# Hone Bento Practice Shard Redesign

这组文件是 Open Design 中产出的 Harness Deck / Hone 全新设计稿归档，目标是保留当前真实产品的内容与功能覆盖，同时采用不同于现状实现的 UI 组织方式。

## 文件

- `index.html`：设计稿入口，链接到工作台与 statusBar 两个核心屏幕。
- `screens/workbench-home.html`：完整桌面工作台原型，采用 Practice Shard 石头标识与 Bento 主题。
- `screens/statusbar-panel.html`：macOS 菜单栏弹层原型，覆盖闭环健康度、实践健康度、本机运维和快捷入口。
- `logo-options.html`：logo 选择记录，已标记 `Practice Shard` 为选中方向。

## 功能覆盖

设计稿覆盖当前产品的主要功能语义：

- 首页闭环总览、行动队列、目标健康度、审计轨迹。
- 实践库中的信号规范化、实践草稿保存和本地资产创建。
- 应用与同步中的注册表投射、冲突采纳、回滚和 manifest 边界。
- 本地评审、运维脚本预览、设置授权与隐私边界。
- 菜单栏快捷入口、健康状态、运维状态和打开工作台动作。

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
