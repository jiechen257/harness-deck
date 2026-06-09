import { useCallback, useEffect, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";

import { detectAgents, getAppStatus, installSkill, invokeAgent, listRealInsights } from "../../lib/api";
import type {
  AgentAvailability,
  AppStatus,
  FeedItem,
  InstallResult,
  Locale,
  RealInsight,
} from "../../lib/types";

interface InsightsViewProps {
  feedItems: FeedItem[];
  highPriorityFeed: FeedItem[];
  locale: Locale;
}

type SuggestionStatus = "idle" | "generating" | "ready" | "applied" | "dismissed";

interface Suggestion {
  status: SuggestionStatus;
  description?: string;
  action?: string;
  target?: string;
  skillName?: string;
  content?: string;
  applyResult?: InstallResult;
}

const categoryLabels: Record<string, Record<string, string>> = {
  "zh-CN": {
    TokenAnomaly: "Token 异常",
    SessionActivity: "会话活动",
    ModelConcentration: "模型集中度",
  },
  "en-US": {
    TokenAnomaly: "Token Anomaly",
    SessionActivity: "Session Activity",
    ModelConcentration: "Model Concentration",
  },
};

function buildSuggestionPrompt(insight: RealInsight, appStatus: AppStatus | null): string {
  const context = appStatus?.healthFactors
    ?.map((f) => `${f.name}: ${f.score} (${f.met ? "pass" : "fail"})`)
    .join(", ") ?? "no health data";

  return `You are an AI coding configuration optimizer. Given this insight about a developer's AI tool usage, suggest ONE specific configuration change.

Insight:
- Category: ${insight.category}
- Title: ${insight.title}
- Summary: ${insight.summary}
- Evidence: ${insight.evidence}
- Severity: ${insight.severity}

Current health: ${context}

Respond with ONLY a JSON object (no markdown, no explanation):
{"suggestion":"one-line description of what to change","action":"CopySkill","target":"ClaudeCode","skillName":"suggested-skill-name","content":"# Skill Title\\n\\nSkill content as markdown"}`;
}

export function InsightsView({ feedItems, highPriorityFeed, locale }: InsightsViewProps) {
  const [realInsights, setRealInsights] = useState<RealInsight[]>([]);
  const [agents, setAgents] = useState<AgentAvailability[]>([]);
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});

  useEffect(() => {
    void listRealInsights().then(setRealInsights);
    void detectAgents().then(setAgents);
    void getAppStatus().then(setAppStatus);
  }, []);

  const availableAgent = agents.find((a) => a.available);
  const pendingCount = Object.values(suggestions).filter((s) => s.status === "ready").length;

  const labels = categoryLabels[locale] ?? categoryLabels["en-US"];

  const generateSuggestion = useCallback(async (insight: RealInsight) => {
    if (!availableAgent) return;

    setSuggestions((prev) => ({ ...prev, [insight.id]: { status: "generating" } }));

    try {
      const result = await invokeAgent({
        kind: availableAgent.kind,
        prompt: buildSuggestionPrompt(insight, appStatus),
        timeoutSecs: 60,
        requestJsonOutput: true,
      });

      if (result.parsedJson && typeof result.parsedJson === "object") {
        const parsed = result.parsedJson as Record<string, string>;
        setSuggestions((prev) => ({
          ...prev,
          [insight.id]: {
            status: "ready",
            description: parsed.suggestion ?? "",
            action: parsed.action ?? "CopySkill",
            target: parsed.target ?? "ClaudeCode",
            skillName: parsed.skillName ?? "suggested-skill",
            content: parsed.content ?? "",
          },
        }));
      } else {
        setSuggestions((prev) => ({
          ...prev,
          [insight.id]: {
            status: "ready",
            description: result.stdout.slice(0, 200) || (locale === "zh-CN" ? "Agent 返回了非结构化建议" : "Agent returned unstructured suggestion"),
            action: "CopySkill",
            target: "ClaudeCode",
            skillName: `insight-${insight.id}`,
            content: result.stdout,
          },
        }));
      }
    } catch {
      setSuggestions((prev) => ({
        ...prev,
        [insight.id]: {
          status: "idle",
          description: locale === "zh-CN" ? "生成失败，请重试" : "Generation failed, please retry",
        },
      }));
    }
  }, [availableAgent, appStatus, locale]);

  const applySuggestion = useCallback(async (insightId: string) => {
    const suggestion = suggestions[insightId];
    if (!suggestion || suggestion.status !== "ready") return;

    try {
      const result = await installSkill({
        sourceUrl: `insight://${insightId}`,
        target: (suggestion.target === "Codex" ? "Codex" : "ClaudeCode") as "ClaudeCode" | "Codex",
        action: "CopySkill",
        skillName: suggestion.skillName ?? "suggested-skill",
      });
      setSuggestions((prev) => ({
        ...prev,
        [insightId]: { ...prev[insightId], status: "applied", applyResult: result },
      }));
    } catch {
      setSuggestions((prev) => ({
        ...prev,
        [insightId]: { ...prev[insightId], status: "ready" },
      }));
    }
  }, [suggestions]);

  const dismissSuggestion = useCallback((insightId: string) => {
    setSuggestions((prev) => ({
      ...prev,
      [insightId]: { ...prev[insightId], status: "dismissed" },
    }));
  }, []);

  return (
    <div className="insight-workbench">
      <section className="insight-hero">
        <div>
          <h3>{locale === "zh-CN" ? "洞察与优化" : "Insights and Optimization"}</h3>
          <p>
            {realInsights.length > 0
              ? locale === "zh-CN"
                ? `${realInsights.length} 条洞察${pendingCount > 0 ? `，${pendingCount} 条建议待处理` : ""}`
                : `${realInsights.length} insight(s)${pendingCount > 0 ? `, ${pendingCount} suggestion(s) pending` : ""}`
              : locale === "zh-CN"
                ? "正在分析本地数据..."
                : "Analyzing local data..."}
          </p>
        </div>
        {availableAgent ? (
          <span className="status-pill">
            {locale === "zh-CN" ? `Agent: ${availableAgent.kind}` : `Agent: ${availableAgent.kind}`}
          </span>
        ) : highPriorityFeed[0] ? (
          <span className="status-pill">{locale === "zh-CN" ? "高优先" : "High priority"}</span>
        ) : null}
      </section>

      {realInsights.length > 0 ? (
        <div className="insight-grid">
          {realInsights.map((insight) => {
            const suggestion = suggestions[insight.id];
            return (
              <article key={insight.id} className="insight-card">
                <strong>
                  {labels[insight.category] ?? insight.category}: {insight.title}
                </strong>
                <p>{insight.summary}</p>
                <small>{insight.severity} · {insight.source}</small>
                <p style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px" }}>{insight.evidence}</p>

                {/* Suggestion generation button */}
                {(!suggestion || suggestion.status === "idle") && availableAgent ? (
                  <button
                    className="secondary-action compact"
                    type="button"
                    onClick={() => void generateSuggestion(insight)}
                    style={{ marginTop: "8px" }}
                  >
                    <Sparkles size={13} aria-hidden="true" />
                    <span>{locale === "zh-CN" ? "生成优化建议" : "Generate Suggestion"}</span>
                  </button>
                ) : null}

                {/* No agent available */}
                {(!suggestion || suggestion.status === "idle") && !availableAgent ? (
                  <p className="muted-line" style={{ marginTop: "8px", fontSize: "11px" }}>
                    {locale === "zh-CN" ? "未检测到本地 agent（需要 Claude Code 或 Codex CLI）" : "No local agent detected (requires Claude Code or Codex CLI)"}
                  </p>
                ) : null}

                {/* Generating */}
                {suggestion?.status === "generating" ? (
                  <p className="muted-line" style={{ marginTop: "8px" }}>
                    {locale === "zh-CN" ? "正在调用本地 agent 生成建议..." : "Generating suggestion via local agent..."}
                  </p>
                ) : null}

                {/* Suggestion ready — show preview */}
                {suggestion?.status === "ready" ? (
                  <div className="suggestion-preview" style={{ marginTop: "8px", padding: "8px", border: "1px solid var(--border)", borderRadius: "6px" }}>
                    <p style={{ fontWeight: 500 }}>{suggestion.description}</p>
                    <small>
                      {suggestion.action} → {suggestion.target} · {suggestion.skillName}
                    </small>
                    <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
                      <button
                        className="primary-action compact"
                        type="button"
                        onClick={() => void applySuggestion(insight.id)}
                      >
                        <Check size={13} aria-hidden="true" />
                        <span>{locale === "zh-CN" ? "应用" : "Apply"}</span>
                      </button>
                      <button
                        className="secondary-action compact"
                        type="button"
                        onClick={() => dismissSuggestion(insight.id)}
                      >
                        <X size={13} aria-hidden="true" />
                        <span>{locale === "zh-CN" ? "忽略" : "Dismiss"}</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Applied */}
                {suggestion?.status === "applied" ? (
                  <div className="install-toast success" style={{ marginTop: "8px" }}>
                    {suggestion.applyResult?.message ?? (locale === "zh-CN" ? "建议已应用" : "Suggestion applied")}
                  </div>
                ) : null}

                {/* Dismissed */}
                {suggestion?.status === "dismissed" ? (
                  <p className="muted-line" style={{ marginTop: "8px", fontSize: "11px" }}>
                    {locale === "zh-CN" ? "已忽略" : "Dismissed"}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}

      {feedItems.length > 0 ? (
        <section className="feed-list">
          {feedItems.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.priority}</span>
              </div>
              <p>{item.summary}</p>
              {item.profileImpact ? (
                <small>{locale === "zh-CN" ? "配置集影响" : "profile impact"}</small>
              ) : (
                <small>{item.source}</small>
              )}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
