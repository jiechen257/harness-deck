# 前端目录结构

前端代码位于 `src/`，按职责分层组织。

## 目录布局

```text
src/
  main.tsx                          # React 入口
  App.tsx                           # 应用 Shell：窗口判断、布局骨架、键盘快捷键
  App.test.tsx                      # App Shell 级测试（窗口路由、快捷键）
  components/
    workbench/
      Workbench.tsx                 # 主窗口：侧边栏 + 内容区 + 工具栏
      Sidebar.tsx                   # 导航侧边栏
    menubar/
      MenuBarPanel.tsx              # 菜单栏弹出面板
      NativeStatusDashboard.tsx     # 状态仪表盘卡片
    views/
      HomeView.tsx                  # 首页/控制台
      ProfileView.tsx               # 配置集视图
      SyncView.tsx                  # 同步视图（deploy plan、dry-run）
      DiscoverView.tsx              # 发现视图
      OperateView.tsx               # 运行视图
      InsightsView.tsx              # 洞察视图
      GuardView.tsx                 # 守护视图
      UsageView.tsx                 # 用量视图
      SettingsView.tsx              # 设置视图
    shared/
      MacChrome.tsx                 # macOS 窗口铬装饰
      ProductMark.tsx               # 产品标识
  hooks/
    useLocale.ts                    # locale 状态 + localStorage 持久化
    useTheme.ts                     # theme 状态 + localStorage 持久化
  constants/
    copy.ts                         # zh-CN / en-US 翻译文案
    navigation.ts                   # navItems、viewLabels、secondaryViews 映射
    types.ts                        # 前端独有类型（ViewId、NavItem）
  lib/
    api.ts                          # Tauri invoke 封装 + 浏览器 fixture 回退
    types.ts                        # 共享 TypeScript 类型，镜像 Rust domain
  styles/
    app.css                         # CSS 自定义属性，[data-theme="dark"]
  test/
    setup.ts                        # Vitest/jsdom 测试配置
```

## 拆分原则

| 原则 | 说明 |
|------|------|
| **组件按功能域拆文件** | 每个视图一个文件，每个独立 UI 区块一个文件；文件名即组件名 |
| **hooks 抽离** | 含副作用或可复用的状态逻辑提取为自定义 hook |
| **常量与组件分离** | 静态配置（导航项、文案、映射表）放 `constants/`，不混在组件逻辑中 |
| **lib/ 保持不变** | `api.ts` 和 `types.ts` 职责清晰，继续作为数据层和类型层 |
| **测试跟随组件** | 可按组件/视图拆分测试文件，也可保留单个 `App.test.tsx` 做集成测试 |

## 路由

当前无路由库，视图切换使用 React 状态（`activeView: ViewId`）。如果视图数量或导航复杂度增长，可以引入路由方案。菜单栏面板通过 `?panel=1` URL 参数区分：

```tsx
// src/App.tsx — Shell 层判断
const isPanel = new URLSearchParams(window.location.search).get("panel") === "1";
if (isPanel) return <MenuBarPanel />;
return <Workbench />;
```

## 关键文件职责

| 文件 | 职责 |
|------|------|
| `App.tsx` | Shell 层：判断 panel/workbench、挂载全局键盘快捷键、提供 locale/theme 上下文 |
| `components/workbench/Workbench.tsx` | 主窗口布局：侧边栏 + 视图容器 + 工具栏 |
| `components/workbench/Sidebar.tsx` | 导航侧边栏，消费 `constants/navigation.ts` |
| `components/views/*.tsx` | 各业务视图，接收 locale 和 copy 作为 props |
| `hooks/useLocale.ts` | locale 状态管理 + localStorage 同步 |
| `hooks/useTheme.ts` | theme 状态管理 + localStorage 同步 |
| `constants/copy.ts` | 中英文文案对象，独立维护 |
| `constants/navigation.ts` | 导航项定义、视图标签、二级视图映射 |
| `lib/api.ts` | 唯一调用 `invoke()` 的文件 |
| `lib/types.ts` | 所有共享接口和联合类型 |

## 资源

优先使用 CSS/token 化视觉表达。图标当前来自 `lucide-react`，可按需替换。避免不必要的大型装饰图片。
