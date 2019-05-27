import {DeviceBridge} from '../Http/DeviceBridge';
import {Device} from '../Http/Device';
import {Event} from '../Http/Event';

import {IQuestionnaireModel} from '../Model/Questionnaire';

export class SessionHandler
{
	public readonly bridge: DeviceBridge;
	public readonly fetcher: Device;
	public readonly questionnaire: IQuestionnaireModel;

	public running: boolean = false;

	public constructor(bridge: DeviceBridge, fetcher: Device, questionnaire: IQuestionnaireModel)
	{
		this.bridge = bridge;
		this.fetcher = fetcher;
		this.questionnaire = questionnaire;
	}

	public start(): void
	{
		if(this.running)
			return;

		this.bridge.broadcast(new Event('session', 'start', {time: new Date()}));
	}

	public stop(): void
	{
		if(this.running)
		{

			this.running = false;
		}

		this.bridge.broadcast(new Event('session', 'stop', {}));
		this.bridge.sessionHandler = null;
	}

	private
}