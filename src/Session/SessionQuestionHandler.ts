import {EventEmitter} from 'events';
import {IQuestionModel} from '../Model/Question';
import {DeviceBridge} from '../Http/DeviceBridge';
import {Device} from '../Http/Device';
import {Event} from '../Http/Event';

import {Validator, ObjectRule, StringRule} from '@aeres-games/validator';
import {SessionAnswer, ISessionAnswerModel} from '../Model/SessionAnswer';
import {IContactModel, getContact} from '../Model/Contact';
import {SessionHandler} from './SessionHandler';

export enum SessionQuestionState
{
	Listening,
	Ended,
	Terminated
}

export class SessionQuestionHandler extends EventEmitter
{
	private _state: SessionQuestionState = SessionQuestionState.Listening;

	private readonly answerValidator: Validator;

	private readonly handler: SessionHandler;
	public readonly question: IQuestionModel;
	public readonly number: number;

	public readonly answers: Array<ISessionAnswerModel> = [];

	public constructor(handler: SessionHandler, question: IQuestionModel, number: number)
	{
		super();
		let that = this;

		this.handler = handler;
		this.question = question;
		this.number = number;

		this.answerValidator = new Validator(new ObjectRule({
			answer: new StringRule({minLength: 1, maxLength: 511}),
			phone: new StringRule({minLength: 1})
		}));

		this.handler.fetcher.on('answer', function(data: {answer: string, phone: string})
		{
			try {that.answerValidator.validate(data);}
			catch(error) {return;}

			getContact(data.phone).then(function(contact: IContactModel)
			{
				let answer: ISessionAnswerModel = null;

				if(that.question.type === 'choice')
				{
					let choicePos = parseInt(data.answer);

					if(isNaN(choicePos) || choicePos < 1 || choicePos > that.question.choices.length)
					{
						that.emit('info', {message: 'Session Question #' + number + ' received invalid choice "' + data.answer + '"'});
						return;
					}

					answer = new SessionAnswer({
						questionId: that.question._id,
						contactId: contact.id,
						choiceId: that.question.choices[choicePos - 1],
						answer: data.answer
					});
				}
				else
				{
					answer = new SessionAnswer({
						questionId: that.question._id,
						contactId: contact.id,
						answer: data.answer
					});
				}

				that.answers.push(answer);
				that.handler.bridge.broadcast(new Event('session', 'answer', {answer: answer.answer, choiceId: answer.choiceId || null}));
				that.emit('info', {message: 'Session Question #' + number + ' received answer "' + data.answer + '"'});
			});
		});

		this.emit('info', {message: 'Question #' + number + ' started on Session for Questionnaire titled "' + this.handler.questionnaire.name + '"'});
		this.handler.bridge.broadcast(new Event('session', 'question-start', {questionId: this.question.id}));

		let timer = this.question.timer === null ? this.handler.questionnaire.timer : this.question.timer;
		if(timer > 0)
		{
			setTimeout(function()
			{
				that.end();
			}, timer * 1000);
		}
	}

	public end(): void
	{
		let that = this;

		if(this.state !== SessionQuestionState.Listening)
			return;

		this.emit('info', {message: 'Question #' + this.number + ' ended on Session for Questionnaire titled "' + this.handler.questionnaire.name + '"'});
		this._state = SessionQuestionState.Ended;
		this.handler.fetcher.removeAllListeners('answer');
		this.handler.bridge.broadcast(new Event('session', 'question-end', {}));
		

		if(this.handler.questionnaire.autoplayTimeout > 0)
		{
			setTimeout(function()
			{
				that.terminate();
			}, this.handler.questionnaire.autoplayTimeout * 1000);
		}
	}

	public terminate(): void
	{
		if(this.state !== SessionQuestionState.Ended)
			return;

		this.emit('info', {message: 'Question #' + this.number + ' terminated on Session for Questionnaire titled "' + this.handler.questionnaire.name + '"'});
		this._state = SessionQuestionState.Terminated;
		this.emit('terminated');
	}

	public get state()
	{
		return this._state;
	}
}