import type { TurnResult } from './turn';
import type { StreamEvent } from './types';

export interface StreamedTurn {
	events: AsyncIterable<StreamEvent>;
	result: Promise<TurnResult>;
}

export type {
	StreamEvent,
	SystemInitEvent,
	MessageEvent,
	ToolCallEvent,
	ToolResultEvent,
	TurnCompletedEvent,
	TurnFailedEvent,
} from './types';

export {
	isSystemInitEvent,
	isMessageEvent,
	isToolCallEvent,
	isToolResultEvent,
	isTurnCompletedEvent,
	isTurnFailedEvent,
} from './types';
