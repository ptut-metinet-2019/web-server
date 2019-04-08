import EventEmitter from '@aeres-games/event-emitter';

import Request from './Request';

export default class Device extends EventEmitter
{
	constructor(request, ws)
	{
		super();
		var that = this;

		this.request = request;
		this.ws = ws;

		this.ws.on('error', (error) => that.notify('warn', {message: 'A Websocket error occured', error}));

		this.ws.on('close', function(code, reason)
		{
			that.notify('close', {code, reason, device: that});
		});

		this.ws.on('message', function(message)
		{
			try
			{
				message = JSON.parse(message);
			}
			catch(error)
			{
				that.notify('warn', {message: 'Couldn\'t parse message JSON', error});
				return;
			}

			if(typeof message.type !== 'string')
			{
				that.notify('warn', {message: 'Invalid / Missing message type'});
				return;
			}

			if(message.type === 'request')
			{
				if(typeof message.id !== 'string')
				{
					that.notify('warn', {message: 'Invalid / Missing request id'});
					return;
				}

				if(typeof message.target !== 'string')
				{
					that.notify('warn', {message: 'Invalid / Missing request target'});
					return;
				}

				if(typeof message.action !== 'string')
				{
					that.notify('warn', {message: 'Invalid / Missing request action'});
					return;
				}

				that.notify('request', {request: new Request(message.id, that, message.target, message.action, message.data)});
			}
			else
			{
				that.notify('warn', {message: 'Unknown message type ' + message.type});
			}
		});
	}

	sendResponse(response)
	{
		this.ws.send(JSON.stringify({type: 'response', request: response.request.id, status: response.status, data: response.data}));
	}
}