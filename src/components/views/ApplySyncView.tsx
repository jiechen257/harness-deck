import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, ShieldCheck, Shuffle, Upload } from "lucide-react";

import {
  adoptAsset,
  confirmProjection,
  getActiveRegistry,
  listAdapterCapabilities,
  listAuditEvents,
  listProjectionTargets,
  listProjections,
  previewAssetDiff,
  previewProjection,
  rollbackProjection,
} from "../../lib/api";
import type {
  AdoptResult,
  AdapterCapability,
  AuditEvent,
  DiffPayload,
  Locale,
  Projection,
  ProjectionAction,
  ProjectionExecutionResult,
  ProjectionPlan,
  ProjectionTarget,
  RegistryConnection,
} from "../../lib/types";
import { LoopStepper } from "../shared/LoopStepper";

type SyncMode = "plan" | "conflict" | "rollback" | "audit";

function actionBadge(action: ProjectionAction["action"]) {
  if (action === "conflict") return "badge-warn";
  if (action === "skip") return "";
  return "badge-good";
}

function defaultRegistryDest(targetPath: string) {
  const name = targetPath.split("/").filter(Boolean).at(-1) ?? "adopted-asset";
  return `system-skills/${name}`;
}

function defaultBackupPath() {
  return "~/Library/Application Support/Hone/backups";
}

