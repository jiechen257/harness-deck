# 错误处理

Rust 错误使用 `CommandError`，可通过 Tauri IPC 序列化到前端。

## 错误码

| Code | 工厂方法 | 使用场景 |
|------|----------|----------|
| `AuthorizationRequired` | `CommandError::authorization_required(msg)` | 未授权读取、刷新、projection 写入、脚本执行 |
| `ValidationError` | `CommandError::validation(msg)` | 参数无效、目标不存在、拒绝危险操作 |
| `PlanBlocked` | `CommandError::plan_blocked(msg)` | plan 中存在冲突或阻断风险 |
| `StorageError` | `CommandError::storage(msg)` | SQLite、文件系统或 Tauri 错误 |
| `SubprocessError` | `CommandError::subprocess(msg)` | BYOA CLI 调用失败 |
| `TimeoutError` | `CommandError::timeout(msg)` | BYOA CLI 超时 |

## 安全规则

- 错误消息不得包含秘密、完整 prompt、源代码或完整日志。
- projection rollback 只能删除 Hone 管理的 symlink；普通文件必须拒绝。
- target 写入前必须先返回 plan 供 UI 展示。
- 前端根据 `code` 做本地化，路径和用户生成名称保持原文。
