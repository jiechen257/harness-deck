# Backend Quality Guidelines

## Test Organization

Tests are organized by implementation phase in top-level test files:

| File | Coverage |
|------|----------|
| `phase1_tests.rs` | Profile parsing, validation, secret scan, deploy plan, manifest write |
| `phase2_3_tests.rs` | Target discovery authorization, sync governance |
| `phase4_5_tests.rs` | Account workspace, Keychain references, usage confidence |
| `phase6_8_tests.rs` | Registry scoring, insights, feed, wake control confirmation |

### Example: Phase 1 test pattern

```rust
// src-tauri/src/phase1_tests.rs
#[test]
fn fixture_profiles_parse_and_validate() {
    let profiles = list_fixture_profiles();
    assert!(profiles.len() >= 2);
    let report = validate_profile(&profiles[0]);
    assert!(report.valid);
}

#[test]
fn blocked_plan_cannot_be_confirmed() {
    let plan = DeployPlan {
        dry_run: true,
        risk: RiskLevel::High,
        // ...
    };
    // confirm_dry_run_deploy should reject high-risk plans
}
```

## Safety Constraints

- Fixture mode is the default — no reading or writing real Claude Code or Codex config directories.
- No shell hooks, remote LLM calls, or background log collection.
- No hardcoded credentials or tokens.
- Real write APIs exist as types and disabled UI concepts, not as callable commands.

## Code Style

- Pure functions in `domain/`, thin side-effect wrappers in `services/`, typed narrow handlers in `commands/`.
- All domain structs use `#[serde(rename_all = "camelCase")]` to match TypeScript types.
- Use `Default` impls for fixture defaults (see `SyncPolicy::default()`, `ProfileMetadata::default()`).
- Use `From` impls for type conversions (see `ProfileSummary::from(&HarnessProfile)`).

### Example: Domain struct with serde and Default

```rust
// src-tauri/src/domain/profile.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPolicy {
    pub rules: String,
    pub skills: String,
    pub mcp_references: String,
    pub real_writes_allowed: bool,
}

impl Default for SyncPolicy {
    fn default() -> Self {
        Self {
            rules: "append-scoped-block".to_string(),
            skills: "copy-reference".to_string(),
            mcp_references: "target-override".to_string(),
            real_writes_allowed: false,
        }
    }
}
```

## Verification

```bash
cargo test --manifest-path src-tauri/Cargo.toml   # Rust tests
pnpm lint                                          # ESLint
pnpm typecheck                                     # TypeScript
pnpm test                                          # Vitest
```
