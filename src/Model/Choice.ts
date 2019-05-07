import * as Mongoose from 'mongoose';

export interface IChoiceModel extends Mongoose.Document
{
	questionId	: string;
	title		: string;
	answer		: boolean;

	created		: Date;
	updated		: Date;
	deleted		: Date;
}

export const ChoiceSchema: Mongoose.Schema = new Mongoose.Schema(
{
	questionId: {type: Mongoose.Schema.Types.ObjectId, ref: 'Question', required: true},
	title: 		{type: String, required: true},
	answer:		{type: Boolean, required: true},

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

export const Choice: Mongoose.Model<IChoiceModel> = Mongoose.model<IChoiceModel>('Choice', ChoiceSchema);