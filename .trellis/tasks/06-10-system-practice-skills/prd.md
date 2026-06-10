# Hone System Practice Skills

## Goal

把 Hone 内置的信息源挖掘、最佳实践标准化、本地 harness review 能力从硬编码 prompt 改成可版本化、可审阅、可禁用 / 升级的 `System Practice Skill`。

## Requirements

- 默认提供三类 system skill：`intake-source-research`、`normalize-practice-card`、`local-harness-review`。
- system skill 文件资产放 registry repo 的 `system-skills/<name>/SKILL.md`。
- Hone 带默认副本，用于首次启动和恢复。
- SQLite 记录 system skill 版本、启用状态、执行历史、输出对象和用户决策。
- 执行层调用用户本地 Codex / Claude，不直连远端 API。
- UI 允许查看、复制到个人 registry、禁用或升级 system skill。
- system skill 和用户安装的 `Local Asset` 必须分开标记。
- 当前硬编码 prompt，例如 agent 精排和建议生成，后续应迁移到 system skill 调用。

## Acceptance Criteria

- [ ] system skill 不是只写死在产品代码中的 prompt。
- [ ] system skill 的版本、启用状态、执行历史可追踪。
- [ ] system skill 输出可以生成或关联 Signal Card、Practice Card、Local Review 建议。
- [ ] 本地 agent 调用边界明确，prompt 不包含 source code、完整 logs 或 secrets。
- [ ] 用户能区分系统能力和自己安装的 Local Asset。

## Dependencies

- 父任务：`.trellis/tasks/06-10-hone-positioning-practice-loop/prd.md`。
- 依赖 `data-model-storage` 的 system skill metadata 和 execution history 设计。
- 顺序依赖：在 `data-model-storage` 明确 System Practice Skill metadata / execution history 后推进。

## Notes

- 实现前需要补 `design.md` 和 `implement.md`。
