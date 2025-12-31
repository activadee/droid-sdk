import { ParseError, StreamError } from '../errors';
import type { StreamEvent } from '../types';

/**
 * Parses a stream of newline-delimited JSON into stream events.
 *
 * This async generator reads from a byte stream, buffers partial lines,
 * and yields parsed {@link StreamEvent} objects as they become available.
 *
 * @param stream - A readable stream of bytes (from CLI stdout)
 * @yields Parsed stream events in order
 *
 * @throws {StreamError} If reading from the stream fails
 * @throws {ParseError} If a line cannot be parsed as JSON
 *
 * @example
 * ```typescript
 * const stream = process.stdout; // Assume Web ReadableStream
 * for await (const event of parseJsonLines(stream)) {
 *   console.log(event.type, event);
 * }
 * ```
 *
 * @category CLI
 */
export async function* parseJsonLines(
	stream: ReadableStream<Uint8Array>,
): AsyncGenerator<StreamEvent, void, unknown> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				if (buffer.trim()) {
					yield parseJsonLine(buffer.trim());
				}
				break;
			}

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed) {
					yield parseJsonLine(trimmed);
				}
			}
		}
	} catch (error) {
		throw new StreamError(
			'Failed to read stream',
			error instanceof Error ? error : new Error(String(error)),
		);
	} finally {
		reader.releaseLock();
	}
}

/**
 * Parses a single JSON line into a stream event.
 *
 * @param line - A single line of JSON text
 * @returns Parsed stream event
 *
 * @throws {ParseError} If the line is not valid JSON
 *
 * @internal
 */
function parseJsonLine(line: string): StreamEvent {
	try {
		return JSON.parse(line) as StreamEvent;
	} catch (error) {
		throw new ParseError(
			`Failed to parse JSON line: ${line.slice(0, 100)}...`,
			line,
			error instanceof Error ? error : undefined,
		);
	}
}

/**
 * Collects summary information from an array of stream events.
 *
 * Extracts the session ID, final response, timing, and error status
 * from a collection of events. Useful for aggregating streaming results.
 *
 * @param events - Array of stream events to process
 * @returns Collected summary with session info, final text, and status
 *
 * @example
 * ```typescript
 * const events: StreamEvent[] = [];
 * for await (const event of stream) {
 *   events.push(event);
 * }
 *
 * const summary = collectStreamEvents(events);
 * console.log(`Session: ${summary.sessionId}`);
 * console.log(`Duration: ${summary.durationMs}ms`);
 * console.log(`Result: ${summary.finalText}`);
 * ```
 *
 * @category CLI
 */
export function collectStreamEvents(events: StreamEvent[]): {
	/** Session ID from the events */
	sessionId: string | undefined;
	/** Final response text */
	finalText: string | undefined;
	/** Total execution duration in milliseconds */
	durationMs: number;
	/** Number of conversation turns */
	numTurns: number;
	/** Whether an error occurred */
	isError: boolean;
	/** Error message if isError is true */
	errorMessage?: string;
} {
	let sessionId: string | undefined;
	let finalText: string | undefined;
	let durationMs = 0;
	let numTurns = 0;
	let isError = false;
	let errorMessage: string | undefined;

	for (const event of events) {
		if ('session_id' in event && event.session_id) {
			sessionId = event.session_id;
		}

		if (event.type === 'completion') {
			finalText = event.finalText;
			durationMs = event.durationMs;
			numTurns = event.numTurns;
		}

		if (event.type === 'turn.failed') {
			isError = true;
			errorMessage = event.error.message;
		}
	}

	return { sessionId, finalText, durationMs, numTurns, isError, errorMessage };
}
