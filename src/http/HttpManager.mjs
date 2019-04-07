import fs from 'fs';
import url from 'url';
import https from 'https';
import WebSocket from 'ws';
import bcrypt from 'bcrypt';
import sha512 from 'js-sha512';
import EventEmitter from '@aeres-games/event-emitter';

import Device from './Device';
import DeviceBridge from './DeviceBridge';
import StringHelper from '../helper/StringHelper';
import User from '../model/User';

const KEY = fs.readFileSync('storage/cert/server.key');
const CERT = fs.readFileSync('storage/cert/server.cert');
const CA = fs.existsSync('storage/cert/server.ca') ? fs.readFileSync('storage/cert/server.ca') : null;

const ROUTES = [
	{path: '/login', method: 'POST', action: 'login'},
	{path: '/register', method: 'POST', action: 'register'}
];

export default class HttpManager extends EventEmitter
{
	constructor()
	{
		super();

		this.server = null;
		this.wss = null;

		this.pending = [];
		this.bridges = {};
	}

	start()
	{
		var that = this;

		if(this.server !== null)
			return;

		this.server = https.createServer(
		{
			key: KEY,
			cert: CERT,
			ca: CA ? CA : undefined
		}, (req, res) => that.request(req, res));

		this.server.on('upgrade', (req, socket, head) => that.upgrade(req, socket, head));

		this.wss = new WebSocket.Server({server: this.server});
		this.wss.on('connection', (ws, req) => that.connection(ws, req));

		this.server.listen(process.env.SERVER_PORT, function()
		{
			that.notify('ready', {});
		});
	}

	stop()
	{
		var that = this;

		if(this.server === null)
			return;

		this.wss.close(function()
		{
			that.wss = null;
			that.clients = [];

			that.server.close(function()
			{
				that.server = null;
				that.pending = [];

				that.notify('close', {});
			});
		});
	}

	request(req, res)
	{
		var that = this;
		var found = null;

		for(var route of ROUTES)
		{
			if(req.url === route.path && req.method === route.method)
			{
				found = route;
				break;
			}
		}

		if(!found)
		{
			res.writeHead(404, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'No route found for ' + req.method + ' ' + req.url}));

