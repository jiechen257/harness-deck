# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 项目简介

Hone 是一个基于 Tauri 2 + React + TypeScript + Rust 构建的 macOS 菜单栏应用和工作台，帮助个人开发者发现、应用并持续优化 AI coding 范式。核心链路：Discover → Apply → Observe → Optimize。

产品采用 **BYOA (Bring Your Own Agent)** 模式——通过调用用户本地已安装的 Claude Code / Codex CLI 执行推理任务（语义过滤、优化建议生成），不直连 API，不绑定特定 provider。

当前处于 **混合模式**：真实数据读取已实现（Usage/Insights 从本机 `~/.claude/` 和 `~/.codex/` 读取），爬取和安装功能需要网络和 Tauri 运行时。浏览器开发模式（`pnpm dev`）仍有 fixture fallback。

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

两者都渲染 `src/App.tsx`。menubar 窗口加载 `index.html?panel=1`；`App` 检查 `URLSearchParams` 中的 `panel=1`，渲染 `MenuBarPanel` 而非完整工作台。所有 UI 都在同一个 React 组件树中。

托盘图标设置和面板定位逻辑在 `src-tauri/src/tray.rs` 和 `src-tauri/src/window.rs`。左键点击托盘图标打开 menubar 面板；面板失焦时自动隐藏。

### 前端 (src/)

按职责分层组织：

- `App.tsx` — 应用 Shell：窗口判断（panel/workbench）、5 视图路由（`useState<ViewId>`，无路由库）、全局键盘快捷键、locale/theme 提供
- `components/menubar/` — MenuBar 弹出面板：`MenuBarPanel.tsx`（每日一瞥：热点 + 待处理建议数 + 成本 + 快捷操作）
- `components/views/` — 5 个业务视图：
  - `HomeView.tsx` — 仪表盘，4 张导航卡片
  - `DiscoverView.tsx` — 信息聚合器（多平台爬取 + agent 精排 + 一键安装），自足化组件
  - `UsageView.tsx` — 真实用量统计，自足化组件（调用 `getRealUsageSummary()`）
  - `InsightsView.tsx` — 洞察 + AI 建议生成 + 确认写回闭环，自足化组件
  - `SettingsView.tsx` — 内部 5-tab（General / Installed / Sync / Guard / Wake），吸收原有 Profile/Sync/Guard/Operate 视图内容
- `components/shared/` — 跨视图复用的 UI 片段（`MacChrome.tsx`、`HarnessLogo.tsx`）
- `hooks/` — 自定义 hook：`useLocale.ts`、`useTheme.ts`
- `constants/` — 静态配置：`copy.ts`（中英文文案）、`navigation.ts`（5 个导航项）、`types.ts`（`ViewId` 类型）
- `lib/types.ts` — 共享 TypeScript 类型，镜像 Rust domain 结构体（camelCase serde）
- `lib/api.ts` — Tauri 命令封装。每个函数在 Tauri 环境中调用 `invoke()`，在浏览器中回退到 fixture 数据
- `styles/app.css` — 单一 CSS 文件，使用 `[data-theme="dark"]` 选择器实现主题切换

语言为 `zh-CN`（默认）或 `en-US`，存储在 `localStorage`。主题为 `light`（默认）或 `dark`。

### 后端 (src-tauri/src/)

四层 Rust 架构 + tray/窗口分离：

- **`commands/`** — `#[tauri::command]` 处理器，在 `lib.rs` 中通过 `generate_handler![]` 注册。薄封装层，调用 service 并返回序列化结果。包含 sync 和 async 两种命令。
- **`services/`** — 业务逻辑：
  - `byoa_service` — BYOA 管道：检测本地 agent CLI（`which claude/codex`）、子进程调用（带超时和 JSON 解析）
  - `crawl_service` — 多平台爬取（GitHub/HN/Reddit/linux.do）、关键词过滤、agent 精排、策展加载
  - `install_service` — 一键安装（创建 skill 目录 + SKILL.md）
  - `target_adapter` — Target adapter trait + ClaudeCode/Codex 实现，可扩展
  - `usage_service` — 真实用量数据读取（stats-cache + SQLite）
  - `insight_service` — 真实洞察生成（token anomaly / session activity / model concentration）
  - `account_service`、`profile_service`、`registry_service`、`sync_governance_service` 等
- **`readers/`** — 外部数据读取器：`claude_reader`（`~/.claude/`）、`codex_reader`（`~/.codex/`）、`skill_scanner`、`sanitizer`
- **`domain/`** — 数据结构体，带 `Serialize`/`Deserialize`。全部使用 `#[serde(rename_all = "camelCase")]`。
- **`tray.rs`** — 系统托盘图标构建、菜单项定义、tray 事件处理。
- **`window.rs`** — 窗口管理函数。
- **`lib.rs`** — 模块声明、`run()` 函数和 `invoke_handler` 注册。

添加新 Tauri 命令的流程：定义 domain 结构体 → 添加 service 函数 → 创建 command 处理器 → 在 `lib.rs` 的 `generate_handler![]` 列表中注册 → 在 `types.ts` 中添加 TypeScript 类型 → 在 `api.ts` 中添加 `invoke` 封装。

### 测试结构

- **React**：`src/App.test.tsx` 做集成测试（13 个测试），覆盖 5 视图导航、快捷键、MenuBar、Settings tabs、品牌。使用 `@testing-library/react` + `vitest` + `jsdom`。
- **Rust**：`src-tauri/src/tests/` + `byoa_tests.rs` + `target_adapter_tests.rs`，共 37 个测试。用 `cargo test` 运行。

## 关键约定

- UI 必须同时支持 zh-CN 和 en-US；zh-CN 为默认语言。UI 文案在视图内部 inline 处理（`locale === "zh-CN" ? "..." : "..."`）。
- `@typescript-eslint/no-explicit-any` 设为 `error`。
- 原生体验：系统字体、非交互元素使用默认光标、禁止 WebKit 右键菜单（可编辑字段除外）、macOS 键盘快捷键（⌘1-5 导航、⌘, 打开设置、Escape 回到首页）。
- 所有破坏性操作需遵循 dry-run → manifest → backup → confirmation 流程。
- Target 支持通过 adapter pattern 扩展。当前支持 Claude Code 和 Codex，未来可添加 Cursor/Windsurf/Copilot。
