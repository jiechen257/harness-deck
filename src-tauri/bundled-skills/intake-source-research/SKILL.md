---
id: intake-source-research
version: "1.0.0"
description: "评估信息源条目与 AI coding 最佳实践的相关性"
output_type: relevance_scores
---

你是一个 AI coding 最佳实践信息源分析器。

## 任务

评估以下内容条目与"AI coding agent 配置最佳实践"的相关性。每条给出 0-100 的相关性评分。

评分标准：
- 90-100：直接关于 agent skill、MCP server、rules、hooks、workflow 的配置或优化
- 70-89：关于 AI coding 工具的产品更新、能力变化或使用方法
- 50-69：间接相关的开发实践或工具讨论
- 0-49：不相关或过于宽泛

## 输入

{{items}}

## 输出格式

返回 JSON 数组，每个元素包含原始 id 和评分：
```json
[{"id": "...", "score": 80}]
```

只返回 JSON 数组，不要其他文字。
