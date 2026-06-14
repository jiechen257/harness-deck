# Final product polish and release readiness

## Goal

Push the current Hone implementation from "MVP / internal beta candidate" to a release-readiness state with explicit evidence. The task should verify the product loop, UI/UX, safety boundaries, desktop shell behavior, and build/test health against the Practice Shard product design.

## Requirements

- Preserve the current 6-view Practice Shard workbench: Home, Practice Library, Apply & Sync, Local Review, Operations, Settings.
- Verify that the implementation still matches `docs/product-design/screens/workbench-home.html`, `docs/product-design/screens/statusbar-panel.html`, and `docs/product-design/README.md`.
- Ensure release-blocking UX gaps are fixed when they are narrow and local to the current implementation.
- Keep Operations in the current safe MVP boundary: preview, authorization check, confirm, audit, and no direct shell execution.
- Keep projection writes gated by `write_projection` and operations confirmation gated by `script_execution`.
- Confirm browser fallback data is visibly marked as fixture/fallback and does not masquerade as authoritative SQLite state.
- Produce current validation evidence for lint, typecheck, tests, Rust tests, build, and feasible desktop/browser visual checks.

## Acceptance Criteria

- [x] The workbench still exposes exactly the 6 current product views.
- [x] Operations preview-first and authorization-gated confirmation are functional in UI and tests.
- [x] Projection confirm/adopt/rollback authorization boundaries remain covered by tests.
- [x] Local Review and evidence surfaces do not contain misleading hardcoded release claims.
- [x] Main workbench and menubar panel can be visually inspected after the latest code changes.
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `cargo test --manifest-path src-tauri/Cargo.toml` pass.
- [x] `pnpm tauri:build` is attempted and the result is recorded.
- [x] Any docs/spec changes reflect stable product boundaries, not temporary placeholders.

## Definition of Done

- All blocking fixes are implemented and covered by the smallest meaningful tests.
- Validation commands are run from the repo root and summarized in the final answer.
- If a validation step cannot complete, the blocking reason is documented with the exact failing command.
- The Trellis task is archived after commit if the final readiness pass is complete.

## Out of Scope

- Turning Operations safe confirmation into real shell execution.
- Adding a new agent workflow, remote LLM integration, or provider account flow.
- Redesigning the Practice Shard visual direction.
- Shipping notarized macOS release artifacts.

## Technical Notes

- Current frontend authority: `src/App.tsx`, `src/components/views/*`, `src/components/menubar/MenuBarPanel.tsx`, `src/lib/api.ts`, `src/lib/types.ts`, `src/styles/app.css`.
- Current backend authority: `src-tauri/src/commands/*`, `src-tauri/src/services/*`, `src-tauri/src/db/*`, `src-tauri/src/domain/*`.
- Required specs read before work: `.trellis/spec/frontend/index.md`, `.trellis/spec/frontend/component-guidelines.md`, `.trellis/spec/frontend/quality-guidelines.md`, `.trellis/spec/frontend/state-management.md`, `.trellis/spec/backend/index.md`, `.trellis/spec/backend/quality-guidelines.md`, `.trellis/spec/backend/database-guidelines.md`.
- Validation evidence: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `cargo test --manifest-path src-tauri/Cargo.toml`, `pnpm tauri:build`, and Browser DOM checks for `/`, Operations, Local Review, and `/?panel=1` passed on 2026-06-14.
- Screenshot capture through the in-app browser timed out at the CDP screenshot command, so visual verification used DOM/visible text checks rather than saved screenshot artifacts.
