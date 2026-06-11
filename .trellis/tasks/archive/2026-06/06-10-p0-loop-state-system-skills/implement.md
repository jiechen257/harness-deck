# Implementation Plan

## Checklist

1. 阅读相关规范：
   - `.trellis/spec/frontend/index.md`
   - `.trellis/spec/backend/index.md`
   - `.trellis/spec/guides/cross-layer-thinking-guide.md`
2. 后端补齐 domain types、db repository 查询和 commands。
3. 实现 `get_loop_summary` 聚合。
4. 实现 `normalize_signal` system skill 调用和错误映射。
5. 前端补齐 TS 类型和 API wrapper。
6. 改造 `HomeView` 使用真实 summary。
7. 改造 `PracticeLibraryView` 使用真实 Signal/Practice/Asset 状态机。
8. 更新 tests：
   - React：导航、refresh 未授权、normalize preview、confirm draft。
   - Rust：practice/asset/status repo、loop summary、normalize error path。
9. 运行验证。

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
```

## Risk Points

- System skill 返回 JSON 不稳定，必须防御 parse failure。
- Browser fallback 不能被误认为真实 MVP 数据。
- Home summary 不应在前端重复拼装业务统计。
- 未授权 refresh 不能静默失败。

## Rollback

- 保留 fallback 数据。
- 新 commands 出错时只影响对应视图，不破坏 App 启动。
- Schema 变更必须兼容旧数据库。
