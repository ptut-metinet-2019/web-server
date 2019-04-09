import Mongoose from 'mongoose';

const SessionAnswerSchema = new Mongoose.Schema(
{
	sessionId: 	{type: Mongoose.Schema.Types.ObjectId, ref: 'Session', required: true},
	questionId: {type: Mongoose.Schema.Types.ObjectId, ref: 'Question', required: true},
	contactId: 	{type: Mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true},
	choiceId: 	{type: Mongoose.Schema.Types.ObjectId, ref: 'Choice'},
	answer: 	{type: String, required: true},

	created: 	{type: Date, default: Date.now},
	updated: 	{type: Date, default: Date.now},
	deleted: 	{type: Date, default: null}
},{
	toJSON:
	{
		transform: function(document, result)
		{
			delete result.deleted;
		}
	}
});

export default Mongoose.model('SessionAnswer', SessionAnswerSchema);