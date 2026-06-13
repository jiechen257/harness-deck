# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 项目简介

Hone 是一个基于 Tauri 2 + React + TypeScript + Rust 构建的 macOS 菜单栏应用和 Practice Shard 工作台。当前产品/UI 以 `docs/product-design/screens/workbench-home.html` 为准。

核心闭环：

```text
Signals -> Practices -> Local Assets -> Projection -> Review -> Improve
                                      |                         |
                                      +---- Operations / Audit --+
```

产品采用 **BYOA (Bring Your Own Agent)** 模式，通过调用用户本地已安装的 Claude Code / Codex CLI 执行推理任务（信号分析、实践标准化、本地评审），不直连 API，不绑定特定 provider。

数据持久化采用双层真相模型：SQLite（`hone.db`）保存结构化索引、状态、关系和审计；registry repo 保存文件资产（skills、rules、hooks、MCP 片段）。Target 目录（`~/.claude/`、`~/.codex/`）只是投射结果。

## 命令

```bash
pnpm install
pnpm dev
pnpm tauri:dev
pnpm tauri:build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:watch
cargo test --manifest-path src-tauri/Cargo.toml
```

## 架构

### 双窗口，单入口

Tauri 在 `src-tauri/tauri.conf.json` 中配置两个窗口：

- **main**（1180×760）：完整 Practice Shard 工作台
- **menubar**（356×640）：系统菜单栏弹出面板

两者都渲染 `src/App.tsx`。menubar 窗口加载 `index.html?panel=1`，`App` 根据 URL 参数渲染 `MenuBarPanel`。

### 前端

- `src/App.tsx`：Shell、窗口判断、6 视图路由、快捷键、locale/theme。
- `src/constants/navigation.ts`：当前主导航，必须保持 6 视图。
- `src/components/menubar/MenuBarPanel.tsx`：菜单栏面板。
- `src/components/views/HomeView.tsx`：首页闭环总览。
- `src/components/views/PracticeLibraryView.tsx`：实践库，signals -> practices -> local assets。
- `src/components/views/ApplySyncView.tsx`：应用与同步，projection plan、conflict/adopt、rollback、audit。
- `src/components/views/LocalReviewView.tsx`：本地评审，health finding、evidence、drift timeline。
- `src/components/views/OperationsView.tsx`：运维，脚本预览与确认。
- `src/components/views/SettingsView.tsx`：registry、authorization、audit、appearance。
- `src/lib/api.ts`：唯一 Tauri invoke 封装，浏览器模式提供 fallback。
- `src/lib/types.ts`：TypeScript domain mirror。

### 后端

#### 数据层

SQLite 数据库（`hone.db`）包含：

- `signal_cards`
- `practice_cards`
- `signal_practice_links`
- `local_assets`
- `projections`
- `operations_scripts`
- `audit_events`
- `registry_connections`
- `authorization_state`
- `refresh_records`
- `system_skill_configs`
- `source_configs`

#### 服务层

- `skill_service`：内置 System Practice Skill 加载、解析、执行和追踪。
- `projection_service`：registry -> target 安全投射，包含 preview、symlink/copy、conflict skip、adopt、rollback、health。
- `intake_service`：信号源刷新管道，包含授权检查、signal 生成、refresh 记录和 audit。
- `byoa_service`：检测本地 agent CLI、子进程调用。
- `usage_service`：本地用量数据读取能力；当前不是主导航。
- `insight_service`：本地洞察生成能力；当前不替代本地评审。

#### 命令层

- `app_commands`
- `db_commands`
- `loop_commands`
- `skill_commands`
- `projection_commands`
- `intake_commands`

命令注册以 `src-tauri/src/lib.rs` 的 `generate_handler![]` 为准。

## 关键约定

- UI 同时支持 zh-CN 和 en-US；zh-CN 为默认语言。
- 主视图是 `home`、`library`、`apply`、`review`、`operations`、`settings`。
- `UsageView` / `InsightsView` 文件可以存在，但不是当前 Practice Shard 主导航准绳。
- 原生体验：系统字体、macOS 键盘快捷键（⌘1-6 导航、⌘, 设置、Escape 首页）。
- 所有投射操作遵循 preview -> confirm -> audit；写入能力由 Rust 服务控制。
- 5 项权限：registry / local_read / external_signals / write_projection / script_execution。
