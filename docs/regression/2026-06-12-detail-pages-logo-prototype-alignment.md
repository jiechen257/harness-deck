# 2026-06-12 详情页与 Logo 原型对齐回归

## 范围

本轮修复覆盖：

- 产品 Logo：`src/components/shared/HarnessLogo.tsx`
- 菜单栏面板：`src/components/menubar/MenuBarPanel.tsx`
- 工作台外壳与证据抽屉：`src/App.tsx`
- 五个非首页菜单页的 command deck 详情样式：
  - `PracticeLibraryView`
  - `ApplySyncView`
  - `LocalReviewView`
  - `OperationsView`
  - `SettingsView`
- 样式入口：`src/styles/app.css`

视觉真源仍为：

- `docs/product-design/screens/workbench-home.html`
- `docs/product-design/screens/statusbar-panel.html`

## 截图证据

截图目录：`docs/regression-artifacts/2026-06-12/`

- `after-library-detail.png`
- `after-apply-detail.png`
- `after-review-detail.png`
- `after-operations-detail.png`
- `after-settings-detail.png`
- `after-settings-detail-1180.png`
- `after-statusbar-panel-fullbleed-v2.png`
- `after-workbench-home-firstscreen-v2.png`
- `after-library-source-toggles.png`
- `after-apply-sync-header.png`
- `after-local-review-card.png`
- `after-settings-drawer-dedup-v3.png`
- `after-workbench-wide-centered.png`

这些截图主要使用 `1512x900` viewport，在浏览器 fixture 模式下逐页切换并采集。`after-settings-detail-1180.png` 用于覆盖窄桌面状态，确认 rail 与 stage 不再互相挤压。`after-statusbar-panel-fullbleed-v2.png` 使用 `356x640` viewport 验证菜单栏面板左右全宽铺满；`after-workbench-wide-centered.png` 使用 `1892x1100` viewport 验证工作台达到最大宽度后居中。

## 修复点

- `HarnessLogo` 已从旧 fader 图标替换为原型 HTML 中的 shard SVG 路径。
- `MenuBarPanel` 顶部菜单栏标记已改用同一 shard logo，移除旧蓝色圆点。
- `statusbar-stage` 移除外层左右内边距，面板与顶部菜单栏在独立窗口中全宽铺满。
- `workbench-command-deck` 移除左右内边距，设置 `1680px` 最大宽度，并在宽屏中居中展示。
- 五个详情页标题区补齐原型式 `KICKER + 大标题 + 说明文案`。
- 中央 stage 内的旧 `view-panel` 外框已取消，详情内容直接融入 command deck canvas。
- `view-content`、tabs、module/card、projection board、review summary、operations cards、settings groups、form rows 和 list rows 已映射到原型 HTML 的密度、边框、圆角和浅蓝白视觉语言。
- 修复两列业务行被误当作 `icon + body + badge` 三列布局导致文本挤窄的问题。
- 首页首屏压缩了 hero、决策队列、闭环分段卡片和 action 高度，在 `1512x900` 启动视口中完整展示主要内容。
- 右侧证据抽屉按视图去重：评审页不再重复最近审计，设置页不再重复最近审计和安全边界，首页不再重复安全边界。
- 实践库来源开关改为紧凑开关控件，移除右侧异常空白列。
- 应用同步投射步骤块改为有限宽度左对齐，避免空白横幅。
- 本地评审发现卡片按内容收缩，移除红框中的异常空白高度。
- 补齐原型标题 tracking、balanced wrapping、按钮/标签 press 与 focus 状态，并在窄桌面断点保留 248px rail。

## 验证命令

```bash
pnpm lint
pnpm typecheck
pnpm test
```

截图通过本机 Chrome DevTools Protocol 逐页生成。临时服务命令：

```bash
pnpm exec vite --host 127.0.0.1 --port 1421
```

## 结果

- 详情页不再表现为旧样式面板嵌在新 shell 中。
- 用户截图标出的左侧 rail 与右侧详情内容之间的视觉断层已消除。
- Logo 已替换为原型 shard mark。
- statusBar 独立面板已全宽铺满，顶部菜单栏 icon 已替换为 shard mark。
- workbench 外侧左右内边距已移除，宽屏状态居中展示。
- 首页启动视口主要内容已完整落在一屏内。
- 1180px 窄桌面截图中，导航副标题和设置页标题保持可读，没有出现异常挤压。
