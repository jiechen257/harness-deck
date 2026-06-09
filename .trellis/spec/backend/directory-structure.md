# Directory Structure

Backend code lives under `src-tauri/src/` in a three-layer Rust architecture.

## Directory Layout

```text
src-tauri/
  Cargo.toml
  tauri.conf.json
  src/
    main.rs                          # Tauri entry point
    lib.rs                           # Module roots, tray setup, invoke_handler registration
    commands/
      mod.rs
      app_commands.rs
      profile_commands.rs
      target_commands.rs
      deploy_commands.rs
      account_commands.rs
      registry_commands.rs
      insight_commands.rs
      usage_commands.rs
      wake_commands.rs
    domain/
      mod.rs
      app.rs
      adapter.rs                     # TargetKind enum
      deploy_plan.rs
      errors.rs                      # CommandError struct
      manifest.rs
      profile.rs                     # HarnessProfile, ProfileSummary, ValidationReport
      account_workspace.rs
      insights.rs
      registry.rs
      sync_governance.rs
      target_integration.rs
      usage.rs
      wake_control.rs
    services/
      mod.rs
      app_paths.rs
      adapter_service.rs
      privacy_service.rs
      profile_service.rs
      storage_service.rs
      sync_governance_service.rs
      target_integration_service.rs
      account_service.rs
      insight_service.rs
      registry_service.rs
      usage_service.rs
      wake_service.rs
    phase1_tests.rs                  # Phase-organized integration tests
    phase2_3_tests.rs
    phase4_5_tests.rs
    phase6_8_tests.rs
```

## Module Organization

- **`domain/`** — serializable data structures with `#[serde(rename_all = "camelCase")]` and pure business rules. No filesystem, Tauri, network, or UI dependencies.
- **`services/`** — side effects: app data directories, manifest files, fixture loading, future SQLite and Keychain wrappers. Each service file matches a domain area.
- **`commands/`** — Tauri IPC boundary. Commands validate payloads, call services, return `Result<T, CommandError>`. Thin wrappers only.

### Example: Adding a new Tauri command

```rust
// 1. domain/wake_control.rs — define the struct
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WakeSession {
    pub mode: WakeMode,
    pub active: bool,
    pub duration_minutes: Option<u32>,
    // ...
}

// 2. services/wake_service.rs — implement logic
pub fn get_fixture_wake_control() -> WakeControlSummary { /* ... */ }

// 3. commands/wake_commands.rs — thin command handler
#[tauri::command]
pub fn get_wake_control() -> WakeControlSummary {
    wake_service::get_fixture_wake_control()
}

// 4. lib.rs — register in generate_handler![]
.invoke_handler(tauri::generate_handler![
    commands::wake_commands::get_wake_control,
    commands::wake_commands::request_wake_mode_command,
])
```

Then add the matching TypeScript type in `src/lib/types.ts` and the `invoke` wrapper in `src/lib/api.ts`.

## Naming Conventions

- Rust modules use `snake_case`. Command files are named `{domain}_commands.rs`, services are `{domain}_service.rs`.
- Public domain types use product names: `HarnessProfile`, `DeployPlan`, `ManifestSummary`, `TargetKind`, `CommandError`, `SyncGovernance`.
- Keep product-specific English identifiers in code. Chinese appears in localized frontend copy, not Rust identifiers.

## Boundaries

- Frontend code must not write user agent config files.
- Rust commands must not expose real write operations (fixture mode).
- Fixture adapters must not read real Claude Code or Codex directories.
- Every new command must be registered in `lib.rs` `generate_handler![]`.
