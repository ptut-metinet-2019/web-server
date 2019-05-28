import {DeviceBridge} from '../Http/DeviceBridge';
import {Device} from '../Http/Device';
import {Event} from '../Http/Event';
import {SessionQuestionHandler} from './SessionQuestionHandler';

import {Session, ISessionModel} from '../Model/Session';
import {ISessionAnswerModel} from '../Model/SessionAnswer';
import {IQuestionnaireModel} from '../Model/Questionnaire';
import {IQuestionModel} from '../Model/Question';

import {EventEmitter} from 'events';

export class SessionHandler extends EventEmitter
{
	public readonly bridge: DeviceBridge;
	public readonly fetcher: Device;
	public readonly questionnaire: IQuestionnaireModel;

	public running: boolean = false;
	private questionHandler: SessionQuestionHandler = null;
	private answers: Array<ISessionAnswerModel> = [];

	public constructor(bridge: DeviceBridge, fetcher: Device, questionnaire: IQuestionnaireModel)
	{
		super();

		this.bridge = bridge;
		this.fetcher = fetcher;
		this.questionnaire = questionnaire;
	}

	public start(): void
	{
		if(this.running)
			return;

		this.startQuestion(0);
		this.running = true;
	}

	public stop(save: boolean = false): void
	{
		let that = this;

		if(this.running)
		{
			if(this.questionHandler)
			{
				this.questionHandler.removeAllListeners();
				this.questionHandler.end();
				this.questionHandler.terminate();
				this.questionHandler = null;
			}
			else if(save)
			{
				let session = new Session({questionnaireId: this.questionnaire.id, phone: this.fetcher.phoneNumber});
				session.save(function(error, session: ISessionModel)
				{
					if(error) return;

					for(let answer of that.answers)
						answer.sessionId = session.id;

					Session.insertMany(that.answers);
				});
			}

			this.answers = [];
			this.running = false;
		}

		this.emit('info', {message: 'Session stopped for Questionnaire titled "' + this.questionnaire.name + '" (Saved : ' + (save ? 'true' : 'false') + ')'});
		this.bridge.broadcast(new Event('session', 'stop', {}));
		this.bridge.sessionHandler = null;
	}

	public skip(): void
	{
		if(!this.questionHandler)
			return;

		this.questionHandler.end();
	}

	public next(): void
	{
		if(!this.questionHandler)
			return;

		this.questionHandler.terminate();
	}

	private startQuestion(number: number)
	{
		let that = this;

		if(this.questionnaire.questions.length <= number)
		{
			this.questionHandler = null;
			return this.stop(true);
		}

		this.questionHandler = new SessionQuestionHandler(this, this.questionnaire.questions[number], number);
		this.questionHandler.on('terminated', function()
		{
			that.answers = that.answers.concat(that.questionHandler.answers);
			that.questionHandler.removeAllListeners();
			that.startQuestion(that.questionHandler.number + 1);
		});

		this.questionHandler.on('info', (event: object) => that.emit('info', event));
		this.questionHandler.on('warn', (event: object) => that.emit('warn', event));
		this.questionHandler.on('error', (event: object) => that.emit('error', event));

		this.emit('info', {message: 'Question #' + number + ' started on Session for Questionnaire titled "' + this.questionnaire.name + '"'});
	}
}