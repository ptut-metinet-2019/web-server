import Questionnaire from '../model/Questionnaire';
import Response from '../http/Response';

export default class QuestionnaireController
{
	constructor(bridge)
	{
		this.bridge = bridge;
	}

	all(request, callback)
	{
		Questionnaire.find({userId: this.bridge.user.id}, function(error, questionnaires)
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
		//TODO validation

		var questionnaire = new Questionnaire({userId: this.bridge.user.id, name: request.data.name, timer: request.data.timer, autoplayTimeout: request.data.autoplayTimeout});
		questionnaire.save(function(error, questionnaire)
		{
			if(error)
			{
				//TODO
				return;
			}

			callback(new Response(request, 204));

			// TODO : broadcast
		});
	}

	update(request, callback)
	{
		console.log('update');
	}

	delete(request, callback)
	{
		console.log('delete');
	}
}