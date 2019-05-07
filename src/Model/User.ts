import * as Mongoose from 'mongoose';

export interface IUserModel extends Mongoose.Document
{
	email		: string;
	password	: string;

	created		: Date;
	updated		: Date;
	deleted		: Date;
}

export const UserSchema: Mongoose.Schema = new Mongoose.Schema(
{
	email: 		{type: String, required: true, index: true, unique: true},
	password: 	{type: String, required: true},

	created: 	{type: Date, default: Date.now},
	updated: 	{type: Date, default: Date.now},
	deleted: 	{type: Date, default: null}
},{
	toJSON:
	{
		transform: function(document, result)
		{
			delete result.password;
			delete result.updated;
			delete result.deleted;
		}
	}
});

export const User: Mongoose.Model<IUserModel> = Mongoose.model<IUserModel>('User', UserSchema);