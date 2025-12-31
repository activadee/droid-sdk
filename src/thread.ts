import { execDroidJson, type SpawnOptions, spawnDroidStreaming } from './cli/process';
import { ExecutionError } from './errors';
import type { StreamedTurn } from './events';
import { buildTurnResultFromEvents, buildTurnResultFromJson, type TurnResult } from './turn';
import type { DroidConfig, RunOptions, StreamEvent, ThreadOptions } from './types';

/**
 * Represents a conversation thread with the Droid AI.
 *
 * A Thread maintains conversational context across multiple interactions,
 * allowing for iterative development and refinement of AI responses. Each
 * thread is identified by a unique session ID that persists the conversation
 * state across process restarts.
 *
 * Threads support both synchronous execution via {@link run} and real-time
 * streaming via {@link runStreamed} for observing tool calls and intermediate
 * results as they happen.
 *
 * @example
 * ```typescript
 * import { Droid, MODELS } from '@activade/droid-sdk';
 *
 * const droid = new Droid({ model: MODELS.CLAUDE_SONNET });
 * const thread = droid.startThread();
 *
 * // First interaction - establish context
 * const result1 = await thread.run('Create a TypeScript function to validate emails');
 *
 * // Follow-up - the AI remembers the previous context
 * const result2 = await thread.run('Add support for custom domain restrictions');
 *
 * // Access session ID for later resumption
 * console.log('Session ID:', thread.id);
 * ```
 *
 * @example
 * ```typescript
 * // Streaming example - observe tool calls in real-time
 * const { events, result } = await thread.runStreamed('Build a REST API');
 *
 * for await (const event of events) {
 *   if (event.type === 'tool_call') {
 *     console.log(`Calling tool: ${event.toolName}`);
 *   } else if (event.type === 'tool_result') {
 *     console.log(`Tool result: ${event.value.slice(0, 100)}...`);
 *   }
 * }
 *
 * const finalResult = await result;
 * console.log('Final response:', finalResult.finalResponse);
 * ```
 *
 * @see {@link Droid.startThread} for creating new threads
 * @see {@link Droid.resumeThread} for resuming existing threads
 * @see {@link TurnResult} for handling execution results
 *
 * @category Core
 */
export class Thread {
	private _sessionId: string | undefined;
	private readonly _cwd: string;
	private readonly _config: DroidConfig;
	private readonly _threadOptions: ThreadOptions;

	/**
	 * Creates a new Thread instance.
	 *
	 * @param config - The Droid configuration inherited from the parent Droid instance
	 * @param threadOptions - Thread-specific options that override config defaults
	 * @param sessionId - Optional session ID to resume an existing conversation
	 *
	 * @remarks
	 * This constructor is typically not called directly. Use {@link Droid.startThread}
	 * or {@link Droid.resumeThread} instead for proper initialization.
	 *
	 * @internal
	 */
	constructor(config: DroidConfig, threadOptions: ThreadOptions = {}, sessionId?: string) {
		this._config = config;
		this._threadOptions = threadOptions;
		this._sessionId = sessionId;
		this._cwd = threadOptions.cwd ?? config.cwd ?? process.cwd();
	}

	/**
	 * The unique session identifier for this thread.
	 *
	 * The session ID is assigned after the first prompt is executed and
	 * remains constant for the lifetime of the thread. Use this ID with
	 * {@link Droid.resumeThread} to continue the conversation later.
	 *
	 * @returns The session ID, or undefined if no prompts have been executed yet
	 *
	 * @example
	 * ```typescript
	 * const thread = droid.startThread();
	 * console.log(thread.id); // undefined
	 *
	 * await thread.run('Hello');
	 * console.log(thread.id); // 'session_abc123...'
	 *
	 * // Save for later resumption
	 * localStorage.setItem('sessionId', thread.id);
	 * ```
	 */
	get id(): string | undefined {
		return this._sessionId;
	}

	/**
	 * The working directory for this thread's CLI operations.
	 *
	 * All file operations and commands executed by the AI will be relative
	 * to this directory.
	 *
	 * @returns The absolute path to the working directory
	 *
	 * @example
	 * ```typescript
	 * const thread = droid.startThread({ cwd: '/projects/my-app' });
	 * console.log(thread.cwd); // '/projects/my-app'
	 * ```
	 */
	get cwd(): string {
		return this._cwd;
	}

