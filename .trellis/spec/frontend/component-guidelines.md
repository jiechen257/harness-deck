# 组件规范

## 组件形态

每个组件是独立文件中的函数组件，使用 typed props。文件名与组件名一致。

```tsx
interface UsageViewProps {
  locale: Locale;
}

export function UsageView({ locale }: UsageViewProps) {
  // view-local state and typed API calls
}
```

## 组件分层

| 层级 | 目录 | 职责 |
|------|------|------|
| Shell | `App.tsx` | 窗口判断、全局快捷键、五视图路由、locale/theme |
| 面板 | `components/menubar/` | 菜单栏弹出面板 |
| 视图 | `components/views/` | Home、Discover、Usage、Insights、Settings 和 projection 详情 |
| 共享 | `components/shared/` | Logo、stepper 等复用 UI |

## 数据流

- 组件通过 props 接收 `locale`、`theme` 和回调。
- Tauri IPC 调用保持在 `lib/api.ts` 中，组件调用 typed 封装函数。
- 浏览器模式 fallback 可以用于开发预览，但 Tauri 路径必须接真实 command。

## 控件

- 图标优先使用 `lucide-react`。
- 主导航按钮必须有 `aria-label` 和 `aria-current="page"`。
- 分段控件用于视图内部 tab。
- Toggle/checkbox 用于授权开关。
- 状态标签必须包含文字，不只靠颜色表达。

## 视觉方向

- 浅色主题：浅金白底、低饱和星图、深蓝/鎏金点缀。
- 深色主题：玄夜蓝、鎏金星图风格。
- 工作台首屏必须是可用产品界面，不做营销 landing。
- 卡片圆角不超过 8px。
