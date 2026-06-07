# HarnessDeck Agent 工作规则

本文件约束自动化代理在 `harness-deck` 仓库中的工作方式。上层全局规则仍然生效，本文件只记录本项目的额外约定。

## 项目状态

- 当前仓库已经进入可运行实现阶段。
- 当前已有 Tauri 2 + React + TypeScript + Rust macOS 桌面应用、package 配置、测试和构建命令。
- 当前主窗口对齐 command deck 原型，包含顶部命令栏、北斗品牌状态带、菜单栏面板和 macOS 窗口化工作台。
- 当前 Tauri 配置包含 `main` 管理窗口和 `menubar` 菜单栏面板窗口；`menubar` 通过 `index.html?panel=1` 渲染。
- 当前默认仍为 fixture / mock mode，不直接写入真实 Claude Code、Codex 或系统电源配置。
- 当前设计与实现来源：
  - `docs/superpowers/specs/2026-06-07-harness-deck-design.md`
  - `docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md`
  - `docs/product-design/harnessdeck-command-deck-prototype.html`
  - `yetone/native-feel-skill`

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

## UI/UX 约定

- 复杂 UI 改动优先对齐 `docs/product-design/harnessdeck-command-deck-prototype.html`。
- 北斗七星只作为品牌视觉语言，不进入信息架构，不使用天枢、天璇、瑶光等星名作为功能名。
- 中文界面中 `Profiles` 统一使用“配置集”。
- 浅色主题使用浅金白底、低饱和星图、深蓝/鎏金点缀。
- 深色主题使用玄夜蓝、鎏金星图风格。
- 菜单栏面板必须能独立于管理窗口展示当前配置集、同步健康度、成本、防睡状态和快捷动作。
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
- secrets 存 Keychain，Profile files 和 SQLite 只保存引用。
- 读取 logs、启用 hooks、调用本地 LLM、发送脱敏摘要到远端 LLM、启用实验性合盖防睡，都需要用户明确授权。
- 修改 Claude/Codex 配置前必须生成 plan、展示 diff、备份、写入、验证并记录 manifest。
- 涉及账号切换、配置写入、rollback 和隐私授权的动作需要进入 audit trail。

## 文档维护

- 产品设计变更先更新 spec。
- README 写中文稳定结论、当前状态和入口信息。
- `README.en.md` 写对应英文文档。
- 新增实现计划时，保持它与 spec 对齐，避免重新定义 MVP 边界。
- 文档中避免占位词、临时标签和模糊状态词。
- 文档中避免反向对比句式，直接写正向结论。

## 验证

纯文档修改至少执行：

```bash
rg -n 'TB''D|TO''DO|place''holder|待''定|未''定|不''确定|不是.*而''是|not .*b''ut' AGENTS.md README.md README.en.md docs/superpowers/specs/2026-06-07-harness-deck-design.md docs/superpowers/specs/2026-06-07-harness-deck-implementation-design.md
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
