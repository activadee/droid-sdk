/**
 * Base error class for all Droid SDK errors.
 *
 * All SDK-specific errors extend this class, making it easy to catch
 * and handle Droid-related errors separately from other exceptions.
 *
 * @example
 * ```typescript
 * import { Droid, DroidError, CliNotFoundError } from '@activade/droid-sdk';
 *
 * try {
 *   const droid = new Droid();
 *   await droid.exec('Generate code');
 * } catch (error) {
 *   if (error instanceof CliNotFoundError) {
 *     console.log('Please install the Droid CLI first');
 *   } else if (error instanceof DroidError) {
 *     console.log('Droid error:', error.message);
 *   } else {
 *     throw error; // Re-throw non-Droid errors
 *   }
 * }
 * ```
 *
 * @category Errors
 */
export class DroidError extends Error {
	/**
	 * Creates a new DroidError instance.
	 *
	 * @param message - Human-readable error description
	 * @param options - Optional error options including cause
	 */
	constructor(message: string, options?: { cause?: Error }) {
		super(message, options);
		this.name = 'DroidError';
		Error.captureStackTrace?.(this, this.constructor);
	}
}

/**
 * Thrown when the Droid CLI binary cannot be found.
 *
 * This error indicates that the Droid CLI is not installed or not
 * in the system PATH. The {@link searchedPaths} property contains
 * all locations that were checked.
 *
 * @example
 * ```typescript
 * import { Droid, CliNotFoundError } from '@activade/droid-sdk';
 * import { ensureDroidCli } from '@activade/droid-sdk/cli';
 *
 * try {
 *   const droid = new Droid();
 *   await droid.exec('Hello');
 * } catch (error) {
 *   if (error instanceof CliNotFoundError) {
 *     console.log('Searched paths:', error.searchedPaths);
 *     // Auto-install the CLI
 *     await ensureDroidCli();
 *   }
 * }
 * ```
 *
 * @category Errors
 */
export class CliNotFoundError extends DroidError {
	/**
	 * List of filesystem paths that were searched for the CLI binary.
	 */
	readonly searchedPaths: string[];

	/**
	 * Creates a new CliNotFoundError instance.
	 *
	 * @param searchedPaths - Array of paths that were checked for the CLI
	 */
	constructor(searchedPaths: string[]) {
		super(
			`Droid CLI not found. Searched: ${searchedPaths.join(', ')}. Install with: curl -fsSL https://app.factory.ai/cli | sh`,
		);
		this.name = 'CliNotFoundError';
		this.searchedPaths = searchedPaths;
	}
}

/**
 * Thrown when the Droid CLI process fails to execute.
 *
 * This error provides details about the failure including the exit code,
 * stderr output, and optionally the session ID if one was established.
 *
 * @example
 * ```typescript
 * import { Droid, ExecutionError } from '@activade/droid-sdk';
 *
 * try {
 *   await droid.exec('Invalid command');
 * } catch (error) {
 *   if (error instanceof ExecutionError) {
 *     console.log('Exit code:', error.exitCode);
 *     console.log('Stderr:', error.stderr);
 *     if (error.sessionId) {
 *       console.log('Session:', error.sessionId);
 *     }
 *   }
 * }
 * ```
 *
 * @category Errors
 */
export class ExecutionError extends DroidError {
	/**
	 * The process exit code (non-zero indicates failure).
	 */
	readonly exitCode: number;

	/**
	 * Standard error output from the CLI process.
	 */
	readonly stderr: string;

	/**
	 * The session ID if one was established before the error occurred.
	 */
	readonly sessionId?: string;

	/**
	 * Creates a new ExecutionError instance.
	 *
	 * @param message - Human-readable error description
	 * @param exitCode - The process exit code
	 * @param stderr - Standard error output
	 * @param sessionId - Optional session ID from the execution
	 */
	constructor(message: string, exitCode: number, stderr: string, sessionId?: string) {
		super(message);
		this.name = 'ExecutionError';
		this.exitCode = exitCode;
		this.stderr = stderr;
		this.sessionId = sessionId;
	}
}

/**
 * Thrown when parsing JSON or structured output fails.
 *
 * This error includes the raw content that failed to parse, useful
 * for debugging malformed responses.
 *
 * @example
 * ```typescript
 * import { Droid, ParseError } from '@activade/droid-sdk';
 * import { z } from 'zod';
 *
 * const schema = z.object({ value: z.number() });
 *
 * try {
 *   const result = await droid.exec('Generate JSON');
 *   result.parse(schema);
 * } catch (error) {
 *   if (error instanceof ParseError) {
 *     console.log('Failed to parse:', error.raw.slice(0, 100));
 *     console.log('Cause:', error.cause);
 *   }
 * }
 * ```
 *
 * @category Errors
 */
export class ParseError extends DroidError {
	/**
	 * The raw content that failed to parse.
	 */
	readonly raw: string;

	/**
	 * Creates a new ParseError instance.
	 *
	 * @param message - Human-readable error description
	 * @param raw - The content that failed to parse
	 * @param cause - Optional underlying error that caused the parse failure
	 */
	constructor(message: string, raw: string, cause?: Error) {
		super(message, { cause });
		this.name = 'ParseError';
		this.raw = raw;
	}
}

/**
 * Thrown when an operation exceeds the configured timeout.
 *
 * The {@link timeoutMs} property indicates the timeout value that was exceeded.
 *
 * @example
 * ```typescript
 * import { Droid, TimeoutError } from '@activade/droid-sdk';
 *
 * const droid = new Droid({ timeout: 30000 }); // 30 seconds
 *
 * try {
 *   await droid.exec('Long running task');
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.log(`Operation timed out after ${error.timeoutMs}ms`);
 *   }
 * }
 * ```
 *
 * @category Errors
 */
export class TimeoutError extends DroidError {
	/**
	 * The timeout duration in milliseconds that was exceeded.
	 */
	readonly timeoutMs: number;

	/**
	 * Creates a new TimeoutError instance.
	 *
	 * @param timeoutMs - The timeout value in milliseconds
	 */
	constructor(timeoutMs: number) {
		super(`Operation timed out after ${timeoutMs}ms`);
		this.name = 'TimeoutError';
		this.timeoutMs = timeoutMs;
	}
}

/**
 * Thrown when reading from a stream fails.
 *
 * This typically occurs during streaming execution when the event
 * stream is interrupted or corrupted.
 *
 * @example
 * ```typescript
 * import { StreamError } from '@activade/droid-sdk';
 *
 * try {
 *   const { events } = await thread.runStreamed('Generate code');
 *   for await (const event of events) {
 *     console.log(event);
 *   }
 * } catch (error) {
 *   if (error instanceof StreamError) {
 *     console.log('Stream failed:', error.message);
 *     console.log('Cause:', error.cause);
 *   }
 * }
 * ```
 *
 * @category Errors
 */
export class StreamError extends DroidError {
	/**
	 * Creates a new StreamError instance.
	 *
	 * @param message - Human-readable error description
	 * @param cause - Optional underlying error that caused the stream failure
	 */
	constructor(message: string, cause?: Error) {
		super(message, { cause });
		this.name = 'StreamError';
	}
}
