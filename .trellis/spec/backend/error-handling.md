# Error Handling

Rust errors use a `CommandError` struct that is safe to return through Tauri IPC as serialized JSON.

## Error Model

`CommandError` is defined in `src-tauri/src/domain/errors.rs` as a flat struct with a static `code` and a dynamic `message`:

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: &'static str,
    pub message: String,
}
```

### Error Codes

| Code | Factory method | When to use |
|------|---------------|-------------|
| `AuthorizationRequired` | `CommandError::authorization_required(msg)` | Target discovery without explicit read authorization |
| `ValidationError` | `CommandError::validation(msg)` | Unknown profile ID, missing fields, secret scan hit |
| `PlanBlocked` | `CommandError::plan_blocked(msg)` | Non-dry-run deploy or high/blocked risk plan |
| `StorageError` | `CommandError::storage(msg)` | Filesystem or Tauri errors |

### Example: Command returning errors

```rust
// src-tauri/src/commands/deploy_commands.rs
#[tauri::command]
pub fn generate_deploy_plan(
    profile_id: String,
    target_kind: TargetKind,
) -> Result<DeployPlan, CommandError> {
    let profile = get_fixture_profile(&profile_id)
        .ok_or_else(|| CommandError::validation(format!("unknown profile id: {profile_id}")))?;
    let findings = scan_profile_for_secrets(&profile);
    if !findings.is_empty() {
        return Err(CommandError::validation(format!(
            "secret-like value detected at {}",
            findings[0].field
        )));
    }
    plan_deploy(&profile, target_kind)
}
```

### Automatic conversions

`std::io::Error` and `tauri::Error` convert to `CommandError::storage` via `From` impls:

```rust
impl From<std::io::Error> for CommandError {
    fn from(error: std::io::Error) -> Self {
        Self::storage(error.to_string())
    }
}
```

## Safety Rules

- Do not return raw Rust error strings directly to the frontend — always use `CommandError` with a stable code.
- Do not include secrets, full prompts, full logs, or source content in error payloads.
- Secret scanner hits identify the field path, never the secret value.
- Blocked or high-risk plans must prevent dry-run confirmation at the command level.

## UI Contract

Frontend renders localized messages keyed by `CommandError.code`. Product-generated names and file paths remain untranslated.
