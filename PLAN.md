# Droid SDK Plan

> TypeScript SDK for Factory Droid CLI - Bun Only

**Package**: `@activadee-ai/droid-sdk`  
**Version**: `0.1.0`  
**License**: MIT  

---

## Overview

This SDK provides a TypeScript wrapper around the Factory `droid` CLI, following the same patterns as the OpenAI Codex SDK. It enables programmatic interaction with Factory's AI development agent for automation, CI/CD pipelines, and building AI-powered development tools.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **CLI Wrapper** | Pure wrapper around `droid` CLI, not a direct API client |
| **Config Inheritance** | Inherits from `~/.factory` config when no explicit options |
| **No Retries** | Fail fast, consumer handles retry logic |
| **Streaming-First** | `runStreamed()` is the core primitive |
| **Bun Only** | Leverages Bun's native APIs for optimal performance |
| **Optional CLI Installer** | Auto-downloads CLI on-demand (not bundled) |
| **Zod Optional** | Peer dependency for structured output |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    @activadee-ai/droid-sdk                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌──────────────────────┐    │
│  │  Droid  │───▶│ Thread  │───▶│   TurnResult         │    │
│  └────┬────┘    └────┬────┘    │   - finalResponse    │    │
│       │              │         │   - items[]          │    │
│       │              │         │   - parse<T>()       │    │
│       ▼              ▼         └──────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  CLI Process Wrapper                 │   │
│  │  - Bun.spawn(['droid', 'exec', ...args])            │   │
│  │  - Stream parser (JSONL → AsyncIterable<Event>)     │   │
│  │  - Options → CLI flags mapping                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   droid CLI    │
                    │ (external bin) │
                    └────────────────┘
```

---

## Project Structure

```
droid-sdk/
├── package.json
├── tsconfig.json
├── bunfig.toml
├── biome.json
├── README.md
├── LICENSE
├── CHANGELOG.md
├── PLAN.md                         # This file
├── src/
│   ├── index.ts                    # Main exports
│   ├── droid.ts                    # Main Droid class
│   ├── thread.ts                   # Thread/Session management
│   ├── turn.ts                     # Turn result class
│   ├── events.ts                   # Event types and streaming
│   ├── models.ts                   # Model definitions & constants
│   ├── errors.ts                   # Custom error classes
│   ├── cli/
│   │   ├── index.ts                # CLI module exports
│   │   ├── installer.ts            # Auto-download CLI logic
│   │   ├── process.ts              # Bun.spawn wrapper
│   │   └── stream-parser.ts        # JSONL parser
│   ├── types/
│   │   ├── index.ts                # Type exports
│   │   ├── config.ts               # Configuration types
│   │   ├── events.ts               # Stream event types
│   │   ├── options.ts              # Thread/Run options
│   │   └── turn.ts                 # Turn result types
│   └── schemas/
│       └── zod-adapter.ts          # Zod to JSON Schema adapter
├── tests/
│   ├── droid.test.ts
│   ├── thread.test.ts
│   ├── streaming.test.ts
│   ├── cli-installer.test.ts
│   └── fixtures/
│       └── mock-responses.ts
└── examples/
    ├── basic.ts
    ├── streaming.ts
    ├── structured-output.ts
    ├── multi-turn.ts
    └── auto-install.ts
```

---

## API Specification

### Main Exports

```typescript
// @activadee-ai/droid-sdk
export { Droid } from './droid';
export { Thread } from './thread';
export { TurnResult } from './turn';
export { DroidError, CliNotFoundError, ExecutionError } from './errors';
export { MODELS, type ModelId } from './models';
export * from './types';
export * from './events';

// @activadee-ai/droid-sdk/cli
export { ensureDroidCli, isDroidCliInstalled, getDroidCliPath } from './cli';
```

### Droid Class

```typescript
export interface DroidConfig {
  /** Working directory for all threads (default: process.cwd()) */
  cwd?: string;
  
  /** Default model (inherits from Factory config if not set) */
  model?: ModelId | string;
  
