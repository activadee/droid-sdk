/**
 * Base interface for all turn items.
 *
 * Turn items represent discrete events that occurred during an
 * execution turn, such as messages, tool calls, and tool results.
 *
 * @category Types
 */
export interface TurnItem {
	/** Discriminator for the item type */
	type: 'message' | 'tool_call' | 'tool_result';
}

/**
 * A message item from an execution turn.
 *
 * Represents a message exchanged during the conversation, either
 * from the user (prompt) or assistant (AI response).
 *
 * @example
 * ```typescript
 * for (const msg of result.messages) {
 *   console.log(`[${msg.role}] ${msg.text}`);
 * }
 * ```
 *
 * @category Types
 */
export interface MessageItem extends TurnItem {
	/** Item type discriminator */
	type: 'message';
	/** Message author: 'user' for prompts, 'assistant' for AI responses */
	role: 'user' | 'assistant';
	/** Unique message identifier */
	id: string;
	/** Message text content */
	text: string;
	/** Unix timestamp in milliseconds when the message was created */
	timestamp: number;
}

/**
 * A tool call item from an execution turn.
 *
 * Represents an AI request to execute a tool with specific parameters.
 * Each tool call will have a corresponding {@link ToolResultItem}.
 *
 * @example
 * ```typescript
 * for (const call of result.toolCalls) {
 *   console.log(`Tool: ${call.toolName}`);
 *   console.log(`Params: ${JSON.stringify(call.parameters, null, 2)}`);
 * }
 * ```
 *
 * @category Types
 */
export interface ToolCallItem extends TurnItem {
	/** Item type discriminator */
	type: 'tool_call';
	/** Unique identifier for this tool call */
	id: string;
	/** ID of the message that contains this tool call */
	messageId: string;
	/** Internal tool identifier */
	toolId: string;
	/** Human-readable tool name (e.g., 'file_read', 'shell_exec') */
	toolName: string;
	/** Parameters passed to the tool */
	parameters: Record<string, unknown>;
	/** Unix timestamp in milliseconds */
	timestamp: number;
}

/**
 * A tool result item from an execution turn.
 *
 * Represents the output from a tool execution, which may be a
 * successful result or an error.
 *
 * @example
 * ```typescript
 * for (const result of result.toolResults) {
 *   if (result.isError) {
 *     console.error(`${result.toolName} failed: ${result.value}`);
 *   } else {
 *     console.log(`${result.toolName}: ${result.value.slice(0, 100)}...`);
 *   }
 * }
 * ```
 *
 * @category Types
 */
export interface ToolResultItem extends TurnItem {
	/** Item type discriminator */
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
}

/**
 * Union type of all turn item types.
 *
 * Use the `type` property to narrow the type:
 *
 * @example
 * ```typescript
 * for (const item of result.items) {
 *   switch (item.type) {
 *     case 'message':
 *       console.log(`Message: ${item.text}`);
 *       break;
 *     case 'tool_call':
 *       console.log(`Tool call: ${item.toolName}`);
 *       break;
 *     case 'tool_result':
 *       console.log(`Tool result: ${item.value}`);
 *       break;
 *   }
 * }
 * ```
 *
 * @category Types
 */
export type AnyTurnItem = MessageItem | ToolCallItem | ToolResultItem;

/**
 * Data structure for TurnResult construction.
 *
 * Contains all the data needed to construct a {@link TurnResult} instance.
 * This is typically created internally from CLI output.
 *
 * @category Types
 */
export interface TurnResultData {
	/** The final text response from the AI */
	finalResponse: string;
	/** All items from this execution turn */
	items: AnyTurnItem[];
	/** Unique session identifier */
	sessionId: string;
	/** Total execution duration in milliseconds */
	durationMs: number;
	/** Number of conversation turns */
	numTurns: number;
	/** Whether the execution resulted in an error */
	isError: boolean;
}

/**
 * JSON response structure from the Droid CLI.
 *
 * This represents the raw JSON output format when using the `-o json`
 * output format with the CLI.
 *
 * @internal
 * @category Types
 */
export interface JsonResult {
	/** Response type */
	type: 'result';
	/** Result subtype indicating success or error */
	subtype: 'success' | 'error';
	/** Whether the execution resulted in an error */
	is_error: boolean;
	/** Execution duration in milliseconds */
	duration_ms: number;
	/** Number of conversation turns */
	num_turns: number;
	/** Final response text */
	result: string;
	/** Session identifier */
	session_id: string;
}
