# Hone Bento Practice Shard Design

这组文件是 Hone 当前工作台和菜单栏面板的视觉参考，目标是覆盖 Discover -> Apply -> Observe -> Optimize 闭环，并保持 macOS 本地工具的密度和原生感。

## 文件

- `index.html`：设计稿入口，链接到工作台与 statusBar 两个核心屏幕。
- `screens/workbench-home.html`：完整桌面工作台原型，采用 Practice Shard 石头标识与 Bento 主题。
- `screens/statusbar-panel.html`：macOS 菜单栏弹层原型，覆盖闭环健康度、实践健康度、本地用量和快捷入口。
- `logo-options.html`：logo 选择记录，已标记 `Practice Shard` 为选中方向。

## 功能覆盖

设计稿覆盖当前产品的主要功能语义：

- 首页闭环总览、行动队列、目标健康度、审计轨迹。
- Discover 中的信号规范化、实践草稿保存和本地资产创建。
- Apply 中的注册表投射、冲突采纳、回滚和 audit 边界。
- Usage / Insights 中的真实本地观测、投射健康度、审计轨迹和优化建议入口。
- Settings 中的 registry、BYOA agent 检测、授权与隐私边界。
- 菜单栏快捷入口、健康状态、本地用量和打开工作台动作。

## 设计方向

- Logo：`Practice Shard`，多切面石头 / 晶体标识。
- 主题：Bento token，蓝色主操作、浅蓝工作区、模块化卡片。
- 结构：工作台采用左侧闭环导航、中央信号/操作画布、右侧证据与风险抽屉，避免复刻当前运行界面的顶部 tab 与常规卡片堆叠。

## 同步方式

如果这份目录来自 Open Design 项目根目录，可运行：

```bash
./harness-deck-design-sync.sh
```

或指定目标仓库：

```bash
./harness-deck-design-sync.sh /Users/zhici/per-pro/harness-deck
```
