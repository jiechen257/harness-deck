import { Boxes, CheckCircle2, GitBranch, Library, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import type { ViewId } from "../../constants/types";
import { getLoopSummary } from "../../lib/api";
import type { Locale, LoopSection, LoopSummary } from "../../lib/types";

interface HomeViewProps {
  healthScore: number;
  locale: Locale;
  onSelectView: (view: ViewId) => void;
  t: Record<string, string>;
}

const sectionIcons = {
  signals: Library,
  practices: CheckCircle2,
  assets: GitBranch,
  review: ShieldCheck,
  operations: Boxes,
} as const;

function toViewId(view: string): ViewId {
  if (view === "library" || view === "apply" || view === "review" || view === "operations" || view === "settings") {
    return view;
  }
  return "home";
}

function sectionLabel(section: LoopSection, zh: boolean) {
  return {
    name: zh ? section.nameZh : section.nameEn,
    caption: zh ? section.captionZh : section.captionEn,
    action: zh ? section.actionZh : section.actionEn,
  };
}

export function HomeView({ healthScore, locale, onSelectView, t }: HomeViewProps) {
  const zh = locale === "zh-CN";
  const [summary, setSummary] = useState<LoopSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const visibleHealthScore = summary?.healthScore ?? healthScore;

  useEffect(() => {
    let alive = true;
    void getLoopSummary()
      .then((nextSummary) => {
        if (!alive) return;
        setSummary(nextSummary);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => { alive = false; };
  }, []);

  return (
    <section className="loop-home" data-testid="home-view">
      <div className="context-strip">
        <span className="status-pill" aria-label={t.productHealthLabel}>
          <CheckCircle2 size={14} aria-hidden="true" />
          {t.localReady}
        </span>
        <span>{zh ? `闭环健康度 ${visibleHealthScore}%` : `Loop health ${visibleHealthScore}%`}</span>
        <span>{summary?.fixtureMode ? (zh ? "浏览器 fixture 数据" : "Browser fixture data") : (zh ? "SQLite 实时聚合" : "SQLite live aggregation")}</span>
        <span>{zh ? "所有数据与配置均保存在本机" : "All data and configuration stay local"}</span>
      </div>

      <div className="loop-layout">
        <section className="loop-main">
          <div className="view-header">
            <div>
              <h1 className="view-title">{zh ? "闭环状态总览" : "Loop Status Overview"}</h1>
            </div>
            <span className="row-meta">
              {summary ? (zh ? `更新于 ${new Date(summary.updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}` : `Updated ${new Date(summary.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`) : (zh ? "正在读取闭环状态" : "Loading loop status")}
            </span>
          </div>

          <div className="loop-status-list">
            {loadError ? (
              <div className="empty-state">
                <strong>{zh ? "闭环状态读取失败" : "Loop summary failed to load"}</strong>
                <p className="empty-hint">{loadError}</p>
              </div>
            ) : null}
            {(summary?.sections ?? []).map((row) => {
              const Icon = sectionIcons[row.id as keyof typeof sectionIcons] ?? Boxes;
              const labels = sectionLabel(row, zh);
              return (
                <article key={row.id} className={`loop-status-row ${row.tone}`}>
                  <div className="loop-status-icon"><Icon size={18} aria-hidden="true" /></div>
                  <div className="loop-status-primary">
                    <span><b>{labels.name}</b></span>
                    <strong>{row.count}</strong>
                    <span>{labels.caption}</span>
                  </div>
                  <div className="loop-status-metrics">
                    {row.metrics.map((metric) => {
                      const label = zh ? metric.labelZh : metric.labelEn;
                      return (
                        <div className="status-metric" key={`${row.id}-${label}`}>
                          <span>{label}</span>
                          <b>{metric.value}</b>
                        </div>
                      );
                    })}
                  </div>
                  <div className="row-action">
                    <span className="row-meta">{zh ? "下一步" : "Next"}</span>
                    <button className="action-button" type="button" onClick={() => onSelectView(toViewId(row.view))}>
                      {labels.action} →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="workbench-footer">
            <span className="local-dot">{zh ? "数据库  hone.db（SQLite）" : "Database  hone.db (SQLite)"}</span>
            <span>{zh ? "最近备份  昨天 22:10" : "Last backup  yesterday 22:10"}</span>
            <span>{zh ? "审计  已启用" : "Audit  enabled"}</span>
          </div>
        </section>

        <aside className="loop-side-rail">
          <section className="rail-card">
            <h3>{zh ? "待决策队列" : "Decision Queue"}</h3>
            {(summary?.decisions ?? []).length === 0 ? (
              <p className="empty-hint">{zh ? "当前没有待决策事项。" : "No pending decisions."}</p>
            ) : (summary?.decisions ?? []).map((decision) => (
              <button key={`${decision.view}-${decision.titleEn}`} className="decision-row" type="button" onClick={() => onSelectView(toViewId(decision.view))}>
                <span className={`mini-icon ${decision.severity === "warn" ? "purple" : "blue"}`}>{decision.severity === "warn" ? "!" : ">"}</span>
                <div>
                  <strong>{zh ? decision.titleZh : decision.titleEn}</strong>
                  <span className="row-meta">{zh ? decision.detailZh : decision.detailEn}</span>
                </div>
                <span className={`badge ${decision.severity === "warn" ? "badge-warn" : ""}`}>{decision.count}</span>
              </button>
            ))}
          </section>
          <section className="rail-card">
            <h3>{zh ? "目标健康度" : "Target Health"}</h3>
            {(summary?.targets ?? []).map((target) => (
              <div className="target-row" key={target.name}>
                <span className="mini-icon">{target.name === "Claude Code" ? "CC" : "CX"}</span>
                <div><strong>{target.name}</strong><span className="row-meta">{target.detail}</span></div>
                <span className={`badge ${target.score >= 85 ? "badge-good" : "badge-warn"}`}>{target.score}%</span>
              </div>
            ))}
          </section>
          <section className="rail-card">
            <h3>{zh ? "审计轨迹" : "Audit Trail"}</h3>
            <span className="badge" style={{ cursor: "pointer" }}>{zh ? "查看全部" : "View all"}</span>
            {(summary?.recentAudits ?? []).map((audit) => (
              <div className="audit-row" key={audit.id}>
                <span className={`badge ${audit.outcome === "success" ? "badge-good" : "badge-warn"}`}>{audit.outcome === "success" ? "OK" : "!"}</span>
                <div><strong>{audit.eventType}</strong><span className="row-meta">{audit.detail ?? audit.entityType ?? ""}</span></div>
                <span className="row-meta">{new Date(audit.createdAt).toLocaleTimeString(zh ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </section>
  );
}
