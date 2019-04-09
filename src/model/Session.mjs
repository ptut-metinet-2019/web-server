import Mongoose from 'mongoose';

const SessionSchema = new Mongoose.Schema(
{
	questionnaireId: 	{type: Mongoose.Schema.Types.ObjectId, ref: 'Questionnaire', required: true},
	phone: 				{type: String, required: true},

	created: 			{type: Date, default: Date.now},
	updated: 			{type: Date, default: Date.now},
	deleted: 			{type: Date, default: null}
},{
	toJSON:
	{
		transform: function(document, result)
		{
			delete result.deleted;
		}
	}
});

export default Mongoose.model('Session', SessionSchema);