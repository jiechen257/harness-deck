# Hone System Practice Skills 设计

## Scope

把 Hone 内置的 agent 调用能力从硬编码 prompt 改成可管理的 System Practice Skill。交付：默认 SKILL.md 文件 + Rust 端 skill 加载/执行/追踪 service + SQLite 执行历史 + Tauri commands。不改 UI。

## Architecture

### Skill 文件结构

```text
src-tauri/bundled-skills/
  intake-source-research/SKILL.md
  normalize-practice-card/SKILL.md
  local-harness-review/SKILL.md
```

产品构建时通过 `include_str!()` 嵌入二进制。首次启动或 registry 缺失时写入 registry repo。

### Registry 中的位置

```text
<registry_root>/system-skills/intake-source-research/SKILL.md
<registry_root>/system-skills/normalize-practice-card/SKILL.md
<registry_root>/system-skills/local-harness-review/SKILL.md
```

### SKILL.md 格式

每个 SKILL.md 包含：
1. 顶部 YAML frontmatter（`---` 围栏）：id、version、description、output_type
2. Markdown 正文作为 agent prompt template，使用 `{{placeholder}}` 变量

```markdown
---
id: normalize-practice-card
version: "1.0.0"
description: "将信号转成结构化实践卡片"
output_type: practice_card
---

你是一个 AI coding 最佳实践分析器。

## 任务
将以下信号信息转成结构化实践卡片...

## 输入
{{signal_title}}
{{signal_excerpt}}

## 输出格式
返回 JSON：{ "title", "practiceType", "summary", "scenarios", "comparable" }
```

### 数据流

```text
1. skill_service::load_skill(skill_id)
   -> 先从 registry repo 读取
   -> 不存在则从 bundled 写入并读取

2. skill_service::execute_skill(skill_id, variables, agent_kind)
   -> 加载 SKILL.md
   -> 替换 {{placeholder}} 变量
   -> 调用 byoa_service::invoke_agent()
   -> 解析 JSON 输出
   -> 写入 audit_events（执行记录）
   -> 返回结构化结果

3. skill_service::list_system_skills()
   -> 返回所有 system skill 的 metadata + 启用状态
```

### SQLite 表扩展

在现有 `local_assets` 表中，`is_system = 1` 的条目即为 system skill。执行历史记录在 `audit_events` 中，`event_type = 'skill_execution'`。

新增 `system_skill_configs` 表管理启用/禁用状态：

```sql
CREATE TABLE IF NOT EXISTS system_skill_configs (
  skill_id    TEXT PRIMARY KEY,
  enabled     INTEGER NOT NULL DEFAULT 1,
  version     TEXT,
  updated_at  TEXT NOT NULL
);
```

### Rust 模块

```text
src-tauri/src/services/skill_service.rs
  -> load_skill() / execute_skill() / list_system_skills()
  -> seed_bundled_skills()  -- 首次启动写入 registry

src-tauri/src/db/skill_config_repo.rs
  -> get / set_enabled / list_all

src-tauri/src/commands/skill_commands.rs
  -> list_system_skills / execute_skill / toggle_skill
```

## Constraints

- SKILL.md 中的 prompt 不包含 source code、完整 logs 或 secrets
- 执行结果只保存结构化摘要，不保存完整 agent stdout
- system skill 和用户 Local Asset 在 `is_system` 字段区分
- 首版三个 skill 的 prompt 从现有硬编码位置提取并改写
