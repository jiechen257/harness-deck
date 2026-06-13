# 组件规范

## 组件形态

每个组件是一个独立文件中的函数组件，使用 typed props。文件名与组件名一致（PascalCase）。

### 示例：视图组件

```tsx
// src/components/views/UsageView.tsx
import { useEffect, useState } from "react";
import { getUsageSummary } from "../../lib/api";
import type { Locale, UsageSummary } from "../../lib/types";
import type { CopyStrings } from "../../constants/copy";

interface UsageViewProps {
  locale: Locale;
  t: CopyStrings;
}

export function UsageView({ locale, t }: UsageViewProps) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    getUsageSummary().then(setUsage);
  }, []);

  if (!usage) return null;
  return (
    <section className="view-section">
      <h2>{locale === "zh-CN" ? "用量与成本" : "Usage & Cost"}</h2>
      {/* ... */}
    </section>
  );
}
```

## 组件分层

| 层级 | 目录 | 职责 |
|------|------|------|
| Shell | `App.tsx` | 窗口判断、全局键盘快捷键、locale/theme 提供 |
| 布局 | `components/workbench/` | 主窗口骨架、侧边栏导航 |
| 面板 | `components/menubar/` | 菜单栏弹出面板及子组件 |
| 视图 | `components/views/` | 9 个业务视图，各自独立 |
| 共享 | `components/shared/` | 跨视图复用的 UI 片段 |

## 数据流

- 组件通过 props 接收 `locale`、`t`（copy 对象）和回调。
- Tauri IPC 调用保持在 `lib/api.ts` 中，组件调用 typed 封装函数，不直接调用 `invoke()`。
- `api.ts` 中的 fixture 回退确保 `pnpm dev`（浏览器）无需 Rust 后端即可运行。

### API 双路径模式

```tsx
// src/lib/api.ts
async function call<T>(cmd: string, args: Record<string, unknown>, fallback: () => T): Promise<T> {
  if (!isTauriRuntime()) return fallback();
  return invoke<T>(cmd, args);
}

export async function listProfiles(): Promise<ProfileSummary[]> {
  return call("list_profiles", {}, () => fallbackProfiles);
}
```

## 视觉方向

- 浅色主题：温暖金白底色、低饱和度强调色、深蓝与描金细节。
- 深色主题：午夜蓝表面、金色强调色。
- 密集的开发者工具布局，清晰分隔线，紧凑控件。
- 不使用星宿名作为功能标签，不使用营销风格 hero。

## 控件

- 图标按钮（`lucide-react`）用于紧凑命令。
- 分段控件用于 locale/theme/target 切换。
- 侧边栏导航按钮：5 个主导航组，次要视图通过子标签页切换。
- 状态标签用于 dry-run、fixture、risk、confidence、disabled 等状态。

## 无障碍

- 按钮必须有可见文本或 `aria-label`。
- 键盘焦点样式必须可见。
- 状态颜色必须搭配文字，不能仅靠颜色区分。
- 导航使用 `aria-current="page"` 标识当前视图。
