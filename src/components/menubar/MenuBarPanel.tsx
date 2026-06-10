import { Gauge, RefreshCw } from "lucide-react";

import type { Locale } from "../../lib/types";
import { MacChrome } from "../shared/MacChrome";
import { HarnessLogo } from "../shared/HarnessLogo";

interface MenuBarPanelProps {
  healthScore: number;
  locale: Locale;
  onRefresh: () => void;
  onOpenWorkbench: () => void;
  refreshing: boolean;
  standalone?: boolean;
}

export function MenuBarPanel({
  healthScore,
  locale,
  onRefresh,
  onOpenWorkbench,
  refreshing,
  standalone,
}: MenuBarPanelProps) {
  const zh = locale === "zh-CN";

  return (
    <div className={standalone ? "menubar-panel standalone" : "menubar-panel"}>
      <MacChrome title="Hone" compact />
      <div className="panel-content">
        <div className="panel-brand">
          <HarnessLogo size={28} />
          <div>
            <strong className="panel-title">Hone</strong>
            <span className="panel-subtitle">{zh ? "本地优先" : "Local-first"}</span>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-metric">
            <Gauge size={14} aria-hidden="true" />
            <span>{zh ? "健康度" : "Health"}</span>
            <strong>{healthScore}%</strong>
          </div>
        </div>

        <div className="panel-actions">
          <button className="panel-action-button" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw size={14} aria-hidden="true" className={refreshing ? "spin" : ""} />
            {refreshing ? (zh ? "刷新中…" : "Refreshing…") : (zh ? "刷新状态" : "Refresh Status")}
          </button>
          <button className="panel-action-button primary" onClick={onOpenWorkbench}>
            {zh ? "打开工作台" : "Open Workbench"}
          </button>
        </div>
      </div>
    </div>
  );
}
