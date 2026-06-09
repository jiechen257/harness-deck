# 实施计划：真实数据接入

## 执行顺序

分 5 个子任务，按依赖关系排序。child-1/2/3 无依赖可并行，child-4 依赖 child-1，child-5 依赖 child-1 + child-2。

```
Phase A (并行):  child-1: target-and-profiles
                 child-2: usage-and-insights  
                 child-3: registry-skills

Phase B:         child-4: sync-governance (依赖 child-1 的 reader)

Phase C:         child-5: account-home-menubar (聚合 child-1 + child-2 的数据)
```

---

## Child-1: Target Discovery + Profiles (R1 + R2)

### Rust 后端

- [ ] 1.1 添加 `toml` crate 到 `Cargo.toml`
- [ ] 1.2 创建 `src-tauri/src/readers/mod.rs`
- [ ] 1.3 实现 `readers/sanitizer.rs`（env 脱敏、path 缩短）
- [ ] 1.4 实现 `readers/claude_reader.rs`
  - 读取 `~/.claude/settings.json` → ClaudeSettings
  - 读取 `~/.claude.json` → MCP 服务器列表、startup count
  - 统计 `~/.claude/skills/` 目录数
  - 统计 `~/.claude/projects/` 目录数
  - 读取 `~/.claude/plugins/installed_plugins.json`
- [ ] 1.5 实现 `readers/codex_reader.rs`
  - 读取 `~/.codex/config.toml` → CodexTomlConfig
  - 读取 `~/.codex/version.json`
  - 统计 `~/.codex/skills/` 目录数
  - 统计 `~/.codex/session_index.jsonl` 行数
- [ ] 1.6 扩展 `domain/target.rs`：新增 `RealTargetConfig` 和 `TargetConfigSummary`
- [ ] 1.7 修改 `services/target_integration_service.rs`：`discover_real_targets()` 调用 readers
- [ ] 1.8 扩展 `domain/profile.rs`：新增 `RealProfile` 类型
- [ ] 1.9 修改 `services/profile_service.rs`：`build_real_profiles()` 从 readers 聚合
- [ ] 1.10 更新 `commands/target_commands.rs` 和 `commands/profile_commands.rs`
- [ ] 1.11 在 `lib.rs` 中注册新 module

### 前端

- [ ] 1.12 更新 `lib/types.ts`：新增 `RealTargetConfig`、`TargetConfigSummary`、`RealProfile` 类型
- [ ] 1.13 更新 `lib/api.ts`：更新 fixture fallback 匹配新类型
- [ ] 1.14 更新 `ProfileView.tsx`：展示真实配置数据
- [ ] 1.15 更新 `SyncView.tsx` 的目标发现部分

### 验证

```bash
cargo test --manifest-path src-tauri/Cargo.toml
pnpm typecheck && pnpm lint && pnpm test
```

---

## Child-2: Usage + Insights (R3 + R4)

### Rust 后端

- [ ] 2.1 添加 `rusqlite` crate 到 `Cargo.toml`（features = ["bundled"]）
- [ ] 2.2 扩展 `readers/claude_reader.rs`：读取 `stats-cache.json` → ClaudeStats
- [ ] 2.3 扩展 `readers/codex_reader.rs`：读取 `state_5.sqlite` threads 表统计
- [ ] 2.4 扩展 `domain/usage.rs`：新增 `RealUsageSummary`、`DailyActivity`、`ModelUsageEntry`
- [ ] 2.5 修改 `services/usage_service.rs`：`real_usage_summary()` 聚合 stats-cache + SQLite
- [ ] 2.6 扩展 `domain/insight.rs`：新增 `RealInsight`、`InsightCategory`
- [ ] 2.7 修改 `services/insight_service.rs`：`real_insights()` 基于真实数据分析
  - Token 异常：dailyActivity 中超过 2σ 的日期
  - 配置漂移：Claude vs Codex MCP/model 差异
  - Skill 使用热度：从 `~/.claude.json` 的 skillUsage 提取 top-5
  - 活跃会话：从 sessions 目录读取
- [ ] 2.8 更新 `commands/usage_commands.rs` 和 `commands/insight_commands.rs`

