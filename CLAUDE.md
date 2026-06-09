# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 项目简介

HarnessDeck 是一个基于 Tauri 2 + React + TypeScript + Rust 构建的 macOS 菜单栏应用和管理工作台。它管理"Harness 配置集"（规则、技能和 MCP 引用的捆绑包），并通过本地优先的工作流将其同步到 Claude Code 和 Codex 目标：发现 → 配置 → 同步 → 运营 → 改进。

当前处于 **fixture 模式**：所有数据均为 mock/fixture，不读写真实的 Claude Code 或 Codex 配置，不修改系统电源策略，不发起远程调用。Keychain 仅为界面展示。

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
- **main**（1180×760）：完整工作台，侧边栏导航 9 个视图
- **menubar**（356×640）：紧凑的弹出面板，锚定在系统托盘图标

两者都渲染 `src/App.tsx`。menubar 窗口加载 `index.html?panel=1`；`App` 检查 `URLSearchParams` 中的 `panel=1`，渲染 `MenuBarPanel` 而非完整工作台。所有 UI 都在同一个 React 组件树中。

托盘图标设置和面板定位逻辑在 `src-tauri/src/tray.rs` 和 `src-tauri/src/window.rs`。左键点击托盘图标打开 menubar 面板；面板失焦时自动隐藏。

### 前端 (src/)

按职责分层组织：

- `App.tsx` — 应用 Shell：窗口判断（panel/workbench）、全局键盘快捷键、locale/theme 提供
- `components/workbench/` — 主窗口布局：`Workbench.tsx`（侧边栏 + 内容区）、`Sidebar.tsx`（导航）
- `components/menubar/` — 菜单栏弹出面板：`MenuBarPanel.tsx`、`NativeStatusDashboard.tsx`
- `components/views/` — 9 个业务视图，每个视图一个文件
- `components/shared/` — 跨视图复用的 UI 片段（`MacChrome.tsx`、`ProductMark.tsx`）
- `hooks/` — 自定义 hook：`useLocale.ts`（locale + localStorage）、`useTheme.ts`（theme + localStorage）
- `constants/` — 静态配置：`copy.ts`（中英文文案）、`navigation.ts`（导航项、视图标签）、`types.ts`（前端独有类型）
- `lib/types.ts` — 共享 TypeScript 类型，镜像 Rust domain 结构体（camelCase serde）
- `lib/api.ts` — Tauri 命令封装。每个函数在 Tauri 环境中调用 `invoke()`，在浏览器中回退到 fixture 数据。双路径设计让 `pnpm dev` 无需 Rust 后端即可运行。
- `styles/app.css` — 单一 CSS 文件，使用 `[data-theme="dark"]` 选择器实现主题切换

语言为 `zh-CN`（默认）或 `en-US`，存储在 `localStorage`。主题为 `light`（默认）或 `dark`。两者都从工具栏切换。

### 后端 (src-tauri/src/)

三层 Rust 架构 + tray/窗口分离：

- **`commands/`** — `#[tauri::command]` 处理器，在 `lib.rs` 中通过 `generate_handler![]` 注册。薄封装层，调用 service 并返回序列化结果。
- **`services/`** — 业务逻辑。`profile_service`、`adapter_service`、`sync_governance_service`、`registry_service`、`usage_service`、`wake_service` 等。当前返回 fixture 数据。
- **`domain/`** — 数据结构体，带 `Serialize`/`Deserialize`。全部使用 `#[serde(rename_all = "camelCase")]` 以匹配 TypeScript 类型。
- **`tray.rs`** — 系统托盘图标构建、菜单项定义、tray 事件处理。
- **`window.rs`** — 窗口管理函数（`show_menu_panel`、workbench 显示）。
- **`lib.rs`** — 模块声明、`run()` 函数和 `invoke_handler` 注册。

添加新 Tauri 命令的流程：定义 domain 结构体 → 添加 service 函数 → 创建 command 处理器 → 在 `lib.rs` 的 `generate_handler![]` 列表中注册 → 在 `types.ts` 中添加 TypeScript 类型 → 在 `api.ts` 中添加 `invoke` 封装。

### 测试结构

- **React**：`src/App.test.tsx` 做集成测试，各视图/hook 可拆分独立测试文件。使用 `@testing-library/react` + `vitest` + `jsdom`，基于 fixture 数据运行。
- **Rust**：`src-tauri/src/tests/` 下按领域域组织（`profile_tests.rs`、`deploy_tests.rs`、`target_tests.rs` 等）。用 `cargo test` 运行。

## 关键约定

- UI 必须同时支持 zh-CN 和 en-US；zh-CN 为默认语言。所有 UI 文案在 `constants/copy.ts` 中。
- "配置集"是 Profiles 的中文术语。不要使用星宿名（天枢、瑶光等）作为功能名称。
- `@typescript-eslint/no-explicit-any` 设为 `error`。
- 原生体验：系统字体、非交互元素使用默认光标、禁止 WebKit 右键菜单（可编辑字段除外）、macOS 键盘快捷键（⌘1-9 导航、⌘, 打开设置、Escape 回到首页）。
- 所有破坏性操作需遵循 dry-run → manifest → backup → confirmation 流程。
