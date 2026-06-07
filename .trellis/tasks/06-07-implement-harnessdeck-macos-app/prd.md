# Implement HarnessDeck macOS desktop app

## Goal

Build HarnessDeck into a locally runnable macOS desktop app: a local-first AI agent configuration profile, sync, operation, usage, insight, and guard workbench using Tauri 2, React, TypeScript, and Rust.

## Requirements

- Run on macOS as a Tauri 2 desktop app.
- Default UI locale is Simplified Chinese; English switching is available.
- Default UI theme is light; dark switching is available.
- Chinese UI uses `配置集` for Profiles.
- Beidou visual language is present through restrained star-map and navigation accents, not feature naming.
- Main workbench contains Home, Discover, Profiles, Sync, Operate, Usage, Insights, Guard, and Settings.
- Menu bar panel surface shows current profile, sync state, cost, wake state, and quick actions.
- Use fixture mode by default and do not read or write real Claude Code or Codex config directories.
- Model local profiles with rules, skills, MCP references, targets, and sync policy.
- Provide Codex and Claude Code target adapters as fixtures or mocks.
- Generate a deploy plan and preview diff for dry-run sync.
- Confirming dry-run writes a local deployment manifest that can be viewed in the UI.
- Represent backup, usage, guard, privacy, and Keychain boundaries in the product model.
- Real write operations require explicit future confirmation, backup, manifest, and rollback design.
- Implement the additional phases from `docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md`: Safe Target Integration, Sync Governance, Account Workspace, Usage and Cost, Registry and `find-best-skill`, Insights and Feed, and Wake Control.
- Real target discovery/read/validate for Claude Code and Codex may be added only behind explicit user authorization and must not write without backup, preview, confirm, manifest, and rollback.
- Account Workspace must model provider, base URL, default model, budget, limits, and Keychain secret reference; Keychain writes can remain mock/interface until explicitly authorized.
- Usage and cost must distinguish official, local-log, estimated, and missing confidence.
- Registry and discovery must support curated local registry first and optional GitHub discovery only through explicit user action.
- Insights and feed must default to local rules and safe update metadata.
- Wake Control must support standard awake, timed awake, display sleep control state, and explicit confirmation flow for experimental lid-awake behavior.
- No prompts, source code, secrets, or complete local logs are uploaded.
- No API keys, tokens, or credentials are hardcoded.
- Provide launch, test, and build commands.
- Commit each completed phase after verification; do not push.

## Acceptance Criteria

- [ ] Environment detection results are recorded, including installed dependency versions.
- [ ] Local Tauri CLI is available through project commands.
- [ ] `pnpm tauri dev` can start the desktop app locally.
- [ ] Main window displays Home, Discover, Profiles, Sync, Operate, Usage, Insights, Guard, and Settings.
- [ ] Menu bar panel surface displays profile, sync, cost, wake, and quick actions.
- [ ] Chinese default rendering is visible on first launch.
- [ ] English toggle changes fixed UI copy.
- [ ] Light default rendering is visible on first launch.
- [ ] Dark toggle changes theme.
- [ ] Beidou brand visuals are visible without star-name feature labels.
- [ ] At least one sample profile is visible.
- [ ] Profile switching works.
- [ ] Local scan view lists fixture-discovered rules, skills, and MCP references.
- [ ] Codex and Claude Code fixture targets are selectable.
- [ ] Dry-run sync generates a deploy plan with operations and diff preview.
- [ ] Dry-run confirmation writes a local manifest and updates UI state.
- [ ] Drift, conflict, and suggestion views display local fixture data.
- [ ] Usage view displays local usage/cost/duration/drift stats with confidence labeling.
- [ ] Guard view shows privacy, Keychain reference, backup, and real-write protection state.
- [ ] Settings view shows language and theme preferences.
- [ ] Safe Target Integration view can discover/read/validate Claude Code and Codex targets when the user explicitly grants local-read authorization.
- [ ] Sync Governance view supports three-way diff, conflict queue, drift detection, rollback preview, and blocked real writes without confirmation.
- [ ] Account Workspace view models provider/model/budget settings and Keychain references without exposing secrets.
- [ ] Registry view includes curated local templates and `find-best-skill` scoring.
- [ ] Insights and Feed views show local-rule recommendations, profile impact alerts, and update feed entries.
- [ ] Wake Control view includes standard awake, timed awake, display sleep control, and experimental lid-awake confirmation state.
- [ ] Tests or minimum verification commands run and results are reported.
- [ ] Final delivery lists implemented features, mock/fixture capabilities, launch command, test command, build command, and next-stage recommendations.

## Definition of Done

- Project contains Tauri 2 + React + TypeScript + Rust app structure.
- Rust unit tests cover core profile/target/deploy/manifest/guard behavior.
- Frontend tests cover locale/theme and main workflow rendering.
- Lint, typecheck, tests, and build commands run in this session.
- A local desktop launch is attempted and reported with evidence.
- Phase commits exist locally and no push is performed.

## Out of Scope

- Silent real Claude Code or Codex configuration writes.
- Silent account switching.
- Storing raw secrets outside Keychain.
- Uploading prompts, source code, complete logs, or local config.
- Remote LLM calls without explicit sanitized-summary consent.
- Shell hook installation without explicit consent.
- Production notarization and distribution packaging.

## Technical Notes

- Project root: `/Users/jiechen/per-pro/harness-deck`.
- Existing source documents: `AGENTS.md`, `README.md`, `docs/superpowers/specs/2026-06-07-harness-deck-design.md`, `docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md`.
- Primary visual prototype: `docs/product-design/harnessdeck-command-deck-prototype.html`.
- User confirmed continuation after Phase 0 environment check and allowed Trellis initialization.
