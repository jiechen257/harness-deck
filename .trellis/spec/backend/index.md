# 后端开发规范

Hone 后端是 Tauri 2 桌面应用的 Rust 侧，负责 SQLite 状态、registry 文件资产、BYOA agent 调用、本地 usage/insight 读取、projection plan、授权后的 target 写入、rollback 和 audit。

## 规范索引

| 规范 | 说明 |
|------|------|
| [目录结构](./directory-structure.md) | domain/db/services/commands/readers 分层 |
| [数据库规范](./database-guidelines.md) | SQLite、registry、audit、secret 边界 |
| [错误处理](./error-handling.md) | `CommandError` 错误码和安全负载 |
| [质量规范](./quality-guidelines.md) | Rust 测试组织、serde 契约、验证命令 |
| [日志规范](./logging-guidelines.md) | debug log、audit、隐私边界 |

## 项目规则

- 所有 domain 结构体使用 `#[serde(rename_all = "camelCase")]`。
- 前端不可直接读写用户 agent 配置文件。
- 真实 target 写入只允许通过 Rust projection service。
- `confirm_projection`、`adopt_asset`、`rollback_projection` 必须检查 `write_projection` 授权。
- BYOA 调用只走本机 Claude Code / Codex CLI，不直连 API。
- Prompt、源代码、完整日志和 secrets 不进入 telemetry 或普通日志。
