import Mongoose from 'mongoose';

const UserSchema = new Mongoose.Schema(
{
	id: 		{type: Mongoose.Schema.Types.ObjectId, index: true, required: true, auto: true},

	email: 		{type: String, required: true, index: true, unique: true},
	password: 	{type: String, required: true},

	created: 	{type: Date, default: Date.now},
	updated: 	{type: Date, default: Date.now},
	deleted: 	{type: Date, default: null}
});

export default Mongoose.model('User', UserSchema);