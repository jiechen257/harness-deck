# Implementation Plan

## 1. Current-State Audit

- [x] Confirm task context, branch, and working tree state.
- [x] Inspect current view routing and key product surfaces.
- [x] Search for placeholders, TODO markers, fixture disclosure issues, and misleading release claims.
- [x] Review Operations and Local Review surfaces for product-readiness gaps.

## 2. Fix Narrow Blockers

- [x] Fix any local UI/UX, copy, state, or test issue that blocks release-readiness.
- [x] Add or update focused tests for changed behavior.
- [x] Avoid broad refactors and avoid expanding Operations into real shell execution.

## 3. Validation

- [x] Run `pnpm lint`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm test`.
- [x] Run `cargo test --manifest-path src-tauri/Cargo.toml`.
- [x] Attempt `pnpm tauri:build`.
- [x] Run a feasible visual check for the main workbench and menubar panel.

## 4. Finish

- [x] Update specs only if this pass discovers a stable convention that should be reused.
- [ ] Commit the task changes.
- [ ] Archive the Trellis task and record the session journal.
