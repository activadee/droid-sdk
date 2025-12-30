import type { AutonomyLevel, ModelId, ReasoningEffort } from './options';

export interface DroidConfig {
	cwd?: string;
	model?: ModelId | string;
	autonomyLevel?: AutonomyLevel;
	reasoningEffort?: ReasoningEffort;
	droidPath?: string;
	timeout?: number;
}

export const DEFAULT_TIMEOUT = 600_000;
export const DEFAULT_DROID_PATH = 'droid';
