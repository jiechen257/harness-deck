# HarnessDeck implementation design

## Scope

Implement the runnable local app as one integrated Tauri project. The target is a functional local-first workbench that covers every implementation-design phase while preserving safe defaults.

## Architecture

```text
React UI
  -> src/lib/api.ts
  -> Tauri commands
  -> Rust services
  -> domain models + fixture adapters + local manifest files
```

## Frontend

- Use React + TypeScript + Vite.
- Keep navigation in app state for the first build.
- Keep fixed UI copy in typed locale dictionaries for `zh-CN` and `en-US`.
- Store locale and theme preferences in localStorage from the frontend; expose matching Rust commands later as needed.
- Use CSS variables for light and dark tokens.
- Use a compact developer-workbench layout with a left navigation rail, top actions, menu bar panel surface, and main content area.
- Include Beidou visuals as subtle node graphs and star-line accents.

## Backend

- Use Tauri 2 commands as the IPC boundary.
- `domain/` owns serializable profile, target, deploy plan, manifest, usage, and guard types.
- `services/` owns app path creation, fixture profile loading, fixture target state, secret scanning, deploy plan generation, and manifest writing.
- Phase 1 storage writes only to HarnessDeck app data paths under `~/Library/Application Support/HarnessDeck/`.
- No command may read or write real Claude Code or Codex config directories in this task.
- Commands that inspect real local target directories must require an explicit local-read authorization flag and return safe summaries.
- Commands that write real target directories must require a backup id, previewed plan id, explicit confirmation token, manifest write, verification, and rollback metadata.

## Data Model

- `HarnessProfile`: id, name, description, rules, skills, MCP references, targets, sync policy, metadata.
- `TargetKind`: Codex, ClaudeCode.
- `DeployPlan`: id, profile id, target kind, operations, risk, dry-run flag.
- `DeploymentManifest`: id, created_at, profile id, target kind, dry_run, operation count, plan summary, backup policy.
- `UsageSummary`: cost, tokens, duration, drift, confidence.
- `GuardPolicy`: fixture mode, prompt upload, source upload, real writes, Keychain mode, backup mode.
- `AccountWorkspace`: provider, base URL, default model, budget, limits, and Keychain references.
- `RegistryTemplate`: curated practice template metadata, source, quality signals, and safety score.
- `Insight`: local-rule recommendation, affected profile, source confidence, severity.
- `FeedItem`: official/community/registry/profile impact update metadata.
- `WakeSession`: standard awake, timed awake, display sleep control, and experimental lid-awake state.

## Safety

- Fixture mode is enabled by default and visible.
- Dry-run is the only deploy action.
- Secret scanner blocks suspicious profile content.
- Real writes are represented as disabled policy state.
- Keychain is represented through a mock/reference interface only.
- Safe target read integration is opt-in and returns summaries instead of raw config dumps.
- Remote LLM and GitHub discovery actions are opt-in and use sanitized metadata only.

## Testing

- Rust unit tests validate pure model and service behavior.
- Frontend tests validate visible workflow and preference behavior.
- Build verification uses `pnpm tauri build` after tests pass.

## Implementation-Design Phase Coverage

- Phase 0 Project Foundation: runnable Tauri/React/Rust app, commands, paths, i18n, theme, menu bar and workbench entry.
- Phase 1 Local Core Loop: sample profile, fixture targets, deploy plan preview, dry-run manifest, menu/workbench status.
- Phase 2 Safe Target Integration: opt-in Claude Code and Codex discovery/read/validate; writes remain gated.
- Phase 3 Sync Governance: three-way diff model, conflict queue, drift detection, rollback preview, backup metadata.
- Phase 4 Account Workspace: account settings, budgets, provider/model defaults, Keychain reference interface, audit trail.
- Phase 5 Usage And Cost: official/local/estimated/missing confidence labels and local aggregation fixtures.
- Phase 6 Registry And find-best-skill: curated registry, local scoring, optional GitHub discovery gate.
- Phase 7 Insights And Feed: local-rule insights and profile-impact feed.
- Phase 8 Wake Control: standard/timed/display sleep controls and experimental lid-awake confirmation.

## Commit Strategy

- Commit 1: Trellis + Phase 0 environment/dependency foundation.
- Commit 2: Implementation-design Phase 0 app foundation and UI shell.
- Commit 3: Implementation-design Phase 1 local core loop.
- Commit 4: Implementation-design Phase 2 safe target integration and Phase 3 sync governance.
- Commit 5: Implementation-design Phase 4 account workspace and Phase 5 usage/cost.
- Commit 6: Implementation-design Phase 6 registry, Phase 7 insights/feed, and Phase 8 wake control.
- Commit 7: Safety audit, verification, and delivery documentation.

Commits are local only.

## Rollback

Because this task does not touch real user agent config, rollback is normal git revert of project files plus removal of HarnessDeck app data manifests if desired. Runtime dry-run manifests are local product data and are not user agent config.
