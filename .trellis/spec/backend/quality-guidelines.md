# 后端质量规范

## 测试组织

测试按领域组织在 `src-tauri/src/` 下，每个文件对应一个领域区域：

| 文件 | 覆盖领域 |
|------|----------|
| `db_tests.rs` | schema、seed、repository 写读 |
| `intake_tests.rs` | source config、refresh、signal normalization |
| `loop_tests.rs` | Practice Card、local asset、loop summary |
| `projection_tests.rs` | adapter capability、preview、confirm、adopt、rollback、health |
| `skill_tests.rs` | skill scanner、system skill 执行边界 |

### 测试命名

测试函数名应描述被验证的行为，使用 `snake_case`：

```rust
#[test]
fn normalize_signal_creates_practice_draft() { /* ... */ }

#[test]
fn projection_confirm_requires_write_authorization() { /* ... */ }

#[test]
fn rollback_records_audit_event() { /* ... */ }
```

### 模块注册

在 `lib.rs` 中注册测试模块：

```rust
#[cfg(test)]
mod db_tests;
#[cfg(test)]
mod intake_tests;
#[cfg(test)]
mod loop_tests;
#[cfg(test)]
mod projection_tests;
#[cfg(test)]
mod skill_tests;
```

## 安全约束

- 真实 projection 写入必须经过 preview、authorization、confirm、audit。
- ops script 执行必须经过 preview 和 `script_execution` 授权。
- 默认不执行 shell hook、远程 LLM 调用或后台日志收集。
- 不硬编码凭据或 token。

## Scenario: Projection and Operations Authorization Boundaries

### 1. Scope / Trigger

- Trigger: Any command or frontend API that can write Claude/Codex target paths, adopt unmanaged files, rollback projections, or confirm local operations scripts.
- Scope: Rust command boundary, typed frontend API wrappers, browser fallback behavior, and tests.

### 2. Signatures

- `confirm_projection(registry_path: String, target_path: String, target_kind: String) -> Result<ProjectionExecutionResult, CommandError>`
- `adopt_asset(target_path: String, registry_path: String, registry_dest: String, asset_type: String, backup_path: String, target_kind: String) -> Result<AdoptResult, CommandError>`
- `rollback_projection(projection_id: String) -> Result<(), CommandError>`
- `list_ops_scripts() -> Result<Vec<OpsScript>, CommandError>`
- `preview_ops_script(script_id: String) -> Result<OpsScriptPreview, CommandError>`
- `confirm_ops_script(script_id: String) -> Result<OpsScriptExecutionResult, CommandError>`
- Frontend mirrors these through `src/lib/api.ts` with exact camelCase types in `src/lib/types.ts`.

### 3. Contracts

- Projection preview and diff commands remain read-only and do not require `write_projection`.
- Projection confirm, adopt, and rollback must call `db.require_authorization("write_projection")` before any filesystem write.
- Operations preview is read-only and returns steps, required authorization scope, and `willExecute`.
- Operations confirm must call `db.require_authorization("script_execution")` and write an audit event.
- Current Operations MVP records authorized confirmation but keeps direct shell execution disabled: `willExecute: false`, `status: "confirmed_safe_mvp"`.

### 4. Validation & Error Matrix

- Missing `write_projection` on confirm/adopt/rollback -> `CommandError::authorization_required`.
- Missing `script_execution` on `confirm_ops_script` -> `CommandError::authorization_required`.
- Unknown ops script id -> storage/not-found error from repository until a typed not-found repository helper exists.
- Projection rollback against a non-symlink target -> `CommandError::validation`.

### 5. Good/Base/Bad Cases

- Good: User previews a projection plan, grants `write_projection`, confirms, and receives audit-backed execution result.
- Base: User previews an ops script without granting anything; UI shows safe plan and keeps confirm gated.
- Bad: A command performs `fs::remove_file`, symlink creation, copy, or ops confirmation before checking authorization.

### 6. Tests Required

- Backend: `projection_write_command_boundary_requires_authorization` asserts `write_projection` gate failure and success.
- Backend: `confirm_script_requires_script_execution_authorization` asserts ops confirmation is blocked without scope.
- Backend: `confirm_script_records_audit_when_authorized` asserts `ops_script_confirmed` audit is written.
- Frontend: browser fixture tests must grant write/script authorization before expecting projection or operations confirmation success.

### 7. Wrong vs Correct

#### Wrong

```rust
let executed_projection_ids =
    projection_service::execute_projection(&db, registry_path.as_path(), &plan)?;
```

#### Correct

```rust
db.require_authorization("write_projection")?;
let executed_projection_ids =
    projection_service::execute_projection(&db, registry_path.as_path(), &plan)?;
```

## 代码风格

- `domain/` 中使用纯函数，`services/` 中使用薄副作用封装，`commands/` 中使用 typed 窄处理器。
- 所有 domain 结构体使用 `#[serde(rename_all = "camelCase")]` 以匹配 TypeScript 类型。
- 使用小型纯函数承载可测试业务规则；文件系统和 SQLite 副作用放在 services/db 层。
- 使用 `From` impl 做类型转换时保持语义清楚，不隐藏失败路径。

### 示例：带 serde 的 domain 结构体

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectionTarget {
    pub id: String,
    pub name: String,
    pub target_kind: String,
    pub root_path: String,
}
```

## 验证命令

```bash
cargo test --manifest-path src-tauri/Cargo.toml
pnpm lint
pnpm typecheck
pnpm test
```
