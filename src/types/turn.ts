export interface TurnItem {
	type: 'message' | 'tool_call' | 'tool_result';
}

export interface MessageItem extends TurnItem {
	type: 'message';
	role: 'user' | 'assistant';
	id: string;
	text: string;
	timestamp: number;
}

export interface ToolCallItem extends TurnItem {
	type: 'tool_call';
	id: string;
	messageId: string;
	toolId: string;
	toolName: string;
	parameters: Record<string, unknown>;
	timestamp: number;
}

export interface ToolResultItem extends TurnItem {
	type: 'tool_result';
	id: string;
	messageId: string;
	toolId: string;
	toolName: string;
	isError: boolean;
	value: string;
	timestamp: number;
}

export type AnyTurnItem = MessageItem | ToolCallItem | ToolResultItem;

export interface TurnResultData {
	finalResponse: string;
	items: AnyTurnItem[];
	sessionId: string;
	durationMs: number;
	numTurns: number;
	isError: boolean;
}

export interface JsonResult {
	type: 'result';
	subtype: 'success' | 'error';
	is_error: boolean;
	duration_ms: number;
	num_turns: number;
	result: string;
	session_id: string;
}
