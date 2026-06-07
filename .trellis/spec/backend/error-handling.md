# Error Handling

Rust errors must be structured and safe to return through Tauri IPC.

## Error Model

Use an `AppError` enum with stable codes for expected failures:

- `ValidationError`
- `SecretDetected`
- `TargetUnavailable`
- `PlanBlocked`
- `StorageError`
- `IpcError`

IPC responses should expose:

- stable `code`
- concise localized-message key or safe English fallback
- affected object id or path when useful
- remediation hint when the user can act

## Safety Rules

- Do not return raw Rust error strings directly to the frontend.
- Do not include secrets, full prompts, full logs, or source content in error payloads.
- Secret scanner hits should identify the field or fixture path, not the secret value.
- Blocked or high-risk deploy plan operations must prevent dry-run confirmation.

## UI Contract

Frontend renders localized messages from stable error codes. Product-generated names and file paths remain untranslated.
