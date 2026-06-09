import { useEffect, useState } from "react";

import { getRealUsageSummary } from "../../lib/api";
import type { Locale, RealUsageSummary, UsageSummary } from "../../lib/types";

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function UsageView({ locale, usageSummary }: { locale: Locale; usageSummary: UsageSummary | null }) {
  const [realUsage, setRealUsage] = useState<RealUsageSummary | null>(null);

  useEffect(() => {
    void getRealUsageSummary().then(setRealUsage);
  }, []);

  if (!usageSummary && !realUsage) {
    return <p className="muted-line">{locale === "zh-CN" ? "用量数据加载中" : "Loading usage data"}</p>;
  }

  const hasRealData = realUsage && realUsage.dataSources.some((s) => s.available);

  return (
    <div className="usage-dashboard">
      {/* Real data section */}
      {hasRealData && realUsage ? (
        <>
          <section className="usage-hero">
            <div>
              <h3>{locale === "zh-CN" ? "实际用量统计" : "Real Usage Statistics"}</h3>
              <p>
                {realUsage.totalSessions.toLocaleString()} {locale === "zh-CN" ? "会话" : "sessions"} ·{" "}
                {realUsage.totalMessages.toLocaleString()} {locale === "zh-CN" ? "消息" : "messages"} ·{" "}
                {formatTokens(realUsage.totalTokens)} tokens
              </p>
            </div>
            <strong>
              {realUsage.totalCostUsd > 0
                ? `$${realUsage.totalCostUsd.toFixed(2)}`
                : locale === "zh-CN"
                  ? "免费额度"
                  : "Free tier"}
            </strong>
          </section>

          {/* Data sources */}
          <div className="confidence-strip" aria-label={locale === "zh-CN" ? "数据来源" : "Data sources"}>
            {realUsage.dataSources.map((source) => (
              <span key={source.name} style={{ opacity: source.available ? 1 : 0.5 }}>
                {source.available ? "●" : "○"} {source.name}
              </span>
            ))}
          </div>

          {/* Model usage */}
          {realUsage.modelUsage.length > 0 ? (
            <div className="metric-board">
              {realUsage.modelUsage.map((model) => (
                <article key={model.model}>
                  <span>{model.model}</span>
                  <strong>{formatTokens(model.inputTokens + model.outputTokens)}</strong>
                  <small>
                    {locale === "zh-CN" ? "输入" : "in"} {formatTokens(model.inputTokens)} ·{" "}
                    {locale === "zh-CN" ? "输出" : "out"} {formatTokens(model.outputTokens)} ·{" "}
                    {locale === "zh-CN" ? "缓存" : "cache"} {formatTokens(model.cacheReadTokens)}
                  </small>
                </article>
              ))}
            </div>
          ) : null}

          {/* Stats cards */}
          <div className="metric-board">
            <article>
              <span>{locale === "zh-CN" ? "总会话数" : "Total sessions"}</span>
              <strong>{realUsage.totalSessions.toLocaleString()}</strong>
              <small>{locale === "zh-CN" ? "来自 Claude Code" : "from Claude Code"}</small>
            </article>
            {realUsage.longestSessionMinutes ? (
              <article>
                <span>{locale === "zh-CN" ? "最长会话" : "Longest session"}</span>
                <strong>{Math.round(realUsage.longestSessionMinutes)} min</strong>
                <small>{locale === "zh-CN" ? "来自 stats-cache" : "from stats-cache"}</small>
              </article>
            ) : null}
            <article>
              <span>{locale === "zh-CN" ? "Codex 线程" : "Codex threads"}</span>
              <strong>{realUsage.codexThreadCount.toLocaleString()}</strong>
              <small>{locale === "zh-CN" ? "来自 SQLite" : "from SQLite"}</small>
            </article>
            <article>
              <span>{locale === "zh-CN" ? "时间跨度" : "Window"}</span>
              <strong>{realUsage.windowHours.toFixed(0)}h</strong>
              <small>{locale === "zh-CN" ? "估算" : "estimated"}</small>
            </article>
          </div>

          {/* Daily activity chart (last 14 days) */}
          {realUsage.dailyActivity.length > 0 ? (
            <section className="feed-list">
              <h4 style={{ margin: "0 0 8px" }}>
                {locale === "zh-CN" ? "每日活动（最近）" : "Daily Activity (recent)"}
              </h4>
              {realUsage.dailyActivity.slice(-14).map((day) => (
                <article key={day.date}>
                  <div>
                    <strong>{day.date}</strong>
                    <span>
                      {day.sessions} {locale === "zh-CN" ? "会话" : "sess"} · {day.messages}{" "}
                      {locale === "zh-CN" ? "消息" : "msg"}
                    </span>
                  </div>
                  <p>
                    {day.toolCalls} {locale === "zh-CN" ? "工具调用" : "tool calls"}
                  </p>
                </article>
              ))}
            </section>
          ) : null}

          {/* Codex recent threads */}
          {realUsage.codexRecentThreads.length > 0 ? (
            <section className="feed-list">
              <h4 style={{ margin: "0 0 8px" }}>
                {locale === "zh-CN" ? "Codex 近期线程" : "Codex Recent Threads"}
              </h4>
              {realUsage.codexRecentThreads.slice(0, 10).map((thread) => (
                <article key={thread.id}>
                  <div>
                    <strong>{thread.title ?? thread.id.slice(0, 12)}</strong>
                    <span>{thread.model ?? ""}</span>
                  </div>
                  <p>
                    {thread.createdAt}
                    {thread.tokensUsed ? ` · ${formatTokens(thread.tokensUsed)} tokens` : ""}
                    {thread.cwd ? ` · ${thread.cwd}` : ""}
                  </p>
                </article>
              ))}
            </section>
          ) : null}
        </>
      ) : null}

      {/* Fixture fallback section */}
      {usageSummary ? (
        <>
          {hasRealData ? (
            <h4 style={{ margin: "16px 0 8px", opacity: 0.6 }}>
              {locale === "zh-CN" ? "配置集用量（fixture）" : "Profile Usage (fixture)"}
            </h4>
          ) : (
            <section className="usage-hero">
              <div>
                <h3>{locale === "zh-CN" ? "用量与成本" : "Usage and Cost"}</h3>
                <p>
                  {usageSummary.windowHours}h · {usageSummary.totalTokens.toLocaleString()} tokens ·{" "}
                  {usageSummary.durationMinutes} {locale === "zh-CN" ? "分钟" : "min"}
                </p>
              </div>
              <strong>${usageSummary.costUsd.toFixed(2)}</strong>
            </section>
          )}

          {!hasRealData ? (
            <div
              className="confidence-strip"
              aria-label={locale === "zh-CN" ? "用量置信度标签" : "Usage confidence labels"}
            >
              {(locale === "zh-CN"
                ? ["官方", "本地日志", "估算", "缺失"]
                : ["Official", "LocalLog", "Estimated", "Missing"]
              ).map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          ) : null}

          <div className="metric-board">
            {usageSummary.metrics.map((metric) => (
              <article key={metric.id}>
                <span>{metric.label}</span>
                <strong>{metric.id === "cost" ? `${metric.value} ${metric.unit}` : metric.value}</strong>
                <small>
                  {metric.unit || (locale === "zh-CN" ? "来源" : "source")} · {metric.confidenceLabel}{" "}
                  {locale === "zh-CN" ? "置信度" : "confidence"}
                </small>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
