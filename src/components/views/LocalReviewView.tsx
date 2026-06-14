import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { checkProjectionHealth, listAuditEvents, listDriftTimeline, listProjectionTargets, listRealInsights } from "../../lib/api";
import type { AuditEvent, DriftTimelineItem, HealthFinding, Locale, ProjectionTarget, RealInsight } from "../../lib/types";
import { LoopStepper } from "../shared/LoopStepper";

export function LocalReviewView({ locale }: { locale: Locale }) {
  const [insights, setInsights] = useState<RealInsight[]>([]);
  const [findings, setFindings] = useState<HealthFinding[]>([]);
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [targets, setTargets] = useState<ProjectionTarget[]>([]);
  const [timeline, setTimeline] = useState<DriftTimelineItem[]>([]);
  const [targetKind, setTargetKind] = useState("codex");
  const [error, setError] = useState<string | null>(null);
  const zh = locale === "zh-CN";

  const loadData = useCallback(async (nextTargetKind = targetKind) => {
    setError(null);
    try {
      const [nextInsights, nextTargets, nextFindings, nextAudits, nextTimeline] = await Promise.all([
        listRealInsights(),
        listProjectionTargets(),
        checkProjectionHealth(nextTargetKind),
        listAuditEvents(20),
        listDriftTimeline(nextTargetKind),
      ]);
      setInsights(nextInsights);
      setTargets(nextTargets);
      setFindings(nextFindings);
      setAudits(nextAudits);
      setTimeline(nextTimeline);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
  }, [targetKind]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleTargetChange = (nextTargetKind: string) => {
    setTargetKind(nextTargetKind);
    void loadData(nextTargetKind);
  };

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <span className="view-kicker">LOCAL REVIEW</span>
          <h1 className="view-title">{zh ? "本地评审不是报告页，是把偏移变成可执行修复。" : "Local review turns drift into executable repair, not a report page."}</h1>
          <p className="view-subtitle">{zh ? "选择目标后检查投射健康度、真实建议、发现列表、偏移时间线和审计轨迹。" : "Select a target, then inspect projection health, findings, suggestions, drift timeline, and audit trail."}</p>
        </div>
        <label className="field-stack review-target-select">
          <span>{zh ? "检查目标" : "Review target"}</span>
          <select value={targetKind} onChange={(event) => handleTargetChange(event.target.value)}>
            {targets.map((target) => (
              <option key={target.targetKind} value={target.targetKind}>{target.label}</option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <div className="info-block warning-block">
          <strong>{zh ? "评审读取失败" : "Review load failed"}</strong>
          <p>{error}</p>
        </div>
      ) : null}

      <div className="review-summary-strip">
        <div className="review-stat">
          <strong>{findings.length}</strong>
          <span>{zh ? "发现" : "Findings"}</span>
        </div>
        <div className="review-stat">
          <strong>{findings.filter((f) => f.severity === "warn").length}</strong>
          <span>{zh ? "警告" : "Warnings"}</span>
        </div>
        <div className="review-stat">
          <strong>{insights.length}</strong>
          <span>{zh ? "建议" : "Suggestions"}</span>
        </div>
        <div className="review-stat">
          <strong>{audits.length}</strong>
          <span>{zh ? "审计记录" : "Audit records"}</span>
        </div>
      </div>

      <div className="review-grid">
        <section className="card-section">
          <h3 className="section-title"><ShieldCheck size={14} aria-hidden="true" />{zh ? "评审发现" : "Review Findings"}</h3>
          <LoopStepper activeStep="review" locale={locale} />
          {findings.length === 0 ? (
            <p className="empty-hint">{zh ? "未检测到问题，所有投射状态正常。" : "No issues detected. All projections are healthy."}</p>
          ) : (
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
          )}
        </section>
        <section className="card-section">
          <h3 className="section-title">{zh ? "证据与建议" : "Evidence & Recommendation"}</h3>
          {findings.map((finding) => (
            <div key={`${finding.findingType}-${finding.assetId}-${finding.targetPath}`} className="info-block">
              <strong>{finding.targetPath}</strong>
              <p>
                {finding.findingType === "missing_projection"
                  ? (zh ? "建议先在应用与同步中预览投射计划，确认目标路径后再写入。" : "Preview the projection plan in Apply & Sync, confirm the target path, then write.")
                  : finding.detail}
              </p>
            </div>
          ))}
          {insights.map((insight) => (
            <div key={insight.id} className="info-block">
              <strong>{insight.title}</strong>
              <p>{insight.summary}</p>
            </div>
          ))}
          {findings.length === 0 && insights.length === 0 ? (
            <p className="empty-hint">{zh ? "暂无需要处理的证据或建议。" : "No actionable evidence or suggestions right now."}</p>
          ) : null}
        </section>
      </div>

      <section className="card-section">
        <h3 className="section-title">{zh ? "Drift Timeline" : "Drift Timeline"}</h3>
        {timeline.length === 0 ? (
          <p className="empty-hint">{zh ? "当前目标还没有 projection timeline。" : "No projection timeline for this target yet."}</p>
        ) : (
          <div className="item-list">
            {timeline.map((item) => (
              <div key={item.id} className="list-row">
                <div className="row-primary">
                  <strong>{item.targetPath}</strong>
                  <span className="row-meta">
                    {item.status} · {item.relatedEvent ?? (zh ? "暂无关联审计" : "no related audit")}
                    {item.firstDetectedAt ? ` · first ${new Date(item.firstDetectedAt).toLocaleString(zh ? "zh-CN" : "en-US")}` : ""}
                    {item.lastCheckedAt ? ` · last ${new Date(item.lastCheckedAt).toLocaleString(zh ? "zh-CN" : "en-US")}` : ""}
                  </span>
                </div>
                <span className={`badge ${item.status === "active" ? "badge-good" : item.status === "drifted" || item.status === "broken" ? "badge-warn" : ""}`}>{item.targetKind}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card-section">
        <h3 className="section-title">{zh ? "审计轨迹" : "Audit Trail"}</h3>
        {audits.length === 0 ? (
          <p className="empty-hint">{zh ? "暂无审计记录。" : "No audit events yet."}</p>
        ) : (
          <div className="item-list">
            {audits.map((event) => (
              <div key={event.id} className="list-row">
                <div className="row-primary"><strong>{event.eventType}</strong><span className="row-meta">{event.detail}</span></div>
                <span className={`badge ${event.outcome === "success" ? "badge-good" : "badge-warn"}`}>{event.outcome}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
