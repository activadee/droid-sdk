import type { AutonomyLevel, ModelId, ReasoningEffort } from './options';

/**
 * Configuration options for the Droid SDK.
 *
 * This interface defines the global settings that apply to all operations
 * performed by a Droid instance. Individual operations can override these
 * settings using their respective options.
 *
 * @example
 * ```typescript
 * import { Droid, MODELS } from '@activade/droid-sdk';
 *
 * const config: DroidConfig = {
 *   model: MODELS.CLAUDE_SONNET,
 *   autonomyLevel: 'high',
 *   reasoningEffort: 'medium',
 *   cwd: '/path/to/project',
 *   timeout: 300000 // 5 minutes
 * };
 *
 * const droid = new Droid(config);
 * ```
 *
 * @see {@link Droid} for usage context
 *
 * @category Configuration
 */
export interface DroidConfig {
	/**
	 * Working directory for CLI operations.
	 *
	 * All file paths and commands will be relative to this directory.
	 * Defaults to `process.cwd()` if not specified.
	 *
	 * @default process.cwd()
	 */
	cwd?: string;

	/**
	 * The AI model to use for generation.
	 *
	 * Can be a predefined model ID from {@link MODELS} or a custom model string.
	 * Different models have different capabilities, speeds, and costs.
	 *
	 * @example
	 * ```typescript
	 * // Using predefined model constant
	 * { model: MODELS.CLAUDE_SONNET }
	 *
	 * // Using model ID string
	 * { model: 'claude-opus-4-5-20251101' }
	 *
	 * // Custom model
	 * { model: 'custom:my-fine-tuned-model' }
	 * ```
	 */
	model?: ModelId | string;

	/**
	 * Level of autonomous decision-making.
	 *
	 * Controls how independently the AI operates:
	 * - `'default'`: Use model's default behavior
	 * - `'low'`: Require confirmation for most actions
	 * - `'medium'`: Allow some autonomous actions
	 * - `'high'`: Maximize autonomous operation
	 *
	 * @default 'default'
	 */
	autonomyLevel?: AutonomyLevel;

	/**
	 * Reasoning intensity for complex tasks.
	 *
	 * Controls the depth of reasoning the AI uses:
	 * - `'off'` or `'none'`: Minimal reasoning
	 * - `'low'`: Light reasoning
	 * - `'medium'`: Balanced reasoning
	 * - `'high'`: Deep, thorough reasoning
	 *
	 * Higher values may improve quality but increase latency and cost.
	 */
	reasoningEffort?: ReasoningEffort;

	/**
	 * Path to the Droid CLI binary.
	 *
	 * Allows specifying a custom CLI location. If not provided,
	 * the SDK will search standard locations and the system PATH.
	 *
	 * @default 'droid'
	 */
	droidPath?: string;

	/**
	 * Maximum execution time in milliseconds.
	 *
	 * Operations that exceed this timeout will be terminated and
	 * throw a {@link TimeoutError}.
	 *
	 * @default 600000 (10 minutes)
	 */
	timeout?: number;
}

/**
 * Default timeout for Droid operations in milliseconds.
 *
 * Set to 10 minutes (600,000ms) to accommodate complex, long-running tasks.
 *
 * @category Configuration
 */
export const DEFAULT_TIMEOUT = 600_000;

/**
 * Default path/command to invoke the Droid CLI.
 *
 * Uses 'droid' which relies on the binary being in the system PATH.
 * Can be overridden via {@link DroidConfig.droidPath}.
 *
 * @category Configuration
 */
export const DEFAULT_DROID_PATH = 'droid';
