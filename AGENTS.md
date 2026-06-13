# Hone Agent 工作规则

本文件约束自动化代理在 `harness-deck` 仓库中的工作方式。上层全局规则仍然生效，本文件只记录本项目的额外约定。

## 项目状态

- 当前仓库已经进入可运行实现阶段。
- 当前已有 Tauri 2 + React + TypeScript + Rust macOS 桌面应用、package 配置、测试和构建命令。
- 当前主窗口对齐 command deck 原型，包含顶部命令栏、品牌状态带、菜单栏面板和 macOS 窗口化工作台。
- 当前 Tauri 配置包含 `main` 管理窗口和 `menubar` 菜单栏面板窗口；`menubar` 通过 `index.html?panel=1` 渲染。
- 当前主导航为 5 个工作台视图：Home、Discover、Usage、Insights、Settings。
- 当前数据层使用 SQLite；registry repo 保存可投射资产；Claude Code / Codex target 目录保存投射结果。
- 当前 projection confirm / adopt / rollback 会真实触碰文件系统，必须先获得 `write_projection` 授权。
- 当前设计与实现来源：
  - `.trellis/tasks/06-13-06-13-readme-product-loop-real-closure/`
  - `README.md`
  - `docs/product-design/`（视觉参考）
  - `yetone/native-feel-skill`

## 默认语言

- 文档默认使用简体中文。
- 面向外部读者的 README 保持中文优先，并提供英文版本。
- 产品 UI 必须支持简体中文和英文，默认显示简体中文。
- 产品 UI 默认浅色主题，必须支持浅色和深色主题切换。
- 代码标识符、配置键、CLI 名称、API 名称和产品专有名词保留英文。
- 用户明确要求英文时，可以输出英文；没有明确要求时，中文优先。

## 产品边界

Hone 是 macOS 菜单栏应用和管理工作台，核心目标是帮助个人开发者发现、应用、观测并持续优化 AI coding/harness engineering 实践。

当前产品闭环是：

```text
Discover -> Apply -> Observe -> Optimize
```

MVP 必须保留完整闭环：

- Discover：收集信号，生成 Practice Card，并沉淀为 registry-backed local asset。
- Apply：预览 projection plan，确认后投射到 Claude Code / Codex，支持 adopt 和 rollback。
- Observe：读取真实本地 Usage、projection health 和 audit trail。
- Optimize：基于洞察和 BYOA agent 生成可确认的本地资产改进建议。

## UI/UX 约定

- 复杂 UI 改动优先对齐当前五视图闭环；视觉风格可参考 `docs/product-design/harnessdeck-command-deck-prototype.html`。
- 不使用星宿名（天枢、天璇、瑶光等）作为功能名，功能命名保持工程语义。
- 浅色主题使用浅金白底、低饱和星图、深蓝/鎏金点缀。
- 深色主题使用玄夜蓝、鎏金星图风格。
- 菜单栏面板必须能独立于管理窗口展示闭环健康度、实践健康度、本地用量和快捷动作。
- 原生感改动遵循 native-feel audit：系统字体、默认 cursor、非内容文本不选中、平台 focus ring、pressed state、禁用 WebKit 默认右键菜单、快捷键遵循 macOS 习惯。

## 技术方向

已选技术栈：

- Tauri 2
- React
- TypeScript
- Rust
- SQLite
- macOS Keychain

后续实现围绕 Tauri/Rust 本地优先架构展开，关键配置读取、写入、备份、manifest 和真实系统边界由 Rust 服务负责。React 前端负责工作台和菜单栏面板体验，必须通过命令接口访问本地能力。

## 安全与隐私

- 默认不上传 prompts、source code、完整 logs。
- secrets 存 Keychain，registry asset 和 SQLite 只保存引用。
- 读取 logs、启用 hooks、调用本地 LLM、发送脱敏摘要到远端 LLM、启用实验性合盖防睡，都需要用户明确授权。
- 修改 Claude/Codex target 前必须生成 plan、展示 diff、获得 `write_projection` 授权、写入、验证并记录 audit。
- 涉及账号切换、配置写入、rollback 和隐私授权的动作需要进入 audit trail。

## 文档维护

- 产品设计变更先更新当前 Trellis task / spec。
- README 写中文稳定结论、当前状态和入口信息。
- `README.en.md` 写对应英文文档。
- 新增实现计划时，保持它与 spec 对齐，避免重新定义 MVP 边界。
- 文档中避免占位词、临时标签和模糊状态词。
- 文档中避免反向对比句式，直接写正向结论。

## 验证

纯文档修改至少执行：

```bash
rg -n 'TB''D|TO''DO|place''holder|待''定|未''定|不''确定|不是.*而''是|not .*b''ut' AGENTS.md README.md README.en.md CLAUDE.md docs .trellis/spec
```

代码或 UI 修改按风险运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri:build
```

前端或桌面 UI 改动需要在可行时启动 `pnpm tauri:dev`，并用浏览器、Computer Use 或 macOS 桌面观察验证主窗口与菜单栏面板。

<!-- TRELLIS:START -->
# Trellis Instructions

These instructions are for AI assistants working in this project.

This project is managed by Trellis. The working knowledge you need lives under `.trellis/`:

- `.trellis/workflow.md` — development phases, when to create tasks, skill routing
- `.trellis/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.trellis/workspace/` — per-developer journals and session traces
- `.trellis/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a Trellis command is available on your platform (e.g. `/trellis:finish-work`, `/trellis:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:
- `.agents/skills/` — reusable Trellis skills
- `.codex/agents/` — optional custom subagents

Managed by Trellis. Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.

<!-- TRELLIS:END -->
