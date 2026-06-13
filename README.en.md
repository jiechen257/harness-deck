# Hone

Chinese documentation: [`README.md`](README.md)

Hone is a macOS menu bar app and workbench for individual developers who want to discover, apply, observe, and continuously improve AI coding practices.

It runs local-first. Hone reads local Claude Code and Codex state, calls the user's own local agent CLIs through BYOA, stores structured state in SQLite, keeps reusable assets in a registry repo, and projects approved assets into local target directories only after explicit authorization.

## Product Loop

```text
Discover -> Apply -> Observe -> Optimize
   ^                              |
   +------------------------------+
```

- **Discover**: collect trusted signals, normalize them into Practice Cards, and turn adoptable practices into local assets.
- **Apply**: preview projection plans, confirm writes, adopt unmanaged assets, and roll back managed projections for Claude Code and Codex.
- **Observe**: aggregate local usage, cost, sessions, model distribution, projection health, and audit history.
- **Optimize**: surface local insights and use BYOA agents to generate improvement suggestions for user-approved registry assets.

## Workbench Views

| View | Responsibility |
| --- | --- |
| **Home** | Loop dashboard and next-action queue |
| **Discover** | Signals, Practice Cards, local assets, and the entry point into projection |
| **Usage** | Real local usage and cost observation |
| **Insights** | Usage insights, projection health, and audit trail |
| **Settings** | Registry, BYOA agent detection, authorization, appearance, and audit settings |

The projection plan screen is opened from the Discover asset flow. It is not a primary navigation item.

## Current Implementation

The repository contains a runnable Tauri 2 + React + TypeScript + Rust macOS app.

Implemented product closure:

- Main workbench and standalone menu bar panel.
- Five primary workbench views: Home, Discover, Usage, Insights, Settings.
- SQLite state for signals, practices, local assets, projections, source configs, authorizations, system skills, and audit events.
- BYOA detection and invocation boundaries for Claude Code and Codex.
- Signal refresh, normalization, Practice Card creation, and local asset creation.
- Registry-backed asset materialization when a writable active registry is configured.
- Projection preview, confirmed write, unmanaged adoption, rollback, health checks, and audit trail.
- Real local usage readers for Claude Code and Codex where data sources are available.

Safety boundary:

- Prompts, source code, full logs, secrets, and complete local configuration are not uploaded by default.
- Agent calls are local CLI subprocesses.
- Local reads, external signals, projection writes, and script execution each require separate authorization.
- Projection confirm, adopt, and rollback require `write_projection` authorization before touching target files.

## Technology

- Tauri 2
- React
- TypeScript
- Rust
- SQLite
- macOS Keychain boundary for future secret storage

## Development Commands

```bash
pnpm install
pnpm dev
pnpm tauri:dev
pnpm tauri:build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:watch
cargo test --manifest-path src-tauri/Cargo.toml
```

## License

Hone is released under the GNU General Public License v3.0 only (GPL-3.0-only). See [`LICENSE`](LICENSE) for the full text.
