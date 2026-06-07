# Directory Structure

Backend code lives under `src-tauri/src/` and follows the implementation design.

## Directory Layout

```text
src-tauri/
  Cargo.toml
  tauri.conf.json
  src/
    main.rs
    lib.rs
    commands/
      mod.rs
      app_commands.rs
      profile_commands.rs
      target_commands.rs
      deploy_commands.rs
    domain/
      mod.rs
      adapter.rs
      deploy_plan.rs
      errors.rs
      manifest.rs
      profile.rs
      usage.rs
    services/
      mod.rs
      app_paths.rs
      adapter_service.rs
      privacy_service.rs
      profile_service.rs
      storage_service.rs
      sync_service.rs
    fixtures/
      profiles/
      targets/
```

## Module Organization

- `domain/` contains serializable data structures and pure business rules. It should avoid direct filesystem, Tauri, network, and UI dependencies.
- `services/` owns side effects: app data directories, manifest files, fixture loading, future SQLite, and future Keychain wrappers.
- `commands/` is the Tauri IPC boundary. Commands validate typed payloads, call services, and return IPC-safe results.
- `fixtures/` contains sample profiles and target snapshots used for Phase 1 dry-runs.

## Naming Conventions

- Rust modules use `snake_case`.
- Public domain types use clear product names such as `HarnessProfile`, `DeployPlan`, `DeploymentManifest`, `TargetKind`, and `GuardPolicy`.
- Keep product-specific English identifiers in code. Chinese appears in localized frontend copy, not Rust identifiers.

## Boundaries

- Frontend code must not write user agent config files.
- Rust commands must not expose real write operations in Phase 1.
- Fixture adapters must not read real Claude Code or Codex directories.
