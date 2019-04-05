import Mongoose from 'mongoose';

const SessionAnswerSchema = new Mongoose.Schema(
{
	id: 		{type: Mongoose.Schema.Types.ObjectId, index: true, required: true, auto: true},

	sessionId: 	{type: Mongoose.Schema.Types.ObjectId, ref: 'Session', required: true},
	questionId: {type: Mongoose.Schema.Types.ObjectId, ref: 'Question', required: true},
	contactId: 	{type: Mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true},
	choiceId: 	{type: Mongoose.Schema.Types.ObjectId, ref: 'Choice'},
	answer: 	{type: String, required: true},

	created: 	{type: Date, default: Date.now},
	updated: 	{type: Date, default: Date.now},
	deleted: 	{type: Date, default: null}
});

export default Mongoose.model('SessionAnswer', SessionAnswerSchema);