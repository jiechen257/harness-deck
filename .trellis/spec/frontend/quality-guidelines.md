# 前端质量规范

## 测试结构

使用 `@testing-library/react` + `vitest` + `jsdom`。测试运行于浏览器 fallback 数据或 mock Tauri IPC。

测试文件可以按组件拆分，也可以保留集成测试文件：

```text
src/
  App.test.tsx
  components/
    views/
      __tests__/
        PracticeLibraryView.test.tsx
        ApplySyncView.test.tsx
```

推荐做法：至少保留 `App.test.tsx` 做 Shell 级集成测试（渲染 App，验证 6 视图、快捷键和 panel/window 分支）。独立视图或 hook 的复杂度超过一定阈值时再拆分测试文件。

## 测试覆盖区域

| 区域 | 验证内容 |
|------|----------|
| Locale | 默认 zh-CN 渲染；切换英文后文案变化 |
| Theme | 默认 light `data-theme`；切换 dark 后属性变化 |
| 导航 | 6 个侧边栏按钮、`aria-current="page"`、键盘快捷键（Cmd+1-6、Cmd+,、Escape） |
| 首页 | loop summary、行动队列、目标健康度 |
| 实践库 | signal 列表、normalize、Practice Card、local asset 创建 |
| 应用与同步 | projection target、preview、confirm、adopt、rollback |
| 本地评审 | projection health、drift timeline、evidence/finding |
| 运维 | ops script 预览、确认边界、状态标签 |
| 设置 | registry、授权、主题、audit trail |
| 菜单栏面板 | `?panel=1` 渲染独立面板，含健康度、快捷入口、打开工作台 |

## 设计约束

- 首屏是可用的工作台（带状态控制台），不是落地页。
- 主窗口有 6 个当前主视图：Home、Practice Library、Apply & Sync、Local Review、Operations、Settings。
- 菜单栏面板展示闭环健康度、实践健康度、本机运维状态和快捷操作。
- 当前 Practice Shard 工作台按原型 token 使用 `10px / 16px / 24px / pill` 半径层级；如果某个旧视图仍在用非原型样式，优先对齐 `docs/product-design/screens/workbench-home.html`，不要再回退到旧的 8px 上限。
- 原生体感：系统字体、非交互元素默认光标、屏蔽 WebKit 右键菜单。

## 无障碍

- 每个交互控件需要文本标签或 `aria-label`。
- 不依赖颜色区分风险或状态，必须搭配文字标签。
- 确保浅色和深色主题下的对比度。
- 导航使用 `role="navigation"` 配合 `aria-label="Workbench views"`。

## 验证命令

```bash
pnpm lint
pnpm typecheck
pnpm test
```

视觉类工作用 `pnpm dev` 在浏览器验证，或 `pnpm tauri:dev` 启动完整桌面应用。桌面 UI 改动需要验证主窗口和 `?panel=1` 菜单栏面板。
