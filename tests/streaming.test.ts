import { describe, expect, it } from 'bun:test';
import { collectStreamEvents, parseJsonLines } from '../src/cli/stream-parser';
import type { StreamEvent } from '../src/types';
import {
	MOCK_SESSION_ID,
	mockCompletionEvent,
	mockMessageEvent,
	mockStreamEvents,
	mockSystemInitEvent,
} from './fixtures/mock-responses';

function createMockStream(lines: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	let index = 0;

	return new ReadableStream({
		pull(controller) {
			if (index < lines.length) {
				const line = lines[index];
				if (line !== undefined) {
					controller.enqueue(encoder.encode(`${line}\n`));
				}
				index++;
			} else {
				controller.close();
			}
		},
	});
}

describe('parseJsonLines', () => {
	it('should parse valid JSONL stream', async () => {
		const lines = [JSON.stringify(mockSystemInitEvent), JSON.stringify(mockMessageEvent)];

		const stream = createMockStream(lines);
		const events: StreamEvent[] = [];

		for await (const event of parseJsonLines(stream)) {
			events.push(event);
		}

		expect(events.length).toBe(2);
		expect(events[0]?.type).toBe('system');
		expect(events[1]?.type).toBe('message');
	});

	it('should handle empty lines', async () => {
		const lines = [JSON.stringify(mockSystemInitEvent), '', JSON.stringify(mockMessageEvent)];

		const stream = createMockStream(lines);
		const events: StreamEvent[] = [];

		for await (const event of parseJsonLines(stream)) {
			events.push(event);
		}

		expect(events.length).toBe(2);
	});

	it('should throw ParseError for invalid JSON', async () => {
		const lines = ['not valid json'];
		const stream = createMockStream(lines);

		const events = parseJsonLines(stream);

		await expect(async () => {
			for await (const _ of events) {
			}
		}).toThrow();
	});
});

describe('collectStreamEvents', () => {
	it('should extract session ID from events', () => {
		const result = collectStreamEvents(mockStreamEvents);
		expect(result.sessionId).toBe(MOCK_SESSION_ID);
	});

	it('should extract completion data', () => {
		const result = collectStreamEvents(mockStreamEvents);
		expect(result.finalText).toBe(mockCompletionEvent.finalText);
		expect(result.durationMs).toBe(mockCompletionEvent.durationMs);
		expect(result.numTurns).toBe(1);
		expect(result.isError).toBe(false);
	});

	it('should detect failed turns', () => {
		const failedEvents: StreamEvent[] = [
			mockSystemInitEvent,
			{
				type: 'turn.failed',
				error: { message: 'Test error', code: 'ERR' },
				session_id: MOCK_SESSION_ID,
				timestamp: Date.now(),
			},
		];

		const result = collectStreamEvents(failedEvents);
		expect(result.isError).toBe(true);
		expect(result.errorMessage).toBe('Test error');
	});

	it('should handle empty events', () => {
		const result = collectStreamEvents([]);
		expect(result.sessionId).toBeUndefined();
		expect(result.finalText).toBeUndefined();
		expect(result.isError).toBe(false);
	});
});
