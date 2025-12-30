import type { ChildProcess } from 'node:child_process';
import type { Readable } from 'node:stream';

/**
 * Convert a Node.js Readable stream to a string.
 */
export function streamToString(stream: Readable | null): Promise<string> {
	if (!stream) return Promise.resolve('');
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		stream.on('data', (chunk: Buffer) => chunks.push(chunk));
		stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
		stream.on('error', reject);
	});
}

/**
 * Wait for a child process to exit and return the exit code.
 * Handles the race condition where process may exit before listener is registered.
 */
export function waitForExit(proc: ChildProcess): Promise<number> {
	return new Promise((resolve) => {
		let resolved = false;
		const resolveOnce = (code: number) => {
			if (!resolved) {
				resolved = true;
				resolve(code);
			}
		};

		// Register listener first to avoid race condition
		proc.on('close', (code) => resolveOnce(code ?? 0));

		// Check if already exited after registering listener
		if (proc.exitCode !== null) {
			resolveOnce(proc.exitCode);
		}
	});
}

/**
 * Convert a Node.js Readable stream to a Web ReadableStream.
 */
export function nodeStreamToWebStream(nodeStream: Readable): ReadableStream<Uint8Array> {
	return new ReadableStream({
		start(controller) {
			nodeStream.on('data', (chunk: Buffer) => {
				controller.enqueue(new Uint8Array(chunk));
			});
			nodeStream.on('end', () => {
				controller.close();
			});
			nodeStream.on('error', (err) => {
				controller.error(err);
			});
		},
		cancel() {
			nodeStream.destroy();
		},
	});
}
