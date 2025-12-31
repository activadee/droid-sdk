import { ParseError } from './errors';
import type {
	AnyTurnItem,
	MessageItem,
	StreamEvent,
	ToolCallItem,
	ToolResultItem,
	TurnResultData,
} from './types';

/**
 * Represents the result of a Droid execution turn.
 *
 * TurnResult encapsulates all data from a single AI interaction, including
 * the final response, tool calls made, messages exchanged, and execution
 * metadata. It provides convenient accessors for filtering results and
 * methods for parsing structured output.
 *
 * @example
 * ```typescript
 * const result = await thread.run('Generate a config object');
 *
 * // Access the final text response
 * console.log(result.finalResponse);
 *
 * // Check execution metadata
 * console.log(`Completed in ${result.durationMs}ms over ${result.numTurns} turns`);
 *
 * // Access tool calls and results
 * for (const call of result.toolCalls) {
 *   console.log(`Called: ${call.toolName}`);
 * }
 *
 * // Parse structured JSON output
 * import { z } from 'zod';
 * const Config = z.object({ port: z.number(), host: z.string() });
 * const config = result.parse(Config);
 * ```
 *
 * @see {@link Thread.run} for creating TurnResult instances
 * @see {@link Thread.runStreamed} for streaming execution
 *
 * @category Core
 */
export class TurnResult {
	/**
	 * The final text response from the AI.
	 *
	 * This contains the complete response after all tool calls have been
	 * processed. For structured output, this will be JSON that can be
	 * parsed using {@link parse} or {@link tryParse}.
	 */
	readonly finalResponse: string;

	/**
	 * All items from this execution turn.
	 *
	 * Items include messages (user and assistant), tool calls, and tool
	 * results in chronological order. Use the typed accessors like
	 * {@link toolCalls}, {@link toolResults}, and {@link messages} for
	 * filtered access.
	 */
	readonly items: AnyTurnItem[];

	/**
	 * The unique session identifier for this conversation.
	 *
	 * This ID can be used with {@link Droid.resumeThread} to continue
	 * the conversation later.
	 */
	readonly sessionId: string;

	/**
	 * Total execution time in milliseconds.
	 *
	 * Measures the time from prompt submission to final response,
	 * including all tool calls.
	 */
	readonly durationMs: number;

	/**
	 * Number of conversation turns in this execution.
	 *
	 * A turn typically represents one prompt-response cycle, though
	 * complex operations may involve multiple internal turns.
	 */
	readonly numTurns: number;

	/**
	 * Indicates whether the execution resulted in an error.
	 *
	 * When true, {@link finalResponse} may contain error details
	 * rather than the expected output.
	 */
	readonly isError: boolean;

	/**
	 * Creates a new TurnResult instance.
	 *
	 * @param data - The raw turn result data from the CLI
	 *
	 * @internal
	 */
	constructor(data: TurnResultData) {
		this.finalResponse = data.finalResponse;
		this.items = data.items;
		this.sessionId = data.sessionId;
		this.durationMs = data.durationMs;
		this.numTurns = data.numTurns;
		this.isError = data.isError;
	}

	/**
	 * Parses the final response as JSON and validates against a schema.
	 *
	 * This method is designed to work with Zod schemas but supports any
	 * object with a `parse` method that throws on invalid input.
	 *
	 * @typeParam T - The expected output type
	 * @param schema - A schema with a parse method (e.g., Zod schema)
	 * @returns The parsed and validated data
	 *
	 * @example
	 * ```typescript
	 * import { z } from 'zod';
	 *
	 * const UserSchema = z.object({
	 *   id: z.number(),
	 *   name: z.string(),
	 *   email: z.string().email()
	 * });
	 *
	 * const result = await thread.run('Generate a user object as JSON');
	 * const user = result.parse(UserSchema);
	 * // TypeScript knows: user.id is number, user.name is string, etc.
	 * ```
	 *
	 * @throws {ParseError} If the response is not valid JSON
	 * @throws {Error} If the schema validation fails (error from schema.parse)
	 *
	 * @see {@link tryParse} for non-throwing validation
	 */
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

