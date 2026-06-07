# Backend Quality Guidelines

## Required Tests

Rust unit tests should cover:

- successful sample profile parsing
- validation failure for missing required fields
- secret scanner hits for common key/token patterns
- fixture adapter target discovery/state
- deploy plan generation for Codex and Claude Code fixtures
- blocked deploy plans preventing confirmation
- manifest write and latest-manifest lookup

## Safety Constraints

- Phase 1 must not read or write real Claude Code or Codex config directories.
- No shell hooks, remote LLM calls, or background log collection in Phase 1.
- No hardcoded credentials or tokens.
- Real write APIs may exist as types or disabled UI concepts, but not as callable commands.

## Code Style

- Prefer small pure functions in `domain/` and thin side-effect wrappers in `services/`.
- Keep Tauri commands typed and narrow.
- Use `serde` for IPC/domain serialization.
- Use deterministic fixture data for tests.

## Verification

Run the narrowest meaningful Rust command while developing and full project verification before committing:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
pnpm lint
pnpm typecheck
pnpm test
pnpm tauri build
```
