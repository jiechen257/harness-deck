# Hone 数据模型与本地持久化

## Goal

定义并实现 Hone 的本地数据模型和 SQLite 持久化边界，支撑 Signal Card、Practice Card、Local Asset、Operations Script、audit 和 registry 连接。

## Requirements

- SQLite 保存结构化摘要、metadata、关系、状态、执行历史和用户决策。
- SQLite 不保存完整网页正文、完整 changelog 原文、完整 thread dump、完整本地 source code / logs 或 secrets。
- 需要建模 `Signal Card`、`Practice Card`、`Local Asset`、`Operations Script`、`System Practice Skill`、registry connection、projection / install status、audit event、source refresh record 和 first-run authorization state。
- registry repo 是 skill、rule、hook、MCP 片段等文件资产的真相来源。
- Hone SQLite 是索引、状态、关系和审计来源。
- 支持用户已有 registry、内置只读 starter registry，以及初始化新 registry。
- 数据模型必须支持 `Official`、`Maintainer / Repository`、`Community` 三层 source tier。

## Acceptance Criteria

- [ ] SQLite schema 能表达 Signal -> Practice -> Local Asset -> Projection -> Review 的闭环关系。
- [ ] registry repo path、target projection path、projection mode、checksum、status 和 audit refs 可追踪。
- [ ] Signal / Practice 只保存结构化摘要和短摘录，不保存完整原文。
- [ ] 授权状态能区分 registry、本地读取、外部 signals、写入和脚本执行。
- [ ] starter registry 不作为长期写入目标。
- [ ] 后端测试覆盖 schema 初始化、基础 CRUD、audit 写入和隐私边界。

## Dependencies

- 父任务：`.trellis/tasks/06-10-hone-positioning-practice-loop/prd.md`。
- 顺序依赖：在 `product-prototype` 锁定信息架构和原型方向后推进。

## Notes

- 实现前需要补 `design.md` 和 `implement.md`。