  /** Default autonomy level */
  autonomyLevel?: AutonomyLevel;
  
  /** Default reasoning effort */
  reasoningEffort?: ReasoningEffort;
  
  /** Path to droid CLI binary (default: 'droid' in PATH) */
  droidPath?: string;
  
  /** Timeout in milliseconds (default: 600000 = 10 min) */
  timeout?: number;
}

export class Droid {
  constructor(config?: DroidConfig);
  
  /** Start a new thread/session */
  startThread(options?: ThreadOptions): Thread;
  
  /** Resume an existing session */
  resumeThread(sessionId: string, options?: ThreadOptions): Thread;
  
  /** One-shot execution without session management */
  exec(prompt: string, options?: ExecOptions): Promise<TurnResult>;
  
  /** List available tools for a model */
  listTools(model?: string): Promise<string[]>;
}
```

### Thread Class

```typescript
export interface ThreadOptions {
  /** Working directory for this thread */
  cwd?: string;
  
  /** Model to use */
  model?: ModelId | string;
  
  /** Autonomy level: 'default' | 'low' | 'medium' | 'high' */
  autonomyLevel?: AutonomyLevel;
  
  /** Reasoning effort: 'off' | 'none' | 'low' | 'medium' | 'high' */
  reasoningEffort?: ReasoningEffort;
  
  /** Use specification mode */
  useSpec?: boolean;
  
  /** Model to use for spec mode */
  specModel?: string;
  
  /** Reasoning effort for spec mode */
  specReasoningEffort?: ReasoningEffort;
  
  /** Force-enable specific tools */
  enabledTools?: string[];
  
  /** Disable specific tools */
  disabledTools?: string[];
  
  /** Skip all permission checks (DANGEROUS) */
  skipPermissionsUnsafe?: boolean;
}

export interface RunOptions extends Partial<ThreadOptions> {
  /** JSON Schema for structured output */
  outputSchema?: JsonSchema;
  
  /** Read prompt from file instead */
  promptFile?: string;
}

export interface StreamedTurn {
  /** Async iterable of stream events */
  events: AsyncIterable<StreamEvent>;
  
  /** Promise that resolves to the final turn result */
  result: Promise<TurnResult>;
}

export class Thread {
  /** Unique session ID */
  readonly id: string | undefined;
  
  /** Working directory */
  readonly cwd: string;
  
  /** Execute prompt with streaming events */
  runStreamed(prompt: string, options?: RunOptions): Promise<StreamedTurn>;
  
  /** Execute prompt and wait for completion */
  run(prompt: string, options?: RunOptions): Promise<TurnResult>;
}
```

### TurnResult Class

```typescript
export interface TurnItem {
  type: 'message' | 'tool_call' | 'tool_result';
}

export interface MessageItem extends TurnItem {
  type: 'message';
  role: 'user' | 'assistant';
  id: string;
  text: string;
  timestamp: number;
}

export interface ToolCallItem extends TurnItem {
  type: 'tool_call';
  id: string;
  messageId: string;
  toolId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  timestamp: number;
}

export interface ToolResultItem extends TurnItem {
  type: 'tool_result';
  id: string;
  messageId: string;
  toolId: string;
  toolName: string;
  isError: boolean;
  value: string;
  timestamp: number;
}

export class TurnResult {
  /** Final response text from the agent */
  readonly finalResponse: string;
  
  /** All items from the turn (messages, tool calls, results) */
  readonly items: TurnItem[];
  
  /** Session ID for resuming */
  readonly sessionId: string;
  
  /** Execution duration in milliseconds */
  readonly durationMs: number;
  
  /** Number of agent turns */
  readonly numTurns: number;
  
  /** Whether the turn resulted in an error */
  readonly isError: boolean;
  
  /** Parse finalResponse as typed data using Zod schema */
  parse<T>(schema: ZodType<T>): T;
  
  /** Get all tool calls from this turn */
  get toolCalls(): ToolCallItem[];
  
