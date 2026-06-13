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
