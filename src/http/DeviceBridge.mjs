import EventEmitter from '@aeres-games/event-emitter';

import QuestionnaireController from '../controller/QuestionnaireController';
import Response from '../http/Response';

export default class DeviceBridge extends EventEmitter
{
	constructor(user)
	{
		super();

		this.user = user;
		this.devices = [];

		this.controllers = {
			'questionnaire': new QuestionnaireController(this)
		};
	}

	bindDevice(device)
	{
		var that = this;

		device.on('request', function(event)
		{
			var controller = null;

			for(var controllerName of Object.keys(that.controllers))
			{
				if(controllerName === event.request.target)
				{
					controller = that.controllers[controllerName];
					break;
				}
			}

			if(!controller)
			{
				console.log('TODO : invalid target');
				return;
			}

			if(!(['all', 'find', 'create', 'update', 'delete']).includes(event.request.action) || typeof controller[event.request.action] !== 'function')
			{
				console.log('TODO : invalid action');
				return;
			}

			controller[event.request.action](event.request, function(result)
			{
				if(result instanceof Response)
					event.request.device.sendResponse(result);
			});
		});

		this.devices.push(device);
	}

	broadcast(event)
	{
		var message = JSON.stringify({type: 'event', target: event.target, action: event.action, data: response.data});

		for(var device of this.devices)
			device.ws.send(message);
	}
}