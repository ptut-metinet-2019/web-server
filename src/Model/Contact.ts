import * as Mongoose from 'mongoose';

export interface IContactModel extends Mongoose.Document
{
	phone	: string;

	created	: Date;
	updated	: Date;
	deleted	: Date;
}

export const ContactSchema: Mongoose.Schema = new Mongoose.Schema(
{
	phone: 		{type: String, required: true},

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

export const Contact: Mongoose.Model<IContactModel> = Mongoose.model<IContactModel>('Contact', ContactSchema);