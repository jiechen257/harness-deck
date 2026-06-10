# Hone System Practice Skills 执行计划

## Implementation Checklist

1. 创建 `src-tauri/bundled-skills/` 目录，编写三个 SKILL.md：
   - `intake-source-research/SKILL.md` — 信息源挖掘和相关性评分
   - `normalize-practice-card/SKILL.md` — 信号转实践卡片
   - `local-harness-review/SKILL.md` — 本地 harness 资产结构 review
2. 在 `db/schema.rs` 添加 `system_skill_configs` 表到 migration。
3. 创建 `db/skill_config_repo.rs` — get / set_enabled / list_all。
4. 创建 `domain/system_skill.rs` — `SystemSkillMeta`、`SkillExecutionResult`。
5. 创建 `services/skill_service.rs`：
   - `load_skill(registry_path, skill_id)` — 从 registry 读取 SKILL.md，解析 frontmatter + template
   - `execute_skill(db, skill_id, variables, agent_kind)` — 替换变量 → invoke agent → parse → audit
   - `list_system_skills(db)` — 返回 skill configs + bundled metadata
   - `seed_bundled_skills(registry_path)` — 首次启动写入 registry
6. 创建 `commands/skill_commands.rs`：
   - `list_system_skills` — 列出所有 system skill 及状态
   - `execute_system_skill` — 执行指定 skill
   - `toggle_system_skill` — 启用/禁用
7. 在 `lib.rs` 注册 skill commands 和首次启动 seed。
8. 在 `api.ts` 和 `types.ts` 添加前端类型和 API。
9. 编写测试：
   - SKILL.md 解析（frontmatter + template 变量替换）
   - skill config CRUD
   - seed_bundled_skills 幂等性
   - execute_skill 输出结构化和 audit 记录
10. 运行 `cargo test` 和 `pnpm typecheck`。

## Validation

```bash
cargo test --manifest-path src-tauri/Cargo.toml -- skill
pnpm typecheck
ls src-tauri/bundled-skills/*/SKILL.md
```

## Risk Points

- SKILL.md 的 prompt template 需要足够通用，避免硬编码特定数据结构
- agent 调用是异步子进程，execute_skill 需要 async
- 首版不迁移前端 InsightsView 中的 `buildSuggestionPrompt`，只在后端提供可调用接口

## Rollback

新增文件删除即可：`bundled-skills/`、`skill_service.rs`、`skill_commands.rs`、`skill_config_repo.rs`、`domain/system_skill.rs`。
