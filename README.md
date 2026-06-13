# Hone

English documentation: [`README.en.md`](README.en.md)

Hone 是一个 macOS 菜单栏应用和本地实践运营工作台，帮助个人开发者把 AI coding / harness engineering 的实践沉淀成本机可复用资产，并安全投射到 Claude Code 和 Codex。

当前产品准绳是 Practice Shard 工作台设计稿：

- `docs/product-design/screens/workbench-home.html`
- `docs/product-design/screens/statusbar-panel.html`

## 当前产品闭环

```text
Signal -> Practice -> Local Asset -> Projection -> Review -> Improve
                                      |                         |
                                      +---- Operations / Audit --+
```

- **Signal**：从可信来源收集 changelog、模型讯息、社区讨论和本地样例信号。
- **Practice**：通过 BYOA agent 生成 Practice Card 草稿，用户保存为实践卡片。
- **Local Asset**：把实践沉淀为 registry 中的 skill、rule、hook、MCP 片段或 profile fragment。
- **Projection**：在写入前生成投射计划，确认后 symlink/copy 到 Claude Code 或 Codex target。
- **Review**：检查缺失投射、断链、drift、证据和修复建议。
- **Operations**：本机脚本只读展示，运行必须先预览、检查授权、再写入审计。
- **Settings**：管理 registry、starter、授权、主题、语言和审计历史。

## 工作台视图

| 视图 | 职责 |
| --- | --- |
| **首页** / Home | 闭环健康度、今日顺序、分段状态、目标健康度和最近审计 |
| **实践库** / Practice Library | 信号、实践卡片、本地资产和归档对象 |
| **应用与同步** / Apply & Sync | 注册表投射、冲突采纳、回滚和投射审计 |
| **本地评审** / Local Review | 投射健康度、发现列表、证据建议和 drift timeline |
| **运维** / Operations | Codex proxy、Sleep guard、Wake display 的预览与确认 |
| **设置** / Settings | Registry bootstrap、授权边界、外观语言、本地数据和审计 |

## MenuBar 面板

菜单栏面板是每日入口，独立于主窗口渲染：

- 闭环健康度
- 实践健康度
- 本地用量/运行状态摘要
- 低风险快捷动作
- 打开完整工作台

## 技术与数据模型

- **框架**：Tauri 2 + React + TypeScript + Rust
- **数据**：SQLite `hone.db` 保存结构化索引、状态、关系和审计
- **资产**：registry repo 保存 skills、rules、hooks、MCP 片段等文件资产
- **目标**：`~/.claude/`、`~/.codex/` 是投射结果，不是主真相
- **Agent**：BYOA，通过用户本地 Claude Code / Codex CLI 做信号规范化和评审

当前实现包含：

- 双窗口 Tauri app：`main` 工作台 + `menubar` 面板
- 6 个主视图导航
- SQLite schema、repository、seed 和测试
- 信号刷新、Practice Card 生成、本地资产创建
- projection plan、confirm、adopt、rollback、health check
- 本地 review、audit trail、authorization state
- system skills 和 BYOA 子进程调用边界

## 安全与隐私

- 默认不上传 prompts、源代码、完整日志或 secrets。
- 读取本地目录、外部信号、写入投射、脚本执行均有独立授权边界。
- 投射写入必须先生成 plan，再确认，再记录 audit。
- 回滚只能删除 Hone 管理的 symlink，普通文件必须拒绝。
- Secrets 归 Keychain 边界；SQLite 和 registry 只保存引用或安全摘要。

## 当前文档权威

当前产品与 UI 以 `docs/product-design/screens/workbench-home.html` 为准。

`docs/superpowers/specs/2026-06-07-harness-deck-design.md` 和 `docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md` 属于旧 Profile-first 方案，不再作为当前产品边界。

## 开发命令

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

## 许可证

Hone 使用 GNU General Public License v3.0 only（GPL-3.0-only）发布，完整文本见 [`LICENSE`](LICENSE)。
