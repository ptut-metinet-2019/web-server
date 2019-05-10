import * as Mongoose from 'mongoose';

import {Controller, IControllerAction, IControllerRequest} from './Controller';
import {Questionnaire, IQuestionnaireModel} from '../Model/Questionnaire';
import {Question, IQuestionModel} from '../Model/Question';
import {Choice, IChoiceModel} from '../Model/Choice';
import {Response} from '../Http/Response';
import {Event} from '../Http/Event';

import {Validator, ValidationError, ObjectRule, StringRule, NumberRule, BooleanRule} from '@aeres-games/validator';

export interface IQuestionGetData
{
	questionnaireId	: string;
}

export interface IQuestionCreateData
{
	questionnaireId	: string;
	title			: string;
	type			: string;
	timer			: number;
	anonymous		: boolean;
}

export interface IQuestionUpdateData
{
	_id				: string;
	title			: string;
	type			: string;
	timer			: number;
	anonymous		: boolean;
}

export interface IQuestionDeleteData
{
	_id				: string;
}

export class QuestionController extends Controller
{
	private getValidator	: Validator;
	private createValidator	: Validator;
	private updateValidator	: Validator;
	private deleteValidator : Validator;

	public constructor()
	{
		super();

		this.getValidator = new Validator(new ObjectRule({
			questionnaireId: new StringRule({minLength: 1})
		}));

		this.createValidator = new Validator(new ObjectRule({
			questionnaireId: new StringRule({minLength: 1}),
			title: new StringRule({minLength: 3, maxLength: 120}),
			type: new StringRule({regex: /^(free)|(choice)$/}),
			timer: new NumberRule({min: 0, max: 86400, nullable: true}),
			anonymous: new BooleanRule({})
		}), {throw: true});

		this.updateValidator = new Validator(new ObjectRule({
			_id: new StringRule({minLength: 1}),
			title: new StringRule({minLength: 3, maxLength: 120}),
			type: new StringRule({regex: /^(free)|(choice)$/}),
			timer: new NumberRule({min: 0, max: 86400, nullable: true}),
			anonymous: new BooleanRule({})
		}), {throw: true});

		this.deleteValidator = new Validator(new ObjectRule({
			_id: new StringRule({minLength: 1})
		}), {throw: true});
	}

	public getAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: QuestionController = this;

		try
		{
			this.getValidator.validate(request.data);
			var data: IQuestionGetData = request.data as IQuestionGetData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Questionnaire.findOne({userId: request.bridge.user._id, deleted: null, _id: data.questionnaireId}, function(error: any, questionnaire: IQuestionnaireModel)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error finding questionnaire', error});
				return;
			}

			if(questionnaire === null)
			{
				action.response(new Response(404, {error: 'Questionnaire Not Found'}));
				return;
			}

			Question.find({deleted: null, questionnaireId: data.questionnaireId}, function(error: any, questions: Array<IQuestionModel>)
			{
				if(error)
				{
					action.response(new Response(500, {error: 'Internal Server Error'}));
					that.emit('warn', {message: 'Error finding questionnaire questions', error});
					return;
				}

				const questionsIds: Array<string> = questions.map<string>(function(question: IQuestionModel) {
					return question._id.toString();
				});

				Choice.find({deleted: null, questionId: {$in: questionsIds}}, function(error: any, choices: Array<IChoiceModel>)
				{
					if(error)
					{
						action.response(new Response(500, {error: 'Internal Server Error'}));
						that.emit('warn', {message: 'Error finding questionnaire questions choices', error});
						return;
					}

					for(let question of questions)
						(<any>question).choices = choices.filter((choice) => {return choice.questionId.toString() === question._id.toString()});

					action.response(new Response(200, questions));
				});
			});
		});
	}

	public createAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: QuestionController = this;

		try
		{
			this.createValidator.validate(request.data);
			var data: IQuestionCreateData = request.data as IQuestionCreateData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Questionnaire.findOne({userId: request.bridge.user._id, deleted: null, _id: data.questionnaireId}, function(error: any, questionnaire: IQuestionnaireModel)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error finding questionnaire', error});
				return;
			}

			if(questionnaire === null)
			{
				action.response(new Response(404, {error: 'Questionnaire Not Found'}));
				return;
			}

			let question: IQuestionModel = new Question({
				questionnaireId: data.questionnaireId,
				title: data.title,
				type: data.type,
				timer: data.timer,
				anonymous: data.anonymous,
				position: /* TODO*/0
			});

			question.save(function(error, question: IQuestionModel)
			{
				if(error)
				{
					action.response(new Response(500, {error: 'Internal Server Error'}));
					that.emit('warn', {message: 'Error creating question', error});
					return;
				}

				action.broadcast(new Event('question', 'create', question));
				action.response(new Response(200, question));
			});
		});
	}

	public updateAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: QuestionController = this;

		try
		{
			this.updateValidator.validate(request.data);
			var data: IQuestionUpdateData = request.data as IQuestionUpdateData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Question.findOne({_id: data._id, deleted: null}, function(error, question: IQuestionModel)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error finding and updating question', error});
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
					that.emit('warn', {message: 'Error finding and updating question', error});
					return;
				}

				if(questionnaire === null)
				{
					action.response(new Response(404, {error: 'Questionnaire Not Found'}));
					return;
				}

				question.title = data.title;
				question.type = data.type;
				question.timer = data.timer;
				question.anonymous = data.anonymous;
				question.updated = new Date();

				question.save(function(error, question: IQuestionModel)
				{
					if(error)
					{
						action.response(new Response(500, {error: 'Internal Server Error'}));
						that.emit('warn', {message: 'Error updating question', error});
						return;
					}

					action.broadcast(new Event('question', 'update', question));
					action.response(new Response(200, question));
				});
			});
		});
	}

	public deleteAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: QuestionController = this;

		try
		{
			this.deleteValidator.validate(request.data);
			var data: IQuestionDeleteData = request.data as IQuestionDeleteData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Question.findOne({_id: data._id, deleted: null}, function(error, question: IQuestionModel)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error finding and deleting question', error});
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
					that.emit('warn', {message: 'Error finding and deleting question', error});
					return;
				}

				if(questionnaire === null)
				{
					action.response(new Response(404, {error: 'Questionnaire Not Found'}));
					return;
				}

				question.deleted = new Date();
				question.save(function(error, question: IQuestionModel)
				{
					if(error)
					{
						action.response(new Response(500, {error: 'Internal Server Error'}));
						that.emit('warn', {message: 'Error deleting question', error});
						return;
					}

					action.broadcast(new Event('question', 'delete', {_id: question._id}));
					action.response(new Response(204));
				});
			});
		});
	}
}