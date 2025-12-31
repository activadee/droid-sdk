/**
 * Autonomy level for AI decision-making.
 *
 * Controls how independently the AI operates during execution:
 * - `'default'`: Use the model's default behavior
 * - `'low'`: Require confirmation for most actions
 * - `'medium'`: Allow some autonomous actions
 * - `'high'`: Maximize autonomous operation
 *
 * @category Configuration
 */
export type AutonomyLevel = 'default' | 'low' | 'medium' | 'high';

/**
 * Reasoning intensity level.
 *
 * Controls the depth of reasoning the AI uses during execution:
 * - `'off'` or `'none'`: Minimal reasoning (fastest)
 * - `'low'`: Light reasoning
 * - `'medium'`: Balanced reasoning
 * - `'high'`: Deep, thorough reasoning (highest quality)
 *
 * Higher values may improve quality but increase latency and cost.
 *
 * @category Configuration
 */
export type ReasoningEffort = 'off' | 'none' | 'low' | 'medium' | 'high';

/**
 * Output format for CLI responses.
 *
 * - `'text'`: Plain text output (default)
 * - `'json'`: Single JSON object response
 * - `'stream-json'`: Newline-delimited JSON events
 * - `'stream-jsonrpc'`: JSON-RPC formatted events
 *
 * @category Configuration
 */
export type OutputFormat = 'text' | 'json' | 'stream-json' | 'stream-jsonrpc';

/**
 * Supported file attachment types.
 *
 * Used with {@link FileAttachment} to indicate the type of attached file:
 * - `'image'`: Image files (png, jpg, gif, webp, etc.) for vision-capable models
 * - `'text'`: Text files, code, markdown, etc.
 * - `'data'`: JSON, CSV, or other data files
 * - `'other'`: Any other file type
 *
 * @category Types
 */
export type FileAttachmentType = 'image' | 'text' | 'data' | 'other';

/**
 * A file attachment to include with the prompt.
 *
 * Files are referenced using the `@path` syntax that the Droid CLI understands.
 * Attachments allow you to provide context files, images for vision models,
 * or data files for processing.
 *
 * @example
 * ```typescript
 * // Attach an image for vision models
 * const result = await thread.run('Describe this screenshot', {
 *   attachments: [{ path: './screenshot.png', type: 'image' }]
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Attach multiple files with descriptions
 * const result = await thread.run('Review these files', {
 *   attachments: [
 *     { path: './src/main.ts', type: 'text', description: 'Main entry point' },
 *     { path: './data.json', type: 'data', description: 'Sample data' }
 *   ]
 * });
 * ```
 *
 * @category Types
 */
export interface FileAttachment {
	/**
	 * Path to the file (relative to cwd or absolute).
	 */
	path: string;

	/**
	 * Type of the file for context.
	 * Helps the AI understand how to process the attachment.
	 */
	type: FileAttachmentType;

	/**
	 * Optional description to include with the file reference.
	 * Provides additional context about the file's purpose.
	 */
	description?: string;
}

/**
 * Predefined model identifiers for supported AI models.
 *
 * Use these constants to specify the model in configuration:
 *
 * @example
 * ```typescript
 * import { Droid, MODELS } from '@activade/droid-sdk';
 *
 * // Claude models
 * const droid = new Droid({ model: MODELS.CLAUDE_OPUS });
 * const droid = new Droid({ model: MODELS.CLAUDE_SONNET });
 * const droid = new Droid({ model: MODELS.CLAUDE_HAIKU });
 *
 * // OpenAI models
 * const droid = new Droid({ model: MODELS.GPT_5_1_CODEX });
 *
 * // Google models
 * const droid = new Droid({ model: MODELS.GEMINI_3_PRO });
 * ```
 *
 * @category Configuration
 */
export const MODELS = {
	/** Claude Opus 4.5 - Most capable Claude model */
	CLAUDE_OPUS: 'claude-opus-4-5-20251101',
	/** Claude Sonnet 4.5 - Balanced performance and speed */
	CLAUDE_SONNET: 'claude-sonnet-4-5-20250929',
	/** Claude Haiku 4.5 - Fast and efficient */
	CLAUDE_HAIKU: 'claude-haiku-4-5-20251001',

	/** GPT-5.1 - OpenAI's base GPT-5.1 model */
	GPT_5_1: 'gpt-5.1',
	/** GPT-5.1 Codex - Optimized for code */
	GPT_5_1_CODEX: 'gpt-5.1-codex',
	/** GPT-5.1 Codex Max - Extended context and capabilities */
	GPT_5_1_CODEX_MAX: 'gpt-5.1-codex-max',
	/** GPT-5.2 - Latest GPT model */
	GPT_5_2: 'gpt-5.2',

	/** Gemini 3 Pro - Google's most capable model */
	GEMINI_3_PRO: 'gemini-3-pro-preview',
	/** Gemini 3 Flash - Fast Gemini variant */
	GEMINI_3_FLASH: 'gemini-3-flash-preview',

	/** Droid Core - Factory's open-source GLM-based model */
	DROID_CORE: 'glm-4.6',
} as const;

