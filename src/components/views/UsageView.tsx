import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { getRealUsageSummary } from "../../lib/api";
import type { Locale, RealUsageSummary } from "../../lib/types";

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function UsageView({ locale }: { locale: Locale }) {
  const [realUsage, setRealUsage] = useState<RealUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRealUsageSummary();
      setRealUsage(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load usage data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="usage-dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "20px" }}>
        <Loader2 size={16} className="spinning" />
        <span className="muted-line">{locale === "zh-CN" ? "用量数据加载中..." : "Loading usage data..."}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usage-dashboard">
        <div className="install-toast error" style={{ margin: "20px 0" }}>
          {locale === "zh-CN" ? `加载失败：${error}` : `Load failed: ${error}`}
        </div>
        <button className="secondary-action compact" type="button" onClick={() => void fetchData()}>
          <RefreshCw size={14} aria-hidden="true" />
          <span>{locale === "zh-CN" ? "重试" : "Retry"}</span>
        </button>
      </div>
    );
  }

  if (!realUsage) {
    return <p className="muted-line">{locale === "zh-CN" ? "无数据" : "No data"}</p>;
  }

  const hasRealData = realUsage.dataSources.some((s) => s.available);

  if (!hasRealData) {
    return (
      <div className="usage-dashboard">
        <section className="usage-hero">
          <div>
            <h3>{locale === "zh-CN" ? "用量与成本" : "Usage and Cost"}</h3>
            <p>{locale === "zh-CN" ? "未检测到可用的数据源。请确认 Claude Code 或 Codex 已安装。" : "No data sources detected. Please confirm Claude Code or Codex is installed."}</p>
          </div>
        </section>
        <div className="confidence-strip" aria-label={locale === "zh-CN" ? "数据来源" : "Data sources"}>
          {realUsage.dataSources.map((source) => (
            <span key={source.name} style={{ opacity: 0.5 }}>
              ○ {source.name}: {source.path || (locale === "zh-CN" ? "不可用" : "unavailable")}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="usage-dashboard">
      <section className="usage-hero">
        <div>
          <h3>{locale === "zh-CN" ? "用量统计" : "Usage Statistics"}</h3>
          <p>
            {realUsage.totalSessions.toLocaleString()} {locale === "zh-CN" ? "会话" : "sessions"} ·{" "}
            {realUsage.totalMessages.toLocaleString()} {locale === "zh-CN" ? "消息" : "messages"} ·{" "}
            {formatTokens(realUsage.totalTokens)} tokens
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <strong>
            {realUsage.totalCostUsd > 0
              ? `$${realUsage.totalCostUsd.toFixed(2)}`
              : locale === "zh-CN"
                ? "免费额度"
                : "Free tier"}
          </strong>
          <button className="secondary-action compact" type="button" onClick={() => void fetchData()}>
            <RefreshCw size={13} aria-hidden="true" />
            <span>{locale === "zh-CN" ? "刷新" : "Refresh"}</span>
          </button>
        </div>
      </section>

      <div className="confidence-strip" aria-label={locale === "zh-CN" ? "数据来源" : "Data sources"}>
        {realUsage.dataSources.map((source) => (
          <span key={source.name} style={{ opacity: source.available ? 1 : 0.5 }}>
            {source.available ? "●" : "○"} {source.name}
          </span>
        ))}
      </div>

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

      <div className="metric-board">
        <article>
          <span>{locale === "zh-CN" ? "总会话数" : "Total sessions"}</span>
          <strong>{realUsage.totalSessions.toLocaleString()}</strong>
        </article>
        {realUsage.longestSessionMinutes ? (
          <article>
            <span>{locale === "zh-CN" ? "最长会话" : "Longest session"}</span>
            <strong>{Math.round(realUsage.longestSessionMinutes)} min</strong>
          </article>
        ) : null}
        <article>
          <span>{locale === "zh-CN" ? "Codex 线程" : "Codex threads"}</span>
          <strong>{realUsage.codexThreadCount.toLocaleString()}</strong>
        </article>
        <article>
          <span>{locale === "zh-CN" ? "时间跨度" : "Window"}</span>
          <strong>{realUsage.windowHours.toFixed(0)}h</strong>
        </article>
      </div>

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
    </div>
  );
}
