import * as Mongoose from 'mongoose';

import {Controller, IControllerAction, IControllerRequest} from './Controller';
import {Questionnaire, IQuestionnaireModel} from '../Model/Questionnaire';
import {Question, IQuestionModel} from '../Model/Question';
import {Choice, IChoiceModel} from '../Model/Choice';
import {Response} from '../Http/Response';
import {Event} from '../Http/Event';

import {Validator, ValidationError, ObjectRule, StringRule, BooleanRule} from '@aeres-games/validator';

export interface IChoiceCreateData
{
	questionId	: string;
	title		: string;
	answer		: boolean;
}

export interface IChoiceUpdateData
{
	_id			: string;
	title		: string;
	answer		: boolean;
}

export interface IChoiceDeleteData
{
	_id			: string;
}

export class ChoiceController extends Controller
{
	private createValidator	: Validator;
	private updateValidator	: Validator;
	private deleteValidator : Validator;

	public constructor()
	{
		super();

		this.createValidator = new Validator(new ObjectRule({
			questionId: new StringRule({minLength: 1}),
			title: new StringRule({minLength: 3, maxLength: 120}),
			answer: new BooleanRule()
		}), {throw: true});

		this.updateValidator = new Validator(new ObjectRule({
			_id: new StringRule({minLength: 1}),
			title: new StringRule({minLength: 3, maxLength: 120}),
			answer: new BooleanRule()
		}), {throw: true});

		this.deleteValidator = new Validator(new ObjectRule({
			_id: new StringRule({minLength: 1})
		}), {throw: true});
	}

	public createAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: ChoiceController = this;

		try
		{
			this.createValidator.validate(request.data);
			var data: IChoiceCreateData = request.data as IChoiceCreateData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Question.findOne({_id: data.questionId, deleted: null}, function(error, question: IQuestionModel)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error creating choice', error});
				return;
			}

			if(question === null)
			{
				action.response(new Response(404, {error: 'Question Not Found'}));
				return;
			}

			Questionnaire.findOne({_id: question.questionnaireId, deleted: null, userId: request.bridge.user._id}, function(error, questionnaire: IQuestionnaireModel)
			{
				if(error)
				{
					action.response(new Response(500, {error: 'Internal Server Error'}));
					that.emit('warn', {message: 'Error creating choice', error});
					return;
				}

				if(questionnaire === null)
				{
					action.response(new Response(404, {error: 'Questionnaire Not Found'}));
					return;
				}

				if(request.bridge.sessionHandler && request.bridge.sessionHandler.questionnaire.id === questionnaire.id)
				{
					action.response(new Response(403, {error: 'Questionnaire is currently running'}));
					return;
				}

				let choice: IChoiceModel = new Choice({
					questionId: data.questionId,
					title: data.title,
					answer: data.answer
				});

				choice.save(function(error, choice: IChoiceModel)
				{
					if(error)
					{
						action.response(new Response(500, {error: 'Internal Server Error'}));
						that.emit('warn', {message: 'Error creating choice', error});
						return;
					}

					action.broadcast(new Event('choice', 'create', choice));
					action.response(new Response(200, choice));
				});
			});
		});
	}

	public updateAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: ChoiceController = this;

		try
		{
			this.updateValidator.validate(request.data);
			var data: IChoiceUpdateData = request.data as IChoiceUpdateData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Choice.findOne({_id: data._id, deleted: null}, function(error, choice: IChoiceModel)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error finding and updating choice', error});
				return;
			}

			if(choice === null)
			{
				action.response(new Response(404, {error: 'Choice Not Found'}));
				return;
			}

			Question.findOne({_id: choice.questionId, deleted: null}, function(error, question: IQuestionModel)
			{
				if(error)
				{
					action.response(new Response(500, {error: 'Internal Server Error'}));
					that.emit('warn', {message: 'Error finding and updating choice', error});
					return;
				}

				if(question === null)
				{
					action.response(new Response(404, {error: 'Question Not Found'}));
					return;
				}

				Questionnaire.findOne({_id: question.questionnaireId, deleted: null, userId: request.bridge.user._id}, function(error, questionnaire: IQuestionnaireModel)
				{
					if(error)
					{
						action.response(new Response(500, {error: 'Internal Server Error'}));
						that.emit('warn', {message: 'Error finding and updating choice', error});
						return;
					}

					if(questionnaire === null)
					{
						action.response(new Response(404, {error: 'Questionnaire Not Found'}));
						return;
					}

					if(request.bridge.sessionHandler && request.bridge.sessionHandler.questionnaire.id === questionnaire.id)
					{
						action.response(new Response(403, {error: 'Questionnaire is currently running'}));
						return;
					}

					choice.title = data.title;
					choice.answer = data.answer;
					choice.updated = new Date();

					choice.save(function(error, choice: IChoiceModel)
					{
						if(error)
						{
							action.response(new Response(500, {error: 'Internal Server Error'}));
							that.emit('warn', {message: 'Error updating choice', error});
							return;
						}

						action.broadcast(new Event('choice', 'update', choice));
						action.response(new Response(200, choice));
					});
				});
			});
		});
	}

	public deleteAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: ChoiceController = this;

		try
		{
			this.updateValidator.validate(request.data);
			var data: IChoiceDeleteData = request.data as IChoiceDeleteData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Choice.findOne({_id: data._id, deleted: null}, function(error, choice: IChoiceModel)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error finding and deleting choice', error});
				return;
			}

			if(choice === null)
			{
				action.response(new Response(404, {error: 'Choice Not Found'}));
				return;
			}

			Question.findOne({_id: choice.questionId, deleted: null}, function(error, question: IQuestionModel)
			{
				if(error)
				{
					action.response(new Response(500, {error: 'Internal Server Error'}));
					that.emit('warn', {message: 'Error finding and deleting choice', error});
					return;
				}

				if(question === null)
				{
					action.response(new Response(404, {error: 'Question Not Found'}));
					return;
				}

				Questionnaire.findOne({_id: question.questionnaireId, deleted: null, userId: request.bridge.user._id}, function(error, questionnaire: IQuestionnaireModel)
				{
					if(error)
					{
						action.response(new Response(500, {error: 'Internal Server Error'}));
						that.emit('warn', {message: 'Error finding and deleting choice', error});
						return;
					}

					if(questionnaire === null)
					{
						action.response(new Response(404, {error: 'Questionnaire Not Found'}));
						return;
					}

					if(request.bridge.sessionHandler && request.bridge.sessionHandler.questionnaire.id === questionnaire.id)
					{
						action.response(new Response(403, {error: 'Questionnaire is currently running'}));
						return;
					}

					choice.deleted = new Date();
					choice.save(function(error, choice: IChoiceModel)
					{
						if(error)
						{
							action.response(new Response(500, {error: 'Internal Server Error'}));
							that.emit('warn', {message: 'Error deleting choice', error});
							return;
						}

						action.broadcast(new Event('choice', 'delete', choice));
						action.response(new Response(200, choice));
					});
				});
			});
		});
	}
}