  /** Get all messages from this turn */
  get messages(): MessageItem[];
}
```

### Stream Events

```typescript
export type StreamEvent =
  | SystemInitEvent
  | MessageEvent
  | ToolCallEvent
  | ToolResultEvent
  | TurnCompletedEvent
  | TurnFailedEvent;

export interface SystemInitEvent {
  type: 'system';
  subtype: 'init';
  cwd: string;
  session_id: string;
  tools: string[];
  model: string;
}

export interface MessageEvent {
  type: 'message';
  role: 'user' | 'assistant';
  id: string;
  text: string;
  timestamp: number;
  session_id: string;
}

export interface ToolCallEvent {
  type: 'tool_call';
  id: string;
  messageId: string;
  toolId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  timestamp: number;
  session_id: string;
}

export interface ToolResultEvent {
  type: 'tool_result';
  id: string;
  messageId: string;
  toolId: string;
  toolName: string;
  isError: boolean;
  value: string;
  timestamp: number;
  session_id: string;
}

export interface TurnCompletedEvent {
  type: 'completion';
  finalText: string;
  numTurns: number;
  durationMs: number;
  session_id: string;
  timestamp: number;
}

export interface TurnFailedEvent {
  type: 'turn.failed';
  error: {
    message: string;
    code?: string;
  };
  session_id: string;
  timestamp: number;
}
```

### CLI Installer

```typescript
export interface InstallOptions {
  /** Installation directory (default: ~/.droid-sdk/bin) */
  installDir?: string;
  
  /** Force reinstall even if already present */
  force?: boolean;
  
  /** Specific version to install (default: latest) */
  version?: string;
  
  /** Progress callback */
  onProgress?: (progress: { phase: string; percent?: number }) => void;
}

/** Ensures droid CLI is installed, downloads if needed */
export async function ensureDroidCli(options?: InstallOptions): Promise<string>;

/** Check if droid CLI is available */
export async function isDroidCliInstalled(): Promise<boolean>;

/** Get the path to droid CLI binary, or null if not found */
export async function getDroidCliPath(): Promise<string | null>;
```

### Models & Constants

```typescript
export const MODELS = {
  // Claude
  CLAUDE_OPUS: 'claude-opus-4-5-20251101',
  CLAUDE_SONNET: 'claude-sonnet-4-5-20250929',
  CLAUDE_HAIKU: 'claude-haiku-4-5-20251001',
  
  // OpenAI
  GPT_5_1: 'gpt-5.1',
  GPT_5_1_CODEX: 'gpt-5.1-codex',
  GPT_5_1_CODEX_MAX: 'gpt-5.1-codex-max',
  GPT_5_2: 'gpt-5.2',
  
  // Google
  GEMINI_3_PRO: 'gemini-3-pro-preview',
  GEMINI_3_FLASH: 'gemini-3-flash-preview',
  
  // Open Source
  DROID_CORE: 'glm-4.6',
} as const;

export type ModelId = typeof MODELS[keyof typeof MODELS];

export type AutonomyLevel = 'default' | 'low' | 'medium' | 'high';

export type ReasoningEffort = 'off' | 'none' | 'low' | 'medium' | 'high';
```

### Error Classes

```typescript
export class DroidError extends Error {
  constructor(message: string, options?: { cause?: Error });
}

export class CliNotFoundError extends DroidError {
  constructor(searchedPaths: string[]);
}

export class ExecutionError extends DroidError {
  readonly exitCode: number;
  readonly stderr: string;
  readonly sessionId?: string;
  
  constructor(message: string, exitCode: number, stderr: string, sessionId?: string);
}

export class ParseError extends DroidError {
  readonly raw: string;
  
