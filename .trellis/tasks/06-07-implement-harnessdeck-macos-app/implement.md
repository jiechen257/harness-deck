# HarnessDeck implementation plan

## Phase 0: Environment and Foundation

- Install local project Tauri CLI dependency after creating package metadata.
- Re-run version checks for macOS, Xcode, Node, pnpm, Rust, Cargo, rustup, and Tauri CLI.
- Record environment results in project documentation.
- Verify `pnpm tauri --version`.
- Commit Phase 0.

## Implementation-Design Phase 0: Project Foundation

- Add `package.json`, pnpm lockfile, Vite/React/TypeScript config, and Tauri config.
- Add `src/` React app with Home, Discover, Profiles, Sync, Operate, Usage, Insights, Guard, and Settings.
- Add menu bar panel surface inside the main UI and Tauri tray/menu configuration where feasible.
- Implement default Chinese locale, English toggle, default light theme, and dark toggle.
- Recreate core visual direction from the HTML prototype with real components and CSS tokens.
- Verify lint, typecheck, frontend tests, and Tauri dev/build as far as the local environment allows.
- Commit Phase 1.

## Implementation-Design Phase 1: Local Core Loop

- Add Rust domain models for profiles, targets, deploy plans, manifests, usage, and guard policy.
- Add fixtures for sample profiles and Codex/Claude Code targets.
- Add Rust services for profile listing, target listing, secret scanning, deploy plan generation, app paths, and manifest storage.
- Add Rust unit tests for profile validation, secret scanning, deploy plan generation, and manifest write/read.
- Expose typed Tauri commands.
- Wire frontend API calls to Tauri commands for profile list, target list, deploy plan, dry-run confirm, and latest manifest.
- Show latest dry-run status in workbench and menu bar panel.
- Commit implementation-design Phase 1.

## Implementation-Design Phase 2: Safe Target Integration

- Add opt-in local-read authorization model for target discovery.
- Implement Claude Code and Codex discovery/read/validate services that return safe summaries.
- Keep real writes unavailable unless backup, preview, confirm, manifest, verification, and rollback metadata are present.
- Add tests proving fixture mode is default and real target read requires authorization.

## Implementation-Design Phase 3: Sync Governance

- Implement three-way diff data model.
- Implement conflict queue, drift detection, rollback preview, and backup metadata.
- Show deploy plan/diff/conflict/rollback state in Sync.
- Add tests for drift and conflict calculations.
- Commit implementation-design Phases 2 and 3.

## Implementation-Design Phase 4: Account Workspace

- Add account workspace model for provider, base URL, default model, budget, limits, and Keychain reference.
- Add mock Keychain/reference service and audit trail entries.
- Show account settings and switch-plan preview in UI.
- Add tests for secret reference handling without storing secret values.

## Implementation-Design Phase 5: Usage And Cost

- Add usage model with official, local-log, estimated, and missing confidence.
- Implement local aggregation fixtures for tokens, cost, duration, drift, and burn rate.
- Show source confidence labels in Usage and menu panel.
- Add tests for confidence labeling and aggregation.
- Commit implementation-design Phases 4 and 5.

## Implementation-Design Phase 6: Registry And find-best-skill

- Add curated local registry fixtures.
- Implement `find-best-skill` scoring by task match, quality, community signal, personal feedback, and safety risk.
- Add optional GitHub discovery UI gate without automatic remote calls.
- Add tests for scoring and safety risk display.

## Implementation-Design Phase 7: Insights And Feed

- Add local-rule insight engine for token anomalies, repeated failures, profile drift, and update impact.
- Add feed model for official, community, registry, and profile impact alerts.
- Show profile-related high-priority feed items in menu panel and full feed in workbench.
- Add tests for local insight rules.

## Implementation-Design Phase 8: Wake Control

- Add wake session model for standard awake, timed awake, display sleep, and experimental lid-awake state.
- Use mock/system-safe implementation for controls that cannot be safely changed in this phase.
- Require explicit confirmation for experimental lid-awake state.
- Show wake state and quick actions in Operate and menu panel.
- Add tests for confirmation gates.
- Commit implementation-design Phases 6, 7, and 8.

## Safety Boundaries

- Ensure fixture mode is default and visible.
- Ensure real writes are blocked in command surface.
- Ensure no secrets are hardcoded.
- Ensure Keychain is interface/mock only.
- Ensure destructive operations require future dry-run, manifest, and backup.
- Add tests for blocked real write behavior and secret detection.
- Commit safety audit if changes are needed after the implementation-design phase commits.

## Verification and Delivery

- Run `pnpm lint`.
- Run `pnpm typecheck`.
- Run `pnpm test`.
- Run `cargo test --manifest-path src-tauri/Cargo.toml`.
- Run `pnpm tauri build`.
- Start the app with `pnpm tauri dev` or a project run script and verify launch state.
- Summarize environment, installed dependencies, launch command, test command, build command, implemented features, mock features, and next recommendations.
- Commit final delivery updates if files changed.

## Known Verification Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri build
pnpm tauri dev
```

## Guardrails

- Do not run `git push`.
- Do not install system dependencies with sudo, brew, or shell profile edits.
- Do not write real Claude/Codex configuration.
- Do not upload prompts, source code, secrets, or local config.
