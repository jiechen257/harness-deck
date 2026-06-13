# 前端目录结构

前端代码位于 `src/`，按当前 Hone Practice Shard 工作台分层组织。

## 目录布局

```text
src/
  main.tsx                         # React 入口
  App.tsx                          # 应用 Shell、工作台布局、panel/window 判断、快捷键
  App.test.tsx                     # App Shell 级集成测试
  components/
    menubar/
      MenuBarPanel.tsx             # 菜单栏弹出面板
    shared/
      ChevronRightIcon.tsx
      HarnessLogo.tsx
      LoopStepper.tsx
      MacChrome.tsx
      ProductMark.tsx
    views/
      HomeView.tsx                 # 首页：闭环状态、行动队列、健康度
      PracticeLibraryView.tsx      # 实践库：信号、Practice Card、本地资产
      ApplySyncView.tsx            # 应用与同步：projection plan、adopt、rollback
      LocalReviewView.tsx          # 本地评审：drift、evidence、findings
      OperationsView.tsx           # 运维：脚本预览、代理/防睡/显示器状态
      SettingsView.tsx             # 设置：registry、授权、主题
      DiscoverView.tsx             # 遗留/未来能力；不在当前主导航
      UsageView.tsx                # 遗留/未来能力；不在当前主导航
      InsightsView.tsx             # 遗留/未来能力；不在当前主导航
  constants/
    copy.ts                        # zh-CN / en-US 文案
    navigation.ts                  # 当前 6 视图导航
    types.ts                       # 前端独有类型
  hooks/
    useLocale.ts
    useTheme.ts
  lib/
    api.ts                         # Tauri invoke typed 封装 + 浏览器 fallback
    types.ts                       # TypeScript domain mirror
  styles/
    app.css
  test/
    setup.ts
```

## 拆分原则

| 原则 | 说明 |
|------|------|
| 组件按功能域拆文件 | 每个当前主视图一个文件，每个独立 UI 区块一个文件；文件名即组件名 |
| hooks 抽离 | 含副作用或可复用的状态逻辑提取为自定义 hook |
| 常量与组件分离 | 静态配置放 `constants/`，不混在组件逻辑中 |
| lib/ 保持唯一 IPC 边界 | `api.ts` 是前端唯一直接调用 `invoke()` 的文件 |
| 测试跟随组件 | 可按组件/视图拆分测试文件，也可保留单个 `App.test.tsx` 做集成测试 |

## 路由

当前无路由库，视图切换使用 React 状态（`activeView: ViewId`）。菜单栏面板通过 `?panel=1` URL 参数区分：

```tsx
const isPanel = new URLSearchParams(window.location.search).get("panel") === "1";
if (isPanel) return <MenuBarPanel />;
return <AppWorkbench />;
```

## 关键文件职责

| 文件 | 职责 |
|------|------|
| `App.tsx` | Shell 层：判断 panel/workbench、挂载全局快捷键、渲染左侧导航/中间画布/右侧证据抽屉 |
| `components/menubar/MenuBarPanel.tsx` | 菜单栏面板，支持独立窗口渲染 |
| `components/views/HomeView.tsx` | 当前产品闭环总览 |
| `components/views/PracticeLibraryView.tsx` | 信号规范化、Practice Card、本地资产创建 |
| `components/views/ApplySyncView.tsx` | projection 预览、确认、adopt、rollback |
| `components/views/LocalReviewView.tsx` | projection health、drift timeline、findings |
| `components/views/OperationsView.tsx` | 运维脚本和本机状态 |
| `components/views/SettingsView.tsx` | registry、授权、主题 |
| `hooks/useLocale.ts` | locale 状态管理 + localStorage 同步 |
| `hooks/useTheme.ts` | theme 状态管理 + localStorage 同步 |
| `constants/copy.ts` | 中英文文案对象 |
| `constants/navigation.ts` | 当前 6 视图导航项定义 |
| `lib/api.ts` | 唯一调用 `invoke()` 的文件 |
| `lib/types.ts` | 所有共享接口和联合类型 |

## 资源

优先使用 CSS/token 化视觉表达。图标当前来自 `lucide-react`。避免不必要的大型装饰图片。
