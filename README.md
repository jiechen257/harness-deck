# Hone

English documentation: [`README.en.md`](README.en.md)

Hone 是一个 macOS 菜单栏应用和工作台，帮助个人开发者发现、应用并持续优化 AI coding 范式。

它从 GitHub trending、Hacker News、Reddit、linux.do 等社区热榜中聚合 harness engineering 的最新实践，支持一键安装到本地 AI coding 工具，并通过调用用户本地已有的 agent（BYOA）自动生成配置优化建议，形成 **发现 → 应用 → 观测 → 优化** 的完整闭环。

## 核心理念

- **本地优先**：所有数据处理和 agent 调用均在本地完成，不跑后端服务
- **BYOA (Bring Your Own Agent)**：复用用户本地已安装的 Claude Code / Codex CLI 执行推理，不直连 API，不绑定特定 provider
- **完全开源**：面向个人重度 AI coding 用户，通过 GitHub 仓库分发
- **macOS 原生体验**：系统字体、原生托盘、MenuBar 弹出面板、macOS 快捷键

## 产品闭环

```text
Discover → Apply → Observe → Optimize
   ↑                              │
   └──────────────────────────────┘
```

- **Discover**：聚合多平台热榜和策展内容，发现仓库级的 harness engineering 范式（如 framework、curated collection、methodology），而非仅配置文件
- **Apply**：一键安装 skill、rule、hook 到本地 `~/.claude/` 或 `~/.codex/`，低门槛应用
- **Observe**：接入真实本地数据（token、成本、会话活动、模型分布），观测效果
- **Optimize**：Insights 检测到异常或改进机会后，调用本地 agent 生成 registry asset 改进建议，用户确认后写回本地资产

## 信息发现管道

Discover 是 **harness engineering 信息聚合器**，分为两个区域：

### 工具雷达
追踪 GitHub trending 中 harness engineering 相关的仓库，按 star 增速、活跃度、范式类型分类。手工策展的高质量仓库置顶。策展内容维护在独立的 [hone-registry](https://github.com/) 仓库，以 YAML 格式管理，支持社区 PR 贡献。

### 社区脉搏
聚合 Hacker News、Reddit、linux.do 的热门讨论，按话题聚类。

### 数据管道
```text
多平台热榜爬取（用户手动触发，每日一次）
    → 关键词粗筛（本地字符串匹配，瞬间完成）
    → Agent 语义精排（打包粗筛结果，一次 agent 调用完成）
    → 结构化展示
```

客户端本地完成全部爬取和过滤，不依赖后端服务。

## 功能结构

### 5 个工作台视图

| 视图 | 职责 |
|------|------|
| **Home** | 仪表盘，总览各模块状态 |
| **Discover** | 信息聚合 + 一键安装 |
| **Usage** | 真实用量和成本观测 |
| **Insights** | 洞察 + AI 生成优化建议 + 闭环写回 |
| **Settings** | registry、BYOA agent 检测、授权、外观、本地数据和审计设置 |

### MenuBar 面板（每日一瞥）

- 顶部：今日社区热点（最近一次爬取的 top 内容标题）
- 中部：未处理的优化建议数 + 今日成本
- 底部：「更新热榜」（触发爬取）和「打开工作台」快捷按钮

### BYOA 管道

通过 CLI 子进程调用用户本地的 AI coding agent：

```text
检测可用 agent（which claude / which codex）
    → 非交互模式调用，传入结构化 prompt
    → 要求 JSON 输出
    → 解析结果，生成 registry asset 改进建议或语义过滤结果
```

用于两个场景：
1. Discover 的语义精排
2. Insights 的优化建议生成

### Target 支持

MVP 聚焦 Claude Code + Codex，架构上采用 adapter pattern，后续可扩展到 Cursor、Windsurf、Copilot 等工具，只需新增 adapter。

## 路线图

```text
Phase 1 — 地基
  ├── BYOA 管道（检测 + 调用本地 agent CLI）
  ├── 导航重构（9 → 5 视图）
  └── Usage 接入真实数据

Phase 2 — 核心链路前半
  ├── Discover 重做（多平台爬取 + 粗筛 + 精排）
  └── 一键安装（Discover → 本地环境）

Phase 3 — 核心链路后半
  ├── Insights 闭环（洞察 → agent 建议 → 确认写回）
  └── MenuBar 重做（每日一瞥入口）

Phase 4 — 扩展
  └── Target adapter 抽象（支持更多 AI coding 工具）
```

## 技术栈

- **框架**：Tauri 2 + React + TypeScript + Rust
- **平台**：macOS only
- **界面语言**：简体中文（默认）/ English
- **界面主题**：浅色（默认）/ 深色

## 许可证

Hone 使用 GNU General Public License v3.0 only（GPL-3.0-only）发布，完整文本见 [`LICENSE`](LICENSE)。

## 开发状态

当前代码库处于 **Hone 五视图闭环实现阶段**。已有可运行的 Tauri 桌面应用、双窗口、托盘、主题切换、国际化、macOS 原生体验、SQLite 状态、BYOA 检测、真实 Usage/Insights 命令、Discover → Practice → Asset → Projection 的本地闭环。

已保留并接入的基础设施：
- Tauri 双窗口架构（main + menubar）
- 托盘图标和面板定位（`tray.rs`、`window.rs`）
- 主题和语言切换（`useTheme`、`useLocale`）
- CSS 主题系统（`[data-theme="dark"]`）
- macOS 原生体验适配（系统字体、光标、右键菜单抑制、快捷键）

当前闭环：
- Home：闭环健康度和下一步队列
- Discover：信号、实践卡片、本地资产和投射计划入口
- Usage：Claude Code / Codex 本地用量观测
- Insights：用量洞察、投射健康度和审计轨迹
- Settings：registry、BYOA agent、授权和审计设置

投射写入边界：
- 生成投射计划只读
- confirm / adopt / rollback 需要 `write_projection` 授权
- 有 active writable registry 时，实践生成本地资产会写出真实 registry 文件，projection plan 可直接识别

## 隐私边界

- 默认不上传 prompts、源代码、完整日志
- Agent 调用在本地完成，不经过第三方服务
- 爬取仅访问公开热榜页面
- 读取本地 agent 配置目录需用户授权
- 写入 Claude Code / Codex target 目录需 `write_projection` 授权

## 开发命令

```bash
pnpm install                                     # 安装依赖
pnpm dev                                         # vite 开发服务器，localhost:1420
pnpm tauri:dev                                   # 完整 Tauri 桌面应用（Rust + React）
pnpm tauri:build                                 # 生产构建
pnpm lint                                        # eslint，零警告要求
pnpm typecheck                                   # tsc --noEmit
pnpm test                                        # vitest run (jsdom)
pnpm test:watch                                  # vitest watch 模式
cargo test --manifest-path src-tauri/Cargo.toml  # Rust 测试
```

## 相关文档

- 当前实现任务：`.trellis/tasks/06-13-06-13-readme-product-loop-real-closure/`
- 产品规范：`.trellis/spec/`
- UI/UX 原型：[`docs/product-design/`](docs/product-design/)
