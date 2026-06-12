# 2026-06-12 设计屏幕样式对齐回归

## 范围

本次回归覆盖两个视觉真源：

- `docs/product-design/screens/workbench-home.html`
- `docs/product-design/screens/statusbar-panel.html`

实现侧覆盖：

- `src/App.tsx`
- `src/components/views/HomeView.tsx`
- `src/components/menubar/MenuBarPanel.tsx`
- `src/styles/app.css`

## 截图证据

截图目录：`docs/regression-artifacts/2026-06-12/`

基准截图：

- `reference-workbench-home.png`：`1512x900`
- `reference-statusbar-panel.png`：`422x768`

改造前截图：

- `current-workbench-home-before.png`
- `current-statusbar-panel-before.png`

改造后截图：

- `after-workbench-home.png`
- `after-statusbar-panel.png`

像素差异：

- `diff-workbench-home.png`
- `diff-statusbar-panel.png`
- `pixel-diff-metrics.txt`

## 截图命令

```bash
pnpm exec vite --host 127.0.0.1 --port 1421

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1512,900 --screenshot=docs/regression-artifacts/2026-06-12/after-workbench-home.png http://127.0.0.1:1421/

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless=new --disable-gpu --hide-scrollbars --window-size=422,768 --screenshot=docs/regression-artifacts/2026-06-12/after-statusbar-panel.png 'http://127.0.0.1:1421/?panel=1'
```

Chrome headless 在 macOS 下输出了 `task_policy_set` 进程策略告警，但 PNG 文件正常写出。

## 像素差异

记录文件：`docs/regression-artifacts/2026-06-12/pixel-diff-metrics.txt`

```text
workbench: size=1512x900, changed_pixels=323510/1360800 (23.77%), mean_abs_delta=10.78, rms_delta=21.70
statusbar: size=422x768, changed_pixels=140399/324096 (43.32%), mean_abs_delta=10.95, rms_delta=20.99
```

主要差异来源：

- React 侧使用现有 `HarnessLogo`，参考 HTML 使用内联 shard SVG。
- React 侧渲染实时 fixture 时间，参考图固定为 `6月11日 14:46`。
- React 侧保留 fixture/Tauri 数据路径，部分审计详情和目标健康度文案来自浏览器 fixture。
- statusbar 在同等 viewport 下按参考图裁切到“本机运维”区域，footer 位于截图下方。

## 功能回归

已运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
```

结果：

- `pnpm lint` 通过。
- `pnpm typecheck` 通过。
- `pnpm test` 通过，`src/App.test.tsx` 14 项测试全部通过。

## 验收结论

主工作台已经从旧的横向 topbar + 两栏列表改为参考图的三栏 command deck：左侧导航 rail、中间 stage、右侧证据抽屉、首页 hero 健康卡和闭环分段。

菜单栏面板已经从旧的原生 chrome 紧凑列表改为参考图的 statusbar bento panel：menubar 标识、capsule header、health strip、实践健康度、本机运维和快捷入口结构。
