import {EventEmitter} from 'events';
import {IncomingMessage} from 'http';
import * as Websocket from 'ws';

import {Request} from './Request';
import {Response} from './Response';
import {Event} from './Event';

export class Device extends EventEmitter
{
	private ws: Websocket;
	private closeTimeout: NodeJS.Timeout = null;
	private open = false;

	public readonly token: string;
	public readonly phoneNumber?: string;

	public constructor(ws: Websocket, token: string, phoneNumber?: string)
	{
		super();

		this.token = token;
		this.phoneNumber = phoneNumber;

		this.setWebsocket(ws);
	}

	public setWebsocket(ws: Websocket): void
	{
		if(this.ws)
			this.ws.close();

		if(this.closeTimeout)
		{
			clearTimeout(this.closeTimeout);
			this.closeTimeout = null;
		}

		let that = this;
		this.ws = ws;

		this.ws.on('error', (error: Error) => that.emit('warn', {message: 'A Websocket error occured', error}));

		this.ws.on('close', function(code: number, reason: string)
		{
			that.open = false;

			that.closeTimeout = setTimeout(function()
			{
				that.emit('close', {code, reason, device: that});
			}, 10000);
		});

		this.ws.on('message', function(messageString: string)
		{
			try
			{
				var message = JSON.parse(messageString);
			}
			catch(error)
			{
				that.emit('warn', {message: 'Couldn\'t parse message JSON', error});
				return;
			}

			if(typeof message.type !== 'string')
			{
				that.emit('warn', {message: 'Invalid / Missing message type'});
				return;
			}

			if(message.type === 'request')
			{
				if(typeof message.id !== 'string')
				{
					that.emit('warn', {message: 'Invalid / Missing request id'});
					return;
				}

				if(typeof message.target !== 'string')
				{
					that.emit('warn', {message: 'Invalid / Missing request target'});
					return;
				}

				if(typeof message.action !== 'string')
				{
					that.emit('warn', {message: 'Invalid / Missing request action'});
					return;
				}

				message.data = message.data || null;

				if(typeof message.data !== 'object' && message.data !== null)
				{
					that.emit('warn', {message: 'Invalid request data'});
					return;
				}

				that.emit('request', {request: new Request(message.id, message.target, message.action, message.data), device: that});
			}
			else if(message.type === 'answer')
			{
				that.emit('answer', message.data);
			}
			else
			{
				that.emit('warn', {message: 'Unknown message type ' + message.type});
			}
		});

		this.open = true;
	}

	public destroy()
	{
		this.open = false;

		if(this.closeTimeout)
		{
			clearTimeout(this.closeTimeout);
			this.closeTimeout = null;
		}

		if(this.ws)
			this.ws.close();
	}

	public sendResponse(request: Request, response: Response): void
	{
		if(this.open)
			this.ws.send(JSON.stringify({type: 'response', request: request.id, status: response.status, data: response.data}));
	}

	public sendMessage(message: string): void
	{
		if(this.open)
			this.ws.send(message);
	}
}