### 前端

- [ ] 2.9 更新 `lib/types.ts`：新增 usage 和 insight 真实类型
- [ ] 2.10 更新 `lib/api.ts` fixture fallback
- [ ] 2.11 更新 `UsageView.tsx`：展示真实 token/cost/session 数据
- [ ] 2.12 更新 `InsightsView.tsx`：展示真实洞察

### 验证

```bash
cargo test --manifest-path src-tauri/Cargo.toml
pnpm typecheck && pnpm lint && pnpm test
```

---

## Child-3: Registry / Skills (R5)

### Rust 后端

- [ ] 3.1 实现 `readers/skill_scanner.rs`
  - 扫描 `~/.claude/skills/` 和 `~/.codex/skills/`
  - 读取每个 SKILL.md 前 20 行提取标题和描述
- [ ] 3.2 扩展 `domain/registry.rs`：新增 `LocalSkillEntry`
- [ ] 3.3 修改 `services/registry_service.rs`：`local_skill_registry()` 和 `find_best_skill()` 基于真实 skill 列表
- [ ] 3.4 更新 `commands/registry_commands.rs`

### 前端

- [ ] 3.5 更新 `lib/types.ts`：新增 `LocalSkillEntry`
- [ ] 3.6 更新 `lib/api.ts` fixture fallback
- [ ] 3.7 更新 `DiscoverView.tsx`：展示本机 skill 列表（分 claude/codex 标签）

### 验证

```bash
cargo test --manifest-path src-tauri/Cargo.toml
pnpm typecheck && pnpm lint && pnpm test
```

---

## Child-4: Sync Governance (R6)

依赖 child-1 的 reader 模块。

### Rust 后端

- [ ] 4.1 修改 `services/sync_governance_service.rs`：`real_sync_governance()`
  - 对比 Claude Code vs Codex MCP 服务器差异
  - 对比 permissions/hooks 差异
  - 生成真实的 diff 视图
- [ ] 4.2 更新 `domain/sync.rs`：扩展 diff 类型以支持真实路径
- [ ] 4.3 更新 `commands/deploy_commands.rs`

### 前端

- [ ] 4.4 更新 `lib/types.ts`
- [ ] 4.5 更新 `SyncView.tsx` 的治理部分：展示真实差异

### 验证

```bash
cargo test --manifest-path src-tauri/Cargo.toml
pnpm typecheck && pnpm lint && pnpm test
```

---

## Child-5: Account + Home Dashboard + Menubar Panel (R8 + R9 + R10)

依赖 child-1 和 child-2 的数据。

### Rust 后端

- [ ] 5.1 修改 `services/account_service.rs`：`real_account_workspace()` 从 readers 聚合
- [ ] 5.2 新增 service 函数：`calculate_health_score()` 基于真实指标
  - 配置存在性（settings + config 各项）
  - MCP 连接数
  - Skill 覆盖率
  - 近期活跃度
- [ ] 5.3 新增 command：`get_health_score` 或合并到 `get_app_status`
- [ ] 5.4 更新 `commands/account_commands.rs`

### 前端

- [ ] 5.5 更新 `SettingsView.tsx`：展示真实 model/editor/theme
- [ ] 5.6 更新 `HomeView.tsx`：健康分动态计算、卡片数字真实化
- [ ] 5.7 更新 `MenuBarPanel.tsx`：状态行接入真实数据、Refresh 实现重新读取

### 验证

```bash
cargo test --manifest-path src-tauri/Cargo.toml
pnpm typecheck && pnpm lint && pnpm test
pnpm tauri:dev  # 完整 Tauri 应用验证
```

---

## 最终集成验证

- [ ] `pnpm tauri:dev` 启动，所有视图展示真实数据
- [ ] `pnpm dev` 在浏览器中用 fixture fallback 正常运行
- [ ] 删除 `~/.claude/` 模拟不存在场景，验证 graceful fallback
- [ ] 检查 IPC 通道无 API key 泄漏
- [ ] 全量测试通过

## Rollback

每个子任务的变更限制在 readers + 对应 service + 对应 view。如果某个子任务出问题，可以在 service 层切回 fixture 函数，不影响其他子任务。
