# 接入真实数据：从 fixture 模式升级为本机真实数据源

## Goal

将 HarnessDeck 从 Phase 0 fixture 模式升级为读取本机真实的 Claude Code 和 Codex 配置/运营数据，让产品展示有意义的实际信息，而非硬编码的 mock 数据。

**核心原则**：只读不写。所有真实数据接入仅做读取和展示，不修改任何外部配置文件、不写入 Keychain、不调用计费 API。fixture fallback 保留为浏览器开发模式和 Rust 测试的后备。

## 数据源清单

本机已确认存在的可读取数据源：

### Claude Code 数据
| 文件/目录 | 格式 | 内容 | 当前规模 |
|---|---|---|---|
| `~/.claude/settings.json` | JSON | 用户偏好、env、hooks、permissions、theme | 1.7 KB |
| `~/.claude.json` | JSON | MCP 服务器注册、feature flags、startup count | 69.6 KB |
| `~/.claude/stats-cache.json` | JSON | token 用量、session 计数、模型成本 | 6.5 KB |
| `~/.claude/skills/` | 目录 (SKILL.md) | 用户 skill 清单 | 62 个 |
| `~/.claude/sessions/*.json` | JSON | 活跃会话注册 | 8 个文件 |
| `~/.claude/projects/` | 目录 | 项目级配置和会话数据 | 52 个项目 |
| `~/.claude/plugins/installed_plugins.json` | JSON | 已安装插件 | 1 个插件 |
| `~/.claude/CLAUDE.md` | Markdown | 全局用户指令 | 6.3 KB |
| `~/.claude/history.jsonl` | JSONL | 命令历史 | 1,588 行 |

### Codex 数据
| 文件/目录 | 格式 | 内容 | 当前规模 |
|---|---|---|---|
| `~/.codex/config.toml` | TOML | 模型、沙盒、插件、MCP、主题 | ~5 KB |
| `~/.codex/AGENTS.md` | Markdown | 全局 agent 指令 | 5.2 KB |
| `~/.codex/state_5.sqlite` | SQLite | threads (1,123)、tools、spawn_edges | 8.2 MB |
| `~/.codex/goals_1.sqlite` | SQLite | 目标/任务状态 | 33 KB |
| `~/.codex/memories/MEMORY.md` | Markdown | 全局记忆 | 77 KB |
| `~/.codex/skills/` | 目录 (SKILL.md) | agent skill 清单 | 63 个 |
| `~/.codex/session_index.jsonl` | JSONL | 会话索引 | 1,035+ 条 |
| `~/.codex/version.json` | JSON | 版本信息 | 102 bytes |
| `~/.codex/hooks.json` | JSON | Hook 定义 | 1.9 KB |

### 其他 Agent 数据
| 路径 | 格式 | 内容 |
|---|---|---|
| `~/.config/opencode/` | JSON + MD | OpenCode agent 配置 |
| `~/Library/Application Support/Claude/claude_desktop_config.json` | JSON | Claude Desktop MCP 配置 |

## Requirements

### R1: Target Discovery（目标发现）
- 扫描 `~/.claude/` 和 `~/.codex/` 目录，读取配置文件的实际内容
- 从 `~/.claude/settings.json` 提取：editorMode、theme、permissions、hooks 数量、env 变量（脱敏）
- 从 `~/.codex/config.toml` 提取：model、sandbox_mode、approval_policy、plugins、MCP 服务器、受信项目数
- 从 `~/.claude.json` 提取：MCP 服务器列表（名称+类型）、startup count
- 以结构化数据返回，前端在 Profiles 和 Sync 视图中展示

### R2: Profiles（配置集）
- 扫描并聚合本机的 Claude Code + Codex 配置为"Profile"视图
- 展示实际的规则数（从 settings/config 中计数 permissions、hooks 等）
- 展示实际的 skill 数（扫描 `~/.claude/skills/` 和 `~/.codex/skills/` 目录）
- 展示实际的 MCP 服务器数（从 `~/.claude.json` 和 `~/.codex/config.toml` 提取）
- fixture 配置集保留为对比基准

### R3: Usage（用量统计）
- 从 `~/.claude/stats-cache.json` 读取：totalSessions、totalMessages、dailyActivity、modelUsage（含 costUSD）
- 从 Codex SQLite `state_5.sqlite` 的 `threads` 表读取：会话总数、近期活跃度、tokens_used
- 计算真实的 burn rate 和窗口时长
- 数据置信度标记：stats-cache 为 "LocalLog"，SQLite 为 "LocalLog"，无官方计费 API 时标 "Missing"

