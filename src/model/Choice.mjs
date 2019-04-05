import Mongoose from 'mongoose';

const ChoiceSchema = new Mongoose.Schema(
{
	id: 		{type: Mongoose.Schema.Types.ObjectId, index: true, required: true, auto: true},

	questionId: {type: Mongoose.Schema.Types.ObjectId, ref: 'Question', required: true},
	title: 		{type: String, required: true},

	created: 	{type: Date, default: Date.now},
	updated: 	{type: Date, default: Date.now},
	deleted: 	{type: Date, default: null}
});

export default Mongoose.model('Choice', ChoiceSchema);