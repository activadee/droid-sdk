import { execDroidJson, listDroidTools } from './cli/process';
import { Thread } from './thread';
import { buildTurnResultFromJson, type TurnResult } from './turn';
import type { DroidConfig, ExecOptions, ThreadOptions } from './types';
import { DEFAULT_DROID_PATH, DEFAULT_TIMEOUT } from './types';

/**
 * Main entry point for the Droid SDK.
 *
 * The `Droid` class provides a high-level interface to interact with the Factory Droid CLI,
 * enabling AI-powered code generation and task automation. It supports both stateless
 * one-shot execution and stateful multi-turn conversations through threads.
 *
 * @example
 * ```typescript
 * import { Droid, MODELS } from '@activade/droid-sdk';
 *
 * // Create a new Droid instance with configuration
 * const droid = new Droid({
 *   model: MODELS.CLAUDE_SONNET,
 *   autonomyLevel: 'high',
 *   cwd: './my-project'
 * });
 *
 * // One-shot execution
 * const result = await droid.exec('Create a hello world function');
 * console.log(result.finalResponse);
 *
 * // Multi-turn conversation
 * const thread = droid.startThread();
 * await thread.run('Create a React component');
 * await thread.run('Add unit tests for it');
 * ```
 *
 * @see {@link Thread} for multi-turn conversation management
 * @see {@link TurnResult} for response handling
 *
 * @category Core
 */
export class Droid {
	private readonly _config: DroidConfig;

	/**
	 * Creates a new Droid instance with the specified configuration.
	 *
	 * @param config - Configuration options for the Droid instance
	 * @param config.cwd - Working directory for CLI operations (defaults to process.cwd())
	 * @param config.model - AI model to use for generation (e.g., 'claude-sonnet-4-5-20250929')
	 * @param config.autonomyLevel - Level of autonomous decision-making ('low', 'medium', 'high')
	 * @param config.reasoningEffort - Reasoning intensity for complex tasks ('off', 'low', 'medium', 'high')
	 * @param config.droidPath - Custom path to the Droid CLI binary
	 * @param config.timeout - Maximum execution time in milliseconds (default: 600000)
	 *
	 * @example
	 * ```typescript
	 * // Basic usage with defaults
	 * const droid = new Droid();
	 *
	 * // With full configuration
	 * const droid = new Droid({
	 *   model: 'claude-opus-4-5-20251101',
	 *   autonomyLevel: 'high',
	 *   reasoningEffort: 'medium',
	 *   cwd: '/path/to/project',
	 *   timeout: 300000
	 * });
	 * ```
	 */
	constructor(config: DroidConfig = {}) {
		this._config = {
			cwd: config.cwd ?? process.cwd(),
			model: config.model,
			autonomyLevel: config.autonomyLevel,
			reasoningEffort: config.reasoningEffort,
			droidPath: config.droidPath ?? DEFAULT_DROID_PATH,
			timeout: config.timeout ?? DEFAULT_TIMEOUT,
		};
	}

	/**
	 * Returns the current configuration as a readonly object.
	 *
	 * @returns The current Droid configuration
	 *
	 * @example
	 * ```typescript
	 * const droid = new Droid({ model: 'claude-sonnet-4-5-20250929' });
	 * console.log(droid.config.model); // 'claude-sonnet-4-5-20250929'
	 * ```
	 */
	get config(): Readonly<DroidConfig> {
		return this._config;
	}

	/**
	 * Creates a new conversation thread for multi-turn interactions.
	 *
	 * Threads maintain context across multiple prompts, allowing for iterative
	 * development and refinement of AI responses. Each thread has a unique
	 * session ID that persists the conversation state.
	 *
	 * @param options - Optional thread-specific configuration that overrides instance defaults
	 * @returns A new Thread instance ready for interaction
	 *
	 * @example
	 * ```typescript
	 * const droid = new Droid({ model: MODELS.CLAUDE_SONNET });
	 *
	 * // Start a new thread
	 * const thread = droid.startThread({
	 *   autonomyLevel: 'high',
	 *   enabledTools: ['file_read', 'file_write']
	 * });
	 *
	 * // Use the thread for multi-turn conversation
	 * await thread.run('Create a REST API');
	 * await thread.run('Add authentication');
	 * await thread.run('Write tests');
	 *
	 * // Access the session ID for later resumption
	 * console.log('Session ID:', thread.id);
	 * ```
	 *
	 * @see {@link Thread.run} for executing prompts
	 * @see {@link resumeThread} for continuing a previous conversation
	 */
	startThread(options: ThreadOptions = {}): Thread {
		const mergedOptions: ThreadOptions = {
			model: this._config.model,
			autonomyLevel: this._config.autonomyLevel,
			reasoningEffort: this._config.reasoningEffort,
			...options,
		};

		return new Thread(this._config, mergedOptions);
	}

