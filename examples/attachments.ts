import { Droid } from '../src';

async function main() {
	const droid = new Droid();

	const thread = droid.startThread({
		cwd: process.cwd(),
	});

	console.log('Running with file attachments...\n');

	const result = await thread.run('Analyze the attached files and explain what they do', {
		attachments: [
			{ path: './package.json', type: 'data', description: 'Project configuration' },
			{ path: './src/index.ts', type: 'text', description: 'Main entry point' },
		],
	});

	console.log('Session ID:', result.sessionId);
	console.log('Duration:', result.durationMs, 'ms');
	console.log('\nResponse:');
	console.log(result.finalResponse);
}

main().catch(console.error);
