# Technical Design

## Boundary

This is a release-readiness pass over the existing Hone product implementation. It should not introduce a new product model. The implementation remains a Tauri 2 desktop app with a React workbench, SQLite-backed Rust services, and browser fallback fixtures for local web development.

## Product Contract

- The product loop is `Signal -> Practice -> Local Asset -> Projection -> Review -> Improve`, with Operations and Audit as safety and traceability layers.
- The main window uses the current Practice Shard command-deck shell and 6 main views.
- The menubar panel is an independent compact surface for health, local operations state, and shortcuts.
- Operations remains safe MVP: preview and authorized confirmation write audit evidence; direct script execution is not part of this task.

## Frontend Approach

- Audit view routing, visible labels, empty/error states, fixture disclosure, and authorization flows from the current React code.
- Fix only narrow release blockers: misleading text, blocked-action guidance, missing state labels, and broken interactions.
- Keep Tauri IPC calls behind `src/lib/api.ts` typed wrappers.
- Preserve zh-CN default and en-US support for visible copy that is touched.

## Backend Approach

- Re-check command boundaries for write-capable operations.
- Avoid schema changes unless a release blocker is found.
- Keep existing command/service/repository layering.
- Any added backend behavior must have Rust tests in the relevant domain test file.

## Verification Approach

- Static and unit validation: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `cargo test --manifest-path src-tauri/Cargo.toml`.
- Build validation: `pnpm tauri:build`.
- Visual validation: start the app in the most feasible local mode and inspect the main workbench plus `?panel=1` menubar surface after the latest changes.

## Rollback

- UI copy/state fixes can be reverted by file-level patch.
- Backend command changes must remain behind tests; if a fix destabilizes build or tests, revert the narrow change and document the blocker.
