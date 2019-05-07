import {EventEmitter} from '@aeres-games/event-emitter';
import {IncomingMessage} from 'http';
import * as Websocket from 'ws';

import {Request} from './Request';
import {Response} from './Response';
import {Event} from './Event';

export class Device extends EventEmitter
{
	private request: IncomingMessage;
	private ws: Websocket;

	public constructor(request: IncomingMessage, ws: Websocket)
	{
		super();
		let that: EventEmitter = this;

		this.request = request;
		this.ws = ws;

		this.ws.on('error', (error: Error) => that.emit('warn', {message: 'A Websocket error occured', error}));

		this.ws.on('close', function(code: number, reason: string)
		{
			that.emit('close', {code, reason, device: that});
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
			else
			{
				that.emit('warn', {message: 'Unknown message type ' + message.type});
			}
		});
	}

	public sendResponse(request: Request, response: Response): void
	{
		this.ws.send(JSON.stringify({type: 'response', request: request.id, status: response.status, data: response.data}));
	}

	public sendMessage(message: string): void
	{
		this.ws.send(message);
	}
}