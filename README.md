# @activade/droid-sdk

TypeScript SDK for [Factory Droid CLI](https://docs.factory.ai/cli) - Bun only.

A programmatic wrapper around the `droid` CLI, enabling you to integrate Factory's AI development agent into your automation workflows, CI/CD pipelines, and developer tools.

## Installation

```bash
bun add @activade/droid-sdk
```

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- [Factory Droid CLI](https://docs.factory.ai/cli/getting-started/quickstart) installed

```bash
curl -fsSL https://app.factory.ai/cli | sh
```

## Quick Start

```typescript
import { Droid } from '@activade/droid-sdk';

const droid = new Droid();
const thread = droid.startThread();

const result = await thread.run('Analyze this codebase');
console.log(result.finalResponse);
```

## Features

- **Thread-based conversations** - Maintain context across multiple turns
- **Streaming events** - Real-time access to tool calls and results
- **Session persistence** - Resume conversations across processes
- **Structured output** - Parse responses with Zod schemas
- **Auto-install CLI** - Optionally download the CLI on-demand

## Usage

### Basic Usage

```typescript
import { Droid } from '@activade/droid-sdk';

const droid = new Droid({
  cwd: '/path/to/project',
  model: 'claude-sonnet-4-5-20250929',
});

const thread = droid.startThread();
const result = await thread.run('Fix all TypeScript errors');

console.log(result.finalResponse);
console.log(`Completed in ${result.durationMs}ms`);
```

### Streaming Events

```typescript
import { Droid, isToolCallEvent, isToolResultEvent } from '@activade/droid-sdk';

const droid = new Droid();
const thread = droid.startThread();

const { events, result } = await thread.runStreamed('Refactor the auth module');

for await (const event of events) {
  if (isToolCallEvent(event)) {
    console.log(`Calling ${event.toolName}...`);
  }
  if (isToolResultEvent(event)) {
    console.log(`Result: ${event.isError ? 'ERROR' : 'OK'}`);
  }
}

const turn = await result;
console.log(turn.finalResponse);
```

### Multi-Turn Conversations

```typescript
const thread = droid.startThread();

await thread.run('Read the README and understand the project');
await thread.run('Implement the feature described in the README');
await thread.run('Write tests for the implementation');

console.log('Session ID:', thread.id);
```

### Resume Session

```typescript
// Save session ID
const thread = droid.startThread();
await thread.run('Start implementing feature X');
const sessionId = thread.id;

// Later: resume the session
const resumedThread = droid.resumeThread(sessionId);
await resumedThread.run('Continue with the implementation');
```

### Structured Output with Zod

```typescript
import { z } from 'zod';
import { Droid } from '@activade/droid-sdk';

const AnalysisSchema = z.object({
  summary: z.string(),
  issues: z.array(z.object({
    file: z.string(),
    severity: z.enum(['error', 'warning', 'info']),
    message: z.string(),
  })),
  score: z.number().min(0).max(100),
});

const droid = new Droid();
const thread = droid.startThread();

const result = await thread.run('Analyze codebase and return JSON with summary, issues, and score');
const analysis = result.parse(AnalysisSchema);

console.log(`Quality score: ${analysis.score}/100`);
```

### One-Shot Execution

```typescript
const droid = new Droid();

// No session management, just execute and get result
const result = await droid.exec('Quick code review', {
  autonomyLevel: 'default',
});
```

### Auto-Install CLI

```typescript
import { Droid } from '@activade/droid-sdk';
import { ensureDroidCli } from '@activade/droid-sdk/cli';

const droidPath = await ensureDroidCli({
  onProgress: ({ phase, percent }) => {
    console.log(`${phase}: ${percent ?? 0}%`);
  },
});

const droid = new Droid({ droidPath });
```

## Configuration

### DroidConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cwd` | `string` | `process.cwd()` | Working directory |
| `model` | `string` | (from Factory config) | AI model to use |
| `autonomyLevel` | `'default' \| 'low' \| 'medium' \| 'high'` | `'default'` | Autonomy level |
| `reasoningEffort` | `'off' \| 'low' \| 'medium' \| 'high'` | (model default) | Reasoning effort |
| `droidPath` | `string` | `'droid'` | Path to CLI binary |
| `timeout` | `number` | `600000` | Timeout in ms |

### ThreadOptions

| Option | Type | Description |
|--------|------|-------------|
| `cwd` | `string` | Working directory for this thread |
| `model` | `string` | Override model |
| `autonomyLevel` | `string` | Override autonomy |
| `reasoningEffort` | `string` | Override reasoning |
| `useSpec` | `boolean` | Enable spec mode |
| `specModel` | `string` | Model for spec phase |
| `enabledTools` | `string[]` | Force-enable tools |
| `disabledTools` | `string[]` | Disable tools |
| `skipPermissionsUnsafe` | `boolean` | Skip permission checks (DANGEROUS) |

## Available Models

```typescript
import { MODELS } from '@activade/droid-sdk';

MODELS.CLAUDE_OPUS      // 'claude-opus-4-5-20251101'
MODELS.CLAUDE_SONNET    // 'claude-sonnet-4-5-20250929'
MODELS.CLAUDE_HAIKU     // 'claude-haiku-4-5-20251001'
MODELS.GPT_5_1_CODEX    // 'gpt-5.1-codex'
MODELS.GPT_5_1_CODEX_MAX // 'gpt-5.1-codex-max'
MODELS.GPT_5_2          // 'gpt-5.2'
MODELS.GEMINI_3_PRO     // 'gemini-3-pro-preview'
MODELS.DROID_CORE       // 'glm-4.6'
```

## Error Handling

```typescript
import { Droid, CliNotFoundError, ExecutionError, ParseError } from '@activade/droid-sdk';

try {
  const result = await thread.run('Do something');
} catch (error) {
  if (error instanceof CliNotFoundError) {
    console.error('Droid CLI not installed');
  } else if (error instanceof ExecutionError) {
    console.error(`Execution failed: ${error.stderr}`);
  } else if (error instanceof ParseError) {
    console.error(`Failed to parse: ${error.raw}`);
  }
}
```

## CI/CD Example

```yaml
# .github/workflows/droid-review.yml
name: Droid Code Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: curl -fsSL https://app.factory.ai/cli | sh
      - run: |
          bun run - <<'EOF'
          import { Droid } from '@activade/droid-sdk';
          const droid = new Droid();
          const result = await droid.exec('Review this PR for issues');
          console.log(result.finalResponse);
          EOF
        env:
          FACTORY_API_KEY: ${{ secrets.FACTORY_API_KEY }}
```

## Documentation

Full documentation is available at [activadee.github.io/droid-sdk](https://activadee.github.io/droid-sdk/).

## License

MIT