	/**
	 * Attempts to parse the final response, returning null on failure.
	 *
	 * This is a safe alternative to {@link parse} that returns null instead
	 * of throwing when parsing or validation fails. Ideal for optional
	 * structured output.
	 *
	 * @typeParam T - The expected output type
	 * @param schema - A schema with a safeParse method (e.g., Zod schema)
	 * @returns The parsed data, or null if parsing/validation fails
	 *
	 * @example
	 * ```typescript
	 * import { z } from 'zod';
	 *
	 * const ConfigSchema = z.object({
	 *   debug: z.boolean(),
	 *   logLevel: z.enum(['info', 'warn', 'error'])
	 * });
	 *
	 * const result = await thread.run('Generate config if needed');
	 * const config = result.tryParse(ConfigSchema);
	 *
	 * if (config) {
	 *   console.log('Config:', config);
	 * } else {
	 *   console.log('No valid config in response');
	 * }
	 * ```
	 *
	 * @see {@link parse} for throwing validation
	 */
	tryParse<T>(schema: { safeParse: (data: unknown) => { success: boolean; data?: T } }): T | null {
		try {
			const data = JSON.parse(this.finalResponse);
			const result = schema.safeParse(data);
			return result.success ? (result.data ?? null) : null;
		} catch {
			return null;
		}
	}

	/**
	 * All tool calls made during this execution.
	 *
	 * Tool calls represent AI requests to use external capabilities
	 * like file operations, shell commands, or web requests.
	 *
	 * @returns Array of tool call items in chronological order
	 *
	 * @example
	 * ```typescript
	 * const result = await thread.run('Create and test a function');
	 *
	 * for (const call of result.toolCalls) {
	 *   console.log(`Tool: ${call.toolName}`);
	 *   console.log(`Params: ${JSON.stringify(call.parameters)}`);
	 * }
	 * ```
	 */
	get toolCalls(): ToolCallItem[] {
		return this.items.filter((item): item is ToolCallItem => item.type === 'tool_call');
	}

	/**
	 * All tool results from this execution.
	 *
	 * Tool results contain the output (or error) from each tool call.
	 * Use {@link ToolResultItem.isError} to check for failures.
	 *
	 * @returns Array of tool result items in chronological order
	 *
	 * @example
	 * ```typescript
	 * const result = await thread.run('Read and process files');
	 *
	 * for (const toolResult of result.toolResults) {
	 *   if (toolResult.isError) {
	 *     console.error(`${toolResult.toolName} failed: ${toolResult.value}`);
	 *   } else {
	 *     console.log(`${toolResult.toolName} succeeded`);
	 *   }
	 * }
	 * ```
	 */
	get toolResults(): ToolResultItem[] {
		return this.items.filter((item): item is ToolResultItem => item.type === 'tool_result');
	}

	/**
	 * All messages from this execution.
	 *
	 * Messages include both user prompts and assistant responses.
	 * Use {@link assistantMessages} for AI responses only.
	 *
	 * @returns Array of message items in chronological order
	 */
	get messages(): MessageItem[] {
		return this.items.filter((item): item is MessageItem => item.type === 'message');
	}

	/**
	 * Assistant messages only from this execution.
	 *
	 * Filters to only AI responses, excluding user prompts.
	 *
	 * @returns Array of assistant message items in chronological order
	 *
	 * @example
	 * ```typescript
	 * const result = await thread.run('Explain your reasoning');
	 *
	 * for (const msg of result.assistantMessages) {
	 *   console.log(`[${new Date(msg.timestamp).toISOString()}] ${msg.text}`);
	 * }
	 * ```
	 */
	get assistantMessages(): MessageItem[] {
		return this.messages.filter((m) => m.role === 'assistant');
	}

	/**
	 * Converts the result to a plain JSON-serializable object.
	 *
	 * Useful for logging, caching, or transmitting results.
	 *
	 * @returns A plain object representation of the turn result
	 *
	 * @example
	 * ```typescript
	 * const result = await thread.run('Generate code');
	 *
	 * // Save to file
	 * fs.writeFileSync('result.json', JSON.stringify(result.toJSON(), null, 2));
	 *
	 * // Or use with JSON.stringify directly
	 * console.log(JSON.stringify(result));
	 * ```
	 */
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

/**
 * Builds a TurnResult from an array of stream events.
 *
 * Processes events from a streaming execution to extract the final
 * response, session ID, and all interaction items.
 *
 * @param events - Array of stream events from execution
 * @returns A constructed TurnResult instance
 *
 * @internal
 */
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

/**
 * Builds a TurnResult from a JSON CLI response.
 *
 * Converts the raw JSON output format from the Droid CLI into a
 * TurnResult instance.
 *
 * @param json - The JSON response from the CLI
 * @returns A constructed TurnResult instance
 *
 * @internal
 */
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
