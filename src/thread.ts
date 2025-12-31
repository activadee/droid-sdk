import { execDroidJson, type SpawnOptions, spawnDroidStreaming } from './cli/process';
import { ExecutionError } from './errors';
import type { StreamedTurn } from './events';
import { buildTurnResultFromEvents, buildTurnResultFromJson, type TurnResult } from './turn';
import type { DroidConfig, RunOptions, StreamEvent, ThreadOptions } from './types';

export class Thread {
	private _sessionId: string | undefined;
	private readonly _cwd: string;
	private readonly _config: DroidConfig;
	private readonly _threadOptions: ThreadOptions;

	constructor(config: DroidConfig, threadOptions: ThreadOptions = {}, sessionId?: string) {
		this._config = config;
		this._threadOptions = threadOptions;
		this._sessionId = sessionId;
		this._cwd = threadOptions.cwd ?? config.cwd ?? process.cwd();
	}

	get id(): string | undefined {
		return this._sessionId;
	}

	get cwd(): string {
		return this._cwd;
	}

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

	async run(prompt: string, options: RunOptions = {}): Promise<TurnResult> {
		const spawnOptions = this.buildSpawnOptions(prompt, options);

		const jsonResult = await execDroidJson(spawnOptions);

		if (!this._sessionId && jsonResult.session_id) {
			this._sessionId = jsonResult.session_id;
		}

		return buildTurnResultFromJson(jsonResult);
	}

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
