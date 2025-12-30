import { ParseError, StreamError } from '../errors';
import type { StreamEvent } from '../types';

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

export function collectStreamEvents(events: StreamEvent[]): {
	sessionId: string | undefined;
	finalText: string | undefined;
	durationMs: number;
	numTurns: number;
	isError: boolean;
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
