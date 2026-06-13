# 类型安全

## TypeScript 规则

- 所有前端源码使用 TypeScript。
- `@typescript-eslint/no-explicit-any` 设为 `error`——禁止 `any`。
- 使用显式联合类型定义领域枚举：

```tsx
// src/lib/types.ts — 共享领域类型
export type Locale = "zh-CN" | "en-US";
export type Theme = "light" | "dark";
export type TargetKind = "Codex" | "ClaudeCode";
export type OperationType = "CreateFile" | "UpdateFile" | "AppendBlock" | "ReplaceBlock" | "Noop";
export type RiskLevel = "Low" | "Medium" | "High" | "Blocked";
export type DataConfidence = "Official" | "LocalLog" | "Estimated" | "Missing";
export type WakeMode = "StandardAwake" | "TimedAwake" | "DisplaySleep" | "ExperimentalLidAwake";
```

```tsx
// src/constants/types.ts — 前端独有类型
export type ViewId =
  | "home" | "discover" | "profiles" | "sync"
  | "operate" | "usage" | "insights" | "guard" | "settings";

export interface NavItem {
  id: ViewId;
  icon: React.ComponentType;
  matches?: ViewId[];
  zh: string;
  en: string;
}
```

## Rust / TypeScript 契约

所有 Rust domain 结构体使用 `#[serde(rename_all = "camelCase")]`。TypeScript 接口必须精确镜像 camelCase 字段名：

```rust
// Rust 侧
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileSummary {
    pub id: String,
    pub mcp_references: usize,   // 序列化为 "mcpReferences"
}
```

```tsx
// TypeScript 侧
export interface ProfileSummary {
  id: string;
  mcpReferences: number;         // 匹配 camelCase serde 输出
}
```

后端字段变更时，必须在同一次提交中更新 TypeScript 类型和测试。

## Copy 类型

`copy` 对象使用 `satisfies Record<Locale, Record<string, string>>` 确保两种语言有相同的 key：

```tsx
// src/constants/copy.ts
export const copy = {
  "zh-CN": { title: "HarnessDeck 命令中心", /* ... */ },
  "en-US": { title: "HarnessDeck Command Center", /* ... */ },
} satisfies Record<Locale, Record<string, string>>;

export type CopyStrings = (typeof copy)["zh-CN"];
```

组件通过 `CopyStrings` 类型接收 copy 对象，而不是通用的 `Record<string, string>`。

## 验证

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint + no-explicit-any = error
```