			this.notify('info', {message: '404 - ' + req.method + ' ' + req.url});
			return;
		}

		req.on('error', function(error)
		{
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'Request stream error'}));

			that.notify('info', {message: '400 - Request Error : ' + req.method + ' ' + req.url});
		});

		if((['POST', 'PUT', 'PATCH', 'DELETE']).includes(req.method))
		{
			var data = [];

			req.on('data', (chunk) => data.push(chunk));
			req.on('end', function()
			{
				data = Buffer.concat(data).toString();

				if(req.headers['content-length'] && data.length !== parseInt(req.headers['content-length']))
				{
					res.writeHead(400, {'Content-Type': 'application/json'});
					res.end(JSON.stringify({error: 'Content-Length value and actual content length mismatch'}));
					return;
				}

				if(data.length === 0)
				{
					(that[found.action])(req, res, {data: '', type: null});
				}
				else
				{
					var type = null;

					if(req.headers['content-type'] === 'application/json')
					{
						type = 'json';

						try {data = JSON.parse(data);}
						catch(error)
						{
							res.writeHead(400, {'Content-Type': 'application/json'});
							res.end(JSON.stringify({error: 'JSON parsing error'}));
							return;
						}
					}

					(that[found.action])(req, res, {data, type});
				}
			});
		}
		else
		{
			(this[found.action])(req, res, null);
		}
	}

	upgrade(req, socket, head)
	{
		var queryParameters = url.parse(req.url, true).query;

		if(!queryParameters.token)
		{
			socket.destroy();
			return;
		}

		// TODO : Brute force checking
		// TODO : Time checking

		var user = null;
		for(var i in this.pending)
		{
			if(this.pending[i].token === queryParameters.token)
			{
				this.pending[i].socket = socket;
				user = this.pending[i].user;
				break;
			}
		}

		if(!user)
		{
			socket.destroy();
			return;
		}

		this.notify('info', {message: 'User #' + user.id + ' authenticated'});
	}

	connection(ws, req)
	{
		var connection = null;
		for(var i in this.pending)
		{
			if(this.pending[i].socket === req.socket)
			{
				connection = this.pending[i];
				this.pending.slice(i, 1);
				break;
			}
		}

		if(!connection)
		{
			that.notify('warn', {message: 'Socket not found after upgrade'});

			ws.close(500, 'Internal Server Error');
			return;
		}

		if(!this.bridges[connection.user.id])
			this.bridges[connection.user.id] = new DeviceBridge(connection.user);

		this.bridges[connection.user.id].bindDevice(new Device(req, ws));
	}

	login(req, res, body)
	{
		var that = this;

		if(body.type !== 'json')
		{
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'Content must be JSON-encodded'}));
			return;
		}

		if(typeof body.data.email !== 'string')
		{
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'Missing email property'}));
			return;
		}

		if(typeof body.data.password !== 'string')
		{
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'Missing password property'}));
			return;
		}

		// TODO : Brute force checking

		User.findOne({email: body.data.email}, function(error, user)
		{
			if(error)
			{
				res.writeHead(500, {'Content-Type': 'application/json'});
				res.end(JSON.stringify({error: 'Internal Server Error'}));

				that.notify('warn', {message: 'Couldn\'t execute select query', error});
				return;
			}

			if(!user)
			{
				res.writeHead(401, {'Content-Type': 'application/json'});
				res.end(JSON.stringify({error: 'Invalid email or password'}));
				return;
			}

			bcrypt.compare(body.data.password, user.password, function(error, ok)
			{
				if(error)
				{
					res.writeHead(500, {'Content-Type': 'application/json'});
					res.end(JSON.stringify({error: 'Internal Server Error'}));

					that.notify('warn', {message: 'Couldn\'t compare password hash', error});
					return;
				}

				if(!ok)
				{
					res.writeHead(401, {'Content-Type': 'application/json'});
					res.end(JSON.stringify({error: 'Invalid email or password'}));
					return;
				}

				var token = sha512.sha512(req.socket.remoteAddress + Math.random());
				that.pending.push({user: user, token: token, time: new Date(), socket: null});

				res.writeHead(200, {'Content-Type': 'application/json'});
				res.end(JSON.stringify({token: token}));
			});
		});
	}

	register(req, res, body)
	{
		var that = this;

		if(body.type !== 'json')
		{
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'Content must be JSON-encodded'}));
			return;
		}

		if(typeof body.data.email !== 'string')
		{
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'Missing email property'}));
			return;
		}

		if(typeof body.data.password !== 'string')
		{
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'Missing password property'}));
			return;
		}

		if(!StringHelper.isValidEmail(body.data.email))
		{
			res.writeHead(400, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({error: 'Invalid email address'}));
			return;
		}

		// TODO : Brute force checking

		User.findOne({email: body.data.email}, function(error, user)
		{
			if(error)
			{
				res.writeHead(500, {'Content-Type': 'application/json'});
				res.end(JSON.stringify({error: 'Internal Server Error'}));

				that.notify('warn', {message: 'Couldn\'t execute select query', error});
				return;
			}

			if(user)
			{
				res.writeHead(409, {'Content-Type': 'application/json'});
				res.end(JSON.stringify({error: 'Email address already taken'}));
				return;
			}

			bcrypt.hash(body.data.password, 10, function(error, hash)
			{
				if(error)
				{
					res.writeHead(500, {'Content-Type': 'application/json'});
					res.end(JSON.stringify({error: 'Internal Server Error'}));

					that.notify('warn', {message: 'Couldn\'t hash password', error});
					return;
				}

				var user = new User({email: body.data.email, password: hash});
				user.save(function(error, user)
				{
					if(error)
					{
						res.writeHead(500, {'Content-Type': 'application/json'});
						res.end(JSON.stringify({error: 'Internal Server Error'}));

						that.notify('warn', {message: 'Couldn\'t execute insert query', error});
						return;
					}

					var token = sha512.sha512(req.socket.remoteAddress + Math.random());
					that.pending.push({user: user, token: token, time: new Date(), socket: null});

					res.writeHead(200, {'Content-Type': 'application/json'});
					res.end(JSON.stringify({token: token}));
				});
			});
		});
	}
}