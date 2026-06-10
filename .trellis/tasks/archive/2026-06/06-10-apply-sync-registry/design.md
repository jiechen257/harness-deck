# Hone Apply & Sync Registry 投射设计

## Scope

实现 registry repo → Claude Code / Codex target 的安全投射 service 层。交付：projection plan 生成、symlink/copy 执行、conflict 检测、adopt flow、rollback、drift 检测、Tauri commands。不改 UI 布局。

## Architecture

### 投射流程

```text
1. plan_projection(db, registry_path, target_kind)
   -> 扫描 registry 中的 local_assets
   -> 对比 target 目录现有内容
   -> 生成 ProjectionPlan: Vec<ProjectionAction>

2. execute_projection(db, plan, confirmed=true)
   -> 逐项执行：创建 symlink / copy
   -> 冲突项跳过
   -> 写入 projections 表 + audit_events
   -> 返回执行结果

3. adopt_unmanaged(db, target_path, registry_dest)
   -> 检测 target 中未托管资产
   -> 用户确认后：copy 到 registry → backup 原 target → symlink
   -> 写入 local_assets + projections + audit

4. rollback_projection(db, projection_id)
   -> 删除 target symlink/copy
   -> 更新 projection status -> removed
   -> 不删除 registry 源文件

5. check_health(db, registry_path, target_kind)
   -> 检测 broken symlinks
   -> 检测 copy drift (checksum mismatch)
   -> 返回 Vec<HealthFinding>
```

### ProjectionAction

```rust
pub struct ProjectionAction {
    pub asset_id: String,
    pub registry_path: String,    // 相对路径
    pub target_path: String,      // 绝对路径
    pub mode: ProjectionMode,     // Symlink / Copy
    pub action: ActionType,       // Create / Update / Skip / Conflict
    pub conflict_reason: Option<String>,
}
```

### Target Adapter 复用

利用现有 `services/target_adapter.rs` 的 trait 获取 target 根目录：
- Claude Code: `~/.claude/skills/`
- Codex: `~/.codex/skills/`

首版只处理 skills 目录；rules/hooks/MCP 路径通过 asset_type 映射。

### 安全边界

- `execute_projection` 必须接收 `confirmed: bool`，未确认时只返回 plan 不执行
- adopt 逐项确认，不支持批量
- rollback 只删 target 侧 link/copy，registry 保持不变
- 每个写操作生成 audit event
- backup 放在 `HarnessDeckPaths.backups/` 下

## Rust 模块

```text
src-tauri/src/services/projection_service.rs
  -> plan_projection / execute_projection / adopt / rollback / check_health

src-tauri/src/domain/projection_plan.rs
  -> ProjectionAction / ProjectionPlan / ActionType / HealthFinding

src-tauri/src/commands/projection_commands.rs
  -> preview_projection / confirm_projection / adopt_asset / rollback_projection / check_projection_health
```
