import { useEffect, useState } from "react";

import { listRealInsights } from "../../lib/api";
import type { FeedItem, Insight, Locale, RealInsight } from "../../lib/types";

interface InsightsViewProps {
  feedItems: FeedItem[];
  highPriorityFeed: FeedItem[];
  insights: Insight[];
  locale: Locale;
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

export function InsightsView({ feedItems, highPriorityFeed, insights, locale }: InsightsViewProps) {
  const [realInsights, setRealInsights] = useState<RealInsight[]>([]);

  useEffect(() => {
    void listRealInsights().then(setRealInsights);
  }, []);

  const labels = categoryLabels[locale] ?? categoryLabels["en-US"];

  return (
    <div className="insight-workbench">
      <section className="insight-hero">
        <div>
          <h3>{locale === "zh-CN" ? "洞察与 Feed" : "Insights and Feed"}</h3>
          <p>
            {realInsights.length > 0
              ? locale === "zh-CN"
                ? `基于本地数据分析生成了 ${realInsights.length} 条实际洞察。`
                : `${realInsights.length} real insight(s) generated from local data analysis.`
              : locale === "zh-CN"
                ? "本地规则覆盖 token anomaly、失败重复、profile drift 和 update impact。"
                : "Local rules cover token anomalies, repeated failures, profile drift, and update impact."}
          </p>
        </div>
        {highPriorityFeed[0] ? (
          <span className="status-pill">{locale === "zh-CN" ? "高优先" : "High priority"}</span>
        ) : null}
      </section>

      {/* Real insights from local data */}
      {realInsights.length > 0 ? (
        <>
          <h4 style={{ margin: "0 0 8px" }}>
            {locale === "zh-CN" ? "实际数据洞察" : "Real Data Insights"}
          </h4>
          <div className="insight-grid">
            {realInsights.map((insight) => (
              <article key={insight.id}>
                <strong>
                  {labels[insight.category] ?? insight.category}: {insight.title}
                </strong>
                <p>{insight.summary}</p>
                <small>{insight.severity} · {insight.source}</small>
                <p style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px" }}>{insight.evidence}</p>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {/* Fixture insights */}
      {insights.length > 0 ? (
        <>
          {realInsights.length > 0 ? (
            <h4 style={{ margin: "16px 0 8px", opacity: 0.6 }}>
              {locale === "zh-CN" ? "规则洞察（fixture）" : "Rule Insights (fixture)"}
            </h4>
          ) : null}
          <div className="insight-grid">
            {insights.map((insight) => (
              <article key={insight.id}>
                <strong>{insight.title}</strong>
                <p>{insight.summary}</p>
                <small>
                  {insight.severity} · {insight.source}
                </small>
              </article>
            ))}
          </div>
        </>
      ) : null}

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
    </div>
  );
}
