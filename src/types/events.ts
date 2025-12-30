export interface SystemInitEvent {
	type: 'system';
	subtype: 'init';
	cwd: string;
	session_id: string;
	tools: string[];
	model: string;
}

export interface MessageEvent {
	type: 'message';
	role: 'user' | 'assistant';
	id: string;
	text: string;
	timestamp: number;
	session_id: string;
}

export interface ToolCallEvent {
	type: 'tool_call';
	id: string;
	messageId: string;
	toolId: string;
	toolName: string;
	parameters: Record<string, unknown>;
	timestamp: number;
	session_id: string;
}

export interface ToolResultEvent {
	type: 'tool_result';
	id: string;
	messageId: string;
	toolId: string;
	toolName: string;
	isError: boolean;
	value: string;
	timestamp: number;
	session_id: string;
}

export interface TurnCompletedEvent {
	type: 'completion';
	finalText: string;
	numTurns: number;
	durationMs: number;
	session_id: string;
	timestamp: number;
}

export interface TurnFailedEvent {
	type: 'turn.failed';
	error: {
		message: string;
		code?: string;
	};
	session_id: string;
	timestamp: number;
}

export type StreamEvent =
	| SystemInitEvent
	| MessageEvent
	| ToolCallEvent
	| ToolResultEvent
	| TurnCompletedEvent
	| TurnFailedEvent;

export function isSystemInitEvent(event: StreamEvent): event is SystemInitEvent {
	return event.type === 'system' && (event as SystemInitEvent).subtype === 'init';
}

export function isMessageEvent(event: StreamEvent): event is MessageEvent {
	return event.type === 'message';
}

export function isToolCallEvent(event: StreamEvent): event is ToolCallEvent {
	return event.type === 'tool_call';
}

export function isToolResultEvent(event: StreamEvent): event is ToolResultEvent {
	return event.type === 'tool_result';
}

export function isTurnCompletedEvent(event: StreamEvent): event is TurnCompletedEvent {
	return event.type === 'completion';
}

export function isTurnFailedEvent(event: StreamEvent): event is TurnFailedEvent {
	return event.type === 'turn.failed';
}
