# Hone 产品原型执行计划

## Implementation Checklist

1. 创建 `docs/product-design/hone-practice-operations-prototype.html` 单文件原型。
2. 定义原型视觉系统：浅色默认、深色可切换、macOS 窗口 chrome、密集状态面板、低装饰背景。
3. 实现品牌区域和 `Logo Lab`：
   - 内联绘制 `Loop Projection`、`Practice Compass`、`Registry Weave`、`Audit Orbit` 四套 logo。
   - 每套 logo 展示 app icon、workbench title、MenuBar panel 三个预览。
   - 支持点击 logo 方案更新原型当前品牌预览。
4. 实现主应用 shell：
   - 顶部命令栏。
   - MenuBar panel preview。
   - 工作台主导航：`Home`、`Practice Library`、`Apply & Sync`、`Local Review`、`Operations`、`Settings`。
5. 实现 `Home` 闭环状态总览：
   - Signals、Practices、Local Assets、Review、Operations 五个状态块。
   - 入口连接到对应主视图。
6. 实现 `Practice Library`：
   - `Signals | Practices | Assets | Archived` 管道。
   - Signal normalize preview。
   - Practice Card detail。
7. 实现 `Apply & Sync`：
   - registry -> Claude Code / Codex projection graph。
   - symlink 默认、copy fallback、conflict、adopt、backup、rollback、audit 状态。
8. 实现 `Local Review`：
   - drift、orphan、missing、redundant、replacement 建议。
   - review evidence 和 affected target。
9. 实现 `Operations`：
   - `~/start-codex.sh`、`~/dsleep`、`~/dwake` 脚本状态。
   - 风险等级、确认入口、最近执行和 audit。
10. 实现 `Settings / First Run`：
   - registry、本地读取、外部 signals、写入投射、脚本执行的分步授权。
11. 补响应式样式，确保桌面和窄屏布局不重叠。
12. 运行静态验证并用浏览器检查原型。

## Validation

静态文案检查：

```bash
rg -n 'TB''D|TO''DO|place''holder|待''定|未''定|不''确定|不是.*而''是|not .*b''ut' docs/product-design/hone-practice-operations-prototype.html .trellis/tasks/06-10-product-prototype
```

结构检查：

```bash
rg -n 'Logo Lab|Loop Projection|Practice Compass|Registry Weave|Audit Orbit|Signals|Practices|Local Assets|Apply & Sync|Local Review|Operations|First Run' docs/product-design/hone-practice-operations-prototype.html
```

浏览器检查：

- 打开 `docs/product-design/hone-practice-operations-prototype.html`。
- 检查主导航切换、Logo Lab 切换、Signal preview、projection conflict/adopt 状态、first-run step 展示。
- 检查 1440px 桌面和移动窄屏下文本不重叠、不溢出。

## Risk Points

- 原型容易退回资讯列表，需要让 Home 和 Practice Library 都以闭环状态和处理队列为主。
- Logo Lab 不能只做装饰图标，必须展示每个方向在真实产品位置中的效果。
- Apply & Sync 不能出现无确认的一键写入心智，所有安装相关表达都必须是 preview / plan / confirm / audit。
- MenuBar panel 不能变成长资讯流或脚本启动器，应保持每日状态入口。

## Rollback

本子任务只新增一个 HTML 原型和 Trellis 文档。若方向不满意，可以删除 `docs/product-design/hone-practice-operations-prototype.html`，保留 PRD / design / implement 作为决策记录，重新生成另一版原型。