### R4: Insights（洞察）
- 基于真实数据生成洞察，替代硬编码的 4 条 fixture
- 最少支持：
  - Token 异常检测（对比 dailyActivity 中的均值和极值）
  - 配置漂移检测（Claude Code 和 Codex 间的 MCP/model/permission 差异）
  - Skill 使用热度（从 `~/.claude.json` 的 skillUsage 提取）
  - 活跃会话监控（从 sessions 目录读取当前存活进程）

### R5: Registry（技能库）
- 从 `~/.claude/skills/` 和 `~/.codex/skills/` 扫描真实 skill 列表
- 读取每个 SKILL.md 的标题和描述（前 10 行）
- 在 Discover 视图中展示本机实际可用的 skill 而非 3 个 fixture 模板

### R6: Sync Governance（同步治理）
- 对比 Claude Code 和 Codex 的 MCP 服务器配置差异
- 对比两端的 permission/hook 设置差异
- 生成真实的三路 diff 视图（而非 fixture 路径）

### R7: Wake Control（唤醒控制）
- 接入真实的 `caffeinate` 命令
- StandardAwake: `caffeinate -di`
- TimedAwake: `caffeinate -di -t <seconds>`
- DisplaySleep: `caffeinate -i`（允许显示器关闭）
- ExperimentalLidAwake: `caffeinate -dis`
- 提供 session 管理：启动、停止、状态查询
- UI 显示实际的 PID 和运行时长

### R8: Account（账户信息）
- 从 `~/.codex/config.toml` 读取 model 和 approval_policy
- 从 `~/.claude/settings.json` 读取 editorMode 和 theme
- Keychain 引用保持为展示性（不读取真实 secret 值）
- 从 stats-cache 计算实际月度成本

### R9: Home Dashboard（首页仪表盘）
- 健康分基于真实数据计算（而非硬编码 90）：
  - 配置完整性（settings/config 是否存在且有效）
  - MCP 连接数
  - Skill 覆盖率
  - 近期使用活跃度
- 各卡片数字来自真实统计

### R10: Menubar Panel（菜单栏面板）
- 状态行显示真实数据：当前 profile 名→"本机配置"、成本→真实 costUSD、会话数→真实 session count
- Cmd+K 搜索可以先不实现（标记为 placeholder）
- Refresh 按钮触发数据重新读取

## 约束

1. **只读原则**：所有真实数据接入仅读取文件系统，不修改任何外部配置文件
2. **安全脱敏**：API key、token、secret 值不得出现在前端或 IPC 通道中；env 中的 `*TOKEN*`、`*KEY*`、`*SECRET*` 值替换为 `[REDACTED]`
3. **Fixture fallback**：在浏览器开发模式（非 Tauri runtime）下，保留 TypeScript fixture 数据作为 fallback
4. **错误容忍**：文件不存在、格式异常、权限不足时 graceful degradation——返回 empty/default 而非 panic
5. **性能**：首次加载 < 500ms，大文件（audit.jsonl 47MB、logs SQLite 998MB）不在启动时加载
6. **隐私**：不读取 `~/.codex/auth.json` 的 token 内容；不读取 `.env` 中的代理密码；不读取 session transcript 正文

## 决策记录

- **Wake Control (R7)**: 延后到下一轮。本轮只做只读数据接入。
- **Codex SQLite**: 只读 `state_5.sqlite` 的 `threads` 表（1,123 行），跳过 `logs_2.sqlite`（998MB）和 `goals_1.sqlite`。
- **执行方式**: 全部在 Claude Code 中完成，可用 subagent 并行。

## 子任务拆分

| 子任务 | 范围 | 依赖 |
|---|---|---|
| **child-1: target-and-profiles** | R1 + R2: 目标发现 + 配置集 | 无 |
| **child-2: usage-and-insights** | R3 + R4: 用量统计 + 洞察 | 无 |
| **child-3: registry-skills** | R5: 真实技能库 | 无 |
| **child-4: sync-governance** | R6: 同步治理 | child-1 (需要 target 读取能力) |
| **~~child-5: wake-control~~** | ~~R7: 唤醒控制~~ | **延后** |
| **child-5: account-home-menubar** | R8 + R9 + R10: 账户 + 首页 + 菜单栏 | child-1, child-2 (聚合数据) |

## Acceptance Criteria

- [ ] `pnpm tauri:dev` 启动后，所有视图展示本机真实数据而非 fixture
- [ ] `pnpm dev` 在浏览器中仍可运行（fixture fallback）
- [ ] 无 API key / secret 泄漏到前端
- [ ] `~/.claude/` 或 `~/.codex/` 不存在时，graceful fallback 到空状态
- [ ] 读取大文件（stats-cache、SQLite）时无明显卡顿（< 500ms）
- [ ] `pnpm lint && pnpm typecheck && pnpm test` 全部通过
- [ ] `cargo test` 全部通过
- [ ] caffeinate 唤醒可以启动和停止，PID 正确显示
- [ ] 健康分根据实际配置状态动态计算