/**
 * Union type of all predefined model IDs.
 *
 * @category Types
 */
export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/**
 * Thread-level execution options.
 *
 * These options configure a thread's behavior for all prompts executed
 * within it. They can be specified when creating a thread via
 * {@link Droid.startThread} or {@link Droid.resumeThread}.
 *
 * @example
 * ```typescript
 * const thread = droid.startThread({
 *   model: MODELS.CLAUDE_SONNET,
 *   autonomyLevel: 'high',
 *   cwd: '/path/to/project',
 *   enabledTools: ['file_read', 'file_write', 'shell_exec'],
 *   disabledTools: ['web_search']
 * });
 * ```
 *
 * @category Configuration
 */
export interface ThreadOptions {
	/**
	 * Working directory for this thread.
	 * Overrides the Droid instance's cwd setting.
	 */
	cwd?: string;

	/**
	 * AI model to use for this thread.
	 * Overrides the Droid instance's model setting.
	 */
	model?: ModelId | string;

	/**
	 * Autonomy level for this thread.
	 * @see {@link AutonomyLevel}
	 */
	autonomyLevel?: AutonomyLevel;

	/**
	 * Reasoning effort for this thread.
	 * @see {@link ReasoningEffort}
	 */
	reasoningEffort?: ReasoningEffort;

	/**
	 * Whether to use specification mode.
	 * When true, generates a spec before implementing.
	 */
	useSpec?: boolean;

	/**
	 * Model to use for specification generation.
	 * Only applies when `useSpec` is true.
	 */
	specModel?: string;

	/**
	 * Reasoning effort for specification generation.
	 * Only applies when `useSpec` is true.
	 */
	specReasoningEffort?: ReasoningEffort;

	/**
	 * Whitelist of tools the AI is allowed to use.
	 * If specified, only these tools will be available.
	 *
	 * @example
	 * ```typescript
	 * { enabledTools: ['file_read', 'file_write'] }
	 * ```
	 */
	enabledTools?: string[];

	/**
	 * Blacklist of tools the AI is not allowed to use.
	 * These tools will be excluded even if in enabledTools.
	 *
	 * @example
	 * ```typescript
	 * { disabledTools: ['shell_exec', 'web_request'] }
	 * ```
	 */
	disabledTools?: string[];

	/**
	 * Skip permission checks (unsafe).
	 *
	 * @warning This bypasses safety checks and should only be used
	 * in trusted environments where you fully control the prompts.
	 */
	skipPermissionsUnsafe?: boolean;
}

/**
 * JSON Schema definition for structured output.
 *
 * Used with {@link RunOptions.outputSchema} to define the expected
 * structure of AI responses. Follows the JSON Schema specification.
 *
 * @example
 * ```typescript
 * const schema: JsonSchema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number' },
 *     email: { type: 'string', format: 'email' }
 *   },
 *   required: ['name', 'email']
 * };
 * ```
 *
 * @category Types
 */
export interface JsonSchema {
	/** The type of the value */
	type?: string;
	/** Object properties (for type: 'object') */
	properties?: Record<string, JsonSchema>;
	/** Required property names */
	required?: string[];
	/** Array item schema (for type: 'array') */
	items?: JsonSchema;
	/** Allowed values (for enums) */
	enum?: unknown[];
	/** Whether additional properties are allowed */
	additionalProperties?: boolean | JsonSchema;
	/** Additional schema properties */
	[key: string]: unknown;
}

/**
 * Run-level execution options.
 *
 * These options configure a single prompt execution within a thread.
 * They extend {@link ThreadOptions} and add prompt-specific settings.
 *
 * @example
 * ```typescript
 * const result = await thread.run('Generate a user object', {
 *   outputSchema: {
 *     type: 'object',
 *     properties: {
 *       name: { type: 'string' },
 *       email: { type: 'string' }
 *     }
 *   },
 *   attachments: [
 *     { path: './template.json', type: 'data' }
 *   ]
 * });
 * ```
 *
 * @category Configuration
 */
export interface RunOptions extends Partial<ThreadOptions> {
	/**
	 * JSON Schema for structured output.
	 * When provided, the AI will format its response to match this schema.
	 */
	outputSchema?: JsonSchema;

	/**
	 * Path to a file containing the prompt.
	 * Alternative to passing the prompt as a string.
	 */
	promptFile?: string;

	/**
	 * File attachments to include with the prompt.
	 * @see {@link FileAttachment}
	 */
	attachments?: FileAttachment[];
}

/**
 * Options for one-shot execution via {@link Droid.exec}.
 *
 * Extends {@link RunOptions} with the ability to specify a session ID
 * for continuing a previous conversation.
 *
 * @example
 * ```typescript
 * // One-shot with session continuation
 * const result = await droid.exec('Continue our previous work', {
 *   sessionId: 'session_abc123...'
 * });
 * ```
 *
 * @category Configuration
 */
export interface ExecOptions extends RunOptions {
	/**
	 * Session ID to continue a previous conversation.
	 * If provided, the execution will have access to previous context.
	 */
	sessionId?: string;
}
