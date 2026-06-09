import { BarChart3, CheckCircle2, Gauge, Search, Settings, Sparkles, Zap } from "lucide-react";

import type { ViewId } from "../../constants/types";
import type { FeedItem, Locale, ManifestSummary, TargetKind, UsageSummary } from "../../lib/types";
import { ChevronRightIcon } from "../shared/ChevronRightIcon";

interface HomeViewProps {
  healthScore: number;
  highPriorityFeed: FeedItem[];
  locale: Locale;
  manifest: ManifestSummary | null;
  onOpenWorkbench: () => void;
  onRunDryRun: () => Promise<void>;
  onSelectView: (viewId: ViewId) => void;
  selectedProfileName: string;
  selectedTargetKind: TargetKind;
  t: Record<string, string>;
  usageSummary: UsageSummary | null;
}

export function HomeView({
  healthScore,
  highPriorityFeed,
  locale,
  manifest,
  onOpenWorkbench,
  onRunDryRun,
  onSelectView,
  selectedProfileName,
  selectedTargetKind,
  t,
  usageSummary,
}: HomeViewProps) {
  const costMetric = usageSummary?.metrics.find((metric) => metric.id === "cost");
  const cards = [
    {
      icon: Search,
      label: locale === "zh-CN" ? "发现范式" : "Discover",
      value: locale === "zh-CN" ? "热榜" : "Feed",
      unit: "",
      badge: locale === "zh-CN" ? "多平台" : "Multi-source",
      meta: locale === "zh-CN" ? "GitHub trending、HN、Reddit、linux.do 热门实践" : "Trending practices from GitHub, HN, Reddit, linux.do",
      tone: "blue",
      onAction: () => onSelectView("discover"),
    },
    {
      icon: BarChart3,
      label: locale === "zh-CN" ? "用量与成本" : "Usage",
      value: costMetric ? costMetric.value : "$4.82",
      unit: costMetric?.unit ?? "",
      badge: "5h",
      meta: locale === "zh-CN" ? "token、成本、时长、模型分布" : "Tokens, cost, duration, and model distribution",
      tone: "purple",
      onAction: () => onSelectView("usage"),
    },
    {
      icon: Sparkles,
      label: locale === "zh-CN" ? "洞察与优化" : "Insights",
      value: String(highPriorityFeed.length || 3),
      unit: locale === "zh-CN" ? "条建议" : "items",
      badge: locale === "zh-CN" ? "AI 驱动" : "AI-driven",
      meta: locale === "zh-CN" ? "基于用量数据生成优化建议，一键应用到配置" : "AI-generated optimization suggestions from usage data",
      tone: "teal",
      onAction: () => onSelectView("insights"),
    },
    {
      icon: Settings,
      label: locale === "zh-CN" ? "设置" : "Settings",
      value: selectedProfileName,
      unit: "",
      badge: selectedTargetKind,
      meta: locale === "zh-CN" ? "配置集、同步、守护策略、防睡控制" : "Profiles, sync, guard policy, wake control",
      tone: "gold",
      onAction: () => onSelectView("settings"),
    },
  ];
  const improvements = [
    {
      label: locale === "zh-CN" ? "已清理" : "Cleared",
      value: manifest ? "1" : "0",
      detail: locale === "zh-CN" ? "dry-run 部署清单" : "dry-run manifest",
    },
    {
      label: locale === "zh-CN" ? "待处理" : "Pending",
      value: String(highPriorityFeed.length || 3),
      detail: locale === "zh-CN" ? "优化建议" : "suggestions",
    },
  ];
  return (
    <div className="home-dashboard">
      <section className="home-summary-bar">
        <div className="home-summary-left">
          <div className="home-summary-score">
            <strong>{healthScore}</strong>
            <span>{t.nativePressure}</span>
          </div>
        </div>
        <div className="home-summary-meta">
          <span>{selectedProfileName}</span>
          <span>{costMetric ? `${costMetric.value}${costMetric.unit}` : "$4.82"}</span>
          <span className="home-safety-badge">
            <CheckCircle2 size={13} aria-hidden="true" />
            {locale === "zh-CN" ? "本地优先" : "Local-first"}
          </span>
        </div>
        <div className="home-summary-actions">
          <button className="primary-action compact" type="button" onClick={() => void onRunDryRun()}>
            <Zap size={15} aria-hidden="true" />
            <span>{t.dryRun}</span>
          </button>
          <button className="toolbar-button" type="button" onClick={onOpenWorkbench}>
            <Gauge size={15} aria-hidden="true" />
            <span>{t.openWorkbench}</span>
          </button>
        </div>
      </section>

      <section className="home-card-grid" aria-label={t.statusWorkbench}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button key={card.label} className={`home-card ${card.tone}`} type="button" onClick={() => void card.onAction?.()}>
              <div className="home-card-head">
                <Icon size={16} aria-hidden="true" />
                <span className="home-card-label">{card.label}</span>
                <em className="home-card-badge">{card.badge}</em>
              </div>
              <div className="home-card-value">
                <strong>{card.value}</strong>
                {card.unit ? <span>{card.unit}</span> : null}
              </div>
              <p className="home-card-meta">{card.meta}</p>
            </button>
          );
        })}
      </section>

      <section className="home-bottom-bar">
        <div className="home-bottom-left">
          <span className="home-bottom-label">{t.improvementQueue}</span>
          {improvements.map((item) => (
            <span key={item.label} className="home-improvement-chip">
              <strong>{item.value}</strong> {item.label}
            </span>
          ))}
        </div>
        <button type="button" className="toolbar-button" onClick={onOpenWorkbench}>
          {t.openWorkbench}
          <ChevronRightIcon />
        </button>
      </section>
    </div>
  );
}
