# PROJECT KNOWLEDGE BASE

**Generated:** 2025-12-30
**Commit:** b2d3490
**Branch:** main

## OVERVIEW

TypeScript SDK wrapping Factory's `droid` CLI for programmatic AI agent integration. Bun-only runtime. Enables thread-based conversations, streaming events, session persistence, and Zod-validated structured output.

## STRUCTURE

```
droid-sdk/
├── src/
│   ├── index.ts        # Public API exports
│   ├── droid.ts        # Droid class - main entry, creates threads
│   ├── thread.ts       # Thread class - session/conversation management
│   ├── turn.ts         # TurnResult - response wrapper with parse()
│   ├── events.ts       # StreamedTurn interface, event re-exports
│   ├── errors.ts       # Custom errors: CliNotFound, Execution, Parse, Timeout, Stream
│   ├── models.ts       # MODEL_INFO registry, validation helpers
│   ├── cli/
│   │   ├── index.ts    # CLI module exports
│   │   ├── process.ts  # spawnDroid, execDroidJson, findDroidPath
│   │   ├── stream-parser.ts  # parseJsonLines for streaming
│   │   └── installer.ts      # ensureDroidCli auto-install
│   ├── types/          # All TypeScript types
│   │   ├── config.ts   # DroidConfig, defaults
│   │   ├── options.ts  # ThreadOptions, RunOptions, MODELS const
│   │   ├── events.ts   # StreamEvent union, type guards
│   │   └── turn.ts     # TurnItem types
│   └── schemas/
│       └── zod-adapter.ts  # Zod schema helpers
├── tests/              # Bun test files
├── examples/           # Usage examples
└── dist/               # Build output (gitignored)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new config option | `src/types/config.ts` + `src/droid.ts` | Update type, apply in constructor |
| Add thread option | `src/types/options.ts` + `src/cli/process.ts` | Update type, add to `buildArgs()` |
| Add new event type | `src/types/events.ts` + `src/turn.ts` | Add type, type guard, handle in `buildTurnResultFromEvents` |
| Add new error type | `src/errors.ts` | Extend `DroidError` |
| Add new model | `src/models.ts` + `src/types/options.ts` | Add to `MODEL_INFO` and `MODELS` const |
| Modify CLI spawning | `src/cli/process.ts` | `spawnDroid`, `spawnDroidStreaming` |
| Change streaming parser | `src/cli/stream-parser.ts` | `parseJsonLines` generator |
| Update installer | `src/cli/installer.ts` | Unix/Windows install logic |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `Droid` | Class | `src/droid.ts` | Main entry - config holder, thread factory |
| `Thread` | Class | `src/thread.ts` | Session state, `run()` / `runStreamed()` |
| `TurnResult` | Class | `src/turn.ts` | Response wrapper, `parse()` for Zod |
| `execDroidJson` | Function | `src/cli/process.ts` | Spawn → JSON result |
| `spawnDroidStreaming` | Function | `src/cli/process.ts` | Spawn → event stream |
| `parseJsonLines` | Generator | `src/cli/stream-parser.ts` | ReadableStream → events |
| `ensureDroidCli` | Function | `src/cli/installer.ts` | Auto-download CLI |

### Data Flow

```
Droid.startThread() → Thread
Thread.run(prompt) → execDroidJson() → TurnResult
Thread.runStreamed(prompt) → spawnDroidStreaming() → StreamedTurn { events, result }
```

## CONVENTIONS

- **Bun-only**: Uses `Bun.spawn`, `Bun.file`, `Bun.$` - no Node compatibility
- **Biome**: Tabs, 100-char lines, single quotes, trailing commas, semicolons always
- **Type imports**: Must use `import type` for type-only imports (`useImportType: error`)
- **Export types**: Must use `export type` for type re-exports (`useExportType: error`)
- **No explicit any**: Warned but not blocked (`noExplicitAny: warn`)
- **Const preference**: `useConst: error` - use `const` over `let` where possible
- **Strict TS**: `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`

## ANTI-PATTERNS (THIS PROJECT)

| Pattern | Why Bad | Do Instead |
|---------|---------|------------|
| `skipPermissionsUnsafe: true` | Bypasses AI safety checks | Use appropriate `autonomyLevel` |
| Direct CLI spawn without `findDroidPath` | Won't find CLI in non-standard locations | Always use `findDroidPath()` |
| Ignoring `isError` on TurnResult | Silent failures | Check `result.isError` before using response |
| Not handling `CliNotFoundError` | Bad UX when CLI missing | Catch and suggest install command |

## COMMANDS

```bash
# Development
bun run build          # Build types + bundle JS
bun run typecheck      # Type-check only
bun test               # Run tests
bun run test:watch     # Watch mode

# Code quality
bun run lint           # Check with Biome
bun run lint:fix       # Auto-fix
bun run format         # Format with Biome

# Release
bun run prepublishOnly # clean → lint → test → build
```

## NOTES

- **CLI required**: SDK wraps external `droid` CLI binary. Use `ensureDroidCli()` for auto-install or ensure `droid` is in PATH
- **Session IDs**: Thread gets `sessionId` after first `run()`. Access via `thread.id`
- **Streaming vs JSON**: `runStreamed()` returns events iterator + result promise. `run()` returns result directly (faster, no events)
- **Zod optional**: `zod` is peer dependency. `parse()` / `tryParse()` methods work with any schema having `parse`/`safeParse` signature
- **No CI/CD**: Currently no GitHub Actions. Use `bun run prepublishOnly` before releasing
- **Two exports**: Main (`@activade/droid-sdk`) and CLI (`@activade/droid-sdk/cli`) for tree-shaking installer
