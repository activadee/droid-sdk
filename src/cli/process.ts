import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { CliNotFoundError, ExecutionError, TimeoutError } from '../errors';
import type {
	FileAttachment,
	JsonResult,
	OutputFormat,
	RunOptions,
	StreamEvent,
	ThreadOptions,
} from '../types';
import { parseJsonLines } from './stream-parser';
import { nodeStreamToWebStream, streamToString, waitForExit } from './utils';

/**
 * Options for spawning a Droid CLI process.
 *
 * Used internally to configure CLI invocations for execution.
 *
 * @category CLI
 */
export interface SpawnOptions {
	/** The prompt to execute */
	prompt?: string;
	/** Path to a file containing the prompt */
	promptFile?: string;
	/** Session ID to resume a conversation */
	sessionId?: string;
	/** Working directory for the CLI process */
	cwd?: string;
	/** Path to the Droid CLI binary */
	droidPath?: string;
	/** Timeout in milliseconds */
	timeout?: number;
	/** Output format for CLI response */
	outputFormat?: OutputFormat;
	/** Thread-level options */
	threadOptions?: ThreadOptions;
	/** Run-level options */
	runOptions?: RunOptions;
	/** File attachments to include */
	attachments?: FileAttachment[];
}

/**
 * Result from a synchronous Droid CLI execution.
 *
 * @category CLI
 */
export interface DroidProcessResult {
	/** Standard output from the process */
	stdout: string;
	/** Standard error from the process */
	stderr: string;
	/** Process exit code */
	exitCode: number;
}

/**
 * A streaming Droid CLI process.
 *
 * Provides access to real-time events as well as process control methods.
 *
 * @category CLI
 */
export interface StreamingDroidProcess {
	/** Async iterable of stream events */
	events: AsyncIterable<StreamEvent>;
	/** The underlying Node.js child process */
	process: ChildProcess;
	/** Wait for the process to exit and return the exit code */
	waitForExit: () => Promise<number>;
	/** Kill the process */
	kill: () => void;
}

/**
 * Builds a prompt string with file attachments.
 *
 * Prepends file references using the `@path` syntax before the main prompt.
 *
 * @param prompt - The main prompt text
 * @param attachments - File attachments to include
 * @returns Combined prompt string, or undefined if both are empty
 *
 * @example
 * ```typescript
 * const prompt = buildPromptWithAttachments(
 *   'Analyze this code',
 *   [{ path: './src/main.ts', type: 'text' }]
 * );
 * // Returns: "@./src/main.ts\n\nAnalyze this code"
 * ```
 *
 * @category CLI
 */
export function buildPromptWithAttachments(
	prompt: string | undefined,
	attachments: FileAttachment[] | undefined,
): string | undefined {
	if (!prompt && !attachments?.length) {
		return undefined;
	}

	if (!attachments?.length) {
		return prompt;
	}

	const attachmentRefs = attachments.map((attachment) => {
		const ref = `@${attachment.path}`;
		if (attachment.description) {
			return `${ref} (${attachment.description})`;
		}
		return ref;
	});

	const attachmentBlock = attachmentRefs.join('\n');

	if (!prompt) {
		return attachmentBlock;
	}

	return `${attachmentBlock}\n\n${prompt}`;
}

/**
 * Builds CLI arguments from spawn options.
 *
 * @param options - The spawn options to convert
 * @returns Array of CLI arguments
 *
 * @internal
 */
function buildArgs(options: SpawnOptions): string[] {
	const args: string[] = ['exec'];

	const opts = { ...options.threadOptions, ...options.runOptions };

	if (options.outputFormat) {
		args.push('-o', options.outputFormat);
	}

	if (options.sessionId) {
		args.push('-s', options.sessionId);
	}

	if (options.promptFile) {
		args.push('-f', options.promptFile);
	}

	if (opts.model) {
		args.push('-m', opts.model);
	}

	if (opts.autonomyLevel && opts.autonomyLevel !== 'default') {
		args.push('--auto', opts.autonomyLevel);
	}

	if (opts.reasoningEffort) {
		args.push('-r', opts.reasoningEffort);
	}

	if (opts.useSpec) {
		args.push('--use-spec');
	}

	if (opts.specModel) {
		args.push('--spec-model', opts.specModel);
	}

	if (opts.specReasoningEffort) {
		args.push('--spec-reasoning-effort', opts.specReasoningEffort);
	}

	if (opts.enabledTools?.length) {
		args.push('--enabled-tools', opts.enabledTools.join(','));
	}

	if (opts.disabledTools?.length) {
		args.push('--disabled-tools', opts.disabledTools.join(','));
	}

	if (opts.skipPermissionsUnsafe) {
		args.push('--skip-permissions-unsafe');
	}

	if (opts.cwd) {
		args.push('--cwd', opts.cwd);
	}

	const finalPrompt = buildPromptWithAttachments(options.prompt, options.attachments);
	if (finalPrompt) {
		args.push(finalPrompt);
	}

	return args;
}

