import { useEffect, useState } from "react";

import { listRealInsights } from "../../lib/api";
import type { FeedItem, Locale, RealInsight } from "../../lib/types";

interface InsightsViewProps {
  feedItems: FeedItem[];
  highPriorityFeed: FeedItem[];
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

export function InsightsView({ feedItems, highPriorityFeed, locale }: InsightsViewProps) {
  const [realInsights, setRealInsights] = useState<RealInsight[]>([]);

  useEffect(() => {
    void listRealInsights().then(setRealInsights);
  }, []);

  const labels = categoryLabels[locale] ?? categoryLabels["en-US"];

  return (
    <div className="insight-workbench">
      <section className="insight-hero">
        <div>
          <h3>{locale === "zh-CN" ? "洞察与优化" : "Insights and Optimization"}</h3>
          <p>
            {realInsights.length > 0
              ? locale === "zh-CN"
                ? `基于本地数据分析生成了 ${realInsights.length} 条洞察。`
                : `${realInsights.length} insight(s) generated from local data analysis.`
              : locale === "zh-CN"
                ? "正在分析本地数据..."
                : "Analyzing local data..."}
          </p>
        </div>
        {highPriorityFeed[0] ? (
          <span className="status-pill">{locale === "zh-CN" ? "高优先" : "High priority"}</span>
        ) : null}
      </section>

      {realInsights.length > 0 ? (
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
