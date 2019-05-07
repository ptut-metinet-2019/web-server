import * as Mongoose from 'mongoose';

export interface IQuestionnaireModel extends Mongoose.Document
{
	userId			: string;
	name			: string;
	timer			: string;
	autoplayTimeout	: number;

	created			: Date;
	updated			: Date;
	deleted			: Date;
}

export const QuestionnaireSchema: Mongoose.Schema = new Mongoose.Schema(
{
	userId: 			{type: Mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
	name: 				{type: String, required: true},
	timer: 				{type: Number, required: true},
	autoplayTimeout: 	{type: Number, required: true},

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

export const Questionnaire: Mongoose.Model<IQuestionnaireModel> = Mongoose.model<IQuestionnaireModel>('Questionnaire', QuestionnaireSchema);