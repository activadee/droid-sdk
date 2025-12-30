import { execDroidJson, listDroidTools } from './cli/process';
import { Thread } from './thread';
import { type TurnResult, buildTurnResultFromJson } from './turn';
import type { DroidConfig, ExecOptions, ThreadOptions } from './types';
import { DEFAULT_DROID_PATH, DEFAULT_TIMEOUT } from './types';

export class Droid {
	private readonly _config: DroidConfig;

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

	get config(): Readonly<DroidConfig> {
		return this._config;
	}

	startThread(options: ThreadOptions = {}): Thread {
		const mergedOptions: ThreadOptions = {
			model: this._config.model,
			autonomyLevel: this._config.autonomyLevel,
			reasoningEffort: this._config.reasoningEffort,
			...options,
		};

		return new Thread(this._config, mergedOptions);
	}

	resumeThread(sessionId: string, options: ThreadOptions = {}): Thread {
		const mergedOptions: ThreadOptions = {
			model: this._config.model,
			autonomyLevel: this._config.autonomyLevel,
			reasoningEffort: this._config.reasoningEffort,
			...options,
		};

		return new Thread(this._config, mergedOptions, sessionId);
	}

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

	async listTools(model?: string): Promise<string[]> {
		return listDroidTools(this._config.droidPath, model ?? this._config.model);
	}
}