	/**
	 * Executes a prompt with real-time streaming of events.
	 *
	 * This method provides access to intermediate events (tool calls, tool results,
	 * messages) as they occur, enabling real-time UI updates and progress monitoring.
	 * The final result is available via the returned promise.
	 *
	 * @param prompt - The natural language prompt to execute
	 * @param options - Optional run-specific configuration
	 * @returns A StreamedTurn containing an async event iterator and result promise
	 *
	 * @example
	 * ```typescript
	 * // Basic streaming with event handling
	 * const { events, result } = await thread.runStreamed('Create a React component');
	 *
	 * for await (const event of events) {
	 *   switch (event.type) {
	 *     case 'message':
	 *       console.log(`[${event.role}] ${event.text}`);
	 *       break;
	 *     case 'tool_call':
	 *       console.log(`Calling: ${event.toolName}(${JSON.stringify(event.parameters)})`);
	 *       break;
	 *     case 'tool_result':
	 *       console.log(`Result: ${event.isError ? 'ERROR' : 'OK'}`);
	 *       break;
	 *     case 'completion':
	 *       console.log(`Completed in ${event.durationMs}ms`);
	 *       break;
	 *   }
	 * }
	 *
	 * const finalResult = await result;
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Use with type guards for type-safe event handling
	 * import { isToolCallEvent, isToolResultEvent } from '@activade/droid-sdk';
	 *
	 * for await (const event of events) {
	 *   if (isToolCallEvent(event)) {
	 *     // TypeScript knows event is ToolCallEvent
	 *     console.log(event.toolName, event.parameters);
	 *   }
	 * }
	 * ```
	 *
	 * @throws {ExecutionError} If the Droid process exits with a non-zero code
	 * @throws {StreamError} If there's an error reading the event stream
	 *
	 * @see {@link run} for simpler synchronous execution
	 * @see {@link StreamedTurn} for the return type structure
	 */
	async runStreamed(prompt: string, options: RunOptions = {}): Promise<StreamedTurn> {
		const spawnOptions = this.buildSpawnOptions(prompt, options);
		const streamingProcess = await spawnDroidStreaming(spawnOptions);

		const collectedEvents: StreamEvent[] = [];
		let resolveResult: (result: TurnResult) => void;
		let rejectResult: (error: Error) => void;

		const resultPromise = new Promise<TurnResult>((resolve, reject) => {
			resolveResult = resolve;
			rejectResult = reject;
		});

		const self = this;

		async function* createEventIterator(): AsyncGenerator<StreamEvent, void, unknown> {
			try {
				for await (const event of streamingProcess.events) {
					collectedEvents.push(event);

					if ('session_id' in event && event.session_id && !self._sessionId) {
						self._sessionId = event.session_id;
					}

					yield event;
				}

				const exitCode = await streamingProcess.waitForExit();
				if (exitCode !== 0 && collectedEvents.length === 0) {
					rejectResult(
						new ExecutionError(
							`Droid process exited with code ${exitCode}`,
							exitCode,
							'',
							self._sessionId,
						),
					);
					return;
				}

				resolveResult(buildTurnResultFromEvents(collectedEvents));
			} catch (error) {
				rejectResult(error instanceof Error ? error : new Error(String(error)));
			}
		}

		return {
			events: createEventIterator(),
			result: resultPromise,
		};
	}

	/**
	 * Executes a prompt and waits for the complete response.
	 *
	 * This method waits for the AI to finish processing before returning,
	 * providing the complete result including all tool calls and the final
	 * response. For real-time updates, use {@link runStreamed} instead.
	 *
	 * @param prompt - The natural language prompt to execute
	 * @param options - Optional run-specific configuration
	 * @returns A promise resolving to the execution result
	 *
	 * @example
	 * ```typescript
	 * // Simple execution
	 * const result = await thread.run('Create a function to sort an array');
	 * console.log(result.finalResponse);
	 *
	 * // Access tool calls made during execution
	 * for (const call of result.toolCalls) {
	 *   console.log(`Used tool: ${call.toolName}`);
	 * }
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // With file attachments
	 * const result = await thread.run('Describe this image', {
	 *   attachments: [
	 *     { path: './screenshot.png', type: 'image' }
	 *   ]
	 * });
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // With structured output validation
	 * import { z } from 'zod';
	 *
	 * const TaskSchema = z.object({
	 *   title: z.string(),
	 *   priority: z.enum(['low', 'medium', 'high']),
	 *   completed: z.boolean()
	 * });
	 *
	 * const result = await thread.run('Create a task object as JSON');
	 * const task = result.parse(TaskSchema);
	 * console.log(task.title, task.priority);
	 * ```
	 *
	 * @throws {ExecutionError} If the CLI execution fails
	 * @throws {TimeoutError} If the operation exceeds the configured timeout
	 *
	 * @see {@link runStreamed} for real-time event streaming
	 * @see {@link TurnResult} for the return type and parsing methods
	 */
	async run(prompt: string, options: RunOptions = {}): Promise<TurnResult> {
		const spawnOptions = this.buildSpawnOptions(prompt, options);

		const jsonResult = await execDroidJson(spawnOptions);

		if (!this._sessionId && jsonResult.session_id) {
			this._sessionId = jsonResult.session_id;
		}

		return buildTurnResultFromJson(jsonResult);
	}

	/**
	 * Builds the spawn options for CLI execution.
	 *
	 * @param prompt - The prompt to execute
	 * @param options - Run-specific options
	 * @returns Configured spawn options for the CLI process
	 *
	 * @internal
	 */
	private buildSpawnOptions(prompt: string, options: RunOptions): SpawnOptions {
		const mergedOptions: ThreadOptions = {
			...this._threadOptions,
			...options,
		};

		return {
			prompt,
			promptFile: options.promptFile,
			sessionId: this._sessionId,
			cwd: this._cwd,
			droidPath: this._config.droidPath,
			timeout: this._config.timeout,
			threadOptions: mergedOptions,
			runOptions: options,
			attachments: options.attachments,
		};
	}
}
