# Design

## Product Source

This Trellis task defines the active implementation target. The implementation should use these runtime concepts:

- `SignalCard`: discovered external or curated signal.
- `PracticeCard`: normalized reusable practice.
- `LocalAsset`: registry-backed skill, rule, hook, MCP fragment, or profile fragment.
- `Projection`: confirmed install/symlink/copy into Claude Code or Codex targets.
- `Usage` and `Insight`: local observation and optimization signals.

## Documentation Cleanup

Rewrite current project-facing docs so they agree on:

- name: Hone;
- loop: Discover -> Apply -> Observe -> Optimize;
- view structure: Home, Discover, Usage, Insights, Settings;
- current status: local-first app with SQLite, registry, BYOA service code, and guarded projection writes;
- incomplete areas: real external scraping and full AI-generated optimization writeback are not complete unless implemented.

Stale product specs should be deleted or rewritten to the current model.

## Frontend

Rename or remap existing views instead of rewriting every component:

- `PracticeLibraryView` becomes the Discover surface.
- Projection plan remains a detail surface reachable from Discover and Settings, but the primary nav label should be `Discover`.
- `UsageView` becomes a first-class nav route.
- `InsightsView` becomes a first-class nav route.
- `SettingsView` keeps registry, authorization, and system configuration.
- Local scripting is removed from primary navigation for this task.

This keeps existing interaction code while aligning the product shell with README.

## Backend

Add missing command modules:

- usage command: `get_real_usage_summary`.
- insight command: `list_real_insights`.
- BYOA command: `detect_agents`.

Projection write commands must check authorization:

- `confirm_projection`: require `write_projection`.
- `adopt_asset`: require `write_projection`.
- `rollback_projection`: require `write_projection`.

Create a helper in the database/auth layer for checking a scope to keep command code simple.

## Registry Asset Materialization

`create_local_asset_from_practice` currently only writes a DB row. It should also create a minimal registry asset file/directory under the active registry when possible so the projection planner can see it.

If no writable active registry is available, the UI should steer the user to Settings. Browser fallback can still demonstrate the flow, but the Tauri path must materialize a registry asset when a writable registry is active.

## Verification

Use tests before production changes:

- frontend nav and route tests should fail before nav changes;
- Rust authorization tests should fail before projection guard changes;
- Rust asset materialization test should fail before registry write changes.

Manual UI verification can remain browser-level for route visibility. Real filesystem writes should be covered by temp-dir Rust tests.
