import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import type { ViewId } from "../../constants/types";
import { listSignalSources, listSignals, refreshSignals, toggleSignalSource } from "../../lib/api";
import type { Locale, SignalCard, SourceConfig } from "../../lib/types";

interface PracticeLibraryViewProps {
  locale: Locale;
  onSelectView: (view: ViewId) => void;
}

type LibraryTab = "signals" | "practices" | "assets" | "archived";

const practiceCards = [
  ["Local harness review", "Workflow", "检查 registry、Claude/Codex target、projection drift 和孤立资产。", "待生成资产"],
  ["Registry projection", "Skill", "用 symlink 将本地资产投射到 Claude Code 和 Codex。", "可采纳"],
  ["Signal normalization", "Methodology", "把 changelog、模型讯息和社区热度规范化为 Practice Card。", "已应用"],
] as const;

const assets = [
  ["local-harness-review", "registry/system-skills/local-harness-review", "Claude + Codex", "symlink"],
  ["normalize-practice-card", "registry/system-skills/normalize-practice-card", "Codex", "symlink"],
  ["context7-mcp", "registry/mcp/context7.toml", "Claude Code", "copy fallback"],
] as const;

export function PracticeLibraryView({ locale, onSelectView }: PracticeLibraryViewProps) {
  const [tab, setTab] = useState<LibraryTab>("signals");
  const [sources, setSources] = useState<SourceConfig[]>([]);
  const [signals, setSignals] = useState<SignalCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const zh = locale === "zh-CN";

  const loadData = useCallback(async () => {
    const [nextSources, nextSignals] = await Promise.all([listSignalSources(), listSignals()]);
    setSources(nextSources);
    setSignals(nextSignals);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleRefresh = async (sourceId?: string) => {
    setRefreshing(true);
    try {
      await refreshSignals(sourceId);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const tabs: { id: LibraryTab; label: string }[] = [
    { id: "signals", label: zh ? "信号" : "Signals" },
    { id: "practices", label: zh ? "实践" : "Practices" },
    { id: "assets", label: zh ? "资产" : "Assets" },
    { id: "archived", label: zh ? "归档" : "Archived" },
  ];

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2 className="view-title">{zh ? "实践库" : "Practice Library"}</h2>
          <p className="view-subtitle">{zh ? "信号只是输入，最终要沉淀为实践卡片和本地资产。" : "Signals are inputs; the endpoint is an applied practice and local asset."}</p>
        </div>
        <button className="action-button primary" disabled={refreshing} onClick={() => handleRefresh()}>
          <RefreshCw size={14} aria-hidden="true" className={refreshing ? "spin" : ""} />
          {refreshing ? (zh ? "刷新中..." : "Refreshing...") : (zh ? "刷新信号" : "Refresh Signals")}
        </button>
      </div>

      <div className="tabs-bar">
        {tabs.map((item) => (
          <button key={item.id} className={`tab-button ${tab === item.id ? "active" : ""}`} type="button" onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === "signals" ? (
        <div className="pipeline-grid">
          <section className="card-section">
            <h3 className="section-title">{zh ? "Inbox Signals" : "Inbox Signals"}</h3>
            <div className="item-list">
              {signals.map((signal) => (
                <div key={signal.id} className="list-row">
                  <div className="row-primary">
                    <strong>{signal.title}</strong>
                    <span className="row-meta">{signal.sourceTier} · {signal.confidence} · {signal.status}</span>
                  </div>
                  <span className={`badge ${signal.impact === "high" ? "badge-warn" : "badge-info"}`}>{signal.impact}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="card-section">
            <h3 className="section-title">{zh ? "规范化预览" : "Normalize Preview"}</h3>
            <div className="info-block">
              <strong>{zh ? "实践卡片草稿" : "Practice card draft"}</strong>
              <p>{zh ? "类型：Workflow / Skill。场景：本地 agent 配置更新后的 rules、skills、hooks 调整。" : "Type: Workflow / Skill. Scenario: rules, skills, and hooks updates after agent changes."}</p>
            </div>
            <div className="inline-actions">
              <button className="action-button primary" type="button">{zh ? "生成实践预览" : "Generate Preview"}</button>
              <button className="action-button" type="button" onClick={() => onSelectView("apply")}>{zh ? "关联本地资产" : "Link Local Asset"}</button>
            </div>
          </section>
          <section className="card-section full-span">
            <h3 className="section-title">{zh ? "来源开关" : "Source Controls"}</h3>
            <div className="item-list">
              {sources.map((source) => (
                <div key={source.id} className="list-row">
                  <div className="row-primary">
                    <strong>{source.name}</strong>
                    <span className="row-meta">{source.sourceTier} · {source.sourceType}</span>
                  </div>
                  <label className="toggle-label">
                    <input type="checkbox" checked={source.enabled} onChange={(event) => void toggleSignalSource(source.id, event.target.checked).then(loadData)} />
                    <span>{source.enabled ? (zh ? "启用" : "On") : (zh ? "关闭" : "Off")}</span>
                  </label>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "practices" ? (
        <div className="compact-card-grid">
          {practiceCards.map(([title, type, scene, status]) => (
            <article key={title} className="info-block">
              <div className="surface-head"><h3>{title}</h3><span className="badge">{type}</span></div>
              <p>{scene}</p>
              <span className="row-meta">{status}</span>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "assets" ? (
        <section className="card-section">
          <h3 className="section-title">{zh ? "Local Assets" : "Local Assets"}</h3>
          <div className="item-list">
            {assets.map(([name, path, target, mode]) => (
              <div key={name} className="list-row">
                <div className="row-primary">
                  <strong>{name}</strong>
                  <code className="row-path">{path}</code>
                </div>
                <span className="badge">{target} · {mode}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "archived" ? (
        <section className="card-section">
          <h3 className="section-title">{zh ? "已归档实践" : "Archived Practices"}</h3>
          <p className="empty-hint">{zh ? "已归档对象保留来源、决策和审计记录，但不进入当前闭环队列。" : "Archived objects keep sources, decisions, and audit records without entering the active loop."}</p>
        </section>
      ) : null}
    </div>
  );
}
