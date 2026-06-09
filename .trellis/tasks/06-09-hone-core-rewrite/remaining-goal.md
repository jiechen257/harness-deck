# Hone 剩余任务 — Goal Prompt

## 背景

Hone（原 HarnessDeck）：Tauri 2 + React + TS + Rust macOS 桌面应用，帮助开发者发现、应用、优化 AI coding 范式。

**已完成**：Phase 1（BYOA + 导航 9→5 + 真实数据）和 Phase 2（4 平台爬取 + 关键词筛 + agent 排 + 一键安装 + Discover 重做）。验证全通过。工作区 45 文件未提交。

**剩余**：Phase 3（Insights 闭环 + MenuBar 重做）、CLAUDE.md 更新、提交。路线图在 `.trellis/tasks/06-09-hone-core-rewrite/prd.md`。

## 任务 1：Insights 闭环

在 `InsightsView.tsx` 为每条 `RealInsight` 加"生成优化建议"：

1. 卡片底部加"生成建议"按钮
2. 点击后把 `{category,title,summary,evidence}` + `getAppStatus().healthFactors` 打包 prompt，调 `invokeAgent()`
3. Agent 返回 JSON：`{suggestion,action:"CopySkill|AppendRule",target:"ClaudeCode|Codex",skillName,content}`
4. 展示预览卡片（动作类型、目标、内容摘要）
5. "应用"调 `installSkill()` 写入；"忽略"隐藏
6. 状态管理：`Map<insightId, {status:'idle'|'generating'|'ready'|'applied'|'dismissed', suggestion?}>`

验收：按钮可点 → loading → 预览卡片 → 应用/忽略工作 → 浏览器 fallback 提示 → typecheck+lint 零错误

## 任务 2：MenuBar 重做

重写 `MenuBarPanel.tsx` 内容区：

- **顶部**：今日热点标题（爬取 top 1，无则"点击更新热榜"）
- **中部**：待处理建议数 + 今日成本
- **底部**："更新热榜"（调 `crawlAllSources()`）+"打开工作台"
- App.tsx 传入 `pendingSuggestionCount` 和 `latestHotTitle`
- 删旧的 sync status / wake status / search bar，保留 MacChrome + Logo

验收：热点/建议数/成本显示 → 按钮工作 → test 通过 → 旧 UI 已删

## 任务 3：CLAUDE.md 更新

1. HarnessDeck → Hone
2. 简介更新为"发现、应用、优化 AI coding 范式"
3. 架构改为 5 视图 + 5-tab Settings
4. 后端新增 byoa / crawl / install 模块说明
5. 保留"添加新 Tauri 命令的流程"
6. 关键约定中 HarnessDeck → Hone

## 任务 4：提交

分 3 个 commit：
1. `feat: rename to Hone, restructure views 9→5, add BYOA pipeline`
2. `feat: add multi-platform crawl pipeline and one-click skill install`
3. `feat: add Insights feedback loop, redo MenuBar, update CLAUDE.md`

每 commit 前跑 `pnpm typecheck && pnpm lint && pnpm test && cargo test --manifest-path src-tauri/Cargo.toml`。

## 约束

- 双语 UI（zh-CN 默认），文案 inline `locale === "zh-CN" ? "..." : "..."`
- `no-explicit-any` 是 error
- Rust `#[serde(rename_all = "camelCase")]`
- 不删已有测试，只更新或新增

## 关键文件

| 文件 | 任务 |
|------|------|
| `src/components/views/InsightsView.tsx` | 1 |
| `src/components/menubar/MenuBarPanel.tsx` | 2 |
| `src/App.tsx` | 1+2 |
| `src/App.test.tsx` | 1+2 |
| `CLAUDE.md` | 3 |
| `src/lib/api.ts` | 已有 `invokeAgent()`/`installSkill()`/`crawlAllSources()` |
| `src/lib/types.ts` | 已有类型定义 |
