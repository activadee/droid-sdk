import type { TurnResult } from './turn';
import type { StreamEvent } from './types';

/**
 * A streaming turn result with real-time events.
 *
 * Returned by {@link Thread.runStreamed} to provide access to events
 * as they occur, along with a promise for the final result.
 *
 * @example
 * ```typescript
 * const { events, result } = await thread.runStreamed('Generate code');
 *
 * // Process events as they arrive
 * for await (const event of events) {
 *   console.log(event.type);
 * }
 *
 * // Get the final result after all events
 * const finalResult = await result;
 * console.log(finalResult.finalResponse);
 * ```
 *
 * @category Events
 */
export interface StreamedTurn {
	/**
	 * Async iterable of stream events.
	 *
	 * Yields events in real-time as they are emitted by the CLI.
	 * Must be fully consumed before accessing the result promise.
	 */
	events: AsyncIterable<StreamEvent>;

	/**
	 * Promise that resolves to the final turn result.
	 *
	 * Resolves after all events have been emitted and the CLI
	 * process has completed.
	 */
	result: Promise<TurnResult>;
}

// Re-export event types for convenient access
export type {
	MessageEvent,
	StreamEvent,
	SystemInitEvent,
	ToolCallEvent,
	ToolResultEvent,
	TurnCompletedEvent,
	TurnFailedEvent,
} from './types';

// Re-export type guards for event handling
export {
	isMessageEvent,
	isSystemInitEvent,
	isToolCallEvent,
	isToolResultEvent,
	isTurnCompletedEvent,
	isTurnFailedEvent,
} from './types';