export function ApplySyncView({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<SyncMode>("plan");
  const [registry, setRegistry] = useState<RegistryConnection | null>(null);
  const [targets, setTargets] = useState<ProjectionTarget[]>([]);
  const [targetKind, setTargetKind] = useState("codex");
  const [targetPath, setTargetPath] = useState("~/.codex/skills");
  const [plan, setPlan] = useState<ProjectionPlan | null>(null);
  const [projections, setProjections] = useState<Projection[]>([]);
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [execution, setExecution] = useState<ProjectionExecutionResult | null>(null);
  const [adoptResult, setAdoptResult] = useState<AdoptResult | null>(null);
  const [diffPayload, setDiffPayload] = useState<DiffPayload | null>(null);
  const [capabilities, setCapabilities] = useState<AdapterCapability[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [adopting, setAdopting] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [adoptTargetPath, setAdoptTargetPath] = useState("");
  const [registryDest, setRegistryDest] = useState("system-skills/adopted-skill");
  const [assetType, setAssetType] = useState("skill");
  const [backupPath, setBackupPath] = useState(defaultBackupPath());
  const zh = locale === "zh-CN";

  const registryPath = registry?.path ?? "~/HoneRegistry";

  const loadPlan = useCallback(async (nextRegistryPath = registryPath, nextTargetPath = targetPath, nextTargetKind = targetKind) => {
    setLoadingPlan(true);
    setError(null);
    try {
      const [nextPlan, nextProjections, nextAudits] = await Promise.all([
        previewProjection(nextRegistryPath, nextTargetPath, nextTargetKind),
        listProjections(nextTargetKind),
        listAuditEvents(8),
      ]);
      setPlan(nextPlan);
      setProjections(nextProjections);
      setAudits(nextAudits);
      const firstConflict = nextPlan.actions.find((action) => action.action === "conflict");
      if (firstConflict && !adoptTargetPath) {
        setAdoptTargetPath(firstConflict.targetPath);
        setRegistryDest(defaultRegistryDest(firstConflict.targetPath));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoadingPlan(false);
    }
  }, [adoptTargetPath, registryPath, targetKind, targetPath]);

  useEffect(() => {
    let alive = true;
    void Promise.all([getActiveRegistry(), listProjectionTargets(), listAdapterCapabilities()])
      .then(([nextRegistry, nextTargets, nextCapabilities]) => {
        if (!alive) return;
        setRegistry(nextRegistry);
        setTargets(nextTargets);
        setCapabilities(nextCapabilities);
        const preferred = nextTargets.find((target) => target.targetKind === "codex") ?? nextTargets[0];
        if (preferred) {
          setTargetKind(preferred.targetKind);
          setTargetPath(preferred.targetPath);
          void loadPlan(nextRegistry?.path ?? "~/HoneRegistry", preferred.targetPath, preferred.targetKind);
        }
      })
      .catch((loadError: unknown) => {
        if (!alive) return;
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      });
    return () => { alive = false; };
  }, []);

  const actionable = useMemo(() => (plan?.actions ?? []).filter((action) => action.action === "create" || action.action === "update"), [plan]);
  const conflicts = useMemo(() => (plan?.actions ?? []).filter((action) => action.action === "conflict"), [plan]);
  const activeProjections = projections.filter((projection) => projection.status === "active");

  const handleTargetChange = (nextKind: string) => {
    const nextTarget = targets.find((target) => target.targetKind === nextKind);
    const nextPath = nextTarget?.targetPath ?? targetPath;
    setTargetKind(nextKind);
    setTargetPath(nextPath);
    setExecution(null);
    setAdoptResult(null);
    void loadPlan(registryPath, nextPath, nextKind);
  };

  const handleTargetPathChange = (nextPath: string) => {
    setTargetPath(nextPath);
    setExecution(null);
  };

  const handlePreview = () => {
    void loadPlan(registryPath, targetPath, targetKind);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);
    setExecution(null);
    try {
      const result = await confirmProjection(registryPath, targetPath, targetKind);
      setExecution(result);
      await loadPlan(registryPath, targetPath, targetKind);
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : String(confirmError));
    } finally {
      setConfirming(false);
    }
  };

  const handleUseConflict = (action: ProjectionAction) => {
    setMode("conflict");
    setAdoptTargetPath(action.targetPath);
    setRegistryDest(defaultRegistryDest(action.targetPath));
  };

  const handlePreviewDiff = async (action: ProjectionAction) => {
    setError(null);
    try {
      setDiffPayload(await previewAssetDiff(registryPath, action.registryPath, action.targetPath));
    } catch (diffError) {
      setError(diffError instanceof Error ? diffError.message : String(diffError));
    }
  };

  const handleAdopt = async () => {
    setAdopting(true);
    setError(null);
    setAdoptResult(null);
    try {
      const result = await adoptAsset(adoptTargetPath, registryPath, registryDest, assetType, backupPath, targetKind);
      setAdoptResult(result);
      await loadPlan(registryPath, targetPath, targetKind);
    } catch (adoptError) {
      setError(adoptError instanceof Error ? adoptError.message : String(adoptError));
    } finally {
      setAdopting(false);
    }
  };

  const handleRollback = async (projectionId: string) => {
    setRollingBack(projectionId);
    setError(null);
    try {
      await rollbackProjection(projectionId);
      await loadPlan(registryPath, targetPath, targetKind);
    } catch (rollbackError) {
      setError(rollbackError instanceof Error ? rollbackError.message : String(rollbackError));
    } finally {
      setRollingBack(null);
    }
  };

  const tabs: { id: SyncMode; label: string }[] = [
    { id: "plan", label: zh ? "计划" : "Plan" },
    { id: "conflict", label: zh ? "冲突与采纳" : "Conflicts & Adopt" },
    { id: "rollback", label: zh ? "回滚" : "Rollback" },
    { id: "audit", label: zh ? "审计" : "Audit" },
  ];

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2 className="view-title">{zh ? "应用与同步" : "Apply & Sync"}</h2>
          <p className="view-subtitle">{zh ? "默认软链接，复制只作为兼容兜底。所有写入都需要确认。" : "Symlink by default, copy only as compatibility fallback. Every write requires confirmation."}</p>
        </div>
        <button className="action-button" type="button" onClick={handlePreview} disabled={loadingPlan}>
          <Shuffle size={14} aria-hidden="true" />
          {loadingPlan ? (zh ? "生成中..." : "Planning...") : (zh ? "重新生成计划" : "Refresh Plan")}
        </button>
      </div>

      {error ? (
        <div className="info-block warning-block">
          <strong>{zh ? "操作失败" : "Action failed"}</strong>
          <p>{error}</p>
        </div>
      ) : null}

      <section className="projection-card" aria-labelledby="projection-title">
        <div className="projection-title-block">
          <h3 id="projection-title">{zh ? "注册表投射" : "Registry Projection"}</h3>
          <p>{zh ? "选择目标后先生成计划，再确认 create / update。conflict 默认跳过。" : "Select a target, generate a plan, then confirm create/update. Conflicts are skipped by default."}</p>
          <LoopStepper activeStep="projection" locale={locale} />
        </div>
        <div className="projection-node source-node">
          <span className="badge badge-good">{zh ? "事实源" : "Source of truth"}</span>
          <h3>{registryPath}</h3>
          <p>{zh ? "system-skills、rules、hooks、MCP 片段由 registry 管理。" : "System skills, rules, hooks, and MCP fragments are registry-managed."}</p>
        </div>
        <div className="projection-line projection-controls">
          <label className="field-stack">
            <span>{zh ? "目标" : "Target"}</span>
            <select value={targetKind} onChange={(event) => handleTargetChange(event.target.value)}>
              {targets.map((target) => (
                <option key={target.targetKind} value={target.targetKind}>{target.label}</option>
              ))}
            </select>
          </label>
          <label className="field-stack">
            <span>{zh ? "目标路径" : "Target path"}</span>
            <input value={targetPath} onChange={(event) => handleTargetPathChange(event.target.value)} onBlur={handlePreview} />
          </label>
          <div className="projection-summary">
            <span className="badge badge-good">{zh ? "新建" : "Create"} {plan?.creates ?? 0}</span>
            <span className="badge badge-info">{zh ? "更新" : "Update"} {plan?.updates ?? 0}</span>
            <span className="badge">{zh ? "跳过" : "Skip"} {plan?.skips ?? 0}</span>
            <span className="badge badge-warn">{zh ? "冲突" : "Conflict"} {plan?.conflicts ?? 0}</span>
          </div>
        </div>
        <div className="projection-node target-node">
          <span className="badge badge-warn">{zh ? "目标目录" : "Target directory"}</span>
          <h3>{targetPath}</h3>
          <p>{zh ? "确认只会处理 create / update；普通文件或目录冲突保持不动。" : "Confirm only applies create/update; regular file or directory conflicts remain untouched."}</p>
        </div>
      </section>

      <section className="card-section">
        <h3 className="section-title">{zh ? "Adapter Status" : "Adapter Status"}</h3>
        <div className="item-list">
          {capabilities.map((capability) => (
            <div key={capability.targetKind} className="list-row">
              <div className="row-primary">
                <strong>{capability.label}</strong>
                <span className="row-meta">
                  detect {String(capability.detect)} · read {String(capability.readConfig)} · preview {String(capability.previewProjection)} · write {String(capability.writeProjection)} · rollback {String(capability.rollback)}
                </span>
                <span className="row-meta">{capability.note}</span>
              </div>
              <span className={`badge ${capability.supported ? "badge-good" : "badge-warn"}`}>{capability.supported ? (zh ? "MVP 支持" : "MVP supported") : (zh ? "未配置" : "Unsupported")}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="tabs-bar">
        {tabs.map((item) => <button key={item.id} className={`tab-button ${mode === item.id ? "active" : ""}`} type="button" onClick={() => setMode(item.id)}>{item.label}</button>)}
      </div>

      <section className="card-section">
        <div className="surface-head">
          <h3 className="section-title">{tabs.find((item) => item.id === mode)?.label}</h3>
          {mode === "plan" ? (
            <button className="action-button primary" type="button" onClick={handleConfirm} disabled={confirming || actionable.length === 0}>
              <Upload size={14} aria-hidden="true" />
              {confirming ? (zh ? "投射中..." : "Projecting...") : (zh ? `确认投射 ${actionable.length} 项` : `Confirm ${actionable.length} actions`)}
            </button>
          ) : null}
        </div>

        {mode === "plan" ? (
          <>
            <div className="item-list">
              {(plan?.actions ?? []).map((action) => (
                <div key={`${action.assetId}-${action.targetPath}`} className="list-row">
                  <div className="row-primary">
                    <strong>{action.assetName}</strong>
                    <code className="row-path">{action.registryPath} {"->"} {action.targetPath}</code>
                    {action.conflictReason ? <span className="row-meta">{action.conflictReason}</span> : null}
                  </div>
                  <div className="inline-actions">
                    <button className="action-button" type="button" onClick={() => handlePreviewDiff(action)}>
                      {zh ? "查看差异" : "View Diff"}
                    </button>
                    {action.action === "conflict" ? (
                      <button className="action-button" type="button" onClick={() => handleUseConflict(action)}>
                        {zh ? "采纳..." : "Adopt..."}
                      </button>
                    ) : null}
                    <span className={`badge ${actionBadge(action.action)}`}>{action.mode} · {action.action}</span>
                  </div>
                </div>
              ))}
              {(plan?.actions ?? []).length === 0 ? <p className="empty-hint">{zh ? "没有可投射资产。先在实践库创建 Local Asset。" : "No projectable assets. Create a Local Asset from the Practice Library first."}</p> : null}
            </div>
            {execution ? (
              <div className="info-block">
                <strong>{zh ? "投射完成" : "Projection complete"}</strong>
                <p>{zh ? `已执行 ${execution.executedProjectionIds.length} 项，跳过 ${execution.skipped} 项，冲突 ${execution.conflicts} 项。` : `${execution.executedProjectionIds.length} executed, ${execution.skipped} skipped, ${execution.conflicts} conflicts.`}</p>
              </div>
            ) : null}
            {diffPayload ? (
              <div className="info-block">
                <div className="surface-head"><h3>{zh ? "只读 Diff" : "Read-only Diff"}</h3><span className="badge">{diffPayload.sourceExists ? "source" : "missing source"} / {diffPayload.targetExists ? "target" : "missing target"}</span></div>
                <code className="row-path">{diffPayload.sourcePath} {"->"} {diffPayload.targetPath}</code>
                {diffPayload.readError ? <p className="empty-hint">{diffPayload.readError}</p> : null}
                <pre className="diff-viewer">{diffPayload.diffHunks.join("\n")}</pre>
              </div>
            ) : null}
          </>
        ) : null}

        {mode === "conflict" ? (
          <div className="pipeline-grid">
            <section className="info-block">
              <h3>{zh ? "冲突项" : "Conflicts"}</h3>
              <div className="item-list">
                {conflicts.map((action) => (
                  <div key={action.targetPath} className="list-row">
                    <div className="row-primary">
                      <strong>{action.targetPath}</strong>
                      <span className="row-meta">{action.conflictReason ?? (zh ? "目标已存在，默认跳过。" : "Target exists and is skipped by default.")}</span>
                    </div>
                    <div className="inline-actions">
                      <button className="action-button" type="button" onClick={() => setMode("plan")}>{zh ? "跳过" : "Skip"}</button>
                      <button className="action-button" type="button" onClick={() => handleUseConflict(action)}>{zh ? "采纳..." : "Adopt..."}</button>
                      <span className="badge badge-warn">{zh ? "可采纳" : "Adoptable"}</span>
                    </div>
                  </div>
                ))}
                {conflicts.length === 0 ? <p className="empty-hint">{zh ? "当前计划没有冲突。" : "No conflicts in the current plan."}</p> : null}
              </div>
            </section>
            <section className="info-block">
              <h3>{zh ? "采纳确认" : "Adopt Confirmation"}</h3>
              <label className="field-stack"><span>{zh ? "目标路径" : "Target path"}</span><input value={adoptTargetPath} onChange={(event) => setAdoptTargetPath(event.target.value)} /></label>
              <label className="field-stack"><span>{zh ? "Registry destination" : "Registry destination"}</span><input value={registryDest} onChange={(event) => setRegistryDest(event.target.value)} /></label>
              <label className="field-stack"><span>{zh ? "Backup path" : "Backup path"}</span><input value={backupPath} onChange={(event) => setBackupPath(event.target.value)} /></label>
              <label className="field-stack">
                <span>{zh ? "Asset type" : "Asset type"}</span>
                <select value={assetType} onChange={(event) => setAssetType(event.target.value)}>
                  <option value="skill">skill</option>
                  <option value="rule">rule</option>
                  <option value="hook">hook</option>
                  <option value="mcp_config">mcp_config</option>
                  <option value="agent_profile_fragment">agent_profile_fragment</option>
                </select>
              </label>
              <p className="empty-hint">{zh ? "确认后会复制到 registry、备份原 target、再把 target 替换为 symlink。" : "Confirm copies into registry, backs up the original target, then replaces target with a symlink."}</p>
              <button className="action-button primary" type="button" disabled={!adoptTargetPath || !registryDest || adopting} onClick={handleAdopt}>
                <ShieldCheck size={14} aria-hidden="true" />
                {adopting ? (zh ? "采纳中..." : "Adopting...") : (zh ? "确认采纳" : "Confirm Adopt")}
              </button>
              {adoptResult ? (
                <p className="empty-hint">{zh ? `已采纳到 ${adoptResult.registryPath}，备份 ${adoptResult.backupPath}` : `Adopted to ${adoptResult.registryPath}, backup ${adoptResult.backupPath}`}</p>
              ) : null}
            </section>
          </div>
        ) : null}

        {mode === "rollback" ? (
          <div className="item-list">
            {activeProjections.map((projection) => (
              <div key={projection.id} className="list-row">
                <div className="row-primary">
                  <strong>{projection.targetPath}</strong>
                  <span className="row-meta">{projection.targetKind} · {projection.mode} · {projection.status}</span>
                </div>
                <button className="action-button" type="button" disabled={rollingBack === projection.id} onClick={() => handleRollback(projection.id)}>
                  <RotateCcw size={14} aria-hidden="true" />
                  {rollingBack === projection.id ? (zh ? "回滚中..." : "Rolling back...") : (zh ? "回滚链接" : "Rollback Link")}
                </button>
              </div>
            ))}
            {activeProjections.length === 0 ? <p className="empty-hint">{zh ? "当前目标没有 active projection。" : "No active projections for this target."}</p> : null}
            <p className="empty-hint">{zh ? "回滚只删除 target symlink，不删除 registry 源文件；非 symlink target 会被拒绝。" : "Rollback removes only the target symlink and keeps registry source files; non-symlink targets are refused."}</p>
          </div>
        ) : null}

        {mode === "audit" ? (
          <div className="item-list">
            {audits.map((audit) => (
              <div key={audit.id} className="list-row">
                <div className="row-primary">
                  <strong>{audit.eventType}</strong>
                  <span className="row-meta">{audit.detail ?? audit.entityId ?? ""}</span>
                </div>
                <span className={`badge ${audit.outcome === "success" ? "badge-good" : "badge-warn"}`}>{audit.outcome}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
