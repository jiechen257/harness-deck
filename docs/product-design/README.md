# Hone Product Design

这组文件是 Hone 当前产品设计参考。主工作台逻辑以 `screens/workbench-home.html` 为准，菜单栏面板逻辑以 `screens/statusbar-panel.html` 为准。

当前设计采用 Practice Shard 方向：把外部信号切分为可评审实践，沉淀成本地 registry asset，再投射到 Claude Code / Codex，并通过本地评审、运维动作和审计记录持续闭环。

## 文件

- `index.html`：设计入口，链接到工作台和菜单栏面板两个核心屏幕。
- `screens/workbench-home.html`：当前主工作台参考，定义 6 个视图、左侧闭环导航、中央信号/操作画布和右侧证据抽屉。
- `screens/statusbar-panel.html`：当前 macOS 菜单栏面板参考，覆盖闭环健康度、实践健康度、本机运维和快捷入口。
- `logo-options.html`：logo 选择记录，已标记 `Practice Shard` 为选中方向。

## 功能覆盖

设计覆盖当前产品的主要功能语义：

- 首页 / Home：闭环总览、行动队列、目标健康度、审计轨迹。
- 实践库 / Practice Library：信号规范化、Practice Card 草稿保存、本地资产创建。
- 应用与同步 / Apply & Sync：registry projection、目标路径、冲突采纳、回滚和 audit 边界。
- 本地评审 / Local Review：projection health、drift evidence、finding、timeline 和改进建议。
- 运维 / Operations：Codex proxy、Sleep guard、Wake display、脚本预览和确认。
- 设置 / Settings：registry 路径、bootstrap、授权范围、审计和隐私边界。
- 菜单栏面板：健康状态、运维状态、快捷入口和打开工作台动作。

## 设计方向

- Logo：`Practice Shard`，多切面石头 / 晶体标识。
- 主题：Bento token，蓝色主操作、浅蓝工作区、模块化卡片。
- 结构：工作台采用左侧闭环导航、中央信号/操作画布、右侧证据与风险抽屉。
- 产品闭环：`Signal -> Practice -> Local Asset -> Projection -> Review -> Improve`，Operations 和 Audit 作为安全执行与可追溯层。

## 同步方式

如果这份目录来自 Open Design 项目根目录，可运行：

```bash
./harness-deck-design-sync.sh
```

或指定目标仓库：

```bash
./harness-deck-design-sync.sh /Users/zhici/per-pro/harness-deck
```
