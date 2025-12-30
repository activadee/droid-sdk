export { Droid } from './droid';
export {
	CliNotFoundError,
	DroidError,
	ExecutionError,
	ParseError,
	StreamError,
	TimeoutError,
} from './errors';
export type { StreamedTurn } from './events';
export {
	isMessageEvent,
	isSystemInitEvent,
	isToolCallEvent,
	isToolResultEvent,
	isTurnCompletedEvent,
	isTurnFailedEvent,
	type MessageEvent,
	type StreamEvent,
	type SystemInitEvent,
	type ToolCallEvent,
	type ToolResultEvent,
	type TurnCompletedEvent,
	type TurnFailedEvent,
} from './events';

export { getModelInfo, isValidModel, MODEL_INFO, MODELS, type ModelInfo } from './models';
export { Thread } from './thread';
export { buildTurnResultFromEvents, buildTurnResultFromJson, TurnResult } from './turn';

export type {
	AnyTurnItem,
	AutonomyLevel,
	DroidConfig,
	ExecOptions,
	JsonResult,
	JsonSchema,
	MessageItem,
	ModelId,
	OutputFormat,
	ReasoningEffort,
	RunOptions,
	ThreadOptions,
	ToolCallItem,
	ToolResultItem,
	TurnItem,
	TurnResultData,
} from './types';

export { DEFAULT_DROID_PATH, DEFAULT_TIMEOUT } from './types';
