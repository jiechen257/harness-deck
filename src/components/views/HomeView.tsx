import { CheckCircle2 } from "lucide-react";
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

function section(summary: LoopSummary | null, id: string): LoopSection | null {
  return summary?.sections.find((item) => item.id === id) ?? null;
}

function metricValue(sectionValue: LoopSection | null, labelEn: string) {
  return sectionValue?.metrics.find((metric) => metric.labelEn === labelEn)?.value ?? "0";
}

function fallbackSections(zh: boolean): LoopSection[] {
  return [
    {
      id: "signals",
      nameZh: "信号",
      nameEn: "Signals",
      count: 3,
      captionZh: "待整理",
      captionEn: "pending",
      metrics: [
        { labelZh: "高影响", labelEn: "High impact", value: "1" },
        { labelZh: "官方来源", labelEn: "Official", value: "2" },
        { labelZh: "已规范化", labelEn: "Normalized", value: "0" },
      ],
      actionZh: "继续规范化",
      actionEn: "Continue normalization",
      view: "library",
      tone: "blue",
    },
    {
      id: "practices",
      nameZh: "实践",
      nameEn: "Practices",
      count: 2,
      captionZh: "可采纳",
      captionEn: "adoptable",
      metrics: [
        { labelZh: "待生成资产", labelEn: "Assets pending", value: "1" },
        { labelZh: "已应用", labelEn: "Applied", value: "0" },
      ],
      actionZh: "创建本地资产",
      actionEn: "Create local asset",
      view: "library",
      tone: "teal",
    },
    {
      id: "assets",
      nameZh: "资产",
      nameEn: "Assets",
      count: 1,
      captionZh: "注册表就绪",
      captionEn: "registry ready",
      metrics: [
        { labelZh: "Claude 已投射", labelEn: "Claude projected", value: "0" },
        { labelZh: "Codex 已投射", labelEn: "Codex projected", value: "0" },
      ],
      actionZh: "生成投射计划",
      actionEn: "Build projection plan",
      view: "apply",
      tone: "blue",
    },
    {
      id: "review",
      nameZh: "评审",
      nameEn: "Review",
      count: 1,
      captionZh: "缺失投射",
      captionEn: "missing projection",
      metrics: [
        { labelZh: "偏移/断链", labelEn: "Drift/broken", value: "0" },
        { labelZh: "孤立资产", labelEn: "Orphan", value: "0" },
      ],
      actionZh: "查看证据",
      actionEn: "View evidence",
      view: "review",
      tone: "purple",
    },
    {
      id: "operations",
      nameZh: "运维",
      nameEn: "Operations",
      count: 3,
      captionZh: "脚本",
      captionEn: "scripts",
      metrics: [
        { labelZh: "Codex 代理", labelEn: "Codex proxy", value: zh ? "已登记" : "registered" },
        { labelZh: "防睡守护", labelEn: "Sleep guard", value: zh ? "待确认" : "needs confirmation" },
        { labelZh: "今日脚本", labelEn: "Scripts today", value: "0" },
      ],
      actionZh: "预览运行计划",
      actionEn: "Preview run plan",
      view: "operations",
      tone: "gold",
    },
  ];
}

