import { ParseError } from './errors';
import type {
	AnyTurnItem,
	MessageItem,
	StreamEvent,
	ToolCallItem,
	ToolResultItem,
	TurnResultData,
} from './types';

export class TurnResult {
	readonly finalResponse: string;
	readonly items: AnyTurnItem[];
	readonly sessionId: string;
	readonly durationMs: number;
	readonly numTurns: number;
	readonly isError: boolean;

	constructor(data: TurnResultData) {
		this.finalResponse = data.finalResponse;
		this.items = data.items;
		this.sessionId = data.sessionId;
		this.durationMs = data.durationMs;
		this.numTurns = data.numTurns;
		this.isError = data.isError;
	}

	parse<T>(schema: { parse: (data: unknown) => T }): T {
		try {
			const data = JSON.parse(this.finalResponse);
			return schema.parse(data);
		} catch (error) {
			if (error instanceof SyntaxError) {
				throw new ParseError('Failed to parse finalResponse as JSON', this.finalResponse, error);
			}
			throw error;
		}
	}

	tryParse<T>(schema: { safeParse: (data: unknown) => { success: boolean; data?: T } }): T | null {
		try {
			const data = JSON.parse(this.finalResponse);
			const result = schema.safeParse(data);
			return result.success ? (result.data ?? null) : null;
		} catch {
			return null;
		}
	}

	get toolCalls(): ToolCallItem[] {
		return this.items.filter((item): item is ToolCallItem => item.type === 'tool_call');
	}

	get toolResults(): ToolResultItem[] {
		return this.items.filter((item): item is ToolResultItem => item.type === 'tool_result');
	}

	get messages(): MessageItem[] {
		return this.items.filter((item): item is MessageItem => item.type === 'message');
	}

	get assistantMessages(): MessageItem[] {
		return this.messages.filter((m) => m.role === 'assistant');
	}

	toJSON(): TurnResultData {
		return {
			finalResponse: this.finalResponse,
			items: this.items,
			sessionId: this.sessionId,
			durationMs: this.durationMs,
			numTurns: this.numTurns,
			isError: this.isError,
		};
	}
}

export function buildTurnResultFromEvents(events: StreamEvent[]): TurnResult {
	const items: AnyTurnItem[] = [];
	let sessionId = '';
	let finalResponse = '';
	let durationMs = 0;
	let numTurns = 0;
	let isError = false;

	for (const event of events) {
		if ('session_id' in event && event.session_id) {
			sessionId = event.session_id;
		}

		switch (event.type) {
			case 'message':
				items.push({
					type: 'message',
					role: event.role,
					id: event.id,
					text: event.text,
					timestamp: event.timestamp,
				});
				break;

			case 'tool_call':
				items.push({
					type: 'tool_call',
					id: event.id,
					messageId: event.messageId,
					toolId: event.toolId,
					toolName: event.toolName,
					parameters: event.parameters,
					timestamp: event.timestamp,
				});
				break;

			case 'tool_result':
				items.push({
					type: 'tool_result',
					id: event.id,
					messageId: event.messageId,
					toolId: event.toolId,
					toolName: event.toolName,
					isError: event.isError,
					value: event.value,
					timestamp: event.timestamp,
				});
				break;

			case 'completion':
				finalResponse = event.finalText;
				durationMs = event.durationMs;
				numTurns = event.numTurns;
				break;

			case 'turn.failed':
				isError = true;
				finalResponse = event.error.message;
				break;
		}
	}

	return new TurnResult({
		finalResponse,
		items,
		sessionId,
		durationMs,
		numTurns,
		isError,
	});
}

export function buildTurnResultFromJson(json: {
	result: string;
	session_id: string;
	duration_ms: number;
	num_turns: number;
	is_error: boolean;
}): TurnResult {
	return new TurnResult({
		finalResponse: json.result,
		items: [],
		sessionId: json.session_id,
		durationMs: json.duration_ms,
		numTurns: json.num_turns,
		isError: json.is_error,
	});
}
