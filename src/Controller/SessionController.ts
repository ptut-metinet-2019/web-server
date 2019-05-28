import * as Mongoose from 'mongoose';

import {Controller, IControllerAction, IControllerRequest} from './Controller';
import {Questionnaire, IQuestionnaireModel} from '../Model/Questionnaire';
import {Question, IQuestionModel} from '../Model/Question';
import {Choice, IChoiceModel} from '../Model/Choice';
import {Response} from '../Http/Response';
import {Event} from '../Http/Event';
import {Device} from '../Http/Device';
import {SessionHandler} from '../Session/SessionHandler';
import {Session, ISessionModel} from '../Model/Session';
import {SessionAnswer, ISessionAnswerModel} from '../Model/SessionAnswer';
import {Contact, IContactModel} from '../Model/Contact';

import {Validator, ValidationError, ObjectRule, StringRule, BooleanRule} from '@aeres-games/validator';

export interface ISessionStartData
{
	questionnaireId: string;
}

export interface ISessionAllData
{
	questionnaireId: string;
}

export interface ISessionGetData
{
	_id: string;
}

export class SessionController extends Controller
{
	private initValidator: Validator;
	private allValidator: Validator;
	private getValidator: Validator;

	public constructor()
	{
		super();

		this.initValidator = new Validator(new ObjectRule({
			questionnaireId: new StringRule({minLength: 1})
		}));

		this.allValidator = new Validator(new ObjectRule({
			questionnaireId: new StringRule({minLength: 1})
		}));

		this.getValidator = new Validator(new ObjectRule({
			_id: new StringRule({minLength: 1})
		}));
	}

	public initAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: SessionController = this;

