/**
 * System initialization event.
 *
 * Emitted at the start of a streaming execution to indicate the
 * session configuration and available tools.
 *
 * @category Events
 */
export interface SystemInitEvent {
	/** Event type identifier */
	type: 'system';
	/** Event subtype */
	subtype: 'init';
	/** Working directory for this session */
	cwd: string;
	/** Unique session identifier */
	session_id: string;
	/** List of available tool names */
	tools: string[];
	/** AI model being used */
	model: string;
}

/**
 * Message event for user or assistant messages.
 *
 * Emitted when a message is sent or received during execution.
 * Check the `role` property to distinguish between user prompts
 * and AI responses.
 *
 * @category Events
 */
export interface MessageEvent {
	/** Event type identifier */
	type: 'message';
	/** Message author role */
	role: 'user' | 'assistant';
	/** Unique message identifier */
	id: string;
	/** Message text content */
	text: string;
	/** Unix timestamp in milliseconds */
	timestamp: number;
	/** Session identifier */
	session_id: string;
}

/**
 * Tool call event.
 *
 * Emitted when the AI invokes a tool during execution.
 * Contains the tool name and parameters being passed.
 *
 * @example
 * ```typescript
 * if (isToolCallEvent(event)) {
 *   console.log(`Calling ${event.toolName} with:`, event.parameters);
 * }
 * ```
 *
 * @category Events
 */
export interface ToolCallEvent {
	/** Event type identifier */
	type: 'tool_call';
	/** Unique identifier for this tool call */
	id: string;
	/** ID of the message containing this tool call */
	messageId: string;
	/** Internal tool identifier */
	toolId: string;
	/** Human-readable tool name */
	toolName: string;
	/** Parameters passed to the tool */
	parameters: Record<string, unknown>;
	/** Unix timestamp in milliseconds */
	timestamp: number;
	/** Session identifier */
	session_id: string;
}

/**
 * Tool result event.
 *
 * Emitted after a tool call completes with the result or error.
 *
 * @example
 * ```typescript
 * if (isToolResultEvent(event)) {
 *   if (event.isError) {
 *     console.error(`${event.toolName} failed:`, event.value);
 *   } else {
 *     console.log(`${event.toolName} succeeded:`, event.value.slice(0, 100));
 *   }
 * }
 * ```
 *
 * @category Events
 */
export interface ToolResultEvent {
	/** Event type identifier */
	type: 'tool_result';
	/** Unique identifier for this result */
	id: string;
	/** ID of the message containing the original tool call */
	messageId: string;
	/** Internal tool identifier */
	toolId: string;
	/** Human-readable tool name */
	toolName: string;
	/** Whether the tool execution resulted in an error */
	isError: boolean;
	/** Tool output value or error message */
	value: string;
	/** Unix timestamp in milliseconds */
	timestamp: number;
	/** Session identifier */
	session_id: string;
}

/**
 * Turn completed event.
 *
 * Emitted when execution completes successfully with the final response
 * and execution statistics.
 *
 * @category Events
 */
export interface TurnCompletedEvent {
	/** Event type identifier */
	type: 'completion';
	/** Final text response from the AI */
	finalText: string;
	/** Number of conversation turns */
	numTurns: number;
	/** Total execution duration in milliseconds */
	durationMs: number;
	/** Session identifier */
	session_id: string;
	/** Unix timestamp in milliseconds */
	timestamp: number;
}

/**
 * Turn failed event.
 *
 * Emitted when execution fails with error details.
 *
 * @category Events
 */
export interface TurnFailedEvent {
	/** Event type identifier */
	type: 'turn.failed';
	/** Error information */
	error: {
		/** Human-readable error message */
		message: string;
		/** Error code if available */
		code?: string;
	};
	/** Session identifier */
	session_id: string;
	/** Unix timestamp in milliseconds */
	timestamp: number;
}

/**
 * Union of all stream event types.
 *
 * Use the type guard functions to narrow the type:
 * - {@link isSystemInitEvent}
 * - {@link isMessageEvent}
 * - {@link isToolCallEvent}
 * - {@link isToolResultEvent}
 * - {@link isTurnCompletedEvent}
 * - {@link isTurnFailedEvent}
 *
 * @category Events
 */
export type StreamEvent =
	| SystemInitEvent
	| MessageEvent
	| ToolCallEvent
	| ToolResultEvent
	| TurnCompletedEvent
	| TurnFailedEvent;

/**
 * Type guard for system initialization events.
 *
 * @param event - The event to check
 * @returns True if the event is a SystemInitEvent
 *
 * @example
 * ```typescript
 * for await (const event of events) {
 *   if (isSystemInitEvent(event)) {
 *     console.log('Session started:', event.session_id);
 *     console.log('Available tools:', event.tools);
 *   }
 * }
 * ```
 *
 * @category Events
 */
export function isSystemInitEvent(event: StreamEvent): event is SystemInitEvent {
	return event.type === 'system' && (event as SystemInitEvent).subtype === 'init';
}

/**
 * Type guard for message events.
 *
 * @param event - The event to check
 * @returns True if the event is a MessageEvent
 *
 * @example
 * ```typescript
 * if (isMessageEvent(event)) {
 *   console.log(`[${event.role}] ${event.text}`);
 * }
 * ```
 *
 * @category Events
 */
export function isMessageEvent(event: StreamEvent): event is MessageEvent {
	return event.type === 'message';
}

/**
 * Type guard for tool call events.
 *
 * @param event - The event to check
 * @returns True if the event is a ToolCallEvent
 *
 * @example
 * ```typescript
 * if (isToolCallEvent(event)) {
 *   console.log(`Calling ${event.toolName}...`);
 * }
 * ```
 *
 * @category Events
 */
export function isToolCallEvent(event: StreamEvent): event is ToolCallEvent {
	return event.type === 'tool_call';
}

/**
 * Type guard for tool result events.
 *
 * @param event - The event to check
 * @returns True if the event is a ToolResultEvent
 *
 * @example
 * ```typescript
 * if (isToolResultEvent(event)) {
 *   if (event.isError) {
 *     console.error('Tool error:', event.value);
 *   }
 * }
 * ```
 *
 * @category Events
 */
export function isToolResultEvent(event: StreamEvent): event is ToolResultEvent {
	return event.type === 'tool_result';
}

/**
 * Type guard for turn completed events.
 *
 * @param event - The event to check
 * @returns True if the event is a TurnCompletedEvent
 *
 * @example
 * ```typescript
 * if (isTurnCompletedEvent(event)) {
 *   console.log(`Completed in ${event.durationMs}ms`);
 * }
 * ```
 *
 * @category Events
 */
export function isTurnCompletedEvent(event: StreamEvent): event is TurnCompletedEvent {
	return event.type === 'completion';
}

/**
 * Type guard for turn failed events.
 *
 * @param event - The event to check
 * @returns True if the event is a TurnFailedEvent
 *
 * @example
 * ```typescript
 * if (isTurnFailedEvent(event)) {
 *   console.error('Execution failed:', event.error.message);
 * }
 * ```
 *
 * @category Events
 */
export function isTurnFailedEvent(event: StreamEvent): event is TurnFailedEvent {
	return event.type === 'turn.failed';
}
