# 后端开发规范

Hone 后端是 Tauri 2 桌面应用的 Rust 侧，负责本地 SQLite、registry-backed local asset、Claude Code / Codex projection、signal intake、local review、ops script 边界、authorization 和 audit trail。

## 规范索引

| 规范 | 说明 | 状态 |
|------|------|------|
| [目录结构](./directory-structure.md) | Rust 分层、SQLite repository、command/service 边界 | 已填写 |
| [数据库规范](./database-guidelines.md) | 应用数据路径、SQLite、registry、projection 写入规则 | 已填写 |
| [错误处理](./error-handling.md) | `CommandError` 结构体、错误码、工厂方法 | 已填写 |
| [质量规范](./quality-guidelines.md) | 按领域组织测试、serde 约定、验证命令 | 已填写 |
| [日志规范](./logging-guidelines.md) | `tauri-plugin-log` 配置、审计模型、隐私边界 | 已填写 |

## 开发前检查清单

开始后端工作前阅读：

- `CLAUDE.md` — 项目概述、命令、架构、关键约定
- `.trellis/spec/backend/directory-structure.md` — 文件位置和分层模式
- `.trellis/spec/backend/error-handling.md` — `CommandError` 使用方式
- `.trellis/spec/backend/quality-guidelines.md` — 测试组织和 serde 约定

涉及持久化、projection 写入、授权或审计时还需阅读：

- `.trellis/spec/backend/database-guidelines.md`
- `.trellis/spec/backend/logging-guidelines.md`

## 项目规则

- 所有 domain 结构体使用 `#[serde(rename_all = "camelCase")]` 以匹配 TypeScript 类型。
- 对 agent 配置和 registry 的关键写入必须由 Rust 侧控制，前端不可直接写入。
- 当前已使用 SQLite 存储信号、实践、本地资产、projection、授权、registry 和 audit。
- projection confirm / adopt / rollback 会真实触碰文件系统，必须先检查 `write_projection` 授权并写入 audit。
- `usage_service`、`insight_service`、`byoa_service` 可以作为服务能力存在；未注册到 `generate_handler![]` 的能力不能写成当前 UI/API 闭环。
