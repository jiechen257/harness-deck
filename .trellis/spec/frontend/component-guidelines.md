# 组件规范

## 组件形态

每个组件是一个独立文件中的函数组件，使用 typed props。文件名与组件名一致（PascalCase）。

### 示例：视图组件

```tsx
// src/components/views/LocalReviewView.tsx
import { useEffect, useState } from "react";
import { listDriftTimeline } from "../../lib/api";
import type { DriftTimelineItem, Locale } from "../../lib/types";

interface LocalReviewViewProps {
  locale: Locale;
}

export function LocalReviewView({ locale }: LocalReviewViewProps) {
  const [items, setItems] = useState<DriftTimelineItem[]>([]);

  useEffect(() => {
    listDriftTimeline().then(setItems);
  }, []);

  return (
    <section className="view-section">
      <h2>{locale === "zh-CN" ? "本地评审" : "Local Review"}</h2>
      <span>{items.length}</span>
    </section>
  );
}
```

## 组件分层

| 层级 | 目录 | 职责 |
|------|------|------|
| Shell | `App.tsx` | 窗口判断、全局键盘快捷键、locale/theme、工作台三栏布局 |
| 面板 | `components/menubar/` | 菜单栏弹出面板 |
| 视图 | `components/views/` | 6 个当前业务视图各自独立 |
| 共享 | `components/shared/` | 跨视图复用的 UI 片段 |

## 数据流

- 组件通过 props 接收 `locale`、必要回调和 view-local 数据。
- Tauri IPC 调用保持在 `lib/api.ts` 中，组件调用 typed 封装函数，不直接调用 `invoke()`。
- `api.ts` 中的 fallback 确保 `pnpm dev`（浏览器）无需 Rust 后端即可运行。

### API 双路径模式

```tsx
// src/lib/api.ts
async function call<T>(cmd: string, args: Record<string, unknown>, fallback: () => T): Promise<T> {
  if (!isTauriEnv()) return fallback();
  return invoke<T>(cmd, args);
}

export async function listPractices(): Promise<PracticeCard[]> {
  return call("list_practices", {}, () => fallbackPractices.map(copyPractice));
}
```

## 视觉方向

- 浅色主题：Practice Shard 工作台的浅色 Bento token、低饱和背景、蓝色主操作。
- 深色主题：同一信息层级下的深色 token。
- 密集的开发者工具布局，清晰分隔线，紧凑控件，三栏工作台。
- 不使用星宿名作为功能标签，不使用营销风格 hero。

## 控件

- 图标按钮（`lucide-react`）用于紧凑命令。
- 分段控件用于 locale/theme/target 切换。
- 侧边栏导航按钮：6 个主视图，不通过 Usage/Insights 替换 Local Review/Operations。
- 状态标签用于 risk、confidence、authorization、fixture、audit、disabled 等状态。

## 无障碍

- 按钮必须有可见文本或 `aria-label`。
- 键盘焦点样式必须可见。
- 状态颜色必须搭配文字，不能仅靠颜色区分。
- 导航使用 `aria-current="page"` 标识当前视图。
