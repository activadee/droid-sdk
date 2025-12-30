export { Droid } from './droid';
export { Thread } from './thread';
export { TurnResult, buildTurnResultFromEvents, buildTurnResultFromJson } from './turn';

export {
	DroidError,
	CliNotFoundError,
	ExecutionError,
	ParseError,
	TimeoutError,
	StreamError,
} from './errors';

export { MODELS, MODEL_INFO, getModelInfo, isValidModel, type ModelInfo } from './models';

export type { StreamedTurn } from './events';
export {
	type StreamEvent,
	type SystemInitEvent,
	type MessageEvent,
	type ToolCallEvent,
	type ToolResultEvent,
	type TurnCompletedEvent,
	type TurnFailedEvent,
	isSystemInitEvent,
	isMessageEvent,
	isToolCallEvent,
	isToolResultEvent,
	isTurnCompletedEvent,
	isTurnFailedEvent,
} from './events';

export type {
	DroidConfig,
	AutonomyLevel,
	ReasoningEffort,
	OutputFormat,
	ModelId,
	ThreadOptions,
	RunOptions,
	ExecOptions,
	JsonSchema,
	TurnItem,
	MessageItem,
	ToolCallItem,
	ToolResultItem,
	AnyTurnItem,
	TurnResultData,
	JsonResult,
} from './types';

export { DEFAULT_TIMEOUT, DEFAULT_DROID_PATH } from './types';
