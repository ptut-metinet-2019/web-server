import * as Mongoose from 'mongoose';
import {IChoiceModel} from './Choice';
import {ISessionAnswerModel} from './SessionAnswer';

export interface IQuestionModel extends Mongoose.Document
{
	questionnaireId	: string;
	title			: string;
	type			: string;
	timer			: number;
	anonymous		: boolean;
	position		: number;

	created			: Date;
	updated			: Date;
	deleted			: Date;

	choices			?: Array<IChoiceModel>;
	answers			?: Array<ISessionAnswerModel>;
}

export const QuestionSchema: Mongoose.Schema = new Mongoose.Schema(
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
},{
	toJSON:
	{
		transform: function(document, result)
		{
			delete result.deleted;
		}
	}
});

export const Question: Mongoose.Model<IQuestionModel> = Mongoose.model<IQuestionModel>('Question', QuestionSchema);