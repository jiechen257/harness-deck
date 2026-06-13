# Hone Agent 工作规则

本文件约束自动化代理在 `harness-deck` 仓库中的工作方式。上层全局规则仍然生效，本文件只记录本项目的额外约定。

## 项目状态

- 当前仓库已经进入可运行实现阶段。
- 当前已有 Tauri 2 + React + TypeScript + Rust macOS 桌面应用、package 配置、测试和构建命令。
- 当前主窗口对齐 Practice Shard Bento 工作台，包含左侧闭环导航、中央信号/操作画布、右侧证据抽屉和菜单栏面板。
- 当前 Tauri 配置包含 `main` 管理窗口和 `menubar` 菜单栏面板窗口；`menubar` 通过 `index.html?panel=1` 渲染。
- 当前产品/UI 准绳：
  - `docs/product-design/screens/workbench-home.html`
  - `docs/product-design/screens/statusbar-panel.html`
  - `docs/product-design/README.md`
- `docs/superpowers/specs/2026-06-07-*` 是旧 Profile-first 方案，不作为当前产品边界。

## 默认语言

- 文档默认使用简体中文。
- 面向外部读者的 README 保持中文优先，并提供英文版本。
- 产品 UI 必须支持简体中文和英文，默认显示简体中文。
- 产品 UI 默认浅色主题，必须支持浅色和深色主题切换。
- 代码标识符、配置键、CLI 名称、API 名称和产品专有名词保留英文。
- 用户明确要求英文时，可以输出英文；没有明确要求时，中文优先。

## 产品边界

Hone 是 macOS 菜单栏应用和本地实践运营工作台，核心目标是帮助用户把 AI coding / harness engineering 实践沉淀成本机可复用资产。

当前闭环是：

```text
Signal -> Practice -> Local Asset -> Projection -> Review -> Improve
                                      |                         |
                                      +---- Operations / Audit --+
```

当前主工作台必须保留 6 个视图：

- 首页：闭环健康度、今日顺序、分段状态、目标健康度、最近审计。
- 实践库：信号、Practice Card、本地资产、归档对象。
- 应用与同步：registry 投射、冲突采纳、回滚、投射审计。
- 本地评审：projection health、发现列表、证据建议、drift timeline。
- 运维：Codex proxy、Sleep guard、Wake display 的预览与确认。
- 设置：registry、starter、授权边界、外观语言、本地数据和审计。

`Usage` / `Insights` 可以作为服务能力或未来模块存在，但不能替代当前设计稿里的 `本地评审` 和 `运维` 主视图。

## UI/UX 约定

- 复杂 UI 改动优先对齐 `docs/product-design/screens/workbench-home.html`。
- 菜单栏面板对齐 `docs/product-design/screens/statusbar-panel.html`。
- 不使用星宿名（天枢、天璇、瑶光等）作为功能名，功能命名保持工程语义。
- 浅色主题使用浅金白底、低饱和星图、深蓝/鎏金点缀。
- 深色主题使用玄夜蓝、鎏金星图风格。
- 菜单栏面板必须能独立于管理窗口展示闭环健康度、实践健康度、本地运行/用量状态和快捷动作。
- 原生感改动遵循 native-feel audit：系统字体、默认 cursor、非内容文本不选中、平台 focus ring、pressed state、禁用 WebKit 默认右键菜单、快捷键遵循 macOS 习惯。

## 技术方向

已选技术栈：

- Tauri 2
- React
- TypeScript
- Rust
- SQLite
- macOS Keychain 边界

关键事实：

- SQLite `hone.db` 保存结构化索引、状态、关系和审计。
- Registry repo 保存 skills、rules、hooks、MCP 片段等文件资产。
- Target 目录（`~/.claude/`、`~/.codex/`）只是投射结果。
- React 前端通过 Tauri command 访问本地能力。
- Rust 服务负责关键文件读写、投射、回滚、审计和本机脚本边界。

## 安全与隐私

- 默认不上传 prompts、source code、完整 logs。
- Secrets 归 Keychain 边界；SQLite 和 registry 只保存引用或安全摘要。
- 读取 logs、启用 hooks、调用本地 LLM、发送脱敏摘要到远端 LLM、启用高风险脚本，都需要用户明确授权。
- 修改 Claude/Codex target 前必须生成 plan、展示 diff、检查授权、写入、验证并记录 audit。
- 涉及账号切换、配置写入、rollback 和隐私授权的动作需要进入 audit trail。

## 文档维护

- 产品设计变更先更新 `docs/product-design/screens/workbench-home.html` 或对应 Trellis task。
- README 写中文稳定结论、当前状态和入口信息。
- `README.en.md` 写对应英文文档。
- 新增实现计划时，保持它与 Practice Shard 工作台对齐，避免重新引入旧 Profile-first 边界。
- 文档中避免占位词、临时标签和模糊状态词。

## 验证

纯文档修改至少执行：

```bash
rg -n 'TB''D|TO''DO|place''holder|待''定|未''定|不''确定' AGENTS.md README.md README.en.md CLAUDE.md docs .trellis/spec
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
