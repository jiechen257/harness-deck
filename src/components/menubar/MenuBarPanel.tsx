import { Menu, Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";

import type { ViewId } from "../../constants/types";
import { getLoopSummary, refreshSignals } from "../../lib/api";
import type { Locale, LoopSection, LoopSummary } from "../../lib/types";
import { MacChrome } from "../shared/MacChrome";
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

type HealthRingStyle = CSSProperties & { "--score": string };

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
    <div className={standalone ? "menubar-panel standalone" : "menubar-panel"}>
      <MacChrome title={standalone ? "Hone" : ""} compact={standalone} />
      <div className="panel-content">
        <div className="menu-top">
          <div className="menu-product">
            <HarnessLogo size={standalone ? 30 : 40} />
            <div>
              <h2 className="menu-product-name">Hone</h2>
              <span className="local-dot">{zh ? "本地优先" : "Local-first"}</span>
            </div>
          </div>
          {!standalone ? (
            <div className="menu-icons">
              <Settings size={14} aria-hidden="true" />
              <Menu size={15} aria-hidden="true" />
            </div>
          ) : null}
        </div>

        <div className="panel-today">
          <strong>{summary?.fixtureMode ? (zh ? "Fixture" : "Fixture") : (zh ? "本机状态" : "Local status")}</strong>
          <span>{summary ? new Date(summary.updatedAt).toLocaleString(zh ? "zh-CN" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : (zh ? "读取中" : "Loading")}</span>
        </div>
        {error ? (
          <div className="panel-error">
            <strong>{zh ? "需要处理" : "Needs attention"}</strong>
            <span>{error}</span>
            <button type="button" onClick={() => onOpenView("settings")}>{zh ? "打开设置" : "Open Settings"}</button>
          </div>
        ) : null}

        <div className="menu-body">
          <div className="menu-stack">
            <section className="status-card health-status-card">
              <div className="status-head">
                <div>
                  <strong>{zh ? "闭环健康度" : "Loop Health"}</strong>
                  <span>{zh ? "闭环状态" : "Loop status"}</span>
                </div>
                <span className="menu-pill good">{healthScore}%</span>
              </div>
              <div className="panel-health-card">
                <div className="health-ring" style={{ "--score": `${healthScore}%` } as HealthRingStyle}>
                  <strong>{healthScore}%</strong>
                  <span>{zh ? "良好" : "Good"}</span>
                </div>
                <div className="health-legend">
                  <span><i className="dot teal" />{zh ? "信号" : "Signals"} <b>{signalSection?.count ?? 0}</b></span>
                  <span><i className="dot teal" />{zh ? "实践" : "Practices"} <b>{practiceSection?.count ?? 0}</b></span>
                  <span><i className="dot teal" />{zh ? "资产" : "Assets"} <b>{assetSection?.count ?? 0}</b></span>
                  <span><i className="dot gold" />{zh ? "评审" : "Review"} <b>{reviewSection?.count ?? 0}</b></span>
                  <span><i className="dot muted" />{zh ? "运维" : "Ops"} <b>{operationsSection?.count ?? 0}</b></span>
                </div>
              </div>
            </section>

            <section className="status-card">
              <div className="status-head">
                <div><strong>{zh ? "实践健康度" : "Practice Health"}</strong></div>
              </div>
              <div className="menu-timeline">
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "可采纳" : "Adoptable"}</strong><span>{zh ? "待转本地资产" : "To local assets"}</span></div>
                  <span className="menu-pill good">{metricValue(practiceSection, "Adoptable")}</span>
                </div>
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "资产待就绪" : "Assets pending"}</strong><span>{zh ? "等待确认" : "Awaiting confirm"}</span></div>
                  <span className="menu-pill warn">{metricValue(practiceSection, "Assets pending")}</span>
                </div>
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "缺失投射" : "Missing"}</strong><span>{zh ? "需要评审" : "Needs review"}</span></div>
                  <span className="menu-pill risk">{metricValue(reviewSection, "Missing")}</span>
                </div>
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "孤立" : "Orphan"}</strong><span>{zh ? "缺少实践关系" : "No practice link"}</span></div>
                  <span className="menu-pill">{metricValue(reviewSection, "Orphan")}</span>
                </div>
              </div>
            </section>

            <section className="status-card">
              <div className="status-head">
                <div><strong>{zh ? "本机运维" : "Local Ops"}</strong></div>
              </div>
              <div className="menu-timeline">
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "Codex 代理" : "Codex proxy"}</strong></div>
                  <span className="menu-pill">{metricValue(operationsSection, "Codex proxy")}</span>
                </div>
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "防睡守护" : "Sleep guard"}</strong></div>
                  <span className="menu-pill">{metricValue(operationsSection, "Sleep guard")}</span>
                </div>
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "今日脚本" : "Scripts today"}</strong></div>
                  <span className="menu-pill">{metricValue(operationsSection, "Scripts today")}</span>
                </div>
              </div>
            </section>

            <section className="status-card">
              <div className="status-head">
                <div><strong>{zh ? "快捷入口" : "Quick Actions"}</strong></div>
              </div>
              <div className="menu-quick-grid">
                <button className="quick-tile" type="button" disabled={refreshing || panelRefreshing} onClick={handleRefreshSignals}><b>{zh ? "刷新信号" : "Refresh"}</b><span>{zh ? "低风险读取" : "Low-risk read"}</span></button>
                <button className="quick-tile" type="button" onClick={() => onOpenView("library")}><b>{zh ? "规范化信号" : "Normalize"}</b><span>{zh ? "主窗口确认" : "Confirm in workbench"}</span></button>
                <button className="quick-tile" type="button" onClick={() => onOpenView("review")}><b>{zh ? "打开本地评审" : "Open Local Review"}</b><span>{zh ? "查看证据" : "View evidence"}</span></button>
                <button className="quick-tile" type="button" onClick={() => onOpenView("apply")}><b>{zh ? "打开应用与同步" : "Open Apply & Sync"}</b><span>{zh ? "先预览计划" : "Preview plan first"}</span></button>
              </div>
              <button className="quick-action" type="button" onClick={onOpenWorkbench}>
                <div>
                  <strong>{zh ? "打开工作台" : "Open Workbench"}</strong>
                  <span>{zh ? "进入完整运营台" : "Enter full ops desk"}</span>
                </div>
                <span>→</span>
              </button>
            </section>

            <div className="menu-footer">
              <span className="menu-pill">{zh ? "配置集：默认" : "Profile: Default"}</span>
              <span className="menu-pill good">{zh ? "同步：正常" : "Sync: OK"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
