import Mongoose from 'mongoose';

const ContactSchema = new Mongoose.Schema(
{
	phone: 		{type: String, required: true},

	created: 	{type: Date, default: Date.now},
	updated: 	{type: Date, default: Date.now},
	deleted: 	{type: Date, default: null}
});

export default Mongoose.model('Contact', ContactSchema);