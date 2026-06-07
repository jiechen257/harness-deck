# HarnessDeck

HarnessDeck 是一个 macOS 菜单栏应用和管理工作台，目标是帮助用户用好 harness engineering。它把社区最佳实践发现、Harness Profile 管理、Claude/Codex 同步、日常操作、用量分析和持续优化放进同一个本地优先工作流。

当前仓库处于产品设计阶段，尚未包含可运行 app 代码。

## 当前状态

- 产品设计文档：[`docs/superpowers/specs/2026-06-07-harness-deck-design.md`](docs/superpowers/specs/2026-06-07-harness-deck-design.md)
- 目标平台：macOS
- 计划技术栈：Tauri 2、React、TypeScript、Rust、SQLite、macOS Keychain
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

当前没有安装、构建或测试命令。下一步是在产品设计文档通过 review 后，生成实施计划并初始化 Tauri + React + Rust 项目结构。

---

# HarnessDeck

HarnessDeck is a macOS menu bar app and management workbench for using harness engineering well. It brings community practice discovery, Harness Profile management, Claude/Codex sync, daily operation, usage analysis, and continuous improvement into one local-first workflow.

This repository is in the product design stage. It does not contain runnable app code yet.

## Current Status

- Product design document: [`docs/superpowers/specs/2026-06-07-harness-deck-design.md`](docs/superpowers/specs/2026-06-07-harness-deck-design.md)
- Target platform: macOS
- Planned stack: Tauri 2, React, TypeScript, Rust, SQLite, macOS Keychain
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

There are no install, build, or test commands yet. The next step is to create an implementation plan and initialize the Tauri + React + Rust project structure after the product design document passes review.
