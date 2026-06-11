import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Link2, RefreshCw, Wand2 } from "lucide-react";

import type { ViewId } from "../../constants/types";
import {
  createLocalAssetFromPractice,
  createPracticeFromSignal,
  listLocalAssets,
  listPractices,
  listSignalSources,
  listSignals,
  normalizeSignal,
  refreshSignals,
  toggleSignalSource,
} from "../../lib/api";
import type { Locale, LocalAsset, NormalizeResult, PracticeCard, PracticeDraft, SignalCard, SourceConfig } from "../../lib/types";
import { LoopStepper } from "../shared/LoopStepper";

interface PracticeLibraryViewProps {
  locale: Locale;
  onSelectView: (view: ViewId) => void;
}

type LibraryTab = "signals" | "practices" | "assets" | "archived";

function statusLabel(status: string, zh: boolean) {
  const labels: Record<string, { zh: string; en: string }> = {
    inbox: { zh: "待整理", en: "Inbox" },
    processing: { zh: "处理中", en: "Processing" },
    normalized: { zh: "已规范化", en: "Normalized" },
    draft: { zh: "草稿", en: "Draft" },
    adoptable: { zh: "可采纳", en: "Adoptable" },
    applied: { zh: "已应用", en: "Applied" },
    ready: { zh: "就绪", en: "Ready" },
    archived: { zh: "已归档", en: "Archived" },
  };
  return zh ? (labels[status]?.zh ?? status) : (labels[status]?.en ?? status);
}

function tierLabel(tier: string, zh: boolean) {
  if (tier === "official") return zh ? "Official 官方" : "Official";
  if (tier === "maintainer") return zh ? "Maintainer/Repository" : "Maintainer/Repository";
  return zh ? "Community 社区" : "Community";
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [value];
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "practice-asset";
}

function deriveAssetType(practice: PracticeCard) {
  const value = `${practice.practiceType} ${practice.title}`.toLowerCase();
  if (value.includes("mcp")) return "mcp_config";
  if (value.includes("hook")) return "hook";
  if (value.includes("rule")) return "rule";
  if (value.includes("profile")) return "agent_profile_fragment";
  return "skill";
}

function deriveRegistryPath(practice: PracticeCard, assetType: string) {
  const slug = slugify(practice.title);
  if (assetType === "mcp_config") return `mcp/${slug}.toml`;
  if (assetType === "hook") return `hooks/${slug}.sh`;
  if (assetType === "rule") return `rules/${slug}.md`;
  if (assetType === "agent_profile_fragment") return `profiles/${slug}.md`;
  return `system-skills/${slug}`;
}

