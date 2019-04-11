import Controller from './Controller';
import Questionnaire from '../model/Questionnaire';
import Response from '../http/Response';
import Event from '../http/Event';

import Validator from '../validation/Validator';
import ValidationError from '../validation/ValidationError';
import ObjectRule from '../validation/ObjectRule';
import StringRule from '../validation/StringRule';
import NumberRule from '../validation/NumberRule';

export default class QuestionnaireController extends Controller
{
	constructor(bridge)
	{
		super();

		this.bridge = bridge;

		this.createValidator = new Validator(new ObjectRule({
			name: new StringRule({minLength: 3, maxLength: 45}),
			timer: new NumberRule({min: 0, max: 86400}),
			autoplayTimeout: new NumberRule({min: 0, max: 86400})
		}));

		this.deleteValidator = new Validator(new ObjectRule({
			_id: new StringRule({minLength: 1})
		}));
	}

	allAction(request, callback)
	{
		var that = this;

		Questionnaire.find({userId: this.bridge.user._id, deleted: null}, function(error, questionnaires)
		{
			if(error)
			{
				callback(new Response(request, 500, {error: 'Internal Server Error'}));
				that.notify('warn', {message: 'Couldn\'t retrieve questionnaires list', error});
				return;
			}

			callback(new Response(request, 200, {questionnaires}));
		});
	}

	createAction(request, callback)
	{
		var that = this;

		try {this.createValidator.validate(request.data);}
		catch(error)
		{
			callback(new Response(request, 400, {error: error.message}));
			return;
		}

		var questionnaire = new Questionnaire({userId: this.bridge.user._id, name: request.data.name, timer: request.data.timer, autoplayTimeout: request.data.autoplayTimeout});
		questionnaire.save(function(error, questionnaire)
		{
			if(error)
			{
				callback(new Response(request, 500, {error: 'Internal Server Error'}));
				that.notify('warn', {message: 'Error creating questionnaire', error});
				return;
			}

			that.bridge.broadcast(new Event('questionnaire', 'create', questionnaire));
			callback(new Response(request, 204));
		});
	}

	updateAction(request, callback)
	{
		console.log('update');
	}

	deleteAction(request, callback)
	{
		var that = this;

		try {this.deleteValidator.validate(request.data);}
		catch(error)
		{
			callback(new Response(request, 400, {error: error.message}));
			return;
		}

		Questionnaire.findOne({_id: request.data._id, userId: this.bridge.user._id, deleted: null}, function(error, questionnaire)
		{
			if(error)
			{
				console.error('todo questionnaire find error');
				return;
			}

			if(questionnaire === null)
			{
				console.log('todo questionnaire not found ' + request.data._id);
				return;
			}

			questionnaire.deleted = Date.now();
			questionnaire.save(function(error, questionnaire)
			{
				if(error)
				{
					console.error(error);
					return;
				}

				that.bridge.broadcast(new Event('questionnaire', 'delete', {_id: questionnaire._id}));
				callback(new Response(request, 204));
			});
		});
	}
}