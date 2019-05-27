import {EventEmitter} from '@aeres-games/event-emitter';
import {IUserModel} from '../Model/User';
import {Device} from './Device';
import {Event} from './Event';
import {Request} from './Request';
import {SessionHandler} from '../Session/SessionHandler';

export class DeviceBridge extends EventEmitter
{
	public readonly user: IUserModel;
	public readonly devices: Array<Device> = [];

	public sessionHandler: SessionHandler = null;

	public constructor(user: IUserModel)
	{
		super();

		this.user = user;
	}

	public bindDevice(device: Device): void
	{
		var that = this;

		device.on('info', (event: object) => that.emit('info', event));
		device.on('warn', (event: object) => that.emit('warn', event));
		device.on('error', (event: object) => that.emit('error', event));

		device.on('close', function(event: {code: number, reason: string, device: Device})
		{
			that.emit('info', {message: 'User #' + that.user._id + ' device connection closed'});

			for(let i = 0; i < that.devices.length; ++i)
			{
				if(that.devices[i] === event.device)
				{
					that.devices.splice(i, 1);

					if(that.devices.length === 0)
						that.emit('empty', {bridge: that});

					break;
				}
			}
		});

		device.on('request', function(event: {request: Request, device: Device})
		{
			that.emit('request', {request: event.request, device: event.device, bridge: that});
		});

		this.devices.push(device);
	}

	public broadcast(event: Event): void
	{
		var message = JSON.stringify({type: 'event', target: event.target, action: event.action, data: event.data});

		for(var device of this.devices)
			device.sendMessage(message);
	}
}