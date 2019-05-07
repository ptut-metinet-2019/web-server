import {EventEmitter} from '@aeres-games/event-emitter';
import {DatabaseManager} from './DatabaseManager';
import {HttpManager} from './http/HttpManager';

export class Server extends EventEmitter
{
	private databaseManager: DatabaseManager;
	private httpManager: HttpManager;

	public constructor()
	{
		super();
		let that = this;

		this.databaseManager = new DatabaseManager();
		this.httpManager = new HttpManager();

		this.databaseManager.on('ready', function()
		{
			that.emit('info', {message: 'Database connection established'});

			that.httpManager.start();
		});

		this.databaseManager.on('close', function()
		{
			that.emit('info', {message: 'Database connection closed'});
		});

		this.databaseManager.on('info', (event) => that.emit('info', event));
		this.databaseManager.on('warn', (event) => that.emit('warn', event));

		this.databaseManager.on('error', function(error)
		{
			that.emit('error', error);

			that.httpManager.stop();
			that.databaseManager.disconnect();
		});

		this.httpManager.on('ready', function()
		{
			that.emit('info', {message: 'Https server online'});
		});

		this.httpManager.on('close', function()
		{
			that.emit('info', {message: 'Https server closed'});

			that.databaseManager.disconnect();
		});

		this.httpManager.on('info', (event) => that.emit('info', event));
		this.httpManager.on('warn', (event) => that.emit('warn', event));

		this.httpManager.on('error', function(error)
		{
			that.emit('error', error);

			that.httpManager.stop();
			that.databaseManager.disconnect();
		});
	}

	public start(): void
	{
		this.databaseManager.connect();
	}

	public stop(): void
	{
		this.httpManager.stop();
	}
}