# 后端开发规范

HarnessDeck 后端是 Tauri 2 桌面应用的 Rust 侧，负责本地文件系统访问、fixture target 适配器、deploy plan 生成、dry-run manifest 写入、应用数据路径、隐私检查，以及未来的 SQLite / Keychain 集成。

## 规范索引

| 规范 | 说明 | 状态 |
|------|------|------|
| [目录结构](./directory-structure.md) | 三层 Rust 架构、模块边界、tray/窗口分离 | 已填写 |
| [数据库规范](./database-guidelines.md) | 应用数据路径、manifest 持久化、SQLite 规则 | 已填写 |
| [错误处理](./error-handling.md) | `CommandError` 结构体、错误码、工厂方法 | 已填写 |
| [质量规范](./quality-guidelines.md) | 按领域组织测试、serde 约定、验证命令 | 已填写 |
| [日志规范](./logging-guidelines.md) | `tauri-plugin-log` 配置、审计模型、隐私边界 | 已填写 |

## 开发前检查清单

开始后端工作前阅读：

- `CLAUDE.md` — 项目概述、命令、架构、关键约定
- `.trellis/spec/backend/directory-structure.md` — 文件位置和三层模式
- `.trellis/spec/backend/error-handling.md` — `CommandError` 使用方式
- `.trellis/spec/backend/quality-guidelines.md` — 测试组织和 serde 约定

涉及持久化或密钥时还需阅读：

- `.trellis/spec/backend/database-guidelines.md`
- `.trellis/spec/backend/logging-guidelines.md`

## 项目规则

- 所有 domain 结构体使用 `#[serde(rename_all = "camelCase")]` 以匹配 TypeScript 类型。
- 对 agent 配置的关键写入必须由 Rust 侧控制，前端不可直接写入。
- 当前阶段使用 fixture target 和 dry-run manifest。
- 在备份、diff、验证、manifest 和回滚机制实现之前，不开放真实 Claude/Codex 配置写入。
