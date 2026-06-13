# Hone

Chinese documentation: [`README.md`](README.md)

Hone is a macOS menu bar app and local practice operations workbench for turning AI coding / harness engineering practices into reusable local assets that can be safely projected into Claude Code and Codex.

The active product reference is the Practice Shard workbench design:

- `docs/product-design/screens/workbench-home.html`
- `docs/product-design/screens/statusbar-panel.html`

## Current Product Loop

```text
Signal -> Practice -> Local Asset -> Projection -> Review -> Improve
                                      |                         |
                                      +---- Operations / Audit --+
```

- **Signal**: collect changelog, model, community, and local sample signals.
- **Practice**: use BYOA agents to draft Practice Cards and let the user save them.
- **Local Asset**: materialize practices as registry assets such as skills, rules, hooks, MCP fragments, or profile fragments.
- **Projection**: preview and confirm symlink/copy plans into Claude Code or Codex targets.
- **Review**: inspect missing projections, broken links, drift evidence, and repair suggestions.
- **Operations**: show local scripts in read-only mode; execution requires preview, authorization, and audit.
- **Settings**: manage registry, starter fallback, authorization, theme, language, and audit history.

## Workbench Views

| View | Responsibility |
| --- | --- |
| **Home** | Loop health, today's order, segment status, target health, and recent audit |
| **Practice Library** | Signals, Practice Cards, local assets, and archived objects |
| **Apply & Sync** | Registry projection, conflict adoption, rollback, and projection audit |
| **Local Review** | Projection health, findings, evidence, advice, and drift timeline |
| **Operations** | Preview and confirm Codex proxy, Sleep guard, and Wake display scripts |
| **Settings** | Registry bootstrap, authorization boundaries, appearance, language, data, and audit |

## Architecture

- **Stack**: Tauri 2, React, TypeScript, Rust
- **State**: SQLite `hone.db`
- **Assets**: registry repo for skills, rules, hooks, and MCP fragments
- **Targets**: `~/.claude/` and `~/.codex/` hold projections only
- **Agents**: BYOA through local Claude Code / Codex CLI subprocesses

The current implementation includes the two-window Tauri app, the 6-view workbench, SQLite schema and repositories, signal-to-practice flow, local asset creation, projection planning, confirm/adopt/rollback, local review, audit trail, authorization state, system skills, and BYOA boundaries.

## Safety

- No prompts, source code, full logs, or secrets are uploaded by default.
- Local reads, external signals, projection writes, and script execution are separate authorization scopes.
- Projection writes require plan preview, explicit confirmation, and audit.
- Rollback removes only Hone-managed symlinks.
- Secrets belong to the Keychain boundary; SQLite and registry store references or safe summaries.

## Documentation Authority

Current product and UI behavior follow `docs/product-design/screens/workbench-home.html`.

`docs/superpowers/specs/2026-06-07-harness-deck-design.md` and `docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md` describe the old Profile-first plan and no longer define current product boundaries.

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
