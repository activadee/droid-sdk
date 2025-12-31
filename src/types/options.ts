export type AutonomyLevel = 'default' | 'low' | 'medium' | 'high';

export type ReasoningEffort = 'off' | 'none' | 'low' | 'medium' | 'high';

export type OutputFormat = 'text' | 'json' | 'stream-json' | 'stream-jsonrpc';

/**
 * Supported file attachment types.
 * - 'image': Image files (png, jpg, gif, webp, etc.) for vision-capable models
 * - 'text': Text files, code, markdown, etc.
 * - 'data': JSON, CSV, or other data files
 * - 'other': Any other file type
 */
export type FileAttachmentType = 'image' | 'text' | 'data' | 'other';

/**
 * A file attachment to include with the prompt.
 * The file will be referenced using the @path syntax that the droid CLI understands.
 *
 * @example
 * ```typescript
 * // Attach an image for vision models
 * const result = await thread.run('Describe this screenshot', {
 *   attachments: [{ path: './screenshot.png', type: 'image' }]
 * });
 *
 * // Attach multiple files
 * const result = await thread.run('Review these files', {
 *   attachments: [
 *     { path: './src/main.ts', type: 'text' },
 *     { path: './data.json', type: 'data' }
 *   ]
 * });
 * ```
 */
export interface FileAttachment {
	/** Path to the file (relative to cwd or absolute) */
	path: string;
	/** Type of the file for context */
	type: FileAttachmentType;
	/** Optional description to include with the file reference */
	description?: string;
}

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
	attachments?: FileAttachment[];
}

export interface ExecOptions extends RunOptions {
	sessionId?: string;
}
