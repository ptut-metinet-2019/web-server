import {readFileSync, existsSync} from 'fs';
import {IncomingMessage, ServerResponse, OutgoingHttpHeaders} from 'http';
import {Server, createServer} from 'https';
import {Socket} from 'net';
import * as WebSocket from 'ws';
import {DeviceBridge} from './DeviceBridge';
import {EventEmitter} from '@aeres-games/event-emitter';
import * as Url from 'url';
import {IUserModel, User} from '../Model/User';
import {Device} from './Device';
import {Request} from './Request';
import {Response} from './Response';
import {Event} from './Event';
import * as bcrypt from 'bcrypt';
import {sha512} from 'js-sha512';
import {isValidEmail} from '../Helper/StringHelper';

import {Controller, IControllerAction, IControllerRequest} from '../Controller/Controller';
import {QuestionnaireController} from '../Controller/QuestionnaireController';

const KEY = readFileSync('storage/cert/server.key');
const CERT = readFileSync('storage/cert/server.cert');
const CA = existsSync('storage/cert/server.ca') ? readFileSync('storage/cert/server.ca') : null;

interface Route
{
	path: string;
	method: string;
	action: string;
}

const ROUTES: Array<Route> = [
	{path: '/login', method: 'POST', action: 'login'},
	{path: '/register', method: 'POST', action: 'register'}
];

export interface PendingDevice
{
	token: string;
	socket: Socket;
	user: IUserModel;
	time: Date;
}

export class HttpManager extends EventEmitter
{
	private server: Server = null;
	private wss: WebSocket.Server = null;

	private pending: Array<PendingDevice> = [];
	private bridges: {[header: string]: DeviceBridge} = {};
	private controllers: Map<string, Controller> = new Map();

	public constructor()
	{
		super();

		this.controllers.set('questionnaire', new QuestionnaireController());
	}

	public start(): void
	{
		let that: HttpManager = this;

		if(this.server !== null)
			return;

		this.server = createServer(
		{
			key: KEY,
			cert: CERT,
			ca: CA ? CA : undefined
		}, (request: IncomingMessage, response: ServerResponse) => that.handleRequest(request, response));

		this.server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => that.handleUpgrade(request, socket, head));

