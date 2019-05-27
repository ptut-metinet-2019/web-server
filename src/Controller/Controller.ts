import {EventEmitter} from 'events';
import {DeviceBridge} from '../Http/DeviceBridge';
import {Device} from '../Http/Device';
import {Response} from '../Http/Response';
import {Event} from '../Http/Event';

export interface IControllerAction
{
	response: (response: Response) => void;
	broadcast: (event: Event) => void;
}

export interface IControllerRequest
{
	bridge: DeviceBridge;
	device: Device;
	data: object;
}

export class Controller extends EventEmitter
{
	public constructor()
	{
		super();
	}
}