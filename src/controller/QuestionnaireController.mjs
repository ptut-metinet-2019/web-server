import Questionnaire from '../model/Questionnaire';
import Response from '../http/Response';
import Event from '../http/Event';

export default class QuestionnaireController
{
	constructor(bridge)
	{
		this.bridge = bridge;
	}

	all(request, callback)
	{
		Questionnaire.find({userId: this.bridge.user._id, deleted: null}, function(error, questionnaires)
		{
			if(error)
			{
				//TODO
				return;
			}

			callback(new Response(request, 200, {questionnaires}));
		});
	}

	create(request, callback)
	{
		var that = this;

		//TODO validation

		var questionnaire = new Questionnaire({userId: this.bridge.user._id, name: request.data.name, timer: request.data.timer, autoplayTimeout: request.data.autoplayTimeout});
		questionnaire.save(function(error, questionnaire)
		{
			if(error)
			{
				//TODO
				return;
			}

			that.bridge.broadcast(new Event('questionnaire', 'create', questionnaire));
			callback(new Response(request, 204));
		});
	}

	update(request, callback)
	{
		console.log('update');
	}

	delete(request, callback)
	{
		var that = this;

		//TODO validation

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