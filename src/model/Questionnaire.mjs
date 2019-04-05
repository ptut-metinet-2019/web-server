import Mongoose from 'mongoose';

const QuestionnaireSchema = new Mongoose.Schema(
{
	id: 				{type: Mongoose.Schema.Types.ObjectId, index: true, required: true, auto: true},

	userId: 			{type: Mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
	name: 				{type: String, required: true},
	timer: 				Number,
	autoplayTimeout: 	Number,

	created: 			{type: Date, default: Date.now},
	updated: 			{type: Date, default: Date.now},
	deleted: 			{type: Date, default: null}
});

export default Mongoose.model('Questionnaire', QuestionnaireSchema);