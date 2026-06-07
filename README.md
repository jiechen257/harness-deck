# HarnessDeck

HarnessDeck 是一个 macOS 菜单栏应用和管理工作台，目标是帮助用户用好 harness engineering。它把社区最佳实践发现、Harness Profile 管理、Claude/Codex 同步、日常操作、用量分析和持续优化放进同一个本地优先工作流。

当前仓库已经包含可本地运行的 Tauri 2 + React + TypeScript + Rust macOS 桌面应用骨架和 MVP fixture 工作流。

## 当前状态

- 产品设计文档：[`docs/superpowers/specs/2026-06-07-harness-deck-design.md`](docs/superpowers/specs/2026-06-07-harness-deck-design.md)
- 目标平台：macOS
- 当前技术栈：Tauri 2、React、TypeScript、Rust
- 预留集成：SQLite、macOS Keychain
- 首批 agent targets：Claude Code 和 Codex
- 界面语言：支持简体中文和英文，默认显示简体中文
- 界面主题：支持浅色和深色，默认浅色
- 品牌方向：北斗导航 + 司南工程仪表

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

当前实现为本地优先 fixture mode。应用默认显示简体中文和浅色主题，支持英文和深色切换。主窗口包含首页、发现、配置集、同步、运行、用量、洞察、守护和设置；菜单栏面板展示当前配置集、同步状态、成本、防睡状态和快捷动作。

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

---

# HarnessDeck

HarnessDeck is a macOS menu bar app and management workbench for using harness engineering well. It brings community practice discovery, Harness Profile management, Claude/Codex sync, daily operation, usage analysis, and continuous improvement into one local-first workflow.

This repository now contains a locally runnable Tauri 2 + React + TypeScript + Rust macOS desktop app skeleton and MVP fixture workflow.

## Current Status

- Product design document: [`docs/superpowers/specs/2026-06-07-harness-deck-design.md`](docs/superpowers/specs/2026-06-07-harness-deck-design.md)
- Target platform: macOS
- Current stack: Tauri 2, React, TypeScript, Rust
- Reserved integrations: SQLite, macOS Keychain
- First agent targets: Claude Code and Codex
- Interface language: Simplified Chinese and English, with Simplified Chinese as the default
- Interface theme: light and dark, with light as the default
- Brand direction: Beidou navigation + compass-like engineering instrument panel

## Product Loop

```text
Discover -> Profile -> Sync -> Operate -> Improve
```

- `Discover`: find official, community, and curated harness engineering practices.
- `Profile`: turn practices into reusable Harness Profiles.
- `Sync`: deploy Profiles safely to Claude Code and Codex.
- `Operate`: manage Profiles, accounts, usage, sync, and wake state through a menu bar control center.
- `Improve`: suggest changes based on tokens, cost, drift, conflicts, failures, and updates.

## MVP Scope

The MVP provides a complete local loop with pluggable remote integrations. Core capabilities include:

- Menu bar control center and secondary workbench
- Harness Profiles
- Claude Code and Codex adapters
- Policy sync, three-way diff, backup, manifest, and rollback
- Account Workspace and Keychain secret storage
- Claude/Codex usage and cost views with source confidence labels
- Curated registry, GitHub discovery, and `find-best-skill`
- Local rule-based insights and profile impact update feed
- Standard awake, timed awake, display sleep control, and explicit confirmation for experimental lid-awake behavior

## Privacy Boundary

HarnessDeck uses a local-first design:

- It does not upload prompts, source code, or complete logs by default.
- It stores secrets in macOS Keychain.
- Profile files and SQLite store secret references only.
- Reading logs, enabling hooks, using a local LLM, sending sanitized summaries to a remote LLM, and enabling experimental lid-awake behavior all require explicit user consent.

## Development Status

The current implementation runs in local-first fixture mode. The app defaults to Simplified Chinese and the light theme, with English and dark theme switching available. The main window includes Home, Discover, Profiles, Sync, Operate, Usage, Insights, Guard, and Settings. The menu bar panel shows the current profile, sync status, cost, wake state, and quick actions.

Implemented local loop:

- Profile fixtures, Codex / Claude Code fixture targets, deploy plan, and dry-run manifest.
- Safe target discovery with explicit local-read authorization and summary-only output.
- Three-way diff, conflict queue, drift detection, and rollback preview.
- Account Workspace, mock Keychain reference, switch-plan preview, and audit trail.
- Usage / cost aggregation with Official, LocalLog, Estimated, and Missing confidence.
- Curated registry, `find-best-skill` scoring, and GitHub discovery gate.
- Local insight rules, feed, and profile impact alert.
- Wake Control mock/system-safe state, with explicit confirmation for experimental lid-awake behavior.

Mock / fixture capabilities:

- No real Claude Code or Codex configuration writes.
- Keychain is interface/mock-only and does not store secret values.
- Registry / GitHub discovery does not perform automatic remote calls.
- Wake Control does not change system power policy.
- SQLite persistence is reserved; manifests are currently recorded as local JSON files.

Common commands:

```bash
pnpm install
pnpm tauri:dev
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri:build
```
