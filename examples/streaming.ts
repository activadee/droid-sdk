import { Droid, isToolCallEvent, isToolResultEvent, isTurnCompletedEvent } from '../src';

async function main() {
	const droid = new Droid();

	const thread = droid.startThread({
		autonomyLevel: 'low',
	});

	console.log('Starting streaming execution...\n');

	const { events, result } = await thread.runStreamed('Fix all TypeScript errors in this project');

	for await (const event of events) {
		if (isToolCallEvent(event)) {
			console.log(`[TOOL CALL] ${event.toolName}`);
			console.log(`  Parameters: ${JSON.stringify(event.parameters)}`);
		}

		if (isToolResultEvent(event)) {
			const status = event.isError ? 'ERROR' : 'OK';
			console.log(`[TOOL RESULT] ${event.toolName}: ${status}`);
		}

		if (isTurnCompletedEvent(event)) {
			console.log(`\n[COMPLETE] Duration: ${event.durationMs}ms, Turns: ${event.numTurns}`);
		}
	}

	const turnResult = await result;
	console.log('\n--- Final Response ---');
	console.log(turnResult.finalResponse);
}

main().catch(console.error);
