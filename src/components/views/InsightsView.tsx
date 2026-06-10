import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { listRealInsights, checkProjectionHealth, listAuditEvents } from "../../lib/api";
import type { AuditEvent, HealthFinding, Locale, RealInsight } from "../../lib/types";

interface InsightsViewProps {
  locale: Locale;
}

export function InsightsView({ locale }: InsightsViewProps) {
  const [insights, setInsights] = useState<RealInsight[]>([]);
  const [healthFindings, setHealthFindings] = useState<HealthFinding[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditEvent[]>([]);
  const zh = locale === "zh-CN";

  useEffect(() => {
    void Promise.all([
      listRealInsights(),
      checkProjectionHealth("claude_code"),
      listAuditEvents(20),
    ]).then(([nextInsights, nextHealth, nextAudits]) => {
      setInsights(nextInsights);
      setHealthFindings(nextHealth);
      setRecentAudits(nextAudits);
    });
  }, []);

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2 className="view-title">{zh ? "洞察与评审" : "Insights & Review"}</h2>
          <p className="view-subtitle">{zh ? "本地 agent 用量洞察和 harness 资产健康度" : "Local agent usage insights and harness asset health"}</p>
        </div>
      </div>

      <section className="card-section">
        <h3 className="section-title">
          <Sparkles size={14} aria-hidden="true" />
          {zh ? `用量洞察 (${insights.length})` : `Usage Insights (${insights.length})`}
        </h3>
        <div className="item-list">
          {insights.map((insight) => (
            <div key={insight.id} className="list-row">
              <div className="row-primary">
                <strong>{insight.title}</strong>
                <span className="row-meta">{insight.summary}</span>
              </div>
              <span className={`badge ${insight.severity === "high" ? "badge-warn" : insight.severity === "medium" ? "badge-info" : ""}`}>
                {insight.severity}
              </span>
            </div>
          ))}
          {insights.length === 0 && <p className="empty-hint">{zh ? "暂无洞察数据" : "No insight data available"}</p>}
        </div>
      </section>

      {healthFindings.length > 0 && (
        <section className="card-section">
          <h3 className="section-title">{zh ? "投射健康度" : "Projection Health"}</h3>
          <div className="item-list">
            {healthFindings.map((finding, i) => (
              <div key={i} className="list-row">
                <div className="row-primary">
                  <strong>{finding.findingType === "broken_symlink" ? (zh ? "断链" : "Broken Symlink") : (zh ? "缺失投射" : "Missing Projection")}</strong>
                  <span className="row-meta">{finding.detail}</span>
                  <code className="row-path">{finding.targetPath}</code>
                </div>
                <span className={`badge ${finding.severity === "warn" ? "badge-warn" : ""}`}>{finding.severity}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card-section">
        <h3 className="section-title">{zh ? `审计轨迹 (${recentAudits.length})` : `Audit Trail (${recentAudits.length})`}</h3>
        <div className="item-list">
          {recentAudits.map((event) => (
            <div key={event.id} className="list-row">
              <div className="row-primary">
                <strong>{event.eventType}</strong>
                <span className="row-meta">
                  {event.entityType && `${event.entityType}`}
                  {event.entityId && ` · ${event.entityId}`}
                </span>
              </div>
              <span className={`badge ${event.outcome === "success" ? "badge-good" : event.outcome === "failure" ? "badge-warn" : ""}`}>
                {event.outcome}
              </span>
            </div>
          ))}
          {recentAudits.length === 0 && <p className="empty-hint">{zh ? "暂无审计记录" : "No audit events yet"}</p>}
        </div>
      </section>
    </div>
  );
}
