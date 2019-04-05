import EventEmitter from '@aeres-games/event-emitter';
import DatabaseManager from './DatabaseManager';
import HttpManager from './http/HttpManager';

export default class Server extends EventEmitter
{
	constructor()
	{
		super();
		var that = this;

		this.databaseManager = new DatabaseManager();
		this.httpManager = new HttpManager();

		this.databaseManager.on('ready', function()
		{
			that.notify('info', {message: 'Database connection established'});

			that.httpManager.start();
		});

		this.databaseManager.on('close', function()
		{
			that.notify('info', {message: 'Database connection closed'});
		});

		this.databaseManager.on('info', (event) => that.notify('info', event));
		this.databaseManager.on('warn', (event) => that.notify('warn', event));

		this.databaseManager.on('error', function(error)
		{
			that.notify('error', error);

			that.httpManager.stop();
			that.databaseManager.disconnect();
		});



		this.httpManager.on('ready', function()
		{
			that.notify('info', {message: 'Https server online'});
		});

		this.httpManager.on('close', function()
		{
			that.notify('info', {message: 'Https server closed'});

			that.databaseManager.disconnect();
		});

		this.httpManager.on('info', (event) => that.notify('info', event));
		this.httpManager.on('warn', (event) => that.notify('warn', event));

		this.httpManager.on('error', function(error)
		{
			that.notify('error', error);

			that.httpManager.stop();
			that.databaseManager.disconnect();
		});
	}

	start()
	{
		this.databaseManager.connect();
	}

	stop()
	{
		this.httpManager.stop();
	}
}