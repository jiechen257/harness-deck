# 2026-06-11 功能回归记录

## 目标与安全边界

本轮回归目标是按当前产品使用流程验证 Hone / HarnessDeck 的功能闭环，并记录测试中发生的所有事情。

用户明确边界：

- 第 4 阶段“应用与同步”不执行真实同步，不影响本机 agent 工作。
- 不做任何影响本地电脑和 agent 的操作。
- 第 3 阶段“实践库”重点验证。
- 本机 Claude 不可用，本轮只按 Codex 目标验证。

执行约束：

- `computer-use` skill 文件已读取。首次工具发现没有暴露可操作 macOS 桌面的 computer-use MCP 工具；安装 `computer-use@openai-bundled` 后再次发现工具，仍只返回移动端 pithos 和 node_repl / Playwright 能力。因此本轮用安全的浏览器自动化、Tauri 临时 HOME 烟测、单元测试和 Rust 测试替代桌面点击。
- 未点击完整 Tauri 桌面态里的真实“确认投射”。
- 浏览器回归里的“应用与同步”只把目标路径改为 `/tmp/hone-regression-target/codex-skills` 并查看只读 diff。
- 运维流程只验证“预览计划”和未授权阻断，不执行本机脚本。

## 环境

- 仓库：`/Users/zhici/per-pro/harness-deck`
- 分支：`main`
- 应用：Hone
- 前端服务：`pnpm dev`，`http://127.0.0.1:1420`
- 自动化：bundled Playwright via node_repl
- 截图与日志：`docs/regression-artifacts/2026-06-11/`

## 运行命令

```bash
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
pnpm dev
HOME=/tmp/hone-regression-home CARGO_HOME=/Users/zhici/.cargo RUSTUP_HOME=/Users/zhici/.rustup pnpm tauri:dev
```

