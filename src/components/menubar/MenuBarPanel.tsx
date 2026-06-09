import { BarChart3, Gauge, Layers, RotateCw, Search, ShieldCheck, Shuffle, Zap } from "lucide-react";

import type { FeedItem, Locale, ManifestSummary, TargetKind, UsageSummary } from "../../lib/types";
import { MacChrome } from "../shared/MacChrome";
import { HarnessLogo } from "../shared/HarnessLogo";

export interface MenuBarPanelProps {
  healthScore: number;
  highPriorityFeed: FeedItem[];
  locale: Locale;
  manifest: ManifestSummary | null;
  onOpenWorkbench: () => void;
  onRefresh: () => void;
  onRunDryRun: () => Promise<void>;
  onSwitchProfile: () => void;
  selectedProfileName: string;
  selectedTargetKind: TargetKind;
  standalone?: boolean;
  t: Record<string, string>;
  usageSummary: UsageSummary | null;
}

export function MenuBarPanel({
  healthScore,
  highPriorityFeed,
  locale,
  manifest,
  onOpenWorkbench,
  onRefresh,
  onRunDryRun,
  onSwitchProfile,
  selectedProfileName,
  selectedTargetKind,
  standalone = false,
  t,
  usageSummary,
}: MenuBarPanelProps) {
  const costMetric = usageSummary?.metrics.find((item) => item.id === "cost");
  const syncValue = manifest ? (locale === "zh-CN" ? "manifest 已写入" : "manifest written") : "93%";
  const burnMetric = usageSummary ? `$${usageSummary.burnRateUsdPerHour.toFixed(2)}/h` : "$0.82/h";
  const feedTitle = highPriorityFeed[0]?.title ?? (locale === "zh-CN" ? "暂无高优先事项" : "No high-priority items");
  const panelMetrics = [
    {
      icon: Layers,
      label: t.currentProfile,
      value: selectedProfileName,
      meta: `${selectedTargetKind} target`,
      tone: "blue",
    },
    {
      icon: Shuffle,
      label: t.syncStatus,
      value: syncValue,
      meta: manifest?.id ?? (locale === "zh-CN" ? "manifest 待生成" : "manifest pending"),
      tone: "green",
    },
    {
      icon: BarChart3,
      label: t.cost,
      value: costMetric ? `${costMetric.value}${costMetric.unit}` : "$4.82",
      meta: burnMetric,
      tone: "gold",
    },
    {
      icon: Zap,
      label: t.wake,
      value: t.awakeStandard,
      meta: "mock/system-safe",
      tone: "gold",
    },
  ];
  const focusMeta = locale === "zh-CN" ? "来自本地 feed，只显示摘要" : "Local feed summary only";

  return (
    <aside
      aria-label={t.menuPanel}
      className={standalone ? "menu-status-panel standalone" : "menu-status-panel"}
      data-testid={standalone ? "menu-panel-window" : undefined}
    >
      <MacChrome compact={standalone} status={standalone ? "Pinned" : "Live"} title={t.menuPanel} />

      <div className="panel-health">
        <div className="panel-score">
          <HarnessLogo size={28} />
          <strong>{healthScore}</strong>
        </div>
        <div>
          <span>{t.nativeHealthLabel}</span>
          <p>{t.nativePressure}</p>
        </div>
      </div>

      <div className="mini-chips">
        <span>{t.localFirst}</span>
        <span>{t.fixture}</span>
        <span>Keychain</span>
        <span>{t.phaseZero}</span>
      </div>

      <button className="panel-search" type="button">
        <Search size={16} aria-hidden="true" />
        <span>{t.searchPlaceholder}</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="panel-status-list">
        {panelMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className={`panel-status-row ${metric.tone}`} key={metric.label}>
              <span>
                <Icon size={15} aria-hidden="true" />
                {metric.label}
              </span>
              <strong>{metric.value}</strong>
              <small>{metric.meta}</small>
            </article>
          );
        })}
      </div>

      <div className="panel-actions" aria-label={t.quickActions}>
        <button type="button" onClick={onOpenWorkbench}>
          <Gauge size={16} aria-hidden="true" />
          <span>{t.openWorkbench}</span>
        </button>
        <button type="button" onClick={() => void onRunDryRun()}>
          <Zap size={16} aria-hidden="true" />
          <span>{t.dryRun}</span>
        </button>
        <button type="button" onClick={onSwitchProfile}>
          <Layers size={16} aria-hidden="true" />
          <span>{t.switchProfile}</span>
        </button>
        <button type="button" onClick={onRefresh}>
          <RotateCw size={16} aria-hidden="true" />
          <span>{t.refresh}</span>
        </button>
      </div>

      <section className="panel-safety-strip">
        <div>
          <span>{locale === "zh-CN" ? "安全边界" : "Safety boundary"}</span>
          <strong>{locale === "zh-CN" ? "真实写入关闭" : "Real writes blocked"}</strong>
        </div>
        <ShieldCheck size={24} aria-hidden="true" />
      </section>

      <section className="panel-focus-card">
        <div className="table-title">
          <span>{locale === "zh-CN" ? "下一步" : "Next"}</span>
          <strong>{highPriorityFeed.length || 1}</strong>
        </div>
        <strong>{feedTitle}</strong>
        <p>{focusMeta}</p>
      </section>
    </aside>
  );
}