export function PracticeLibraryView({ locale, onSelectView }: PracticeLibraryViewProps) {
  const [tab, setTab] = useState<LibraryTab>("signals");
  const [sources, setSources] = useState<SourceConfig[]>([]);
  const [signals, setSignals] = useState<SignalCard[]>([]);
  const [practices, setPractices] = useState<PracticeCard[]>([]);
  const [assets, setAssets] = useState<LocalAsset[]>([]);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [preview, setPreview] = useState<NormalizeResult | null>(null);
  const [draft, setDraft] = useState<PracticeDraft | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [assetBusyId, setAssetBusyId] = useState<string | null>(null);
  const zh = locale === "zh-CN";

  const loadData = useCallback(async () => {
    const [nextSources, nextSignals, nextPractices, nextAssets] = await Promise.all([
      listSignalSources(),
      listSignals(),
      listPractices(),
      listLocalAssets(),
    ]);
    setSources(nextSources);
    setSignals(nextSignals);
    setPractices(nextPractices);
    setAssets(nextAssets);
    setSelectedSignalId((current) => {
      if (current && nextSignals.some((signal) => signal.id === current)) return current;
      return nextSignals[0]?.id ?? null;
    });
    setSelectedPracticeId((current) => {
      if (current && nextPractices.some((practice) => practice.id === current)) return current;
      return nextPractices[0]?.id ?? null;
    });
    setSelectedAssetId((current) => {
      if (current && nextAssets.some((asset) => asset.id === current)) return current;
      return nextAssets[0]?.id ?? null;
    });
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleRefresh = async (sourceId?: string) => {
    setRefreshing(true);
    setActionError(null);
    try {
      await refreshSignals(sourceId);
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  };

  const selectedSignal = signals.find((signal) => signal.id === selectedSignalId) ?? null;
  const selectedPractice = practices.find((practice) => practice.id === selectedPracticeId) ?? null;
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const assetsByPractice = new Map(assets.map((asset) => [asset.practiceId, asset]));
  const archivedSignals = signals.filter((signal) => signal.status === "archived");
  const archivedPractices = practices.filter((practice) => practice.status === "archived");
  const archivedAssets = assets.filter((asset) => asset.status === "archived");

  const handleGeneratePreview = async () => {
    if (!selectedSignal) return;
    setGenerating(true);
    setPreview(null);
    setDraft(null);
    setActionError(null);
    try {
      const result = await normalizeSignal(selectedSignal.id, "Codex");
      setPreview(result);
      if (result.success && result.draft) {
        setDraft(result.draft);
      } else {
        setActionError(result.errorMessage ?? (zh ? "规范化失败，请检查 system skill 配置。" : "Normalization failed. Check system skill configuration."));
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedSignal || !draft) return;
    setSavingDraft(true);
    setActionError(null);
    try {
      await createPracticeFromSignal(selectedSignal.id, draft);
      setPreview(null);
      setDraft(null);
      await loadData();
      setTab("practices");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setSavingDraft(false);
    }
  };

  const handleCreateAsset = async (practice: PracticeCard) => {
    const assetType = deriveAssetType(practice);
    setAssetBusyId(practice.id);
    setActionError(null);
    try {
      await createLocalAssetFromPractice(practice.id, assetType, deriveRegistryPath(practice, assetType), assetType === "skill");
      await loadData();
      setTab("assets");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setAssetBusyId(null);
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
      {actionError ? (
        <div className="info-block warning-block">
          <strong>{zh ? "操作未完成" : "Action did not complete"}</strong>
          <p>{actionError}</p>
          <button className="action-button" type="button" onClick={() => onSelectView("settings")}>
            {zh ? "检查授权与 system skill" : "Check authorization and system skill"}
          </button>
        </div>
      ) : null}

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
            {signals.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📡</span>
                <strong>{zh ? "暂无新信号" : "No new signals"}</strong>
                <p className="empty-hint">{zh ? "点击「刷新信号」从已启用的信息源拉取最新动态。" : "Click \"Refresh Signals\" to fetch latest updates from enabled sources."}</p>
              </div>
            ) : (
              <div className="item-list">
                {signals.map((signal) => (
                  <button
                    key={signal.id}
                    className={`list-row row-button ${selectedSignalId === signal.id ? "active" : ""}`}
                    type="button"
                    onClick={() => {
                      setSelectedSignalId(signal.id);
                      setPreview(null);
                      setDraft(null);
                      setActionError(null);
                    }}
                  >
                    <div className="row-primary">
                      <strong>{signal.title}</strong>
                      <span className="row-meta">{tierLabel(signal.sourceTier, zh)} · {signal.confidence} · {statusLabel(signal.status, zh)}</span>
                    </div>
                    <span className={`badge ${signal.impact === "high" ? "badge-warn" : "badge-info"}`}>{signal.impact}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
          <section className="card-section">
            <h3 className="section-title">{zh ? "规范化预览" : "Normalize Preview"}</h3>
            {selectedSignal ? (
              <div className="info-block">
                <LoopStepper activeStep="signal" locale={locale} />
                <strong>{selectedSignal.title}</strong>
                <p>{selectedSignal.excerpt ?? (zh ? "该信号没有摘要。" : "This signal has no excerpt.")}</p>
                <span className="row-meta">
                  {tierLabel(selectedSignal.sourceTier, zh)} · {selectedSignal.signalType} · {selectedSignal.confidence}
                  {selectedSignal.publishedAt ? ` · published ${new Date(selectedSignal.publishedAt).toLocaleDateString(zh ? "zh-CN" : "en-US")}` : ""}
                  {" · "}{zh ? "抓取" : "fetched"} {new Date(selectedSignal.fetchedAt).toLocaleDateString(zh ? "zh-CN" : "en-US")}
                </span>
              </div>
            ) : (
              <p className="empty-hint">{zh ? "选择一个信号后生成实践卡片草稿。" : "Select a signal to generate a practice card draft."}</p>
            )}
            {draft ? (
              <div className="info-block">
                <LoopStepper activeStep="practice" locale={locale} />
                <div className="surface-head"><h3>{draft.title}</h3><span className="badge">{draft.practiceType}</span></div>
                <p>{draft.summary}</p>
                <span className="row-meta">{zh ? `场景 ${draft.scenarios.length} 个 · 建议资产 ${draft.suggestedAssetTypes.join(", ")}` : `${draft.scenarios.length} scenarios · Suggested assets ${draft.suggestedAssetTypes.join(", ")}`}</span>
              </div>
            ) : null}
            {preview && !preview.success ? (
              <p className="empty-hint">{preview.errorMessage ?? preview.errorCode}</p>
            ) : null}
            <div className="inline-actions">
              <button className="action-button primary" type="button" disabled={!selectedSignal || generating} onClick={handleGeneratePreview}>
                <Wand2 size={14} aria-hidden="true" />
                {generating ? (zh ? "生成中..." : "Generating...") : (zh ? "生成实践预览" : "Generate Preview")}
              </button>
              <button className="action-button" type="button" disabled={!draft || savingDraft} onClick={handleSaveDraft}>
                <CheckCircle2 size={14} aria-hidden="true" />
                {savingDraft ? (zh ? "保存中..." : "Saving...") : (zh ? "保存为实践" : "Save Practice")}
              </button>
            </div>
          </section>
          <section className="card-section full-span">
            <h3 className="section-title">{zh ? "来源开关" : "Source Controls"}</h3>
            <div className="item-list">
              {sources.map((source) => (
                <div key={source.id} className="list-row">
                  <div className="row-primary">
                    <strong>{source.name}</strong>
                    <span className="row-meta">{tierLabel(source.sourceTier, zh)} · {source.sourceType} · {zh ? "更新" : "updated"} {new Date(source.updatedAt).toLocaleDateString(zh ? "zh-CN" : "en-US")}</span>
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
          {practices.length === 0 ? (
            <section className="card-section">
              <p className="empty-hint">{zh ? "还没有实践卡片。先从信号生成预览并保存。" : "No practice cards yet. Generate and save a preview from Signals first."}</p>
            </section>
          ) : practices.map((practice) => {
            const linkedAsset = assetsByPractice.get(practice.id);
            const scenarios = parseList(practice.scenarios);
            return (
            <article key={practice.id} className="info-block">
              <div className="surface-head"><h3>{practice.title}</h3><span className="badge">{practice.practiceType}</span></div>
              <p>{practice.summary ?? (zh ? "无摘要" : "No summary")}</p>
              <span className="row-meta">{statusLabel(practice.status, zh)}{scenarios.length > 0 ? ` · ${zh ? "场景" : "Scenarios"} ${scenarios.length}` : ""}</span>
              <div className="inline-actions">
                <button className="action-button" type="button" onClick={() => setSelectedPracticeId(practice.id)}>
                  {zh ? "查看详情" : "Details"}
                </button>
                {linkedAsset ? (
                  <span className="badge badge-good">{zh ? "已关联资产" : "Asset linked"}</span>
                ) : (
                  <button className="action-button" type="button" disabled={assetBusyId === practice.id} onClick={() => handleCreateAsset(practice)}>
                    <Link2 size={14} aria-hidden="true" />
                    {assetBusyId === practice.id ? (zh ? "创建中..." : "Creating...") : (zh ? "创建本地资产" : "Create Local Asset")}
                  </button>
                )}
              </div>
            </article>
          );})}
          {selectedPractice ? (
            <section className="info-block full-span">
              <LoopStepper activeStep={assetsByPractice.get(selectedPractice.id) ? "asset" : "practice"} locale={locale} />
              <div className="surface-head"><h3>{selectedPractice.title}</h3><span className="badge">{statusLabel(selectedPractice.status, zh)}</span></div>
              <p>{selectedPractice.summary ?? (zh ? "没有摘要。" : "No summary.")}</p>
              <span className="row-meta">{zh ? "关联资产" : "Linked asset"}: {assetsByPractice.get(selectedPractice.id)?.registryPath ?? (zh ? "未创建" : "Not created")}</span>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "assets" ? (
        <section className="card-section">
          <h3 className="section-title">{zh ? "Local Assets" : "Local Assets"}</h3>
          {assets.length === 0 ? (
            <p className="empty-hint">{zh ? "还没有本地资产。从实践卡片创建资产后会显示在这里。" : "No local assets yet. Create one from a practice card."}</p>
          ) : (
            <div className="item-list">
              {assets.map((asset) => (
              <div key={asset.id} className="list-row">
                <div className="row-primary">
                  <strong>{asset.assetType}</strong>
                  <code className="row-path">{asset.registryPath}</code>
                </div>
                <div className="inline-actions">
                  <button className="action-button" type="button" onClick={() => setSelectedAssetId(asset.id)}>{zh ? "查看详情" : "Details"}</button>
                  <span className={`badge ${asset.status === "ready" ? "badge-good" : ""}`}>{statusLabel(asset.status, zh)} · {asset.isSystem ? "system" : "user"}</span>
                </div>
              </div>
              ))}
            </div>
          )}
          {selectedAsset ? (
            <div className="info-block">
              <LoopStepper activeStep="asset" locale={locale} />
              <div className="surface-head"><h3>{selectedAsset.registryPath}</h3><span className="badge">{selectedAsset.assetType}</span></div>
              <p className="empty-hint">{zh ? "下一步：到应用与同步生成投射计划。" : "Next: generate a projection plan in Apply & Sync."}</p>
              <button className="action-button" type="button" onClick={() => onSelectView("apply")}>{zh ? "打开应用与同步" : "Open Apply & Sync"}</button>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "archived" ? (
        <section className="card-section">
          <h3 className="section-title">{zh ? "已归档实践" : "Archived Practices"}</h3>
          {archivedSignals.length + archivedPractices.length + archivedAssets.length === 0 ? (
            <p className="empty-hint">{zh ? "已归档对象保留来源、决策和审计记录，但不进入当前闭环队列。" : "Archived objects keep sources, decisions, and audit records without entering the active loop."}</p>
          ) : (
            <div className="item-list">
              {[...archivedSignals.map((item) => ({ id: item.id, title: item.title, type: zh ? "信号" : "Signal" })),
                ...archivedPractices.map((item) => ({ id: item.id, title: item.title, type: zh ? "实践" : "Practice" })),
                ...archivedAssets.map((item) => ({ id: item.id, title: item.registryPath, type: zh ? "资产" : "Asset" }))].map((item) => (
                <div key={item.id} className="list-row">
                  <div className="row-primary"><strong>{item.title}</strong><span className="row-meta">{item.type}</span></div>
                  <span className="badge">{zh ? "已归档" : "Archived"}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
