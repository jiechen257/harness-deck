# HarnessDeck Agent 工作规则

本文件约束自动化代理在 `harness-deck` 仓库中的工作方式。上层全局规则仍然生效，本文件只记录本项目的额外约定。

## 项目状态

- 当前仓库处于产品设计阶段。
- 当前没有可运行 app 代码、package 配置、Tauri scaffold、测试目录或构建命令。
- 当前主设计来源是 `docs/superpowers/specs/2026-06-07-harness-deck-design.md`。
- 用户 review 并确认 spec 前，不进入实现计划、代码 scaffold、依赖安装、commit、push 或 PR。

## 默认语言

- 文档默认使用简体中文。
- 面向外部读者的 README 保持中文优先，并提供英文版本。
- 产品 UI 必须支持简体中文和英文，默认显示简体中文。
- 产品 UI 默认浅色主题，必须支持浅色和深色主题切换。
- 代码标识符、配置键、CLI 名称、API 名称和产品专有名词保留英文。
- 用户明确要求英文时，可以输出英文；没有明确要求时，中文优先。

## 产品边界

HarnessDeck 是 macOS 菜单栏应用和管理工作台，核心目标是帮助用户用好 harness engineering。

当前产品闭环是：

```text
Discover -> Profile -> Sync -> Operate -> Improve
```

MVP 必须保留完整闭环：

- 发现 harness engineering 最佳实践。
- 生成并维护 Harness Profile。
- 在 Claude Code 和 Codex 之间安全同步。
- 通过菜单栏控制中心融入日常工作。
- 基于用量、drift、失败和更新给出改进建议。

## 技术方向

已选技术栈：

- Tauri 2
- React
- TypeScript
- Rust
- SQLite
- macOS Keychain

实现前需要先确认 spec 已获用户批准，再进入实施计划。实施计划需要围绕 Tauri/Rust 本地优先架构展开，关键配置写入由 Rust 服务负责。

## 安全与隐私

- 默认不上传 prompts、source code、完整 logs。
- secrets 存 Keychain，Profile files 和 SQLite 只保存引用。
- 读取 logs、启用 hooks、调用本地 LLM、发送脱敏摘要到远端 LLM、启用实验性合盖防睡，都需要用户明确授权。
- 修改 Claude/Codex 配置前必须生成 plan、展示 diff、备份、写入、验证并记录 manifest。
- 涉及账号切换、配置写入、rollback 和隐私授权的动作需要进入 audit trail。

## 文档维护

- 产品设计变更先更新 spec。
- README 只写稳定结论、当前状态和入口信息。
- 新增实现计划时，保持它与 spec 对齐，避免重新定义 MVP 边界。
- 文档中避免占位词、临时标签和模糊状态词。
- 文档中避免反向对比句式，直接写正向结论。

## 验证

纯文档修改至少执行：

```bash
rg -n 'TB''D|TO''DO|place''holder|待''定|未''定|不''确定|不是.*而''是|not .*b''ut' AGENTS.md README.md docs/superpowers/specs/2026-06-07-harness-deck-design.md
```

仓库仍处于设计阶段时，没有 app build/test 命令。后续 scaffold 出现后，验证命令以项目 README、package scripts、Cargo/Tauri 配置为准。
