import Mongoose from 'mongoose';

const ChoiceSchema = new Mongoose.Schema(
{
	questionId: {type: Mongoose.Schema.Types.ObjectId, ref: 'Question', required: true},
	title: 		{type: String, required: true},

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

export default Mongoose.model('Choice', ChoiceSchema);