		this.wss = new WebSocket.Server({server: this.server});
		this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => that.handleConnection(ws, request));

		this.server.listen(process.env.SERVER_PORT, function()
		{
			that.emit('ready', {});
		});
	}

	public stop(): void
	{
		var that = this;

		if(this.server === null)
			return;

		this.wss.close(function()
		{
			that.wss = null;
			that.bridges = {};

			that.server.close(function()
			{
				that.server = null;
				that.pending = [];

				that.emit('close', {});
			});
		});
	}

	private handleRequest(request: IncomingMessage, response: ServerResponse): void
	{
		if(request.method === 'OPTIONS')
		{
			response.writeHead(200, this.generateHeaders());
			response.end();
			return;
		}

		var that = this;
		var found = null;

		for(var route of ROUTES)
		{
			if(request.url === route.path && request.method === route.method)
			{
				found = route;
				break;
			}
		}

		if(!found)
		{
			response.writeHead(404, that.generateHeaders());
			response.end(JSON.stringify({error: 'No route found for ' + request.method + ' ' + request.url}));

			this.emit('info', {message: '404 - ' + request.method + ' ' + request.url});
			return;
		}

		request.on('error', function(error: Error)
		{
			response.writeHead(400, that.generateHeaders());
			response.end(JSON.stringify({error: 'Request stream error'}));

			that.emit('info', {message: '400 - Request Error : ' + request.method + ' ' + request.url});
		});

		if((['POST', 'PUT', 'PATCH', 'DELETE']).includes(request.method))
		{
			let body: Array<Buffer> = [];

			request.on('data', (chunk: Buffer) => body.push(chunk));
			request.on('end', function()
			{
				let data: string = Buffer.concat(body).toString();

				if(request.headers['content-length'] && data.length !== parseInt(request.headers['content-length']))
				{
					response.writeHead(400, that.generateHeaders());
					response.end(JSON.stringify({error: 'Content-Length value and actual content length mismatch'}));
					return;
				}

				if(data.length === 0)
				{
					(that[found.action])(request, response, {data: '', type: null});
				}
				else
				{
					var type = null;

					if(request.headers['content-type'] === 'application/json')
					{
						type = 'json';

						try {data = JSON.parse(data);}
						catch(error)
						{
							response.writeHead(400, that.generateHeaders());
							response.end(JSON.stringify({error: 'JSON parsing error'}));
							return;
						}
					}

					(that[found.action])(request, response, {data, type});
				}
			});
		}
		else
		{
			(this[found.action])(request, response, null);
		}
	}

	private handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer)
	{
		let queryParameters = Url.parse(request.url, true).query;

		if(!queryParameters.token)
		{
			socket.destroy();
			return;
		}

		// TODO : Brute force checking
		// TODO : Time checking

		var user = null;
		for(var pending of this.pending)
		{
			if(pending.token === queryParameters.token)
			{
				pending.socket = socket;
				user = pending.user;
				break;
			}
		}

		if(!user)
		{
			socket.destroy();
			return;
		}

		this.emit('info', {message: 'User #' + user._id + ' authenticated with new device'});
	}

	private handleConnection(ws: WebSocket, request: IncomingMessage): void
	{
		let pending: PendingDevice = null;
		let that: HttpManager = this;

		for(let i = 0; i < this.pending.length; ++i)
		{
			if(this.pending[i].socket === request.socket)
			{
				pending = this.pending[i];
				this.pending.splice(i, 1);
				break;
			}
		}

		if(!pending)
		{
			that.emit('warn', {message: 'Socket not found after upgrade'});

			ws.close(500, 'Internal Server Error');
			return;
		}

		if(!this.bridges[pending.user._id])
		{
			this.bridges[pending.user._id] = new DeviceBridge(pending.user);
			this.emit('info', {message: 'Bridge created for User #' + pending.user._id});

			this.bridges[pending.user._id].on('info', (event: object) => that.emit('info', event));
			this.bridges[pending.user._id].on('warn', (event: object) => that.emit('warn', event));
			this.bridges[pending.user._id].on('error', (event: object) => that.emit('error', event));

			this.bridges[pending.user._id].on('request', function(event: {request: Request, device: Device, bridge: DeviceBridge})
			{
				let controller: Controller = null;

				for(let controllerName of that.controllers.keys())
				{
					if(controllerName === event.request.target)
					{
						controller = that.controllers.get(controllerName);
						break;
					}
				}

				if(!controller)
				{
					event.device.sendResponse(event.request, new Response(404, {error: 'Unknown target controller'}));
					that.emit('warn', {message: 'Unknown target controller ' + event.request.target});
					return;
				}

				if(typeof controller[event.request.action + 'Action'] !== 'function')
				{
					event.device.sendResponse(event.request, new Response(404, {error: 'Unknown action method'}));
					that.emit('warn', {message: 'Unknown action method ' + event.request.action});
					return;
				}

				controller[event.request.action + 'Action']({
						bridge: event.bridge,
						device: event.device,
						data: event.request.data
					},{
						response: function(response: Response): void
						{
							event.device.sendResponse(event.request, response);
						},

						broadcast: function(e: Event): void
						{
							event.bridge.broadcast(e);
						}
					});
			});

			this.bridges[pending.user._id].on('empty', function(event: {bridge: DeviceBridge})
			{
				delete that.bridges[pending.user._id];

				that.emit('info', {message: 'Bridge deleted for User #' + pending.user._id + ' (empty)'});
			});
		}

		this.bridges[pending.user._id].bindDevice(new Device(request, ws));
	}

	private login(request: IncomingMessage, response: ServerResponse, body: {type: string, data: any}): void
	{
		let that: HttpManager = this;

		if(body.type !== 'json')
		{
			response.writeHead(400, that.generateHeaders());
			response.end(JSON.stringify({error: 'Content must be JSON-encodded'}));
			return;
		}

		if(typeof body.data.email !== 'string')
		{
			response.writeHead(400, that.generateHeaders());
			response.end(JSON.stringify({error: 'Missing email property'}));
			return;
		}

		if(typeof body.data.password !== 'string')
		{
			response.writeHead(400, that.generateHeaders());
			response.end(JSON.stringify({error: 'Missing password property'}));
			return;
		}

		// TODO : Brute force checking

		User.findOne({email: body.data.email}, function(error, user: IUserModel)
		{
			if(error)
			{
				response.writeHead(500, that.generateHeaders());
				response.end(JSON.stringify({error: 'Internal Server Error'}));

				that.emit('warn', {message: 'Couldn\'t execute select query', error});
				return;
			}

			if(!user)
			{
				response.writeHead(401, that.generateHeaders());
				response.end(JSON.stringify({error: 'Invalid email or password'}));
				return;
			}

			bcrypt.compare(body.data.password, user.password, function(erro: Error, ok: boolean)
			{
				if(error)
				{
					response.writeHead(500, that.generateHeaders());
					response.end(JSON.stringify({error: 'Internal Server Error'}));

					that.emit('warn', {message: 'Couldn\'t compare password hash', error});
					return;
				}

				if(!ok)
				{
					response.writeHead(401, that.generateHeaders());
					response.end(JSON.stringify({error: 'Invalid email or password'}));
					return;
				}

				let token = sha512(request.socket.remoteAddress + Math.random());
				that.pending.push({user: user, token: token, time: new Date(), socket: null});

				response.writeHead(200, that.generateHeaders());
				response.end(JSON.stringify({token, user}));
			});
		});
	}

	private register(request: IncomingMessage, response: ServerResponse, body: {type: string, data: any}): void
	{
		let that: HttpManager = this;

		if(body.type !== 'json')
		{
			response.writeHead(400, this.generateHeaders());
			response.end(JSON.stringify({error: 'Content must be JSON-encodded'}));
			return;
		}

		if(typeof body.data.email !== 'string')
		{
			response.writeHead(400, this.generateHeaders());
			response.end(JSON.stringify({error: 'Missing email property'}));
			return;
		}

		if(typeof body.data.password !== 'string')
		{
			response.writeHead(400, this.generateHeaders());
			response.end(JSON.stringify({error: 'Missing password property'}));
			return;
		}

		if(!isValidEmail(body.data.email))
		{
			response.writeHead(400, this.generateHeaders());
			response.end(JSON.stringify({error: 'Invalid email address'}));
			return;
		}

		// TODO : Brute force checking

		User.findOne({email: body.data.email}, function(error, user: IUserModel)
		{
			if(error)
			{
				response.writeHead(500, that.generateHeaders());
				response.end(JSON.stringify({error: 'Internal Server Error'}));

				that.emit('warn', {message: 'Couldn\'t execute select query', error});
				return;
			}

			if(user)
			{
				response.writeHead(409, that.generateHeaders());
				response.end(JSON.stringify({error: 'Email address already taken'}));
				return;
			}

			bcrypt.hash(body.data.password, 10, function(error: Error, hash: string)
			{
				if(error)
				{
					response.writeHead(500, that.generateHeaders());
					response.end(JSON.stringify({error: 'Internal Server Error'}));

					that.emit('warn', {message: 'Couldn\'t hash password', error});
					return;
				}

				var user = new User({email: body.data.email, password: hash});
				user.save(function(error, user: IUserModel)
				{
					if(error)
					{
						response.writeHead(500, that.generateHeaders());
						response.end(JSON.stringify({error: 'Internal Server Error'}));

						that.emit('warn', {message: 'Couldn\'t execute insert query', error});
						return;
					}

					var token = sha512(request.socket.remoteAddress + Math.random());
					that.pending.push({user: user, token: token, time: new Date(), socket: null});

					response.writeHead(200, that.generateHeaders());
					response.end(JSON.stringify({token, user}));
				});
			});
		});
	}

	private generateHeaders(others: OutgoingHttpHeaders = {}): OutgoingHttpHeaders
	{
		var headers = {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
			'Access-Control-Allow-Headers': 'Content-Type, Content-Length'
		};

		return Object.assign(headers, others);
	}
}