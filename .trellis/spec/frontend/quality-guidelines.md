# 前端质量规范

## 测试结构

使用 `@testing-library/react` + `vitest` + `jsdom`。测试运行于 fixture 数据（无 Tauri 运行时）。

测试文件可以按组件拆分，也可以保留集成测试文件：

```text
src/
  App.test.tsx                           # Shell 级集成测试
  components/
    views/
      __tests__/
        ProfileView.test.tsx             # 视图级测试（可选）
        SyncView.test.tsx
  hooks/
    __tests__/
      useLocale.test.ts                  # Hook 单元测试（可选）
```

推荐做法：至少保留 `App.test.tsx` 做端到端集成测试（渲染 App，验证各视图的完整流程）。独立视图或 hook 的复杂度超过一定阈值时再拆分测试文件。

### 测试覆盖区域

| 区域 | 验证内容 |
|------|----------|
| Locale | 默认 zh-CN 渲染；切换英文后文案变化 |
| Theme | 默认 light `data-theme`；切换 dark 后属性变化 |
| 导航 | 侧边栏按钮、`aria-current="page"`、键盘快捷键（Cmd+1-9、Cmd+,、Escape） |
| 配置集 | Fixture 配置集列表渲染、目标选择器 |
| 同步 | Deploy plan 预览、dry-run 确认、manifest 结果 |
| 同步治理 | 三方 diff、冲突队列、漂移检测、回滚预览 |
| 目标发现 | 未授权时阻止、授权后可见 |
| 用量 | 指标及置信度标签（LocalLog、Estimated、Missing） |
| 账号 | Keychain 引用可见、密钥值隐藏 |
| 守护 | 隐私、备份、真实写入保护策略 |
| 注册表 | 模板列表、find-best-skill 评分、无远程调用 |
| 洞察 | 本地规则洞察、高优先 feed 项 |
| 防睡 | Wake 模式、实验性 lid-awake 需要确认 |
| 菜单栏面板 | `?panel=1` 渲染独立面板，含 profile/sync/cost/wake |

### 测试示例

```tsx
// src/App.test.tsx
it("从默认浅色主题切换到深色", async () => {
  const user = userEvent.setup();
  render(<App />);

  const shell = screen.getByTestId("app-shell");
  expect(shell).toHaveAttribute("data-theme", "light");

  await user.click(screen.getByRole("button", { name: "深色" }));
  expect(shell).toHaveAttribute("data-theme", "dark");
});
```

## 设计约束

- 首屏是可用的工作台（带状态控制台），不是落地页。
- 主窗口有 9 个视图，通过 5 个导航组 + 二级子标签页访问。
- 菜单栏面板展示当前配置集、同步状态、成本、防睡状态、快捷操作。
- 卡片圆角不超过 8px。
- 原生体感：系统字体、非交互元素默认光标、屏蔽 WebKit 右键菜单。

## 无障碍

- 每个交互控件需要文本标签或 `aria-label`。
- 不依赖颜色区分风险或状态——必须搭配文字标签。
- 确保浅色和深色主题下的对比度。
- 导航使用 `role="navigation"` 配合 `aria-label="Workbench views"`。

## 验证命令

```bash
pnpm lint       # eslint，零警告
pnpm typecheck  # tsc --noEmit
pnpm test       # vitest run (jsdom)
```

视觉类工作用 `pnpm dev` 在浏览器验证，或 `pnpm tauri:dev` 启动完整桌面应用。