export function HomeView({ healthScore, locale, onSelectView, t }: HomeViewProps) {
  const zh = locale === "zh-CN";
  const [summary, setSummary] = useState<LoopSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const visibleHealthScore = summary?.healthScore ?? healthScore;
  const signalSection = section(summary, "signals");
  const practiceSection = section(summary, "practices");
  const assetSection = section(summary, "assets");
  const reviewSection = section(summary, "review");
  const sections = summary?.sections.length ? summary.sections : fallbackSections(zh);
  const decisions = summary?.decisions ?? [];

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
    <section className="view active loop-home" data-testid="home-view">
      <span className="sr-only">{zh ? "闭环状态总览" : "Loop Status Overview"}</span>
      <div className="view-title-row">
        <div>
          <span className="view-kicker">LOOP STATUS</span>
          <h1 className="view-title">{zh ? "把信号到本地资产的闭环变成今天的决策队列。" : "Turn the signal-to-asset loop into today's decision queue."}</h1>
          <p>{zh ? "闭环健康度、分段状态、待决策队列、目标健康度和最近审计汇总在这里，让每一步都有明确的下一步动作。" : "Loop health, segment status, decision queue, target health, and recent audits stay together so every step has a next action."}</p>
        </div>
        <span className="pill good status-pill" aria-label={t.productHealthLabel}>
          <CheckCircle2 size={14} aria-hidden="true" />
          {t.localReady}
        </span>
      </div>
      {loadError ? (
        <div className="empty-state">
          <strong>{zh ? "闭环状态读取失败" : "Loop summary failed to load"}</strong>
          <p className="empty-hint">{loadError}</p>
        </div>
      ) : null}
      <div className="hero-grid">
        <section className="command-card">
          <div className="score-row">
            <div className="score-ring" aria-label={zh ? `闭环健康度 ${visibleHealthScore}%` : `Loop health ${visibleHealthScore}%`}><span>{visibleHealthScore}%</span></div>
            <div>
              <h2>{zh ? "闭环健康度" : "Loop Health"}</h2>
              <p>{zh ? "信号、实践、资产、投射、评审和运维一起计算，所有数据与配置都保存在本机。" : "Signals, practices, assets, projection, review, and operations are scored together; all data and configuration stay local."}</p>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric"><strong>{signalSection?.count ?? 3}</strong><span>{zh ? "待整理信号" : "Signals pending"}</span></div>
            <div className="metric"><strong>{practiceSection?.count ?? 2}</strong><span>{zh ? "实践卡片" : "Practice cards"}</span></div>
            <div className="metric"><strong>{assetSection?.count ?? 1}</strong><span>{zh ? "本地资产" : "Local assets"}</span></div>
          </div>
        </section>
        <section className="flow-card">
          <div className="surface-head"><h2>{zh ? "今日顺序" : "Today's Order"}</h2><span className="badge warn">{zh ? `${decisions.length || 3} 个决策` : `${decisions.length || 3} decisions`}</span></div>
          {(decisions.length ? decisions : [
            { titleZh: "规范化 3 条信号", titleEn: "Normalize 3 signals", detailZh: "生成 Practice Card 预览", detailEn: "Generate Practice Card previews", count: 3, severity: "info", view: "library" },
            { titleZh: "预览 1 个投射项", titleEn: "Preview 1 projection", detailZh: "Codex / Claude 目标先看 diff", detailEn: "Review target diff first", count: 1, severity: "warn", view: "apply" },
            { titleZh: "评审缺失投射", titleEn: "Review missing projection", detailZh: "把证据链转成可处理建议", detailEn: "Turn evidence into action", count: 1, severity: "warn", view: "review" },
          ]).slice(0, 3).map((decision, index) => (
            <button className={index === 0 ? "flow-row active" : "flow-row"} type="button" key={`${decision.view}-${decision.titleEn}`} onClick={() => onSelectView(toViewId(decision.view))}>
              <span className="icon">{index === 0 ? "IN" : index === 1 ? "PR" : "RV"}</span>
              <div><strong>{zh ? decision.titleZh : decision.titleEn}</strong><span className="caption">{zh ? decision.detailZh : decision.detailEn}</span></div>
              <span className={decision.severity === "warn" ? "badge warn" : "badge"}>{decision.severity === "warn" ? (zh ? "需确认" : "Confirm") : (zh ? "下一步" : "Next")}</span>
            </button>
          ))}
        </section>
      </div>
      <section className="module">
        <div className="module-head"><h2>{zh ? "闭环分段" : "Loop Segments"}</h2><span className="caption">{zh ? "信号、实践、资产、评审、运维" : "Signals, practices, assets, review, operations"}</span></div>
        <div className="module-grid">
          {sections.map((row) => {
            const labels = sectionLabel(row, zh);
            return (
              <article className="flow-card loop-segment-card" key={row.id}>
                <span className={`badge ${row.tone === "teal" ? "good" : row.tone === "purple" || row.tone === "gold" ? "warn" : ""}`}>{labels.name}</span>
                <h3>{labels.caption} {row.count}</h3>
                <p>{row.metrics.map((metric) => `${zh ? metric.labelZh : metric.labelEn} ${metric.value}`).join(" · ")}</p>
                <button className="action" type="button" onClick={() => onSelectView(toViewId(row.view))}>{labels.action}</button>
              </article>
            );
          })}
          <article className="flow-card loop-segment-card">
            <span className="badge">{zh ? "授权" : "Authorization"}</span>
            <h3>{zh ? "5 个边界" : "5 boundaries"}</h3>
            <p>{zh ? "registry · local read · external signals · write projection · script execution" : "registry · local read · external signals · write projection · script execution"}</p>
            <button className="action" type="button" onClick={() => onSelectView("settings")}>{zh ? "检查授权" : "Check authorization"}</button>
          </article>
        </div>
      </section>
      <section className="flow-card home-status-strip">
        <div className="flow-row">
          <span className="icon">DB</span>
          <div><strong>{zh ? "本地状态" : "Local status"}</strong><span className="caption">{summary?.fixtureMode ? (zh ? "浏览器 fixture 数据" : "Browser fixture data") : (zh ? "SQLite 实时聚合" : "SQLite live aggregation")}</span></div>
          <span className="badge good">{zh ? "审计已启用" : "Audit enabled"}</span>
        </div>
        <div className="flow-row">
          <span className="icon">RV</span>
          <div><strong>{zh ? "当前风险" : "Current risk"}</strong><span className="caption">{zh ? `缺失投射 ${metricValue(reviewSection, "Missing")} · 资产待就绪 ${metricValue(practiceSection, "Assets pending")}` : `Missing ${metricValue(reviewSection, "Missing")} · assets pending ${metricValue(practiceSection, "Assets pending")}`}</span></div>
          <button className="action" type="button" onClick={() => onSelectView("review")}>{zh ? "查看证据" : "View evidence"}</button>
        </div>
      </section>
    </section>
  );
}
