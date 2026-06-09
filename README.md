# HarnessDeck

English documentation: [`README.en.md`](README.en.md)

HarnessDeck 是一个 macOS 菜单栏应用和管理工作台，目标是帮助用户用好 harness engineering。它把社区最佳实践发现、Harness Profile 管理、Claude/Codex 同步、日常操作、用量分析和持续优化放进同一个本地优先工作流。

当前仓库已经包含可本地运行的 Tauri 2 + React + TypeScript + Rust macOS 桌面应用骨架和 MVP fixture 工作流。

## 当前状态

- 产品设计文档：[`docs/superpowers/specs/2026-06-07-harness-deck-design.md`](docs/superpowers/specs/2026-06-07-harness-deck-design.md)
- 实现设计文档：[`docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md`](docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md)
- UI/UX 原型：[`docs/product-design/harnessdeck-command-deck-prototype.html`](docs/product-design/harnessdeck-command-deck-prototype.html)
- 原生感参考：[`yetone/native-feel-skill`](https://github.com/yetone/native-feel-skill)
- 目标平台：macOS
- 当前技术栈：Tauri 2、React、TypeScript、Rust
- 预留集成：SQLite、macOS Keychain
- 首批 agent targets：Claude Code 和 Codex
- 界面语言：支持简体中文和英文，默认显示简体中文
- 界面主题：支持浅色和深色，默认浅色
- 品牌方向：工程仪表风格，功能命名保持工程语义

## 产品闭环

```text
Discover -> Profile -> Sync -> Operate -> Improve
```

- `Discover`：发现 harness engineering 的官方、社区和精选实践。
- `Profile`：把实践沉淀为可复用的 Harness Profile。
- `Sync`：把 Profile 安全部署到 Claude Code 和 Codex。
- `Operate`：通过菜单栏控制中心管理 Profile、账号、用量、同步和防睡状态。
- `Improve`：基于 token、成本、drift、冲突、失败和更新持续给出优化建议。

## MVP 范围

MVP 采用本地完整闭环，并预留可插拔远端集成。核心能力包括：

- 菜单栏控制中心和二级工作台
- Harness Profiles
- Claude Code 和 Codex adapters
- policy sync、three-way diff、backup、manifest、rollback
- Account Workspace 和 Keychain secret storage
- Claude/Codex 用量与成本视图，指标带 source confidence
- 精选 registry、GitHub 发现和 `find-best-skill`
- 本地规则洞察和 profile impact update feed
- 标准防睡、定时防睡、显示器睡眠控制、实验性合盖防睡确认流

## 隐私边界

HarnessDeck 采用本地优先设计：

- 默认不上传 prompts、source code、完整 logs。
- secrets 存入 macOS Keychain。
- Profile files 和 SQLite 只保存 secret references。
- 读取 logs、启用 hooks、调用本地 LLM、发送脱敏摘要到远端 LLM、启用实验性合盖防睡，都需要用户明确授权。

## 开发状态

当前实现为本地优先 fixture mode。应用默认显示简体中文和浅色主题，支持英文和深色切换。主窗口对齐 command deck 原型，包含顶部命令栏、品牌状态带、菜单栏面板和 macOS 窗口化工作台。工作台包含首页、发现、配置集、同步、运行、用量、洞察、守护和设置；独立 Tauri 菜单栏面板通过 `index.html?panel=1` 渲染，展示当前配置集、同步健康度、成本、防睡状态和快捷动作。界面已按 native-feel audit 调整系统字体、默认 cursor、平台 focus ring、pressed 状态、右键菜单抑制和 macOS 风格快捷键。

已实现的本地闭环：

- 配置集 fixture、Codex / Claude Code fixture target、deploy plan、dry-run manifest。
- 安全 target discovery，需要显式本地读取授权，只返回安全摘要。
- Three-way diff、conflict queue、drift detection 和 rollback preview。
- Account Workspace、mock Keychain reference、switch-plan preview 和 audit trail。
- Usage / cost 聚合，带 Official、LocalLog、Estimated、Missing confidence。
- Curated registry、`find-best-skill` scoring、GitHub discovery gate。
- 本地 insight rules、feed 和 profile impact alert。
- Wake Control mock/system-safe 状态，实验性合盖防睡需要显式确认。

仍为 mock / fixture 的能力：

- 不写入真实 Claude Code 或 Codex 配置。
- Keychain 为 interface/mock，不保存 secret value。
- Registry / GitHub discovery 不自动远程调用。
- Wake Control 不修改系统电源策略。
- SQLite 持久化仍预留，当前 manifest 以本地 JSON 文件记录。

常用命令：

```bash
pnpm install
pnpm tauri:dev
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri:build
```
