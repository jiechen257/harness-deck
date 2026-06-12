import { useCallback, useEffect, useState } from "react";

import type { ViewId } from "../../constants/types";
import { getLoopSummary, refreshSignals } from "../../lib/api";
import type { Locale, LoopSection, LoopSummary } from "../../lib/types";
import { HarnessLogo } from "../shared/HarnessLogo";

interface MenuBarPanelProps {
  healthScore: number;
  locale: Locale;
  onRefresh: () => void;
  onOpenWorkbench: () => void;
  onOpenView: (view: ViewId) => void;
  refreshing: boolean;
  standalone?: boolean;
}

function section(summary: LoopSummary | null, id: string): LoopSection | null {
  return summary?.sections.find((item) => item.id === id) ?? null;
}

function metricValue(sectionValue: LoopSection | null, labelEn: string) {
  return sectionValue?.metrics.find((metric) => metric.labelEn === labelEn)?.value ?? "0";
}

export function MenuBarPanel({
  healthScore: fallbackHealthScore,
  locale,
  onRefresh,
  onOpenWorkbench,
  onOpenView,
  refreshing,
  standalone,
}: MenuBarPanelProps) {
  const zh = locale === "zh-CN";
  const [summary, setSummary] = useState<LoopSummary | null>(null);
  const [panelRefreshing, setPanelRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const healthScore = summary?.healthScore ?? fallbackHealthScore;
  const signalSection = section(summary, "signals");
  const practiceSection = section(summary, "practices");
  const assetSection = section(summary, "assets");
  const reviewSection = section(summary, "review");
  const operationsSection = section(summary, "operations");
  const updatedAt = summary
    ? new Date(summary.updatedAt).toLocaleString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : (zh ? "读取中" : "Loading");

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await getLoopSummary());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const handleRefreshSignals = async () => {
    setPanelRefreshing(true);
    setError(null);
    try {
      await refreshSignals();
      await loadSummary();
      onRefresh();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : String(refreshError));
    } finally {
      setPanelRefreshing(false);
    }
  };

  return (
    <main className={standalone ? "statusbar-stage standalone" : "statusbar-stage"}>
      <div className="menubar"><span className="dot" /><span>Hone · Practice Shard</span></div>
      <section className="menubar-panel panel">
        <header className="capsule-head">
          <div className="brand">
            <span className="logo" aria-hidden="true"><HarnessLogo size={32} /></span>
            <div>
              <strong>Hone</strong>
              <span className="caption">{zh ? `Practice Shard · 本地优先 · ${updatedAt}` : `Practice Shard · Local-first · ${updatedAt}`}</span>
            </div>
          </div>
          <span className="badge good">{healthScore}%</span>
        </header>
        {error ? (
          <div className="panel-error">
            <strong>{zh ? "需要处理" : "Needs attention"}</strong>
            <span>{error}</span>
            <button type="button" onClick={() => onOpenView("settings")}>{zh ? "打开设置" : "Open Settings"}</button>
          </div>
        ) : null}

        <div className="content">
          <section className="status-strip">
            <div className="ring"><span>{healthScore}%</span></div>
            <div>
              <h2>{zh ? "闭环健康度" : "Loop Health"}</h2>
              <p>{zh ? "把今天的信号、实践、资产和评审状态压缩成一眼可读的菜单栏摘要。" : "Compress today's signals, practices, assets, and review state into a menu-bar summary."}</p>
              <div className="mini-grid">
                <span className="mini">{zh ? "信号" : "Signals"} <b>{signalSection?.count ?? 0}</b></span>
                <span className="mini">{zh ? "实践" : "Practices"} <b>{practiceSection?.count ?? 0}</b></span>
                <span className="mini">{zh ? "资产" : "Assets"} <b>{assetSection?.count ?? 0}</b></span>
                <span className="mini">{zh ? "评审" : "Review"} <b>{reviewSection?.count ?? 0}</b></span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head"><div><strong>{zh ? "实践健康度" : "Practice Health"}</strong><div className="caption">{zh ? "待处理对象按下一步排序" : "Items ordered by next step"}</div></div><span className="pill warn">3</span></div>
            <div className="row"><div><strong>{zh ? "可采纳" : "Adoptable"}</strong><span className="caption">{zh ? "待转本地资产" : "To local assets"}</span></div><span className="pill good">{metricValue(practiceSection, "Adoptable")}</span></div>
            <div className="row"><div><strong>{zh ? "资产待就绪" : "Assets pending"}</strong><span className="caption">{zh ? "等待确认" : "Awaiting confirm"}</span></div><span className="pill warn">{metricValue(practiceSection, "Assets pending")}</span></div>
            <div className="row"><div><strong>{zh ? "缺失投射" : "Missing"}</strong><span className="caption">{zh ? "需要评审" : "Needs review"}</span></div><span className="pill risk">{metricValue(reviewSection, "Missing")}</span></div>
          </section>

          <section className="card">
            <div className="card-head"><div><strong>{zh ? "本机运维" : "Local Ops"}</strong><div className="caption">{zh ? "只读状态，运行进入工作台确认" : "Read-only state; run from workbench confirmation"}</div></div><span className="pill">{operationsSection?.metrics.length ?? 3}</span></div>
            <div className="row"><div><strong>Codex proxy</strong><span className="caption">launchctl</span></div><span className="pill good">{metricValue(operationsSection, "Codex proxy") || (zh ? "运行中" : "running")}</span></div>
            <div className="row"><div><strong>Sleep guard</strong><span className="caption">caffeinate</span></div><span className="pill warn">{metricValue(operationsSection, "Sleep guard") || (zh ? "活跃" : "active")}</span></div>
            <div className="row"><div><strong>Wake display</strong><span className="caption">pmset</span></div><span className="pill">{metricValue(operationsSection, "Scripts today") || (zh ? "空闲" : "idle")}</span></div>
          </section>

          <section className="card">
            <div className="card-head"><div><strong>{zh ? "快捷入口" : "Quick Actions"}</strong><div className="caption">{zh ? "低风险动作在菜单栏，写入动作进入工作台确认" : "Low-risk actions stay here; writes open the workbench"}</div></div></div>
            <button className="action" type="button" disabled={refreshing || panelRefreshing} onClick={handleRefreshSignals}><div><strong>{zh ? "刷新信号" : "Refresh"}</strong><span className="caption">{zh ? "低风险读取" : "Low-risk read"}</span></div><span>↻</span></button>
            <button className="action" type="button" onClick={() => onOpenView("library")}><div><strong>{zh ? "规范化信号" : "Normalize"}</strong><span className="caption">{zh ? "主窗口确认" : "Confirm in workbench"}</span></div><span>→</span></button>
            <button className="action" type="button" onClick={() => onOpenView("review")}><div><strong>{zh ? "打开本地评审" : "Open Local Review"}</strong><span className="caption">{zh ? "查看证据" : "View evidence"}</span></div><span>→</span></button>
            <button className="action" type="button" onClick={() => onOpenView("apply")}><div><strong>{zh ? "打开应用与同步" : "Open Apply & Sync"}</strong><span className="caption">{zh ? "先预览计划" : "Preview plan first"}</span></div><span>→</span></button>
            <button className="action primary" type="button" onClick={onOpenWorkbench}><div><strong>{zh ? "打开工作台" : "Open Workbench"}</strong><span className="caption">{zh ? "进入完整运营台" : "Enter full ops desk"}</span></div><span>↗</span></button>
          </section>
        </div>
        <footer className="footer"><span className="pill">{zh ? "配置集：默认" : "Profile: Default"}</span><span className="pill good">{zh ? "同步：正常" : "Sync: OK"}</span></footer>
      </section>
    </main>
  );
}