  constructor(message: string, raw: string, cause?: Error);
}
```

---

## CLI Flag Mapping

| SDK Option | CLI Flag |
|------------|----------|
| `model` | `-m, --model <id>` |
| `sessionId` | `-s, --session-id <id>` |
| `autonomyLevel: 'low'` | `--auto low` |
| `autonomyLevel: 'medium'` | `--auto medium` |
| `autonomyLevel: 'high'` | `--auto high` |
| `reasoningEffort` | `-r, --reasoning-effort <level>` |
| `useSpec: true` | `--use-spec` |
| `specModel` | `--spec-model <id>` |
| `specReasoningEffort` | `--spec-reasoning-effort <level>` |
| `enabledTools` | `--enabled-tools <ids>` |
| `disabledTools` | `--disabled-tools <ids>` |
| `skipPermissionsUnsafe` | `--skip-permissions-unsafe` |
| `cwd` | `--cwd <path>` |
| `promptFile` | `-f, --file <path>` |
| (streaming) | `-o stream-json` |
| (json result) | `-o json` |

---

## Implementation Phases

### Phase 1: Project Setup & Core Types
- [x] Create PLAN.md
- [ ] Initialize Bun project
- [ ] Configure TypeScript
- [ ] Configure Biome
- [ ] Define all types in `src/types/`
- [ ] Create error classes

### Phase 2: CLI Process Wrapper
- [ ] Implement `DroidProcess` class
- [ ] Implement `spawnDroid()` function
- [ ] Build JSONL stream parser
- [ ] Map SDK options to CLI flags
- [ ] Handle stdout/stderr/exit codes

### Phase 3: Thread & Turn Classes
- [ ] Implement `TurnResult` class
- [ ] Implement `Thread` class
- [ ] Implement `runStreamed()` with AsyncIterable
- [ ] Implement `run()` as wrapper

### Phase 4: Droid Main Class
- [ ] Implement `Droid` class
- [ ] Implement `startThread()`
- [ ] Implement `resumeThread()`
- [ ] Implement `exec()`
- [ ] Implement `listTools()`

### Phase 5: Structured Output
- [ ] Implement Zod to JSON Schema adapter
- [ ] Implement `TurnResult.parse()`
- [ ] Add type inference support

### Phase 6: CLI Auto-Installer
- [ ] Implement platform detection
- [ ] Implement download from Factory CDN
- [ ] Implement version checking
- [ ] Implement `ensureDroidCli()`
- [ ] Implement `isDroidCliInstalled()`
- [ ] Implement `getDroidCliPath()`

### Phase 7: Tests & Documentation
- [ ] Write unit tests
- [ ] Write example files
- [ ] Write README.md
- [ ] Write CHANGELOG.md
- [ ] Prepare for npm publish

---

## Usage Examples

### Basic Usage

```typescript
import { Droid } from '@activadee-ai/droid-sdk';

const droid = new Droid();
const thread = droid.startThread({ cwd: '/my/project' });

const result = await thread.run('Analyze the codebase and explain the architecture');
console.log(result.finalResponse);
```

### Streaming Events

```typescript
import { Droid } from '@activadee-ai/droid-sdk';

const droid = new Droid();
const thread = droid.startThread();

const { events, result } = await thread.runStreamed('Fix all TypeScript errors');

for await (const event of events) {
  switch (event.type) {
    case 'tool_call':
      console.log(`Calling ${event.toolName}...`);
      break;
    case 'tool_result':
      console.log(`Result: ${event.isError ? 'ERROR' : 'OK'}`);
      break;
    case 'completion':
      console.log(`Done in ${event.durationMs}ms`);
      break;
  }
}

const turn = await result;
console.log(turn.finalResponse);
```

### Structured Output with Zod

```typescript
import { Droid } from '@activadee-ai/droid-sdk';
import { z } from 'zod';

const AnalysisSchema = z.object({
  summary: z.string(),
  issues: z.array(z.object({
    file: z.string(),
    line: z.number().optional(),
    severity: z.enum(['error', 'warning', 'info']),
    message: z.string(),
  })),
  score: z.number().min(0).max(100),
});

const droid = new Droid();
const thread = droid.startThread();

const result = await thread.run(
  'Analyze codebase for issues. Return JSON with summary, issues array, and score.',
  { outputSchema: AnalysisSchema }
);