回归后追加验证：

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
```

## 自动化流程结果

浏览器回归日志：`docs/regression-artifacts/2026-06-11/browser-regression-log.json`

| 步骤 | 结果 | 证据 |
| --- | --- | --- |
| 打开首页 | 通过 | `01-home.png` |
| 全局导航、语言、快捷键 | 通过 | `02-global.png` |
| 实践库：信号到本地资产 | 通过 | `03-library-signals-initial.png`、`04-library-preview-generated.png`、`05-library-practice-saved.png`、`06-library-asset-created.png` |
| 应用与同步：测试路径预览 | 通过 | `07-apply-preview-only.png` |
| 本地评审：Codex 目标 | 通过 | `08-local-review-codex.png` |
| 运维：预览后阻断运行 | 通过 | `09-operations-blocked.png` |
| 设置 tabs | 通过 | `10-settings.png` |
| 菜单栏面板路由 | 通过 | `11-menubar-panel-route.png` |
| Tauri 桌面态临时 HOME 烟测 | 部分通过，发现实践库真实 Codex 调用问题 | `14-tauri-dev-desktop-temp-home.png` |

## 分阶段记录

### 1. 全局工作台

已验证：

- 首页可打开并显示闭环状态总览。
- 顶部导航包含：首页、实践库、应用与同步、本地评审、运维、设置。
- 品牌菜单可切换中英文。
- `Meta+,` 可打开设置，`Meta+1` 可回到首页。
- 浏览器 fallback 中页面可稳定渲染。

未验证：

- Tauri 桌面窗口拖拽和 macOS 托盘真实点击，因为当前没有可用的 Mac computer-use 工具。

### 2. 首页

已验证：

- 闭环状态、待决策队列、目标健康度、审计轨迹正常渲染。
- 首页可作为流程入口跳转到其他视图。

### 3. 实践库

这是本轮重点流程。

已验证：

- 进入“实践库”后默认展示“信号”tab 和“规范化预览”区域。
- 选择默认信号并点击“生成实践预览”后，成功生成 Practice Draft。
- 点击“保存为实践”后进入“实践”tab，新增实践卡片可见。
- 点击“创建本地资产”后进入“资产”tab，本地资产列表更新。
- 资产详情里显示 LoopStepper 到资产阶段，并提供“打开应用与同步”入口。

观察：

- 本轮生成的新增资产类型是 `agent_profile_fragment`，路径类似 `profiles/codex-desktop-1-19-0-practice-agent-profile-loading.md`。这是当前前端按标题包含 `profile` 派生资产类型的结果。
- 既有 fixture 资产 `system-skills/local-harness-review` 仍正常显示。

第一轮自动化脚本问题：

- 脚本用 `getByText("创建本地资产")` 等待元素时，因为页面上存在多个同名按钮触发 Playwright strict mode violation。
- 这是测试脚本选择器问题，不是产品问题。
- 已改为 `getByRole("button", { name: "创建本地资产" }).first()` 后流程通过。
- 失败截图保留为 `failed-practice-library-signal-to-asset-flow.png`。

Tauri 桌面态补充发现：

- 使用临时 HOME 启动 `pnpm tauri:dev`，应用数据写入 `/tmp/hone-regression-home/Library/Application Support/com.hone.desktop/hone.db`，没有使用真实用户 home 下的 agent 配置目录。
- 截图 `14-tauri-dev-desktop-temp-home.png` 显示桌面主窗口可启动，并进入 SQLite 实时聚合模式。
- 同一截图中的审计轨迹暴露真实实践库问题：`signal_normalize_failed`，错误为 Codex CLI 不接受 `-q` 参数。
- 根因：`src-tauri/src/services/byoa_service.rs` 仍按旧 Codex CLI 调用 `codex -q --prompt ... --json`。
- 本机当前 `codex --help` 和 `codex exec --help` 显示非交互入口是 `codex exec [OPTIONS] [PROMPT]`，且 `--json` 表示 JSONL 事件流，不是 PracticeDraft 的单个 JSON 对象。
- 修复：Codex agent 调用改为 `codex exec --ephemeral --ignore-rules --skip-git-repo-check --sandbox read-only --ask-for-approval never <prompt>`。
- 修复意图：使用当前 Codex CLI 的 `exec` 子命令；使用 `--ephemeral` 避免持久化 Codex session；使用 `--ignore-rules` 避免项目规则污染 system skill 输出；使用 `--sandbox read-only` 和 `--ask-for-approval never` 避免 system skill 触发本机写操作或交互审批；不使用 Codex CLI 的 `--json` 事件流。
- 出于安全边界，本轮没有真实触发一次 `codex exec` 模型调用；验证方式是本机 CLI help + 参数构造单元测试。

### 4. 应用与同步

已验证：

- 通过实践库资产详情进入“应用与同步”。
- 目标为 Codex；未测试 Claude。
- 目标路径改为安全测试路径 `/tmp/hone-regression-target/codex-skills`。
- 点击“重新生成计划”后可看到 Adapter Status 和投射计划。
- 点击“查看差异”后显示“只读 Diff”。

未执行：

- 未点击“确认投射 2 项”。
- 未执行真实 symlink/copy 到 `~/.codex/skills`。
- 未执行 Claude 目标。

风险说明：

- 浏览器 fallback 模式中的 confirm projection 虽然只修改前端内存 fixture，但本轮手动回归仍跳过该按钮，以保持和用户安全边界一致。

### 5. 本地评审

已验证：

- 打开“本地评审”。
- 检查目标保持 Codex。
- 评审发现、证据与建议、Drift Timeline、审计轨迹区块可渲染。

未验证：

- 真实 Tauri 数据库中 Codex projection 写入后的完整 drift 变化，因为本轮不做真实同步。

### 6. 运维

已验证：

- 运维页展示 Codex proxy、Sleep guard、Wake display 三个操作项。
- 点击“预览计划”后显示计划说明。
- 点击“确认运行”后被未授权提示阻断。

未执行：

- 未运行 `~/start-codex.sh`、`~/dsleep`、`~/dwake`。
- 未修改 launchctl、caffeinate、pmset 或任何本机设置。

### 7. 设置

已验证：

- 通用、授权、审计三个 tab 可切换。
- Registry Bootstrap 区域可见。
- 授权 tab 中“脚本执行”等权限项可见。

未执行：

- 未初始化真实 registry 路径。
- 未切换授权状态。
- 未写入真实本地 registry。

### 8. 菜单栏面板

已验证：

- `/?panel=1` 独立面板路由可渲染。
- 356 x 640 视口下，面板内容可以滚动。
- 滚动到底部后，“快捷入口”和“打开工作台”可见。

发现并修复的问题：

- 问题：356 x 640 视口下，`.menu-stack` 高度约 823px，外层 `.menubar-panel.standalone` 为 `overflow: hidden`，`.menu-body` 没有成为实际滚动容器，导致底部快捷入口被裁掉。
- 证据：`12-menubar-panel-356x640.png`，以及检查结果显示 `.menu-body` scrollHeight 不可用、`快捷入口` top 在 688px，超出 640px 视口。
- 修复：在 `src/styles/app.css` 中让 `.menu-top` 和 `.panel-today` 固定尺寸参与 flex 布局，并给 `.menu-body` 设置 `height: 0`、`overflow-y: auto`、`overscroll-behavior: contain`。
- 修复后证据：`13-menubar-panel-356x640-scrolled.png`；`.menu-body` `clientHeight=510`、`scrollHeight=836`、`overflowY=auto`，滚动后“打开工作台” bottom 为 542px，小于 640px。

## 修复清单

| 文件 | 改动 |
| --- | --- |
| `src/styles/app.css` | 修复菜单栏面板窄高窗口下内容不可滚动，避免快捷入口被裁切。 |
| `src-tauri/src/services/byoa_service.rs` | 修复 Codex BYOA 调用参数，改用当前 `codex exec`，并加只读、临时会话和无审批参数；新增参数构造单元测试。 |

## 当前未覆盖项

- 真正的 macOS computer-use 桌面点击没有执行：当前会话没有暴露 Mac computer-use 操作工具。
- 已安装 `computer-use@openai-bundled` 插件后，`tool_search` 仍只暴露移动端 pithos 截图和 node_repl，没有 Mac 桌面 click/type/screenshot 工具。
- Tauri 托盘左键打开、失焦隐藏、系统菜单 Open Workbench / Quit 未通过 GUI 点击验证。
- 完整 Tauri 桌面态真实 SQLite 持久化流程未做破坏性操作验证。
- Claude 目标未测试，因为用户明确说明本机 Claude 不可用。
- 真实 Codex target 写入、回滚、采纳未执行，因为会影响本机 agent 工作。
- 真实 `codex exec` system skill 调用未执行，因为它会调用本机 Codex/远端模型，可能产生会话、网络或成本副作用；本轮只验证参数构造。

## 结论

- 浏览器安全回归层：通过。
- 实践库主流程：通过，已从信号生成实践并创建本地资产。
- 应用与同步：只读预览通过，真实同步按安全边界跳过。
- 运维：预览和权限阻断通过，真实脚本执行按安全边界跳过。
- Tauri 临时 HOME 桌面烟测：主窗口可启动，数据写入临时 app support 目录。
- 发现 2 个产品问题并已修复：菜单栏面板内容在 356 x 640 下不可滚动；Codex BYOA 调用仍使用旧 CLI 参数，导致实践库真实规范化失败。
