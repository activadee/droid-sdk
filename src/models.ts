export { MODELS, type ModelId } from './types/options';

export interface ModelInfo {
	id: string;
	name: string;
	provider: 'anthropic' | 'openai' | 'google' | 'opensource';
	supportsReasoning: boolean;
	defaultReasoningEffort?: string;
}

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

export function getModelInfo(modelId: string): ModelInfo | undefined {
	return MODEL_INFO[modelId];
}

export function isValidModel(modelId: string): boolean {
	return modelId in MODEL_INFO || modelId.startsWith('custom:');
}
