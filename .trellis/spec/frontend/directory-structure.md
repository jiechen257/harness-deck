# 前端目录结构

前端代码位于 `src/`，按职责分层组织。

```text
src/
  main.tsx
  App.tsx                         # Shell：窗口判断、五视图路由、快捷键、locale/theme
  App.test.tsx                    # Shell 级集成测试
  components/
    menubar/
      MenuBarPanel.tsx            # 菜单栏面板
    shared/
      HarnessLogo.tsx
      LoopStepper.tsx
    views/
      HomeView.tsx                # 闭环健康度和下一步队列
      PracticeLibraryView.tsx     # Discover：signals -> practices -> local assets
      UsageView.tsx               # 本地 usage/cost 观测
      InsightsView.tsx            # 洞察、投射健康度、审计轨迹
      SettingsView.tsx            # registry、BYOA、授权、审计
      ProjectionPlanView.tsx      # Projection plan 详情入口，由 Discover 资产流打开
  constants/
    copy.ts
    navigation.ts                 # 五个主导航项
    types.ts                      # ViewId、NavItem
  hooks/
    useLocale.ts
    useTheme.ts
  lib/
    api.ts                        # 唯一 Tauri invoke 封装
    types.ts                      # TypeScript domain mirror
  styles/
    app.css
  test/
    setup.ts
```

## 路由

当前无路由库，视图切换使用 `activeView: ViewId`。`ViewId` 允许隐藏详情页 `apply`，但主导航只渲染 Home、Discover、Usage、Insights、Settings。

菜单栏面板通过 `index.html?panel=1` 渲染，同样挂在 `App.tsx`。

## 拆分原则

- 每个视图一个文件；复杂区块可继续拆分到同目录子组件。
- `lib/api.ts` 保持为唯一 `invoke()` 入口。
- `lib/types.ts` 镜像 Rust domain 的 camelCase serde 输出。
- `constants/navigation.ts` 只声明主导航，不混入详情页。
