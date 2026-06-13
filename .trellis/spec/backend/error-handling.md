# 错误处理

Rust 错误使用 `CommandError` 结构体，可安全地通过 Tauri IPC 作为序列化 JSON 返回。

## 错误模型

`CommandError` 定义在 `src-tauri/src/domain/errors.rs`，是一个扁平结构体，包含静态 `code` 和动态 `message`：

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: &'static str,
    pub message: String,
}
```

### 错误码

| Code | 工厂方法 | 使用场景 |
|------|----------|----------|
| `AuthorizationRequired` | `CommandError::authorization_required(msg)` | 未经显式授权的目标发现 |
| `ValidationError` | `CommandError::validation(msg)` | 未知配置集 ID、缺失字段、秘密扫描命中 |
| `PlanBlocked` | `CommandError::plan_blocked(msg)` | 非 dry-run 部署或 high/blocked 风险计划 |
| `StorageError` | `CommandError::storage(msg)` | 文件系统或 Tauri 错误 |

### 示例：返回错误的 command

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

### 自动转换

`std::io::Error` 和 `tauri::Error` 通过 `From` impl 转换为 `CommandError::storage`：

```rust
impl From<std::io::Error> for CommandError {
    fn from(error: std::io::Error) -> Self {
        Self::storage(error.to_string())
    }
}
```

## 安全规则

- 不要将原始 Rust 错误字符串直接返回前端——始终使用带稳定 code 的 `CommandError`。
- 错误负载中不得包含秘密、完整 prompt、完整日志或源代码内容。
- 秘密扫描命中时标识字段路径，不包含秘密值本身。
- 被阻止或高风险的计划必须在 command 层阻止 dry-run 确认。

## UI 契约

前端根据 `CommandError.code` 渲染本地化消息。产品生成的名称和文件路径保持不翻译。
