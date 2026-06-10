import { BarChart3, CheckCircle2, Search, Settings, Sparkles } from "lucide-react";

import type { ViewId } from "../../constants/types";
import type { Locale } from "../../lib/types";

interface HomeViewProps {
  healthScore: number;
  locale: Locale;
  onSelectView: (view: ViewId) => void;
  t: Record<string, string>;
}

export function HomeView({ healthScore, locale, onSelectView, t }: HomeViewProps) {
  const zh = locale === "zh-CN";
  const cards = [
    {
      icon: Search,
      title: zh ? "信号源" : "Signal Sources",
      subtitle: zh ? "发现最新 AI coding 实践" : "Discover latest AI coding practices",
      action: zh ? "打开信号源" : "Open Sources",
      view: "discover" as ViewId,
    },
    {
      icon: BarChart3,
      title: zh ? "用量统计" : "Usage Stats",
      subtitle: zh ? "本地 agent 使用数据" : "Local agent usage data",
      action: zh ? "查看用量" : "View Usage",
      view: "usage" as ViewId,
    },
    {
      icon: Sparkles,
      title: zh ? "洞察与评审" : "Insights & Review",
      subtitle: zh ? "用量洞察和资产健康度" : "Usage insights and asset health",
      action: zh ? "查看洞察" : "View Insights",
      view: "insights" as ViewId,
    },
    {
      icon: Settings,
      title: zh ? "设置" : "Settings",
      subtitle: zh ? "授权、注册表和偏好" : "Authorization, registry & preferences",
      action: zh ? "打开设置" : "Open Settings",
      view: "settings" as ViewId,
    },
  ];

  return (
    <section className="hero-dashboard" data-testid="home-view">
      <div className="hero-header">
        <div className="hero-status-row">
          <div className="status-indicator" aria-label={t.productHealthLabel}>
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{t.localReady}</span>
          </div>
          <span className="health-badge" aria-label={t.healthScoreLabel}>{healthScore}%</span>
        </div>
        <h1 className="hero-title">{t.workbenchTitle}</h1>
        <p className="hero-subtitle">{zh ? "本地优先的 AI coding 实践运营台" : "Local-first AI coding practice operations console"}</p>
      </div>

      <div className="dashboard-cards">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button key={card.view} className="dashboard-card" type="button" onClick={() => onSelectView(card.view)}>
              <div className="card-icon"><Icon size={18} aria-hidden="true" /></div>
              <div className="card-body">
                <strong>{card.title}</strong>
                <span>{card.subtitle}</span>
              </div>
              <span className="card-action">{card.action} →</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
