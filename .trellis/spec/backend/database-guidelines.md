# Database Guidelines

HarnessDeck is local-first. Persistent state belongs under the app data directory.

## App Data Layout

```text
~/Library/Application Support/HarnessDeck/
  manifests/               # dry-run deployment manifests (JSON)
  backups/                 # future backup snapshots
  registry-cache/          # future curated registry cache
  feed-cache/              # future feed cache
```

Path resolution uses `app_paths::paths_for_app()`:

```rust
// src-tauri/src/services/app_paths.rs
pub fn paths_for_app<R: Runtime>(app: &AppHandle<R>) -> Result<AppPaths, CommandError> {
    let base = app.path().app_data_dir().map_err(CommandError::from)?;
    Ok(AppPaths {
        base: base.clone(),
        manifests: base.join("manifests"),
        backups: base.join("backups"),
    })
}
```

## Current Persistence

- Dry-run manifests are JSON files written to `manifests/` by `storage_service::write_dry_run_manifest`.
- Profile fixtures are hardcoded in `profile_service.rs`, not loaded from disk.
- No SQLite or Keychain in the current phase.

## Future SQLite Rules

- Store indexes, state, usage aggregation, feed cache, insights, and audit trail in SQLite.
- Store full deployment manifests as files; only indexable metadata goes in SQLite.
- Never store API keys, provider tokens, prompts, source code, or complete logs.
- Migrations must be deterministic and covered by tests.

## Backup Rules

- Any future real write path must create a backup before writing.
- A deployment manifest must include backup metadata before the write is complete.
- Current phase exposes backup design and disabled UI state only.
