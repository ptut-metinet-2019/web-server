import Mongoose from 'mongoose';

const QuestionSchema = new Mongoose.Schema(
{
	questionnaireId: 	{type: Mongoose.Schema.Types.ObjectId, ref: 'Questionnaire', required: true},
	title: 				{type: String, required: true},
	type: 				{type: String, required: true},
	timer: 				Number,
	anonymous: 			{type: Boolean, required: true},
	position: 			{type: Number, required: true},

	created: 			{type: Date, default: Date.now},
	updated: 			{type: Date, default: Date.now},
	deleted: 			{type: Date, default: null}
});

export default Mongoose.model('Question', QuestionSchema);