	/**
	 * Resumes a previously created conversation thread using its session ID.
	 *
	 * This allows continuing a conversation across process restarts or
	 * different execution contexts. The session state is persisted by the
	 * Droid CLI and can be resumed at any time.
	 *
	 * @param sessionId - The unique session identifier from a previous thread
	 * @param options - Optional thread configuration overrides
	 * @returns A Thread instance connected to the existing session
	 *
	 * @example
	 * ```typescript
	 * // Save the session ID from a previous thread
	 * const previousSessionId = 'session_abc123...';
	 *
	 * // Resume the conversation later
	 * const droid = new Droid();
	 * const thread = droid.resumeThread(previousSessionId);
	 *
	 * // Continue where you left off
	 * const result = await thread.run('What did we work on last time?');
	 * console.log(result.finalResponse);
	 * ```
	 *
	 * @throws {ExecutionError} If the session ID is invalid or expired
	 *
	 * @see {@link startThread} for creating new threads
	 * @see {@link Thread.id} for accessing session IDs
	 */
	resumeThread(sessionId: string, options: ThreadOptions = {}): Thread {
		const mergedOptions: ThreadOptions = {
			model: this._config.model,
			autonomyLevel: this._config.autonomyLevel,
			reasoningEffort: this._config.reasoningEffort,
			...options,
		};

		return new Thread(this._config, mergedOptions, sessionId);
	}

	/**
	 * Executes a single prompt without maintaining conversation state.
	 *
	 * This is ideal for one-off tasks that don't require context from
	 * previous interactions. For multi-turn conversations, use
	 * {@link startThread} instead.
	 *
	 * @param prompt - The natural language prompt to execute
	 * @param options - Execution options including model, output schema, etc.
	 * @returns A promise resolving to the execution result
	 *
	 * @example
	 * ```typescript
	 * const droid = new Droid({ model: MODELS.CLAUDE_SONNET });
	 *
	 * // Simple execution
	 * const result = await droid.exec('Generate a UUID');
	 * console.log(result.finalResponse);
	 *
	 * // With structured output using Zod schema
	 * import { z } from 'zod';
	 *
	 * const schema = z.object({
	 *   name: z.string(),
	 *   version: z.string()
	 * });
	 *
	 * const result = await droid.exec('Get package info as JSON', {
	 *   outputSchema: { type: 'object', properties: { name: {}, version: {} } }
	 * });
	 * const data = result.parse(schema);
	 * ```
	 *
	 * @throws {ExecutionError} If the CLI execution fails
	 * @throws {TimeoutError} If the operation exceeds the configured timeout
	 * @throws {CliNotFoundError} If the Droid CLI is not installed
	 *
	 * @see {@link TurnResult} for parsing and accessing response data
	 */
	async exec(prompt: string, options: ExecOptions = {}): Promise<TurnResult> {
		const mergedOptions: ExecOptions = {
			model: this._config.model,
			autonomyLevel: this._config.autonomyLevel,
			reasoningEffort: this._config.reasoningEffort,
			...options,
		};

		const jsonResult = await execDroidJson({
			prompt,
			sessionId: options.sessionId,
			cwd: mergedOptions.cwd ?? this._config.cwd,
			droidPath: this._config.droidPath,
			timeout: this._config.timeout,
			threadOptions: mergedOptions,
			runOptions: mergedOptions,
		});

		return buildTurnResultFromJson(jsonResult);
	}

	/**
	 * Lists all available tools for the configured or specified model.
	 *
	 * Tools represent capabilities that the AI can use during execution,
	 * such as file operations, shell commands, or web requests.
	 *
	 * @param model - Optional model ID to query tools for (defaults to instance model)
	 * @returns A promise resolving to an array of tool names
	 *
	 * @example
	 * ```typescript
	 * const droid = new Droid({ model: MODELS.CLAUDE_SONNET });
	 *
	 * // List tools for the configured model
	 * const tools = await droid.listTools();
	 * console.log('Available tools:', tools);
	 * // ['file_read', 'file_write', 'shell_exec', ...]
	 *
	 * // List tools for a specific model
	 * const gptTools = await droid.listTools('gpt-5.1');
	 * ```
	 */
	async listTools(model?: string): Promise<string[]> {
		return listDroidTools(this._config.droidPath, model ?? this._config.model);
	}
}
