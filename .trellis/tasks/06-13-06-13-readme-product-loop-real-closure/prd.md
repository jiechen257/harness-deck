# Align docs and complete Hone product loop

## Goal

Use this Trellis task as the active product decision record and remove stale product logic from current project documentation. Then make the implemented Hone loop real enough to support the current direction:

```text
Discover -> Apply -> Observe -> Optimize
```

The target for this task is a working local-first loop, not a marketing-complete product.

## Requirements

- Documentation must use the Hone product model in this task:
  - product name: Hone;
  - loop: Discover -> Apply -> Observe -> Optimize;
  - workbench views: Home, Discover, Usage, Insights, Settings;
  - BYOA through local Claude Code / Codex CLI;
  - local registry plus explicit authorization boundaries.
- Remove stale docs that still claim the old product loop, a profile-first primary object, or already-complete fixture-only capabilities that no longer match the code.
- Frontend navigation must match the README view structure.
- Usage and Insights must be reachable from the main workbench and backed by registered Tauri commands.
- BYOA agent detection must be reachable from Settings or a relevant product surface.
- Apply/install actions must enforce `write_projection` authorization before real filesystem writes.
- Script execution must not be a primary workbench view for the current loop. Any local scripting capability should remain settings-level or deferred.
- The local loop must not depend on browser fallback state for the primary path. Tauri-backed data paths must support the transition from signal to practice to local asset to projection.
- Keep local-first privacy boundaries:
  - no backend service;
  - no default upload of prompts, source code, secrets, or complete logs;
  - no remote API dependency for core loop;
  - write actions require explicit permission and audit.

## Acceptance Criteria

- [x] `README.md`, `README.en.md`, `AGENTS.md`, `CLAUDE.md`, and active product/spec docs no longer conflict on product name, loop, and workbench view structure.
- [x] A repo-wide search for stale product claims is reviewed, and stale Markdown references are removed.
- [x] Main navigation exposes exactly the current workbench structure: Home, Discover, Usage, Insights, Settings.
- [x] `UsageView` and `InsightsView` are reachable in the running app.
- [x] Tauri commands exist and are registered for real usage summary, real insights, and BYOA agent detection.
- [x] Projection confirm/adopt/rollback enforce `write_projection` authorization on the Rust side.
- [x] Creating a local asset from a practice creates or materializes a registry asset that can be projected by the Apply path.
- [x] Tests cover the new navigation, command registration behavior through the UI where practical, and projection authorization enforcement.
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `cargo test --manifest-path src-tauri/Cargo.toml` pass.

## Notes

- This task is the current implementation decision record.
- Do not execute real projection writes during verification against user directories. Use tests with temp directories for write-path validation.
