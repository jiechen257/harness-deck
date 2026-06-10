import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { checkProjectionHealth, listAuditEvents, listRealInsights } from "../../lib/api";
import type { AuditEvent, HealthFinding, Locale, RealInsight } from "../../lib/types";

export function LocalReviewView({ locale }: { locale: Locale }) {
  const [insights, setInsights] = useState<RealInsight[]>([]);
  const [findings, setFindings] = useState<HealthFinding[]>([]);
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const zh = locale === "zh-CN";

  useEffect(() => {
    void Promise.all([listRealInsights(), checkProjectionHealth("codex"), listAuditEvents(20)])
      .then(([nextInsights, nextFindings, nextAudits]) => {
        setInsights(nextInsights);
        setFindings(nextFindings);
        setAudits(nextAudits);
      });
  }, []);

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2 className="view-title">{zh ? "本地评审" : "Local Review"}</h2>
          <p className="view-subtitle">{zh ? "聚焦 registry、Claude/Codex target、projection state 和实践关系。" : "Focused on registry, Claude/Codex targets, projection state, and practice relations."}</p>
        </div>
      </div>

      <div className="review-grid">
        <section className="card-section">
          <h3 className="section-title"><ShieldCheck size={14} aria-hidden="true" />{zh ? "评审发现" : "Review Findings"}</h3>
          <div className="item-list">
            {findings.map((finding) => (
              <div key={`${finding.findingType}-${finding.targetPath}`} className="list-row">
                <div className="row-primary">
                  <strong>{finding.findingType === "broken_symlink" ? (zh ? "断链" : "Broken symlink") : (zh ? "缺失投射" : "Missing projection")}</strong>
                  <span className="row-meta">{finding.detail}</span>
                  <code className="row-path">{finding.targetPath}</code>
                </div>
                <span className={`badge ${finding.severity === "warn" ? "badge-warn" : "badge-info"}`}>{finding.severity}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card-section">
          <h3 className="section-title">{zh ? "证据与建议" : "Evidence & Recommendation"}</h3>
          <div className="info-block">
            <strong>registry/skills/workflow/grill-me/SKILL.md</strong>
            <p>{zh ? "建议创建 Practice Card 关系，或通过采纳流程把目标资产纳入 registry 管理。" : "Create a Practice Card relation, or adopt the target asset into the registry."}</p>
          </div>
          {insights.map((insight) => (
            <div key={insight.id} className="info-block">
              <strong>{insight.title}</strong>
              <p>{insight.summary}</p>
            </div>
          ))}
        </section>
      </div>

      <section className="card-section">
        <h3 className="section-title">{zh ? "审计轨迹" : "Audit Trail"}</h3>
        <div className="item-list">
          {audits.map((event) => (
            <div key={event.id} className="list-row">
              <div className="row-primary"><strong>{event.eventType}</strong><span className="row-meta">{event.detail}</span></div>
              <span className={`badge ${event.outcome === "success" ? "badge-good" : "badge-warn"}`}>{event.outcome}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
