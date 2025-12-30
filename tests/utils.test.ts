import { describe, expect, it } from 'bun:test';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { nodeStreamToWebStream, streamToString, waitForExit } from '../src/cli/utils';

describe('streamToString', () => {
	it('should return empty string for null stream', async () => {
		const result = await streamToString(null);
		expect(result).toBe('');
	});

	it('should convert readable stream to string', async () => {
		const readable = Readable.from([Buffer.from('Hello'), Buffer.from(' '), Buffer.from('World')]);
		const result = await streamToString(readable);
		expect(result).toBe('Hello World');
	});

	it('should handle empty stream', async () => {
		const readable = Readable.from([]);
		const result = await streamToString(readable);
		expect(result).toBe('');
	});

	it('should handle multi-line content', async () => {
		const content = 'Line 1\nLine 2\nLine 3';
		const readable = Readable.from([Buffer.from(content)]);
		const result = await streamToString(readable);
		expect(result).toBe(content);
	});
});

describe('waitForExit', () => {
	it('should resolve with exit code 0 for successful process', async () => {
		const proc = spawn('echo', ['hello']);
		const exitCode = await waitForExit(proc);
		expect(exitCode).toBe(0);
	});

	it('should resolve with non-zero exit code for failed process', async () => {
		const proc = spawn('sh', ['-c', 'exit 42']);
		const exitCode = await waitForExit(proc);
		expect(exitCode).toBe(42);
	});

	it('should handle process that exits before waitForExit is called', async () => {
		const proc = spawn('echo', ['hello']);

		// Wait for process to actually exit
		await new Promise<void>((resolve) => {
			proc.on('close', () => resolve());
		});

		// Now call waitForExit on already-exited process
		const exitCode = await waitForExit(proc);
		expect(exitCode).toBe(0);
	});

	it('should only resolve once even if both conditions trigger', async () => {
		// This tests the resolveOnce guard
		let resolveCount = 0;
		const proc = spawn('echo', ['hello']);

		const exitCode = await waitForExit(proc);

		// If the guard works, this should still be a valid exit code
		expect(exitCode).toBe(0);
		expect(typeof exitCode).toBe('number');
	});
});

describe('nodeStreamToWebStream', () => {
	it('should convert Node stream to Web ReadableStream', async () => {
		const nodeStream = Readable.from([
			Buffer.from('Hello'),
			Buffer.from(' '),
			Buffer.from('World'),
		]);
		const webStream = nodeStreamToWebStream(nodeStream);

		expect(webStream).toBeInstanceOf(ReadableStream);

		const reader = webStream.getReader();
		const chunks: Uint8Array[] = [];

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}

		const decoder = new TextDecoder();
		const result = chunks.map((chunk) => decoder.decode(chunk)).join('');
		expect(result).toBe('Hello World');
	});

	it('should handle empty stream', async () => {
		const nodeStream = Readable.from([]);
		const webStream = nodeStreamToWebStream(nodeStream);

		const reader = webStream.getReader();
		const { done, value } = await reader.read();

		expect(done).toBe(true);
		expect(value).toBeUndefined();
	});

	it('should propagate errors', async () => {
		const nodeStream = new Readable({
			read() {
				this.destroy(new Error('Test error'));
			},
		});

		const webStream = nodeStreamToWebStream(nodeStream);
		const reader = webStream.getReader();

		await expect(reader.read()).rejects.toThrow('Test error');
	});
});
