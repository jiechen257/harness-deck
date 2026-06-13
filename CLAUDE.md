# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 项目简介

Hone 是一个基于 Tauri 2 + React + TypeScript + Rust 构建的 macOS 菜单栏应用和工作台，帮助个人开发者持续跟进、应用、评估并优化 AI coding 最佳实践。产品闭环：Discover → Apply → Observe → Optimize。当前实现闭环：Signals → Practices → Local Assets → Projection → Usage/Insights。

产品采用 **BYOA (Bring Your Own Agent)** 模式——通过调用用户本地已安装的 Claude Code / Codex CLI 执行推理任务（信号分析、实践标准化、优化建议），不直连 API，不绑定特定 provider。

数据持久化采用 **双层真相模型**：SQLite（`hone.db`）保存结构化索引、状态、关系和审计；registry repo 保存文件资产（skills、rules、hooks、MCP 片段）。Target 目录（`~/.claude/`、`~/.codex/`）只是投射结果。

## 命令

```bash
pnpm install                                    # 安装依赖
pnpm dev                                        # vite 开发服务器，localhost:1420
pnpm tauri:dev                                  # 完整 Tauri 桌面应用（Rust + React）
pnpm tauri:build                                # 生产构建
pnpm lint                                       # eslint，零警告要求
pnpm typecheck                                  # tsc --noEmit
pnpm test                                       # vitest run (jsdom)
pnpm test:watch                                 # vitest watch 模式
cargo test --manifest-path src-tauri/Cargo.toml # Rust 测试
```

## 架构

### 双窗口，单入口

Tauri 在 `src-tauri/tauri.conf.json` 中配置了两个窗口：
- **main**（1180×760）：完整工作台，导航栏 5 个视图
- **menubar**（356×640）：紧凑的弹出面板，锚定在系统托盘图标

两者都渲染 `src/App.tsx`。menubar 窗口加载 `index.html?panel=1`；`App` 检查 `URLSearchParams` 中的 `panel=1`，渲染 `MenuBarPanel` 而非完整工作台。

### 前端 (src/)

- `App.tsx` — 应用 Shell：窗口判断（panel/workbench）、5 视图路由、全局键盘快捷键、locale/theme
- `components/menubar/MenuBarPanel.tsx` — 菜单栏弹出面板：健康度、刷新状态、快捷操作
- `components/views/` — 5 个业务视图：
  - `HomeView.tsx` — 仪表盘，闭环健康度和下一步队列
  - `PracticeLibraryView.tsx` — Discover 主视图：信号、Practice Card、本地资产和投射入口
  - `UsageView.tsx` — 真实用量统计（`getRealUsageSummary()`）
  - `InsightsView.tsx` — 用量洞察 + 投射健康度 + 审计轨迹
  - `SettingsView.tsx` — 3-tab（通用 / 授权 / 审计）：registry 路径、5 项权限独立授权、审计事件
- `lib/types.ts` — TypeScript 类型，镜像 Rust domain（camelCase serde）
- `lib/api.ts` — Tauri 命令封装，浏览器模式回退空数据

### 后端 (src-tauri/src/)

#### 数据层 (db/)

SQLite 数据库（`hone.db`），10 张表 + 2 张扩展表：

- `signal_cards` — 信号：changelog、模型讯息、社区讨论，三层可信度（official/maintainer/community）
- `practice_cards` — 实践卡片：类型、场景、同类方案、状态
- `signal_practice_links` — 信号 ↔ 实践多对多关联
- `local_assets` — 本地资产：registry 路径、类型、checksum、system/user 标记
- `projections` — 投射状态：asset → target 的 symlink/copy 映射
- `operations_scripts` — 本地脚本注册表；不属于主导航闭环
- `audit_events` — 全局审计日志
- `registry_connections` — registry repo 路径和活跃状态
- `authorization_state` — 5 项权限分步授权
- `refresh_records` — 信号源刷新记录
- `system_skill_configs` — 内置 skill 启用/禁用
- `source_configs` — 7 个信号源（社区/changelog/模型）配置

每个表由对应 `db/*_repo.rs` 提供 CRUD。`Database` struct 通过 `Mutex` 注入 Tauri managed state。

#### 服务层 (services/)

- `skill_service` — 内置 System Practice Skill 的加载、解析、执行和追踪。3 个 SKILL.md 通过 `include_str!()` 嵌入二进制
- `projection_service` — registry → target 安全投射：plan preview、授权后 symlink/copy、conflict skip、adopt flow、rollback、health check
- `intake_service` — 信号源刷新管道：授权检查、fixture signal 生成、refresh 记录、audit
- `byoa_service` — BYOA 管道：检测本地 agent CLI、子进程调用
- `target_adapter` — Target adapter trait，ClaudeCode/Codex 实现
- `usage_service` — 真实用量数据读取
- `insight_service` — 真实洞察生成

#### 命令层 (commands/)

- `app_commands` — get_app_status、open_workbench
- `db_commands` — 授权 CRUD、registry 连接、信号列表、审计事件
- `skill_commands` — list/execute/toggle system skills
- `projection_commands` — preview/confirm/adopt/rollback/health；confirm/adopt/rollback 需要 `write_projection`
- `intake_commands` — refresh/list/toggle signal sources
- `usage_commands` — real local usage summary
- `insight_commands` — real local insights
- `byoa_commands` — local Claude Code / Codex detection and invocation

#### 内置 Skills (bundled-skills/)

3 个 SKILL.md 文件，首次启动写入 registry repo：
- `intake-source-research` — 信息源相关性评分
- `normalize-practice-card` — 信号转实践卡片
- `local-harness-review` — 本地资产结构评审

### 测试结构

- **React**：`src/App.test.tsx` 覆盖 5 视图导航、快捷键、MenuBar、Discover flow、Usage/Insights。
- **Rust**：`db_tests.rs`、`skill_tests.rs`、`projection_tests.rs`、`intake_tests.rs`、`loop_tests.rs` 覆盖 DB、skills、projection、intake 和产品闭环。

## 关键约定

- UI 同时支持 zh-CN 和 en-US；zh-CN 为默认语言。
- `@typescript-eslint/no-explicit-any` 设为 `error`。
- 原生体验：系统字体、macOS 键盘快捷键（⌘1-5 导航、⌘, 设置、Escape 首页）。
- 所有投射操作需遵循 preview → confirm → backup → audit 流程。
- Target 支持通过 adapter pattern 扩展。MVP 只支持 Claude Code 和 Codex。
- 5 项权限（registry / local_read / external_signals / write_projection / script_execution）分步授权，默认关闭。
