import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { listSignalSources, toggleSignalSource, refreshSignals, listSignals } from "../../lib/api";
import type { Locale, SignalCard, SourceConfig } from "../../lib/types";

interface DiscoverViewProps {
  locale: Locale;
}

export function DiscoverView({ locale }: DiscoverViewProps) {
  const [sources, setSources] = useState<SourceConfig[]>([]);
  const [signals, setSignals] = useState<SignalCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const zh = locale === "zh-CN";

  const loadData = useCallback(async () => {
    const [nextSources, nextSignals] = await Promise.all([
      listSignalSources(),
      listSignals(),
    ]);
    setSources(nextSources);
    setSignals(nextSignals);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleToggle = async (id: string, enabled: boolean) => {
    await toggleSignalSource(id, enabled);
    await loadData();
  };

  const handleRefresh = async (sourceId?: string) => {
    setRefreshing(true);
    try {
      await refreshSignals(sourceId);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const tierLabel = (tier: string) => {
    if (tier === "official") return zh ? "官方" : "Official";
    if (tier === "maintainer") return zh ? "维护者" : "Maintainer";
    return zh ? "社区" : "Community";
  };

  const typeLabel = (type: string) => {
    if (type === "changelog") return zh ? "产品更新" : "Changelog";
    if (type === "model_news") return zh ? "模型讯息" : "Model News";
    return zh ? "社区实践" : "Community";
  };

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2 className="view-title">{zh ? "信号源" : "Signal Sources"}</h2>
          <p className="view-subtitle">{zh ? "管理信息来源，手动刷新获取新信号" : "Manage sources and refresh to fetch new signals"}</p>
        </div>
        <button className="action-button primary" disabled={refreshing} onClick={() => handleRefresh()}>
          <RefreshCw size={14} aria-hidden="true" className={refreshing ? "spin" : ""} />
          {refreshing ? (zh ? "刷新中…" : "Refreshing…") : (zh ? "刷新全部" : "Refresh All")}
        </button>
      </div>

      <section className="card-section">
        <h3 className="section-title">{zh ? "已配置来源" : "Configured Sources"}</h3>
        <div className="item-list">
          {sources.map((source) => (
            <div key={source.id} className="list-row">
              <div className="row-primary">
                <strong>{source.name}</strong>
                <span className="row-meta">
                  <span className={`badge ${source.sourceTier === "official" ? "badge-good" : ""}`}>{tierLabel(source.sourceTier)}</span>
                  <span className="badge">{typeLabel(source.sourceType)}</span>
                </span>
              </div>
              <div className="row-actions">
                <label className="toggle-label">
                  <input type="checkbox" checked={source.enabled} onChange={(e) => handleToggle(source.id, e.target.checked)} />
                  <span>{zh ? "启用" : "On"}</span>
                </label>
                <button className="action-button small" disabled={!source.enabled || refreshing} onClick={() => handleRefresh(source.id)}>
                  {zh ? "刷新" : "Refresh"}
                </button>
              </div>
            </div>
          ))}
          {sources.length === 0 && <p className="empty-hint">{zh ? "暂无信号源配置" : "No signal sources configured"}</p>}
        </div>
      </section>

      <section className="card-section">
        <h3 className="section-title">{zh ? `最近信号 (${signals.length})` : `Recent Signals (${signals.length})`}</h3>
        <div className="item-list">
          {signals.slice(0, 20).map((signal) => (
            <div key={signal.id} className="list-row">
              <div className="row-primary">
                <strong>{signal.title}</strong>
                <span className="row-meta">
                  {tierLabel(signal.sourceTier)} · {signal.confidence === "confirmed" ? (zh ? "已确认" : "Confirmed") : (zh ? "未验证" : "Unverified")}
                </span>
              </div>
              <span className={`badge ${signal.impact === "high" ? "badge-warn" : ""}`}>
                {signal.impact === "high" ? (zh ? "高影响" : "High") : signal.impact === "medium" ? (zh ? "中" : "Med") : (zh ? "低" : "Low")}
              </span>
            </div>
          ))}
          {signals.length === 0 && <p className="empty-hint">{zh ? "暂无信号。启用来源后点击刷新。" : "No signals yet. Enable sources and refresh."}</p>}
        </div>
      </section>
    </div>
  );
}
