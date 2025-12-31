export { MODELS, type ModelId } from './types/options';

/**
 * Metadata about a supported AI model.
 *
 * Contains information about the model's capabilities, provider,
 * and default settings.
 *
 * @example
 * ```typescript
 * const info = getModelInfo('claude-sonnet-4-5-20250929');
 * if (info) {
 *   console.log(`${info.name} by ${info.provider}`);
 *   console.log(`Supports reasoning: ${info.supportsReasoning}`);
 * }
 * ```
 *
 * @category Models
 */
export interface ModelInfo {
	/** Unique model identifier */
	id: string;
	/** Human-readable model name */
	name: string;
	/** Model provider */
	provider: 'anthropic' | 'openai' | 'google' | 'opensource';
	/** Whether the model supports reasoning/thinking mode */
	supportsReasoning: boolean;
	/** Default reasoning effort level for this model */
	defaultReasoningEffort?: string;
}

/**
 * Registry of all supported models with their metadata.
 *
 * Use {@link getModelInfo} to look up a specific model, or
 * iterate this object to list all available models.
 *
 * @example
 * ```typescript
 * // List all models
 * for (const [id, info] of Object.entries(MODEL_INFO)) {
 *   console.log(`${info.name} (${id})`);
 * }
 *
 * // Get models by provider
 * const claudeModels = Object.values(MODEL_INFO)
 *   .filter(m => m.provider === 'anthropic');
 * ```
 *
 * @category Models
 */
export const MODEL_INFO: Record<string, ModelInfo> = {
	'claude-opus-4-5-20251101': {
		id: 'claude-opus-4-5-20251101',
		name: 'Claude Opus 4.5',
		provider: 'anthropic',
		supportsReasoning: true,
		defaultReasoningEffort: 'off',
	},
	'claude-sonnet-4-5-20250929': {
		id: 'claude-sonnet-4-5-20250929',
		name: 'Claude Sonnet 4.5',
		provider: 'anthropic',
		supportsReasoning: true,
		defaultReasoningEffort: 'off',
	},
	'claude-haiku-4-5-20251001': {
		id: 'claude-haiku-4-5-20251001',
		name: 'Claude Haiku 4.5',
		provider: 'anthropic',
		supportsReasoning: true,
		defaultReasoningEffort: 'off',
	},
	'gpt-5.1': {
		id: 'gpt-5.1',
		name: 'GPT-5.1',
		provider: 'openai',
		supportsReasoning: true,
		defaultReasoningEffort: 'none',
	},
	'gpt-5.1-codex': {
		id: 'gpt-5.1-codex',
		name: 'GPT-5.1-Codex',
		provider: 'openai',
		supportsReasoning: true,
		defaultReasoningEffort: 'medium',
	},
	'gpt-5.1-codex-max': {
		id: 'gpt-5.1-codex-max',
		name: 'GPT-5.1-Codex-Max',
		provider: 'openai',
		supportsReasoning: true,
		defaultReasoningEffort: 'medium',
	},
	'gpt-5.2': {
		id: 'gpt-5.2',
		name: 'GPT-5.2',
		provider: 'openai',
		supportsReasoning: true,
		defaultReasoningEffort: 'low',
	},
	'gemini-3-pro-preview': {
		id: 'gemini-3-pro-preview',
		name: 'Gemini 3 Pro',
		provider: 'google',
		supportsReasoning: true,
		defaultReasoningEffort: 'high',
	},
	'gemini-3-flash-preview': {
		id: 'gemini-3-flash-preview',
		name: 'Gemini 3 Flash',
		provider: 'google',
		supportsReasoning: true,
		defaultReasoningEffort: 'high',
	},
	'glm-4.6': {
		id: 'glm-4.6',
		name: 'Droid Core (GLM-4.6)',
		provider: 'opensource',
		supportsReasoning: false,
	},
};

/**
 * Retrieves metadata for a specific model.
 *
 * @param modelId - The model identifier to look up
 * @returns Model metadata, or undefined if not found
 *
 * @example
 * ```typescript
 * const info = getModelInfo(MODELS.CLAUDE_SONNET);
 * if (info) {
 *   console.log(`Using ${info.name}`);
 *   if (info.supportsReasoning) {
 *     console.log(`Default reasoning: ${info.defaultReasoningEffort}`);
 *   }
 * }
 * ```
 *
 * @category Models
 */
export function getModelInfo(modelId: string): ModelInfo | undefined {
	return MODEL_INFO[modelId];
}

/**
 * Checks if a model identifier is valid.
 *
 * A model is valid if it exists in {@link MODEL_INFO} or is a custom
 * model (prefixed with "custom:").
 *
 * @param modelId - The model identifier to validate
 * @returns True if the model is valid
 *
 * @example
 * ```typescript
 * isValidModel('claude-sonnet-4-5-20250929'); // true
 * isValidModel('custom:my-fine-tuned-model'); // true
 * isValidModel('invalid-model'); // false
 * ```
 *
 * @category Models
 */
export function isValidModel(modelId: string): boolean {
	return modelId in MODEL_INFO || modelId.startsWith('custom:');
}
