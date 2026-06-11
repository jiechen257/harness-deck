# P2 数据源 Registry Diff Adapter 优化

## Goal

在 P0/P1 可用闭环基础上补齐 MVP 体验的增强能力：官方/社区 source 分层、registry bootstrap、diff viewer、drift timeline、adapter capability 状态。

## Requirements

- 官方 changelog / 模型事实 source 优先，community source 只能作为 unverified signal。
- Source Card 必须展示 source tier、publishedAt、fetchedAt、confidence。
- MVP 优先识别用户已有 registry，例如 `/Users/zhici/work-pro/my-agent-skill`；没有时初始化 `~/HoneRegistry` 或使用 starter registry read-only。
- Apply & Sync 中对 copy fallback / drift / conflict 提供 diff viewer。
- Local Review 展示 drift timeline：首次检测时间、关联 projection/adopt/audit、可能来源。
- Adapter status 页面或区域展示 Claude Code / Codex detect/read/write/rollback 能力。
- Cursor/Windsurf/Claude Desktop 只显示未配置或后续支持，不执行真实写入。

## Acceptance Criteria

- [ ] Signal source list 区分 Official、Maintainer/Repository、Community。
- [ ] 模型事实没有 Official 来源时不能标记 confirmed。
- [ ] First-run / Settings 能识别或选择 existing registry、初始化新 registry、使用 starter registry read-only。
- [ ] Diff viewer 能展示 registry source 和 target content 的差异或说明二进制/缺失/无法读取。
- [ ] Local Review 能按 asset/projection 展示 drift timeline。
- [ ] Adapter status 能展示 Claude Code 和 Codex 的 detect/read/write/rollback capability。
- [ ] 非 MVP target 不提供真实写入按钮。
- [ ] 验证通过：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`cargo test --manifest-path src-tauri/Cargo.toml`。

## Out Of Scope

- 完整远端 registry 同步服务。
- 对非 Claude Code / Codex target 的真实写入。
- 发布渠道实现。
