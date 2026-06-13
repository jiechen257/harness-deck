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

## 错误码

| Code | 工厂方法 | 使用场景 |
|------|----------|----------|
| `AuthorizationRequired` | `CommandError::authorization_required(msg)` | 未经显式授权的 registry、local read、external signals、projection 写入或 script execution |
| `ValidationError` | `CommandError::validation(msg)` | 未知 signal/practice/asset/projection/target ID、缺失字段、非法状态转换 |
| `PlanBlocked` | `CommandError::plan_blocked(msg)` | projection plan 有阻塞风险、目标不支持、缺少预览或未满足确认条件 |
| `StorageError` | `CommandError::storage(msg)` | SQLite、文件系统、Tauri、JSON/TOML 错误 |
| `SubprocessError` | `CommandError::subprocess(msg)` | 运维脚本或本地命令执行失败 |
| `TimeoutError` | `CommandError::timeout(msg)` | 本地命令或读取操作超时 |

## 示例：返回错误的 command

```rust
#[tauri::command]
pub fn confirm_projection(
    database: tauri::State<std::sync::Mutex<Database>>,
    plan_id: String,
) -> Result<ProjectionExecutionResult, CommandError> {
    let db = database.lock().map_err(|_| CommandError::storage("database lock poisoned"))?;
    if !db.has_authorization("write_projection")? {
        return Err(CommandError::authorization_required("write_projection authorization is required"));
    }
    projection_service::confirm_projection(&db, &plan_id)
}
```

## 自动转换

`std::io::Error`、`tauri::Error`、`rusqlite::Error`、`serde_json::Error` 和 `toml::de::Error` 通过 `From` impl 转换为 `CommandError::storage`。

## 安全规则

- 不要将原始 Rust 错误字符串直接返回前端，始终使用带稳定 code 的 `CommandError`。
- 错误负载中不得包含秘密、完整 prompt、完整日志或源代码内容。
- 秘密扫描命中时标识字段路径，不包含秘密值本身。
- 被阻止或高风险的 projection plan 必须在 command/service 层阻止确认。

## UI 契约

前端根据 `CommandError.code` 渲染本地化消息。产品生成的名称和文件路径保持不翻译。
