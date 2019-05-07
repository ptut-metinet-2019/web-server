import * as Mongoose from 'mongoose';

import {Controller, IControllerAction, IControllerRequest} from './Controller';
import {Questionnaire, IQuestionnaireModel} from '../Model/Questionnaire';
import {Question, IQuestionModel} from '../Model/Question';
import {Response} from '../Http/Response';
import {Event} from '../Http/Event';

import {Validator} from '../Validation/Validator';
import {ValidationError} from '../Error/ValidationError';

import {ObjectRule} from '../Validation/Rule/ObjectRule';
import {StringRule} from '../Validation/Rule/StringRule';
import {NumberRule} from '../Validation/Rule/NumberRule';

export interface IQuestionnaireGetQuestionsData
{
	_id				: string;
}

export interface IQuestionnaireCreateData
{
	name			: string;
	timer			: number;
	autoplayTimeout	: number;
}

export interface IQuestionnaireUpdateData
{
	_id				: string;
	name			: string;
	timer			: number;
	autoplayTimeout	: number;
}

export interface IQuestionnaireDeleteData
{
	_id				: string;
}

export class QuestionnaireController extends Controller
{
	private getQuestionsValidator	: Validator;
	private createValidator			: Validator;
	private updateValidator			: Validator;
	private deleteValidator			: Validator;

	public constructor()
	{
		super();

		this.getQuestionsValidator = new Validator(new ObjectRule({
			_id: new StringRule({minLength: 1})
		}));

		this.createValidator = new Validator(new ObjectRule({
			name: new StringRule({minLength: 3, maxLength: 45}),
			timer: new NumberRule({min: 0, max: 86400}),
			autoplayTimeout: new NumberRule({min: 0, max: 86400})
		}));

		this.updateValidator = new Validator(new ObjectRule({
			_id: new StringRule({minLength: 1}),
			name: new StringRule({minLength: 3, maxLength: 45}),
			timer: new NumberRule({min: 0, max: 86400}),
			autoplayTimeout: new NumberRule({min: 0, max: 86400})
		}));

		this.deleteValidator = new Validator(new ObjectRule({
			_id: new StringRule({minLength: 1})
		}));
	}

	public allAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: QuestionnaireController = this;

		Questionnaire.find({userId: request.bridge.user._id, deleted: null}, function(error: any, questionnaires: Array<Mongoose.Document>)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Couldn\'t retrieve questionnaires list', error});
				return;
			}

			action.response(new Response(200, {questionnaires}));
		});
	}

	public getQuestionsAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: QuestionnaireController = this;

		try
		{
			this.getQuestionsValidator.validate(request.data);
			var data: IQuestionnaireGetQuestionsData = request.data as IQuestionnaireGetQuestionsData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Questionnaire.findOne({userId: request.bridge.user._id, deleted: null, _id: data._id}, function(error: any, questionnaire: IQuestionnaireModel)
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

			Question.find({deleted: null, questionnaireId: data._id}, function(error: any, questions: Array<IQuestionModel>)
			{
				if(error)
				{
					action.response(new Response(500, {error: 'Internal Server Error'}));
					that.emit('warn', {message: 'Error finding questionnaire questions', error});
					return;
				}

				action.response(new Response(200, questions));
			});
		});
	}

	public createAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: QuestionnaireController = this;

		try
		{
			this.createValidator.validate(request.data);
			var data: IQuestionnaireCreateData = request.data as IQuestionnaireCreateData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		let questionnaire: IQuestionnaireModel = new Questionnaire({
				userId: request.bridge.user._id,
				name: data.name, timer: data.timer,
				autoplayTimeout: data.autoplayTimeout
			});
		questionnaire.save(function(error, questionnaire)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error creating questionnaire', error});
				return;
			}

			action.broadcast(new Event('questionnaire', 'create', questionnaire));
			action.response(new Response(200, questionnaire));
		});
	}

	public updateAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: QuestionnaireController = this;

		try
		{
			this.updateValidator.validate(request.data);
			var data: IQuestionnaireUpdateData = request.data as IQuestionnaireUpdateData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Questionnaire.findOneAndUpdate({
				_id: data._id, 
				userId: request.bridge.user._id,
				deleted: null
			},{
				name: data.name,
				timer: data.timer,
				autoplayTimeout: data.autoplayTimeout,
				updated: Date.now()
			}, {new: true}, function(error, questionnaire)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error finding and updating questionnaire', error});
				return;
			}

			if(questionnaire === null)
			{
				action.response(new Response(404, {error: 'Questionnaire Not Found'}));
				return;
			}

			action.broadcast(new Event('questionnaire', 'update', questionnaire));
			action.response(new Response(200, questionnaire));
		});
	}

	public deleteAction(request: IControllerRequest, action: IControllerAction): void
	{
		let that: QuestionnaireController = this;

		try
		{
			this.deleteValidator.validate(request.data);
			var data: IQuestionnaireDeleteData = request.data as IQuestionnaireDeleteData;
		}
		catch(error)
		{
			action.response(new Response(400, {error: error.message}));
			return;
		}

		Questionnaire.findOneAndUpdate({
				_id: data._id,
				userId: request.bridge.user._id,
				deleted: null
			},{
				deleted: Date.now()
			}, {new: true}, function(error, questionnaire)
		{
			if(error)
			{
				action.response(new Response(500, {error: 'Internal Server Error'}));
				that.emit('warn', {message: 'Error finding and deleting questionnaire', error});
				return;
			}

			if(questionnaire === null)
			{
				action.response(new Response(404, {error: 'Questionnaire Not Found'}));
				return;
			}

			action.broadcast(new Event('questionnaire', 'delete', {_id: questionnaire._id}));
			action.response(new Response(204));
		});
	}
}