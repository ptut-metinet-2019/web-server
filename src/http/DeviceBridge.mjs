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

		device.on('info', (event) => that.notify('info', event));
		device.on('warn', (event) => that.notify('warn', event));
		device.on('error', (event) => that.notify('error', event));

		device.on('close', function(event)
		{
			that.notify('info', {message: 'User #' + that.user._id + ' device connection closed'});

			for(var i in that.devices)
			{
				if(that.devices[i] === event.device)
				{
					that.devices.splice(i, 1);

					if(that.devices.length === 0)
						that.notify('empty', {bridge: that});

					break;
				}
			}
		});

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
				event.request.device.sendResponse(new Response(event.request, 404, {error: 'Unknown target controller'}));
				that.notify('warn', {message: 'Unknown target controller ' + event.request.target});
				return;
			}

			if(typeof controller[event.request.action + 'Action'] !== 'function')
			{
				event.request.device.sendResponse(new Response(event.request, 404, {error: 'Unknown action method'}));
				that.notify('warn', {message: 'Unknown action method ' + event.request.action});
				return;
			}

			controller[event.request.action + 'Action'](event.request, function(result)
			{
				if(result instanceof Response)
					event.request.device.sendResponse(result);
				else
					event.request.device.sendResponse(new Response(event.request, 204, {}));
			});
		});

		this.devices.push(device);
	}

	broadcast(event)
	{
		var message = JSON.stringify({type: 'event', target: event.target, action: event.action, data: event.data});

		for(var device of this.devices)
			device.ws.send(message);
	}
}