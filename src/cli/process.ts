import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { CliNotFoundError, ExecutionError, TimeoutError } from '../errors';
import type { JsonResult, OutputFormat, RunOptions, StreamEvent, ThreadOptions } from '../types';
import { parseJsonLines } from './stream-parser';
import { nodeStreamToWebStream, streamToString, waitForExit } from './utils';

export interface SpawnOptions {
	prompt?: string;
	promptFile?: string;
	sessionId?: string;
	cwd?: string;
	droidPath?: string;
	timeout?: number;
	outputFormat?: OutputFormat;
	threadOptions?: ThreadOptions;
	runOptions?: RunOptions;
}

export interface DroidProcessResult {
	stdout: string;
	stderr: string;
	exitCode: number;
}

export interface StreamingDroidProcess {
	events: AsyncIterable<StreamEvent>;
	process: ChildProcess;
	waitForExit: () => Promise<number>;
	kill: () => void;
}

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

	if (options.prompt) {
		args.push(options.prompt);
	}

	return args;
}

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
