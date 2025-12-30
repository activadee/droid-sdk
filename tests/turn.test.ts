import { describe, expect, it } from 'bun:test';
import { TurnResult, buildTurnResultFromEvents, buildTurnResultFromJson } from '../src/turn';
import {
	MOCK_SESSION_ID,
	mockCompletionEvent,
	mockJsonResult,
	mockMessageEvent,
	mockStreamEvents,
} from './fixtures/mock-responses';

describe('TurnResult', () => {
	describe('constructor', () => {
		it('should create a TurnResult with all properties', () => {
			const result = new TurnResult({
				finalResponse: 'Test response',
				items: [],
				sessionId: 'session-123',
				durationMs: 1000,
				numTurns: 1,
				isError: false,
			});

			expect(result.finalResponse).toBe('Test response');
			expect(result.sessionId).toBe('session-123');
			expect(result.durationMs).toBe(1000);
			expect(result.numTurns).toBe(1);
			expect(result.isError).toBe(false);
		});
	});

	describe('parse', () => {
		it('should parse JSON response with a schema', () => {
			const result = new TurnResult({
				finalResponse: '{"name": "test", "count": 42}',
				items: [],
				sessionId: 'session-123',
				durationMs: 1000,
				numTurns: 1,
				isError: false,
			});

			const mockSchema = {
				parse: (data: unknown) => data as { name: string; count: number },
			};

			const parsed = result.parse(mockSchema);
			expect(parsed.name).toBe('test');
			expect(parsed.count).toBe(42);
		});

		it('should throw ParseError for invalid JSON', () => {
			const result = new TurnResult({
				finalResponse: 'not valid json',
				items: [],
				sessionId: 'session-123',
				durationMs: 1000,
				numTurns: 1,
				isError: false,
			});

			const mockSchema = {
				parse: (data: unknown) => data,
			};

			expect(() => result.parse(mockSchema)).toThrow('Failed to parse finalResponse as JSON');
		});
	});

	describe('tryParse', () => {
		it('should return parsed data on success', () => {
			const result = new TurnResult({
				finalResponse: '{"value": 100}',
				items: [],
				sessionId: 'session-123',
				durationMs: 1000,
				numTurns: 1,
				isError: false,
			});

			const mockSchema = {
				safeParse: (data: unknown) => ({
					success: true,
					data: data as { value: number },
				}),
			};

			const parsed = result.tryParse(mockSchema);
			expect(parsed?.value).toBe(100);
		});

		it('should return null on parse failure', () => {
			const result = new TurnResult({
				finalResponse: 'invalid',
				items: [],
				sessionId: 'session-123',
				durationMs: 1000,
				numTurns: 1,
				isError: false,
			});

			const mockSchema = {
				safeParse: () => ({ success: false }),
			};

			expect(result.tryParse(mockSchema)).toBeNull();
		});
	});

	describe('accessors', () => {
		it('should filter tool calls correctly', () => {
			const result = buildTurnResultFromEvents(mockStreamEvents);
			expect(result.toolCalls.length).toBe(1);
			expect(result.toolCalls[0]?.toolName).toBe('Read');
		});

		it('should filter tool results correctly', () => {
			const result = buildTurnResultFromEvents(mockStreamEvents);
			expect(result.toolResults.length).toBe(1);
			expect(result.toolResults[0]?.isError).toBe(false);
		});

		it('should filter messages correctly', () => {
			const result = buildTurnResultFromEvents(mockStreamEvents);
			expect(result.messages.length).toBe(1);
			expect(result.messages[0]?.role).toBe('assistant');
		});
	});

	describe('toJSON', () => {
		it('should serialize to JSON correctly', () => {
			const result = new TurnResult({
				finalResponse: 'Test',
				items: [],
				sessionId: 'session-123',
				durationMs: 500,
				numTurns: 2,
				isError: false,
			});

			const json = result.toJSON();
			expect(json.finalResponse).toBe('Test');
			expect(json.sessionId).toBe('session-123');
			expect(json.durationMs).toBe(500);
		});
	});
});

describe('buildTurnResultFromEvents', () => {
	it('should build result from stream events', () => {
		const result = buildTurnResultFromEvents(mockStreamEvents);

		expect(result.sessionId).toBe(MOCK_SESSION_ID);
		expect(result.finalResponse).toBe(mockCompletionEvent.finalText);
		expect(result.durationMs).toBe(mockCompletionEvent.durationMs);
		expect(result.numTurns).toBe(1);
		expect(result.isError).toBe(false);
	});

	it('should handle failed turns', () => {
		const failedEvents = [
			mockMessageEvent,
			{ type: 'turn.failed', error: { message: 'Error' }, session_id: 'test', timestamp: 0 },
		] as const;

		const result = buildTurnResultFromEvents([...failedEvents]);
		expect(result.isError).toBe(true);
		expect(result.finalResponse).toBe('Error');
	});
});

describe('buildTurnResultFromJson', () => {
	it('should build result from JSON response', () => {
		const result = buildTurnResultFromJson(mockJsonResult);

		expect(result.sessionId).toBe(MOCK_SESSION_ID);
		expect(result.finalResponse).toBe(mockJsonResult.result);
		expect(result.durationMs).toBe(mockJsonResult.duration_ms);
		expect(result.numTurns).toBe(mockJsonResult.num_turns);
		expect(result.isError).toBe(mockJsonResult.is_error);
		expect(result.items).toEqual([]);
	});
});
