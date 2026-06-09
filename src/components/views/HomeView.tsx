import { BarChart3, CheckCircle2, Gauge, Layers, Search, ShieldCheck, Shuffle, TerminalSquare, Zap } from "lucide-react";

import type { ViewId } from "../../constants/types";
import type { FeedItem, Locale, ManifestSummary, TargetKind, UsageSummary, WakeControlSummary } from "../../lib/types";
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
  wakeSummary: WakeControlSummary | null;
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
  wakeSummary,
}: HomeViewProps) {
  const costMetric = usageSummary?.metrics.find((metric) => metric.id === "cost");
  const cards = [
    {
      icon: Search,
      label: locale === "zh-CN" ? "发现最佳实践" : "Discover",
      value: "7",
      unit: locale === "zh-CN" ? "源" : "src",
      badge: locale === "zh-CN" ? "注册表" : "Registry",
      meta: locale === "zh-CN" ? "本地 registry 与 find-best-skill 推荐" : "Local registry and find-best-skill recommendations",
      tone: "blue",
      onAction: () => onSelectView("discover"),
    },
    {
      icon: Layers,
      label: locale === "zh-CN" ? "配置集" : "Profiles",
      value: "42",
      unit: locale === "zh-CN" ? "条规则" : "rules",
      badge: selectedProfileName,
      meta: locale === "zh-CN" ? "维护 Harness Profile、skills、MCP 引用" : "Harness Profile, skills, and MCP references",
      tone: "purple",
      onAction: () => onSelectView("profiles"),
    },
    {
      icon: Shuffle,
      label: locale === "zh-CN" ? "安全同步" : "Safe Sync",
      value: manifest ? "Done" : locale === "zh-CN" ? "就绪" : "Ready",
      unit: "",
      badge: selectedTargetKind,
      meta: locale === "zh-CN" ? "Claude Code / Codex 走 dry-run、diff、manifest" : "Claude Code / Codex via dry-run, diff, and manifest",
      tone: "teal",
      onAction: onRunDryRun,
    },
    {
      icon: TerminalSquare,
      label: locale === "zh-CN" ? "日常运行" : "Operate",
      value: wakeSummary?.currentState.confirmed ? "Exp" : locale === "zh-CN" ? "标准" : "Std",
      unit: "",
      badge: t.wake,
      meta: locale === "zh-CN" ? "菜单栏快捷动作、防睡、工作台入口" : "Menu bar actions, wake control, workbench entry",
      tone: "gold",
      onAction: () => onSelectView("operate"),
    },
    {
      icon: BarChart3,
      label: locale === "zh-CN" ? "用量与成本" : "Usage",
      value: costMetric ? costMetric.value : "$4.82",
      unit: costMetric?.unit ?? "",
      badge: "5h",
      meta: locale === "zh-CN" ? "token、成本、时长、置信度一起展示" : "Tokens, cost, duration, and confidence",
      tone: "blue",
      onAction: () => onSelectView("usage"),
    },
    {
      icon: ShieldCheck,
      label: locale === "zh-CN" ? "守护边界" : "Guard",
      value: "100",
      unit: "%",
      badge: "Keychain",
      meta: locale === "zh-CN" ? "默认不上传 prompt、源码、secret 或原始配置" : "No prompts, source, secrets, or raw config uploaded by default",
      tone: "teal",
      onAction: () => onSelectView("guard"),
    },
  ];
  const improvements = [
    {
      label: locale === "zh-CN" ? "已清理" : "Cleared",
      value: manifest ? "1" : "0",
      detail: locale === "zh-CN" ? "dry-run 部署清单" : "dry-run manifest",
    },
    {
      label: locale === "zh-CN" ? "待授权" : "Needs auth",
      value: "2",
      detail: "Codex / Claude Code",
    },
    {
      label: locale === "zh-CN" ? "建议" : "Suggestions",
      value: String(highPriorityFeed.length || 3),
      detail: highPriorityFeed[0]?.title ?? "Profile drift",
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
            {locale === "zh-CN" ? "安全边界 100%" : "Safety 100%"}
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