/**
 * Finds the Droid CLI binary path.
 *
 * Searches in the following order:
 * 1. Preferred path (if provided)
 * 2. System PATH directories
 * 3. Common installation locations (~/.local/bin, ~/.droid-sdk/bin, etc.)
 *
 * @param preferredPath - Optional preferred path to check first
 * @returns The path to the Droid CLI binary
 *
 * @throws {CliNotFoundError} If the CLI cannot be found in any location
 *
 * @example
 * ```typescript
 * // Find CLI in default locations
 * const path = await findDroidPath();
 *
 * // Check specific path first
 * const path = await findDroidPath('/custom/path/droid');
 * ```
 *
 * @category CLI
 */
export async function findDroidPath(preferredPath?: string): Promise<string> {
	const searchPaths: string[] = [];

	if (preferredPath) {
		searchPaths.push(preferredPath);
		if (existsSync(preferredPath)) {
			return preferredPath;
		}
	}

	const pathDirs = (process.env.PATH ?? '').split(':');
	for (const dir of pathDirs) {
		const droidPath = `${dir}/droid`;
		searchPaths.push(droidPath);
		if (existsSync(droidPath)) {
			return droidPath;
		}
	}

	const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? '';
	const additionalPaths = [
		`${homeDir}/.local/bin/droid`,
		`${homeDir}/.droid-sdk/bin/droid`,
		'/usr/local/bin/droid',
		'/opt/homebrew/bin/droid',
	];

	for (const path of additionalPaths) {
		searchPaths.push(path);
		if (existsSync(path)) {
			return path;
		}
	}

	throw new CliNotFoundError(searchPaths);
}

/**
 * Spawns a Droid CLI process and waits for completion.
 *
 * Executes the CLI synchronously and returns the complete output.
 * For real-time streaming, use {@link spawnDroidStreaming} instead.
 *
 * @param options - Spawn configuration options
 * @returns Process result with stdout, stderr, and exit code
 *
 * @throws {CliNotFoundError} If the CLI cannot be found
 * @throws {TimeoutError} If the operation exceeds the timeout
 *
 * @example
 * ```typescript
 * const result = await spawnDroid({
 *   prompt: 'Generate hello world',
 *   outputFormat: 'json',
 *   timeout: 60000
 * });
 *
 * if (result.exitCode === 0) {
 *   console.log(result.stdout);
 * } else {
 *   console.error(result.stderr);
 * }
 * ```
 *
 * @category CLI
 */
export async function spawnDroid(options: SpawnOptions): Promise<DroidProcessResult> {
	const droidPath = await findDroidPath(options.droidPath);
	const args = buildArgs(options);

	const proc = spawn(droidPath, args, {
		cwd: options.cwd ?? process.cwd(),
		stdio: ['inherit', 'pipe', 'pipe'],
	});

	const timeout = options.timeout;
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	let timedOut = false;

	if (timeout && timeout > 0) {
		timeoutId = setTimeout(() => {
			timedOut = true;
			proc.kill();
		}, timeout);
	}

	const [stdout, stderr, exitCode] = await Promise.all([
		streamToString(proc.stdout),
		streamToString(proc.stderr),
		waitForExit(proc),
	]);

	if (timeoutId) {
		clearTimeout(timeoutId);
	}

	if (timedOut) {
		throw new TimeoutError(timeout ?? 0);
	}

	return { stdout, stderr, exitCode };
}

