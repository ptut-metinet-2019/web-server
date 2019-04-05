import Mongoose from 'mongoose';

const SessionSchema = new Mongoose.Schema(
{
	id: 				{type: Mongoose.Schema.Types.ObjectId, index: true, required: true, auto: true},

	questionnaireId: 	{type: Mongoose.Schema.Types.ObjectId, ref: 'Questionnaire', required: true},
	phone: 				{type: String, required: true},

	created: 			{type: Date, default: Date.now},
	updated: 			{type: Date, default: Date.now},
	deleted: 			{type: Date, default: null}
});

export default Mongoose.model('Session', SessionSchema);