import type { JsonResult, StreamEvent } from '../../src/types';

export const MOCK_SESSION_ID = 'test-session-abc123';

export const mockSystemInitEvent: StreamEvent = {
	type: 'system',
	subtype: 'init',
	cwd: '/test/project',
	session_id: MOCK_SESSION_ID,
	tools: ['Read', 'Write', 'Execute', 'Grep', 'Glob'],
	model: 'claude-opus-4-5-20251101',
};

export const mockMessageEvent: StreamEvent = {
	type: 'message',
	role: 'assistant',
	id: 'msg-1',
	text: 'I will analyze the codebase.',
	timestamp: Date.now(),
	session_id: MOCK_SESSION_ID,
};

export const mockToolCallEvent: StreamEvent = {
	type: 'tool_call',
	id: 'call-1',
	messageId: 'msg-1',
	toolId: 'Read',
	toolName: 'Read',
	parameters: { file_path: '/test/project/README.md' },
	timestamp: Date.now(),
	session_id: MOCK_SESSION_ID,
};

export const mockToolResultEvent: StreamEvent = {
	type: 'tool_result',
	id: 'call-1',
	messageId: 'msg-2',
	toolId: 'Read',
	toolName: 'Read',
	isError: false,
	value: '# Test Project\n\nThis is a test project.',
	timestamp: Date.now(),
	session_id: MOCK_SESSION_ID,
};

export const mockCompletionEvent: StreamEvent = {
	type: 'completion',
	finalText: 'The codebase analysis is complete. This is a well-structured project.',
	numTurns: 1,
	durationMs: 1500,
	session_id: MOCK_SESSION_ID,
	timestamp: Date.now(),
};

export const mockTurnFailedEvent: StreamEvent = {
	type: 'turn.failed',
	error: {
		message: 'Rate limit exceeded',
		code: 'RATE_LIMIT',
	},
	session_id: MOCK_SESSION_ID,
	timestamp: Date.now(),
};

export const mockJsonResult: JsonResult = {
	type: 'result',
	subtype: 'success',
	is_error: false,
	duration_ms: 1500,
	num_turns: 1,
	result: 'The codebase analysis is complete.',
	session_id: MOCK_SESSION_ID,
};

export const mockStreamEvents: StreamEvent[] = [
	mockSystemInitEvent,
	mockMessageEvent,
	mockToolCallEvent,
	mockToolResultEvent,
	mockCompletionEvent,
];
