import * as Mongoose from 'mongoose';
import {EventEmitter} from '@aeres-games/event-emitter';

// We load all model classes so that they are registered correctly and in the right order
import {User} 			from './Model/User';
import {Questionnaire} 	from './Model/Questionnaire';
import {Question} 		from './Model/Question';
import {Choice}			from './Model/Choice';
import {Contact}		from './Model/Contact';
import {Session}		from './Model/Session';
import {SessionAnswer}	from './Model/SessionAnswer';

export class DatabaseManager extends EventEmitter
{
	private connection?: Mongoose.Connection = null;

	public connect(): void
	{
		const that: EventEmitter = this;

		if(this.connection !== null)
			return;

		Mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true});
		this.connection = Mongoose.connection;

		this.connection.on('error', function(error)
		{
			that.emit('error', {message: 'A database error occured', error});
		});

		this.connection.once('open', function()
		{
			that.emit('ready', {});
		});
	}

	public disconnect(): void
	{
		if(this.connection === null)
			return;

		this.connection.close();
		this.connection = null;

		this.emit('close', {});
	}
}