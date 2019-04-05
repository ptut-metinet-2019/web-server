import Mongoose from 'mongoose';
import EventEmitter from '@aeres-games/event-emitter';

// We load all model classes so that they are registered correctly and in the right order
import User 			from './model/User';
import Questionnaire 	from './model/Questionnaire';
import Question 		from './model/Question';
import Choice 			from './model/Choice';
import Contact 			from './model/Contact';
import Session 			from './model/Session';
import SessionAnswer 	from './model/SessionAnswer';

export default class DatabaseManager extends EventEmitter
{
	constructor()
	{
		super();
		
		this.connection = null;
	}

	connect()
	{
		var that = this;

		if(this.connection !== null)
			return;

		Mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true});
		this.connection = Mongoose.connection;

		this.connection.on('error', function(error)
		{
			that.notify('error', {message: 'A database error occured', error});
		});

		this.connection.once('open', function()
		{
			that.notify('ready', {});
		});
	}

	disconnect()
	{
		if(this.connection === null)
			return;

		this.connection.close();
		this.connection = null;

		this.notify('close', {});
	}
}