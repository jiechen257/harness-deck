# Hone Apply & Sync registry 投射

## Goal

实现从 registry repo 到 Claude Code / Codex target 的本地安全投射能力，让 `Local Asset` 能通过 symlink 默认方式应用到本地 agent 环境，并具备预览、冲突处理、adopt、回滚、drift 检测和审计。

## Requirements

- MVP 真实同步目标只支持 Claude Code + Codex。
- 默认投射方式为 symlink；copy 仅作为 fallback / compatibility mode。
- 支持从 registry repo 投射 skill、rule、hook、MCP config fragment、agent profile fragment。
- 必须实现 projection preview、unmanaged target conflict detection、explicit adopt flow、backup / rollback、broken symlink detection、copy drift detection 和 SQLite audit event。
- target 已有普通目录或普通文件时默认 skip，不覆盖、不移动、不自动吸收。
- adopt 必须逐项确认，失败时不能删除原始 target 资产。
- adapter 模式预留未来 Cursor、Windsurf、Claude Desktop，但不执行真实同步。

## Acceptance Criteria

- [ ] symlink projection 可预览将创建、更新、跳过的操作。
- [ ] target 中已有未托管资产时默认 skip，并提供 explicit adopt。
- [ ] adopt 会复制到 registry、备份原 target、创建 symlink、写 audit。
- [ ] rollback 删除 target link，不删除 registry 源文件。
- [ ] Local Review 可识别 broken symlink 和 copy drift。
- [ ] 真实写入前必须由用户确认。

## Dependencies

- 父任务：`.trellis/tasks/06-10-hone-positioning-practice-loop/prd.md`。
- 依赖 `data-model-storage` 的 Local Asset、projection status 和 audit 设计。
- 顺序依赖：在 `system-practice-skills` 之后推进，确保资产来源和系统能力边界已稳定。

## Notes

- 实现前需要补 `design.md` 和 `implement.md`。
