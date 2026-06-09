# Backend Development Guidelines

HarnessDeck backend code is the Rust side of a Tauri 2 desktop app. It owns local filesystem access, fixture target adapters, deploy plan generation, dry-run manifest writing, app data paths, privacy checks, and future SQLite / Keychain integration.

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Rust module boundaries, file layout, and new-command workflow | Filled |
| [Database Guidelines](./database-guidelines.md) | App data paths, manifest persistence, future SQLite rules | Filled |
| [Error Handling](./error-handling.md) | `CommandError` struct, error codes, factory methods, examples | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Phase-organized tests, serde conventions, verification commands | Filled |
| [Logging Guidelines](./logging-guidelines.md) | `tauri-plugin-log` setup, audit trail model, privacy boundaries | Filled |

## Pre-Development Checklist

Read these before backend work:

- `CLAUDE.md` — project overview, commands, architecture, key conventions
- `.trellis/spec/backend/directory-structure.md` — where files go and the three-layer pattern
- `.trellis/spec/backend/error-handling.md` — `CommandError` usage
- `.trellis/spec/backend/quality-guidelines.md` — test organization and serde conventions

For persistence or secret work, also read:

- `.trellis/spec/backend/database-guidelines.md`
- `.trellis/spec/backend/logging-guidelines.md`

## Project Rules

- All domain structs use `#[serde(rename_all = "camelCase")]` to match TypeScript types.
- Critical writes to agent configuration must be Rust-owned, never frontend-owned.
- Current phase uses fixture targets and dry-run manifests only.
- Real Claude/Codex config writes are out of scope until backup, diff, verification, manifest, and rollback are implemented.