		try
		{
			this.initValidator.validate(request.data);
			var data: ISessionStartData = request.data as ISessionStartData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Questionnaire.findOne({_id: data.questionnaireId, deleted: null, userId: request.bridge.user._id}, function(error, questionnaire: IQuestionnaireModel)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error starting questionnaire', error});
				return;
			}

			if(questionnaire === null)
			{
				action.response(new Response(404, {error: 'Questionnaire Not Found'}));
				return;
			}

			Question.find({questionnaireId: data.questionnaireId, deleted: null}, function(error, questions: Array<IQuestionModel>)
			{
				if(error)
				{
					action.response(new Response(500, {error: 'Internal Server Error'}));
					that.emit('warn', {message: 'Error starting questionnaire', error});
					return;
				}

				if(questions.length === 0)
				{
					action.response(new Response(403, {error: 'The questionnaire has no question assigned to it'}));
					return;
				}

				questionnaire.questions = questions;
				let choiceQuestions: {[id: string]: IQuestionModel | undefined} = {};

				for(let question of questions)
				{
					if(question.type === 'choice')
					{
						choiceQuestions[question.id] = question;
						question.choices = [];
					}
				}

				Choice.find({questionId: {$in: Object.keys(choiceQuestions)}, deleted: null}, function(error, choices: Array<IChoiceModel>)
				{
					if(error)
					{
						action.response(new Response(500, {error: 'Internal Server Error'}));
						that.emit('warn', {message: 'Error starting questionnaire', error});
						return;
					}

					for(let choice of choices)
						choiceQuestions[choice.questionId].choices.push(choice);

					for(let questionId of Object.keys(choiceQuestions))
					{
						if(choiceQuestions[questionId].choices.length < 2)
						{
							action.response(new Response(403, {error: 'One of the choice questions has lass than 2 choices assigned'}));
							return;
						}
					}

					if(request.bridge.sessionHandler !== null)
					{
						action.response(new Response(403, {error: 'A session is already running'}));
						return;
					}

					let fetcher: Device = null;
					for(let device of request.bridge.devices)
					{
						if(device.phoneNumber !== undefined)
						{
							fetcher = device;
							break;
						}
					}

					if(!fetcher)
					{
						action.response(new Response(403, {error: 'There is no currently connected phone device'}));
						return;
					}

					let questionnaireData = questionnaire.toJSON();
					questionnaireData.questions = [];

					for(let question of questionnaire.questions)
					{
						let questionData = question.toJSON();

						if(question.type === 'choice')
						{
							let choicesData: Array<any> = [];
							for(let choice of question.choices)
								choicesData.push(choice.toJSON());

							questionData.choices = choicesData;
						}

						questionnaireData.questions.push(questionData);
					}

					request.bridge.sessionHandler = new SessionHandler(request.bridge, fetcher, questionnaire);
					request.bridge.sessionHandler.on('info', (event: object) => that.emit('info', event));
					request.bridge.sessionHandler.on('warn', (event: object) => that.emit('warn', event));
					request.bridge.sessionHandler.on('error', (event: object) => that.emit('error', event));

					that.emit('info', {message: 'Session initialized for Questionnaire titled "' + questionnaire.name + '" (User #' + questionnaire.userId + ')'});
					action.broadcast(new Event('session', 'init', {questionnaire: questionnaireData, phoneNumber: fetcher.phoneNumber}));
					action.response(new Response(204));
				});
			});
		});
	}

	public startAction(request: IControllerRequest, action: IControllerAction): void
	{
		if(!request.bridge.sessionHandler)
		{
			action.response(new Response(403, {error: 'No session has been created'}));
			return;
		}

		if(request.bridge.sessionHandler.running)
		{
			action.response(new Response(403, {error: 'The session is already running'}));
			return;
		}

		request.bridge.sessionHandler.start();
		action.response(new Response(204));
	}

	public skipAction(request: IControllerRequest, action: IControllerAction): void
	{
		if(!request.bridge.sessionHandler || !request.bridge.sessionHandler.running)
		{
			action.response(new Response(403, {error: 'No session is currently running'}));
			return;
		}

		request.bridge.sessionHandler.skip();
		action.response(new Response(204));
	}

	public nextAction(request: IControllerRequest, action: IControllerAction): void
	{
		if(!request.bridge.sessionHandler || !request.bridge.sessionHandler.running)
		{
			action.response(new Response(403, {error: 'No session is currently running'}));
			return;
		}

		request.bridge.sessionHandler.next();
		action.response(new Response(204));
	}

	public stopAction(request: IControllerRequest, action: IControllerAction): void
	{
		if(!request.bridge.sessionHandler)
		{
			action.response(new Response(403, {error: 'No session has been created'}));
			return;
		}

		request.bridge.sessionHandler.stop();
		action.response(new Response(204));
	}

	public allAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: SessionController = this;

		try
		{
			this.allValidator.validate(request.data);
			var data: ISessionAllData = request.data as ISessionAllData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Questionnaire.findOne({_id: data.questionnaireId, deleted: null, userId: request.bridge.user._id}, function(error, questionnaire: IQuestionnaireModel)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error listing all sessions for questionnaire', error});
				return;
			}

			if(questionnaire === null)
			{
				action.response(new Response(404, {error: 'Questionnaire Not Found'}));
				return;
			}

			Session.find({questionnaireId: data.questionnaireId, deleted: null}, function(error, sessions: Array<ISessionModel>)
			{
				if(error)
				{
					action.response(new Response(500, {error: 'Internal Server Error'}));
					that.emit('warn', {message: 'Error listing all sessions for questionnaire', error});
					return;
				}

				action.response(new Response(200, sessions));
				return;
			});
		});
	}

	public getAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: SessionController = this;

		try
		{
			this.getValidator.validate(request.data);
			var data: ISessionGetData = request.data as ISessionGetData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Session.findOne({_id: data._id, deleted: null}, function(error, session: ISessionModel)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error getting session', error});
				return;
			}

			if(session === null)
			{
				action.response(new Response(404, {error: 'Session Not Found'}));
				return;
			}

			Questionnaire.findOne({_id: session.questionnaireId, userId: request.bridge.user._id}, function(error, questionnaire: IQuestionnaireModel)
			{
				if(error)
				{
					action.response(new Response(500, {error: 'Internal Server Error'}));
					that.emit('warn', {message: 'Error getting session', error});
					return;
				}

				if(questionnaire === null)
				{
					action.response(new Response(404, {error: 'Questionnaire Not Found'}));
					return;
				}

				Question.find({questionnaireId: questionnaire.id}, function(error, questions: Array<IQuestionModel>)
				{
					if(error)
					{
						action.response(new Response(500, {error: 'Internal Server Error'}));
						that.emit('warn', {message: 'Error getting session', error});
						return;
					}

					questionnaire.questions = questions;
					let choiceQuestions: {[id: string]: IQuestionModel | undefined} = {};

					for(let question of questions)
					{
						if(question.type === 'choice')
						{
							choiceQuestions[question.id] = question;
							question.choices = [];
						}
					}

					Choice.find({questionId: {$in: Object.keys(choiceQuestions)}}, function(error, choices: Array<IChoiceModel>)
					{
						if(error)
						{
							action.response(new Response(500, {error: 'Internal Server Error'}));
							that.emit('warn', {message: 'Error getting session', error});
							return;
						}

						for(let choice of choices)
							choiceQuestions[choice.questionId].choices.push(choice);

						SessionAnswer.find({sessionId: session.id}, function(error, answers: Array<ISessionAnswerModel>)
						{
							if(error)
							{
								action.response(new Response(500, {error: 'Internal Server Error'}));
								that.emit('warn', {message: 'Error getting session', error});
								return;
							}

							let contactIds: Array<string> = [];

							for(let answer of answers)
							{
								contactIds.push(answer.contactId);

								for(let question of questions)
								{
									console.log(answer.questionId + ' - ' + question.id);
									if(answer.questionId === question.id)
									{
										if(!question.answers)
											question.answers = [];

										question.answers.push(answer);
										break;
									}
								}
							}

							Contact.find({_id: {$in: contactIds}}, function(error, contacts: Array<IContactModel>)
							{
								if(error)
								{
									action.response(new Response(500, {error: 'Internal Server Error'}));
									that.emit('warn', {message: 'Error getting session', error});
									return;
								}

								for(let answer of answers)
								{
									for(let contact of contacts)
									{
										if(contact.id === answer.contactId)
										{
											answer.contact = contact;
											break;
										}
									}
								}

								let questionnaireData = questionnaire.toJSON();
								questionnaireData.questions = [];

								for(let question of questionnaire.questions)
								{
									if(!question.answers)
										continue;

									let questionData = question.toJSON();
									questionData.answers = [];

									if(question.type === 'choice')
									{
										questionData.choices = [];

										for(let choice of question.choices)
											questionData.choices.push(choice.toJSON());
									}

									for(let answer of question.answers)
									{
										let answerData = answer.toJSON();
										answerData.phone = answer.contact.phone;

										questionData.answers.push(answerData);
									}

									questionnaireData.questions.push(questionData);
								}

								action.response(new Response(200, {questionnaire: questionnaireData}));
							});
						});
					});
				});
			});
		
			return;
		});
	}
}