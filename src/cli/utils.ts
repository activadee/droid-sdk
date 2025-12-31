import type { ChildProcess } from 'node:child_process';
import type { Readable } from 'node:stream';

/**
 * Converts a Node.js Readable stream to a string.
 *
 * Collects all chunks from the stream and concatenates them into
 * a UTF-8 string.
 *
 * @param stream - A Node.js Readable stream, or null
 * @returns Promise resolving to the complete stream content as a string
 *
 * @example
 * ```typescript
 * const proc = spawn('echo', ['Hello']);
 * const output = await streamToString(proc.stdout);
 * console.log(output); // 'Hello\n'
 * ```
 *
 * @category CLI
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
 * Waits for a child process to exit and returns the exit code.
 *
 * Handles the race condition where a process may exit before the
 * listener is registered by checking exitCode after attaching the
 * close handler.
 *
 * @param proc - The child process to wait for
 * @returns Promise resolving to the exit code (0 if null)
 *
 * @example
 * ```typescript
 * const proc = spawn('npm', ['test']);
 * const exitCode = await waitForExit(proc);
 * if (exitCode !== 0) {
 *   console.error('Tests failed');
 * }
 * ```
 *
 * @category CLI
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
 * Converts a Node.js Readable stream to a Web ReadableStream.
 *
 * Creates a WHATWG-compatible ReadableStream that wraps a Node.js
 * Readable stream, enabling use with web APIs.
 *
 * @param nodeStream - A Node.js Readable stream
 * @returns A Web ReadableStream of Uint8Array chunks
 *
 * @example
 * ```typescript
 * const proc = spawn('cat', ['file.txt']);
 * const webStream = nodeStreamToWebStream(proc.stdout!);
 *
 * const reader = webStream.getReader();
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *   console.log(new TextDecoder().decode(value));
 * }
 * ```
 *
 * @category CLI
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
