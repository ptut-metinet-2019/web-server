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

		this.ws.on('message', function(message)
		{
			try
			{
				message = JSON.parse(message);
			}
			catch(error)
			{
				console.log('TODO : invalid json');
				return;
			}

			if(typeof message.type !== 'string')
			{
				console.log('TODO : invalid type');
				return;
			}

			if(message.type === 'request')
			{
				if(typeof message.id !== 'string')
				{
					console.log('TODO : invalid id');
					return;
				}

				if(typeof message.target !== 'string')
				{
					console.log('TODO : invalid target');
					return;
				}

				if(typeof message.action !== 'string')
				{
					console.log('TODO : invalid action');
					return;
				}

				that.notify('request', {request: new Request(message.id, that, message.target, message.action, message.data)});
			}
			else
			{
				console.log('TODO : unknown type');
			}
		});
	}

	sendResponse(response)
	{
		this.ws.send(JSON.stringify({type: 'response', request: response.request.id, status: response.status, data: response.data}));
	}
}