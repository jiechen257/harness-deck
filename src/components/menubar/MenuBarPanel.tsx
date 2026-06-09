import { Gauge, RefreshCw, Sparkles } from "lucide-react";

import type { Locale } from "../../lib/types";
import { MacChrome } from "../shared/MacChrome";
import { HarnessLogo } from "../shared/HarnessLogo";

export interface MenuBarPanelProps {
  healthScore: number;
  latestHotTitle: string | null;
  locale: Locale;
  onCrawl: () => void;
  onOpenWorkbench: () => void;
  pendingSuggestionCount: number;
  standalone?: boolean;
  todayCost: string;
}

export function MenuBarPanel({
  healthScore,
  latestHotTitle,
  locale,
  onCrawl,
  onOpenWorkbench,
  pendingSuggestionCount,
  standalone = false,
  todayCost,
}: MenuBarPanelProps) {
  return (
    <aside
      aria-label={locale === "zh-CN" ? "菜单栏面板" : "Menu Bar Panel"}
      className={standalone ? "menu-status-panel standalone" : "menu-status-panel"}
      data-testid={standalone ? "menu-panel-window" : undefined}
    >
      <MacChrome compact={standalone} status={standalone ? "Pinned" : "Live"} title={locale === "zh-CN" ? "Hone" : "Hone"} />

      <div className="panel-health">
        <div className="panel-score">
          <HarnessLogo size={32} />
          <strong>{healthScore}</strong>
        </div>
        <div>
          <span>{locale === "zh-CN" ? "工作台健康度" : "Workbench health"}</span>
          <p>{locale === "zh-CN" ? "本地优先就绪" : "Local-first ready"}</p>
        </div>
      </div>

      {/* Today's hot topic */}
      <section className="panel-focus-card">
        <div className="table-title">
          <span>{locale === "zh-CN" ? "今日热点" : "Today's Hot"}</span>
        </div>
        <strong>{latestHotTitle ?? (locale === "zh-CN" ? "点击下方更新热榜" : "Click below to update feed")}</strong>
      </section>

      {/* Key metrics */}
      <div className="panel-status-list">
        <article className="panel-status-row teal">
          <span>
            <Sparkles size={15} aria-hidden="true" />
            {locale === "zh-CN" ? "待处理建议" : "Pending Suggestions"}
          </span>
          <strong>{pendingSuggestionCount}</strong>
          <small>{locale === "zh-CN" ? "来自洞察分析" : "from insights"}</small>
        </article>
        <article className="panel-status-row gold">
          <span>{locale === "zh-CN" ? "今日成本" : "Today's Cost"}</span>
          <strong>{todayCost}</strong>
          <small>{locale === "zh-CN" ? "估算" : "estimated"}</small>
        </article>
      </div>

      {/* Quick actions */}
      <div className="panel-actions" aria-label={locale === "zh-CN" ? "快捷动作" : "Quick Actions"}>
        <button type="button" onClick={onCrawl}>
          <RefreshCw size={16} aria-hidden="true" />
          <span>{locale === "zh-CN" ? "更新热榜" : "Update Feed"}</span>
        </button>
        <button type="button" onClick={onOpenWorkbench}>
          <Gauge size={16} aria-hidden="true" />
          <span>{locale === "zh-CN" ? "打开工作台" : "Open Workbench"}</span>
        </button>
      </div>
    </aside>
  );
}