const analysis = result.parse(AnalysisSchema);
console.log(`Score: ${analysis.score}/100`);
console.log(`Found ${analysis.issues.length} issues`);
```

### Multi-Turn Conversation

```typescript
import { Droid } from '@activadee-ai/droid-sdk';

const droid = new Droid();
const thread = droid.startThread();

// First turn
await thread.run('Read the README and understand the project');

// Second turn - continues context
await thread.run('Now implement the feature described in the README');

// Third turn - still has full context
const result = await thread.run('Write tests for the implementation');

console.log(result.finalResponse);
```

### Resume Session

```typescript
import { Droid } from '@activadee-ai/droid-sdk';

const droid = new Droid();

// Start and save session
const thread = droid.startThread();
const result = await thread.run('Start implementing the feature');
const sessionId = result.sessionId;

// Later: resume the session
const resumedThread = droid.resumeThread(sessionId);
await resumedThread.run('Continue with the implementation');
```

### Auto-Install CLI

```typescript
import { Droid } from '@activadee-ai/droid-sdk';
import { ensureDroidCli } from '@activadee-ai/droid-sdk/cli';

// Ensure CLI is installed before using
const droidPath = await ensureDroidCli({
  onProgress: ({ phase, percent }) => {
    console.log(`${phase}${percent ? `: ${percent}%` : ''}`);
  }
});

const droid = new Droid({ droidPath });
const result = await droid.exec('Quick analysis');
```

### CI/CD Pipeline

```typescript
import { Droid, MODELS } from '@activadee-ai/droid-sdk';

const droid = new Droid({
  model: MODELS.CLAUDE_SONNET,
  timeout: 300000, // 5 minutes
});

const result = await droid.exec('Review the PR and report any issues', {
  autonomyLevel: 'default', // Read-only
  cwd: process.env.GITHUB_WORKSPACE,
});

if (result.isError) {
  process.exit(1);
}

console.log(result.finalResponse);
```

---

## NPM Package Configuration

```json
{
  "name": "@activadee-ai/droid-sdk",
  "version": "0.1.0",
  "description": "TypeScript SDK for Factory Droid CLI - Bun only",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./cli": {
      "types": "./dist/cli/index.d.ts",
      "import": "./dist/cli/index.js"
    }
  },
  "files": ["dist", "README.md", "LICENSE", "CHANGELOG.md"],
  "scripts": {
    "build": "bun run build:types && bun run build:js",
    "build:js": "bun build ./src/index.ts ./src/cli/index.ts --outdir ./dist --target bun --splitting",
    "build:types": "tsc --emitDeclarationOnly",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "lint": "bunx biome check .",
    "lint:fix": "bunx biome check --write .",
    "format": "bunx biome format --write .",
    "clean": "rm -rf dist",
    "prepublishOnly": "bun run clean && bun run lint && bun run test && bun run build"
  },
  "keywords": [
    "factory",
    "droid",
    "ai",
    "cli",
    "sdk",
    "bun",
    "typescript",
    "codex",
    "agent"
  ],
  "author": "Activadee AI",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/activadee-ai/droid-sdk"
  },
  "bugs": {
    "url": "https://github.com/activadee-ai/droid-sdk/issues"
  },
  "homepage": "https://github.com/activadee-ai/droid-sdk#readme",
  "engines": {
    "bun": ">=1.0.0"
  },
  "peerDependencies": {
    "zod": "^3.0.0"
  },
  "peerDependenciesMeta": {
    "zod": {
      "optional": true
    }
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@types/bun": "latest",
    "typescript": "^5.7.0",
    "zod": "^3.24.0"
  }
}
```

---

## References

- [Factory CLI Docs](https://docs.factory.ai/cli/getting-started/quickstart)
- [Droid Exec Reference](https://docs.factory.ai/cli/droid-exec/overview)
- [CLI Reference](https://docs.factory.ai/reference/cli-reference)
- [OpenAI Codex SDK](https://github.com/openai/codex) - API design inspiration
