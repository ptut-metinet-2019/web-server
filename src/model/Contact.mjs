import Mongoose from 'mongoose';

const ContactSchema = new Mongoose.Schema(
{
	id: 		{type: Mongoose.Schema.Types.ObjectId, index: true, required: true, auto: true},

	phone: 		{type: String, required: true},

	created: 	{type: Date, default: Date.now},
	updated: 	{type: Date, default: Date.now},
	deleted: 	{type: Date, default: null}
});

export default Mongoose.model('Contact', ContactSchema);