/**
 * Spawns a Droid CLI process with streaming output.
 *
 * Returns immediately with an async iterable of events that can be
 * consumed as they arrive. Ideal for real-time progress updates.
 *
 * @param options - Spawn configuration options
 * @returns A streaming process object with events and control methods
 *
 * @throws {CliNotFoundError} If the CLI cannot be found
 *
 * @example
 * ```typescript
 * const streaming = await spawnDroidStreaming({
 *   prompt: 'Build a REST API'
 * });
 *
 * for await (const event of streaming.events) {
 *   if (event.type === 'tool_call') {
 *     console.log(`Calling: ${event.toolName}`);
 *   }
 * }
 *
 * const exitCode = await streaming.waitForExit();
 * ```
 *
 * @category CLI
 */
export async function spawnDroidStreaming(options: SpawnOptions): Promise<StreamingDroidProcess> {
	const droidPath = await findDroidPath(options.droidPath);
	const args = buildArgs({ ...options, outputFormat: 'stream-json' });

	const proc = spawn(droidPath, args, {
		cwd: options.cwd ?? process.cwd(),
		stdio: ['inherit', 'pipe', 'pipe'],
	});

	const webStream = proc.stdout ? nodeStreamToWebStream(proc.stdout) : new ReadableStream();
	const events = parseJsonLines(webStream);

	return {
		events,
		process: proc,
		waitForExit: () => waitForExit(proc),
		kill: () => proc.kill(),
	};
}

/**
 * Executes the Droid CLI and parses JSON output.
 *
 * Convenience wrapper that handles the common case of executing with
 * JSON output format and parsing the response.
 *
 * @param options - Spawn configuration options
 * @returns Parsed JSON result from the CLI
 *
 * @throws {CliNotFoundError} If the CLI cannot be found
 * @throws {ExecutionError} If the CLI exits with non-zero or output cannot be parsed
 * @throws {TimeoutError} If the operation exceeds the timeout
 *
 * @example
 * ```typescript
 * const result = await execDroidJson({
 *   prompt: 'Generate a UUID',
 *   sessionId: 'session_abc123'
 * });
 *
 * console.log(result.result); // The generated UUID
 * console.log(result.duration_ms); // Execution time
 * ```
 *
 * @category CLI
 */
export async function execDroidJson(options: SpawnOptions): Promise<JsonResult> {
	const result = await spawnDroid({ ...options, outputFormat: 'json' });

	if (result.exitCode !== 0) {
		throw new ExecutionError(
			`Droid exec failed with exit code ${result.exitCode}`,
			result.exitCode,
			result.stderr,
		);
	}

	try {
		return JSON.parse(result.stdout) as JsonResult;
	} catch {
		throw new ExecutionError(
			'Failed to parse JSON response from droid',
			result.exitCode,
			result.stdout,
		);
	}
}

/**
 * Lists available tools for a given model.
 *
 * Queries the CLI for the list of tools available to the AI during execution.
 *
 * @param droidPath - Optional path to the CLI binary
 * @param model - Optional model to query tools for
 * @returns Array of tool names, or empty array on failure
 *
 * @example
 * ```typescript
 * const tools = await listDroidTools();
 * console.log('Available tools:', tools);
 * // ['file_read', 'file_write', 'shell_exec', ...]
 *
 * const gptTools = await listDroidTools(undefined, 'gpt-5.1');
 * ```
 *
 * @category CLI
 */
export async function listDroidTools(droidPath?: string, model?: string): Promise<string[]> {
	const args = ['exec', '--list-tools', '-o', 'json'];
	if (model) {
		args.push('-m', model);
	}

	const path = await findDroidPath(droidPath);
	const proc = spawn(path, args, {
		stdio: ['inherit', 'pipe', 'pipe'],
	});

	const [stdout, exitCode] = await Promise.all([streamToString(proc.stdout), waitForExit(proc)]);

	if (exitCode !== 0) {
		return [];
	}

	try {
		const data = JSON.parse(stdout);
		if (Array.isArray(data)) {
			return data as string[];
		}
		if (data && typeof data === 'object' && 'tools' in data && Array.isArray(data.tools)) {
			return data.tools as string[];
		}
		return [];
	} catch {
		return stdout.trim().split('\n').filter(Boolean);
	}
}
