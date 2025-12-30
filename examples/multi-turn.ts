import { Droid } from '../src';

async function main() {
	const droid = new Droid();

	const thread = droid.startThread({
		autonomyLevel: 'medium',
	});

	console.log('=== Multi-Turn Conversation ===\n');

	console.log('Turn 1: Understanding the project...');
	const turn1 = await thread.run('Read the README and package.json to understand this project');
	console.log('Session ID:', thread.id);
	console.log('Response:', turn1.finalResponse.slice(0, 200) + '...\n');

	console.log('Turn 2: Implementing a feature...');
	const turn2 = await thread.run(
		'Based on what you learned, add a simple health check endpoint if this is a server project',
	);
	console.log('Response:', turn2.finalResponse.slice(0, 200) + '...\n');

	console.log('Turn 3: Writing tests...');
	const turn3 = await thread.run('Write a test for the health check endpoint you just added');
	console.log('Response:', turn3.finalResponse.slice(0, 200) + '...\n');

	console.log('=== Conversation Complete ===');
	console.log(
		'Total tool calls:',
		turn1.toolCalls.length + turn2.toolCalls.length + turn3.toolCalls.length,
	);
}

main().catch(console.error);
