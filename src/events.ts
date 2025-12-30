import type { TurnResult } from './turn';
import type { StreamEvent } from './types';

export interface StreamedTurn {
	events: AsyncIterable<StreamEvent>;
	result: Promise<TurnResult>;
}

export type {
	MessageEvent,
	StreamEvent,
	SystemInitEvent,
	ToolCallEvent,
	ToolResultEvent,
	TurnCompletedEvent,
	TurnFailedEvent,
} from './types';

export {
	isMessageEvent,
	isSystemInitEvent,
	isToolCallEvent,
	isToolResultEvent,
	isTurnCompletedEvent,
	isTurnFailedEvent,
} from './types';
