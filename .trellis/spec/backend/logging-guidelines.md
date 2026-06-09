# Logging Guidelines

HarnessDeck logging is local-first and privacy-preserving.

## Setup

Logging uses `tauri-plugin-log` in debug builds only:

```rust
// src-tauri/src/lib.rs
if cfg!(debug_assertions) {
    app.handle().plugin(
        tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
    )?;
}
```

No remote telemetry is configured.

## What To Log

- App startup and version
- App data path initialization (`app_paths::paths_for_app`)
- Fixture profile loading
- Fixture target loading
- Deploy plan generation
- Dry-run manifest creation
- Explicit privacy or real-write confirmation events in future phases

## What Not To Log

- Prompts
- Source code
- API keys, tokens, bearer strings, private keys
- Full user config files
- Full local logs imported from other tools

## Audit Trail

Audit trail events are product records, not debug logs. They are modeled as domain structs:

```rust
// src-tauri/src/domain/account_workspace.rs
pub struct AuditEntry {
    pub id: String,
    pub created_at: String,
    pub summary: String,
    pub severity: String,   // "info" | "warn" | "error"
}
```

Future real writes, account switches, rollback actions, privacy grants, and Keychain access must produce audit events with safe metadata — never raw secret values.
