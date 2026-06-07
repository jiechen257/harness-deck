# Backend Development Guidelines

HarnessDeck backend code is the Rust side of a Tauri 2 desktop app. It owns local filesystem access, fixture target adapters, deploy plan generation, dry-run manifest writing, app data paths, privacy checks, and future SQLite / Keychain integration.

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Rust module boundaries and file layout | Filled |
| [Database Guidelines](./database-guidelines.md) | SQLite and local persistence rules | Filled |
| [Error Handling](./error-handling.md) | Typed errors and IPC-safe responses | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Safety, tests, and forbidden backend patterns | Filled |
| [Logging Guidelines](./logging-guidelines.md) | Local-first logging and audit rules | Filled |

## Pre-Development Checklist

Read these before backend work:

- `AGENTS.md`
- `docs/superpowers/specs/2026-06-07-harness-deck-design.md`
- `docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md`
- `.trellis/spec/backend/directory-structure.md`
- `.trellis/spec/backend/error-handling.md`
- `.trellis/spec/backend/quality-guidelines.md`
- `.trellis/spec/guides/index.md`

For persistence or secret work, also read:

- `.trellis/spec/backend/database-guidelines.md`
- `.trellis/spec/backend/logging-guidelines.md`

## Project Rules

- Backend documentation can be English for Trellis compatibility; product docs and UI default to Simplified Chinese.
- Critical writes to agent configuration must be Rust-owned, never frontend-owned.
- Phase 1 uses fixture targets and dry-run manifests only.
- Real Claude/Codex config writes are out of scope until backup, diff, verification, manifest, and rollback are implemented.
