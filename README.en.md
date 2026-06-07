# HarnessDeck

Chinese documentation: [`README.md`](README.md)

HarnessDeck is a macOS menu bar app and management workbench for using harness engineering well. It brings community practice discovery, Harness Profile management, Claude/Codex sync, daily operation, usage analysis, and continuous improvement into one local-first workflow.

This repository contains a locally runnable Tauri 2 + React + TypeScript + Rust macOS desktop app with an MVP fixture workflow.

## Current Status

- Product design document: [`docs/superpowers/specs/2026-06-07-harness-deck-design.md`](docs/superpowers/specs/2026-06-07-harness-deck-design.md)
- Implementation design document: [`docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md`](docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md)
- UI/UX prototype: [`docs/product-design/harnessdeck-command-deck-prototype.html`](docs/product-design/harnessdeck-command-deck-prototype.html)
- Native-feel reference: [`yetone/native-feel-skill`](https://github.com/yetone/native-feel-skill)
- Target platform: macOS
- Current stack: Tauri 2, React, TypeScript, Rust
- Reserved integrations: SQLite and macOS Keychain
- First agent targets: Claude Code and Codex
- Interface language: Simplified Chinese and English, with Simplified Chinese as the default
- Interface theme: light and dark, with light as the default
- Brand direction: Beidou navigation as visual language, with engineering-oriented feature names

## Product Loop

```text
Discover -> Profile -> Sync -> Operate -> Improve
```

- `Discover`: find official, community, and curated harness engineering practices.
- `Profile`: turn practices into reusable Harness Profiles.
- `Sync`: deploy Profiles safely to Claude Code and Codex.
- `Operate`: manage Profiles, accounts, usage, sync, and wake state through a menu bar control center.
- `Improve`: suggest changes based on tokens, cost, drift, conflicts, failures, and updates.

## MVP Scope

The MVP provides a complete local loop with pluggable remote integrations. Core capabilities include:

- Menu bar control center and management workbench
- Harness Profiles
- Claude Code and Codex adapters
- Policy sync, three-way diff, backup, manifest, and rollback
- Account Workspace and Keychain secret storage boundary
- Claude/Codex usage and cost views with source confidence labels
- Curated registry, GitHub discovery gate, and `find-best-skill`
- Local rule-based insights and profile impact update feed
- Standard awake, timed awake, display sleep control, and explicit confirmation for experimental lid-awake behavior

## Privacy Boundary

HarnessDeck uses a local-first design:

- It does not upload prompts, source code, secrets, local configuration, or complete logs by default.
- Secrets belong in macOS Keychain.
- Profile files and SQLite store secret references only.
- Reading logs, enabling hooks, using a local LLM, sending sanitized summaries to a remote LLM, and enabling experimental lid-awake behavior all require explicit user consent.
- Real configuration writes require a plan, diff, backup, manifest, verification, and explicit confirmation.

## Development Status

The current implementation runs in local-first fixture mode. The app defaults to Simplified Chinese and the light theme, with English and dark theme switching available. The main window now follows the command deck prototype with a top command bar, Beidou brand status band, menu bar panel, and macOS-style workbench window. The workbench includes Home, Discover, Profiles, Sync, Operate, Usage, Insights, Guard, and Settings. A standalone Tauri menu bar panel renders through `index.html?panel=1` and shows the current profile, sync health, cost, wake state, and quick actions. The UI has also been adjusted against the native-feel audit with system typography, default cursors, platform focus rings, pressed states, WebKit context-menu suppression, and macOS-style shortcuts.

Implemented local loop:

- Profile fixtures, Codex / Claude Code fixture targets, deploy plan, and dry-run manifest.
- Safe target discovery with explicit local-read authorization and summary-only output.
- Three-way diff, conflict queue, drift detection, and rollback preview.
- Account Workspace, mock Keychain reference, switch-plan preview, and audit trail.
- Usage / cost aggregation with Official, LocalLog, Estimated, and Missing confidence.
- Curated registry, `find-best-skill` scoring, and GitHub discovery gate.
- Local insight rules, feed, and profile impact alert.
- Wake Control mock/system-safe state, with explicit confirmation for experimental lid-awake behavior.

Mock / fixture capabilities:

- No real Claude Code or Codex configuration writes.
- Keychain is interface/mock-only and does not store secret values.
- Registry / GitHub discovery does not perform automatic remote calls.
- Wake Control does not change system power policy.
- SQLite persistence is reserved; manifests are currently recorded as local JSON files.

Common commands:

```bash
pnpm install
pnpm tauri:dev
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri:build
```
