import * as Mongoose from 'mongoose';

export interface ISessionModel extends Mongoose.Document
{
	questionnaireId	: string;
	phone			: string;

	created			: Date;
	updated			: Date;
	deleted			: Date;
}

export const SessionSchema: Mongoose.Schema = new Mongoose.Schema(
{
	questionnaireId: 	{type: Mongoose.Schema.Types.ObjectId, ref: 'Questionnaire', required: true},
	phone: 				{type: String, required: true},

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

export const Session: Mongoose.Model<ISessionModel> = Mongoose.model<ISessionModel>('Session', SessionSchema);