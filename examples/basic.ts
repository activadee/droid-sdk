import { Droid } from '../src';

async function main() {
	const droid = new Droid();

	const thread = droid.startThread({
		cwd: process.cwd(),
	});

	console.log('Starting analysis...');

	const result = await thread.run('Analyze this codebase and explain the architecture');

	console.log('Session ID:', result.sessionId);
	console.log('Duration:', result.durationMs, 'ms');
	console.log('Turns:', result.numTurns);
	console.log('\nResponse:');
	console.log(result.finalResponse);
}

main().catch(console.error);
