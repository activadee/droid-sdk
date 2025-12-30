export type AutonomyLevel = 'default' | 'low' | 'medium' | 'high';

export type ReasoningEffort = 'off' | 'none' | 'low' | 'medium' | 'high';

export type OutputFormat = 'text' | 'json' | 'stream-json' | 'stream-jsonrpc';

export const MODELS = {
	CLAUDE_OPUS: 'claude-opus-4-5-20251101',
	CLAUDE_SONNET: 'claude-sonnet-4-5-20250929',
	CLAUDE_HAIKU: 'claude-haiku-4-5-20251001',

	GPT_5_1: 'gpt-5.1',
	GPT_5_1_CODEX: 'gpt-5.1-codex',
	GPT_5_1_CODEX_MAX: 'gpt-5.1-codex-max',
	GPT_5_2: 'gpt-5.2',

	GEMINI_3_PRO: 'gemini-3-pro-preview',
	GEMINI_3_FLASH: 'gemini-3-flash-preview',

	DROID_CORE: 'glm-4.6',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export interface ThreadOptions {
	cwd?: string;
	model?: ModelId | string;
	autonomyLevel?: AutonomyLevel;
	reasoningEffort?: ReasoningEffort;
	useSpec?: boolean;
	specModel?: string;
	specReasoningEffort?: ReasoningEffort;
	enabledTools?: string[];
	disabledTools?: string[];
	skipPermissionsUnsafe?: boolean;
}

export interface JsonSchema {
	type?: string;
	properties?: Record<string, JsonSchema>;
	required?: string[];
	items?: JsonSchema;
	enum?: unknown[];
	additionalProperties?: boolean | JsonSchema;
	[key: string]: unknown;
}

export interface RunOptions extends Partial<ThreadOptions> {
	outputSchema?: JsonSchema;
	promptFile?: string;
}

export interface ExecOptions extends RunOptions {
	sessionId?: string;
}
