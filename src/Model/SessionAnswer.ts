import * as Mongoose from 'mongoose';
import {IContactModel} from './Contact';

export interface ISessionAnswerModel extends Mongoose.Document
{
	sessionId	: string;
	questionId	: string;
	contactId	: string;
	choiceId	: string;
	answer		: string;

	created		: Date;
	updated		: Date;
	deleted		: Date;

	contact		?: IContactModel;
}

export const SessionAnswerSchema: Mongoose.Schema = new Mongoose.Schema(
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

export const SessionAnswer: Mongoose.Model<ISessionAnswerModel> = Mongoose.model<ISessionAnswerModel>('SessionAnswer', SessionAnswerSchema);