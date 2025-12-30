import { Droid } from '../src';
import { ensureDroidCli, isDroidCliInstalled } from '../src/cli';

async function main() {
	console.log('Checking for Droid CLI...');

	const installed = await isDroidCliInstalled();

	if (!installed) {
		console.log('Droid CLI not found. Installing...\n');

		const droidPath = await ensureDroidCli({
			onProgress: ({ phase, percent, message }) => {
				const pct = percent !== undefined ? ` (${percent}%)` : '';
				console.log(`[${phase.toUpperCase()}]${pct} ${message ?? ''}`);
			},
		});

		console.log('\nInstalled to:', droidPath);
	} else {
		console.log('Droid CLI is already installed.');
	}

	const droid = new Droid();
	const result = await droid.exec('What version of droid am I running?');

	console.log('\nDroid response:', result.finalResponse);
}

main().catch(console.error);
