import * as dotenv from 'dotenv';

import {Server} from './Server';

dotenv.config();

let server: Server = new Server();

server.on('info', function(event: {message: string, error?: any}): void
{
	let time = new Date();

	if(process.env.SERVER_DEBUG === 'true')
	{
		console.log('[' + time.toISOString().substr(11, 8) + '] ' + event.message);

		if(event.error)
			console.log(event.error);
	}
});

server.on('warn', function(event: {message: string, error?: any}): void
{
	let time = new Date();

	console.warn('[' + time.toISOString().substr(11, 8) + '] ' + event.message);

	if(event.error)
		console.warn(event.error);
});

server.on('error', function(event: {message: string, error: any}): void
{
	let time = new Date();

	console.error('[' + time.toISOString().substr(11, 8) + '] ' + (event.error instanceof Error ? event.error.name + ": " : '') + event.message);
	console.error(event.error);
});

server.start();

process.on('SIGINT', function()
{
	server.stop();
});