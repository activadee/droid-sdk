# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-30

### Added

- Initial release
- `Droid` class for SDK initialization
- `Thread` class for conversation management
- `TurnResult` class for response handling
- Streaming support with `runStreamed()` and async iterables
- Multi-turn conversation support
- Session persistence and resume with `resumeThread()`
- Structured output parsing with Zod schema support
- CLI auto-installer via `ensureDroidCli()`
- Full TypeScript types
- Support for all Factory models:
  - Claude Opus 4.5, Sonnet 4.5, Haiku 4.5
  - GPT-5.1, GPT-5.1-Codex, GPT-5.1-Codex-Max, GPT-5.2
  - Gemini 3 Pro, Gemini 3 Flash
  - GLM-4.6 (Droid Core)
- Autonomy level control (default, low, medium, high)
- Tool enable/disable options
- Spec mode support
- Error classes: `DroidError`, `CliNotFoundError`, `ExecutionError`, `ParseError`, `TimeoutError`, `StreamError`
