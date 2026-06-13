# Hook 规范

## 当前 hooks

- `useLocale`：管理 `zh-CN` / `en-US`，持久化到 `localStorage`。
- `useTheme`：管理 `light` / `dark`，持久化到 `localStorage`。

## 规则

- 可复用副作用提取为自定义 hook。
- 单视图独有的数据加载留在视图内部。
- `useEffect` 中的异步加载要处理组件卸载或使用稳定 callback。
- 不在 hook 内直接调用未 typed 的 `invoke()`；统一通过 `lib/api.ts`。

## 示例

```tsx
const [usage, setUsage] = useState<RealUsageSummary | null>(null);

useEffect(() => {
  let alive = true;
  void getRealUsageSummary().then((next) => {
    if (alive) setUsage(next);
  });
  return () => {
    alive = false;
  };
}, []);
```
