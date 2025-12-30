export class DroidError extends Error {
	constructor(message: string, options?: { cause?: Error }) {
		super(message, options);
		this.name = 'DroidError';
		Error.captureStackTrace?.(this, this.constructor);
	}
}

export class CliNotFoundError extends DroidError {
	readonly searchedPaths: string[];

	constructor(searchedPaths: string[]) {
		super(
			`Droid CLI not found. Searched: ${searchedPaths.join(', ')}. ` +
				'Install with: curl -fsSL https://app.factory.ai/cli | sh',
		);
		this.name = 'CliNotFoundError';
		this.searchedPaths = searchedPaths;
	}
}

export class ExecutionError extends DroidError {
	readonly exitCode: number;
	readonly stderr: string;
	readonly sessionId?: string;

	constructor(message: string, exitCode: number, stderr: string, sessionId?: string) {
		super(message);
		this.name = 'ExecutionError';
		this.exitCode = exitCode;
		this.stderr = stderr;
		this.sessionId = sessionId;
	}
}

export class ParseError extends DroidError {
	readonly raw: string;

	constructor(message: string, raw: string, cause?: Error) {
		super(message, { cause });
		this.name = 'ParseError';
		this.raw = raw;
	}
}

export class TimeoutError extends DroidError {
	readonly timeoutMs: number;

	constructor(timeoutMs: number) {
		super(`Operation timed out after ${timeoutMs}ms`);
		this.name = 'TimeoutError';
		this.timeoutMs = timeoutMs;
	}
}

export class StreamError extends DroidError {
	constructor(message: string, cause?: Error) {
		super(message, { cause });
		this.name = 'StreamError';
	}
}
