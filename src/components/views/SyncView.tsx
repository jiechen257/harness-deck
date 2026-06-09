import { CheckCircle2, Search } from "lucide-react";

import type { DeployPlan, Locale, ManifestSummary, ProfileSummary, SyncGovernance, TargetDiscoverySummary } from "../../lib/types";

interface SyncViewProps {
  locale: Locale;
  plan: DeployPlan | null;
  manifest: ManifestSummary | null;
  profile?: ProfileSummary;
  syncGovernance: SyncGovernance | null;
  targetDiscoveries: TargetDiscoverySummary[];
  targetReadAuthorized: boolean;
  onAuthorizeTargetRead: () => Promise<void>;
  onConfirm: () => Promise<void>;
}

export function SyncView({
  locale,
  plan,
  manifest,
  profile,
  syncGovernance,
  targetDiscoveries,
  targetReadAuthorized,
  onAuthorizeTargetRead,
  onConfirm,
}: SyncViewProps) {
  return (
    <div className="sync-layout">
      {manifest ? (
        <div className="manifest-banner">
          <CheckCircle2 size={18} aria-hidden="true" />
          <div>
            <strong>{locale === "zh-CN" ? "dry-run manifest 已写入" : "Dry-run manifest written"}</strong>
            <span>{locale === "zh-CN" ? "未触碰真实配置" : "No real config touched"}</span>
          </div>
          <code>{manifest.id}</code>
        </div>
      ) : null}
      <div className="deploy-plan">
        <div className="section-title">
          <h3>{locale === "zh-CN" ? "部署计划" : "Deploy Plan"}</h3>
          <span className="status-pill">{plan?.dryRun ? (locale === "zh-CN" ? "试运行" : "Dry-run") : (locale === "zh-CN" ? "加载中" : "Loading")}</span>
        </div>
        <p className="muted-line">
          {profile?.name ?? "macOS Dev"} → {plan?.targetKind ?? "Codex"}
        </p>
        <div className="operation-list">
          {plan?.operations.map((operation) => (
            <article key={operation.id}>
              <div>
                <strong>{operation.operationType}</strong>
                <span>{operation.path}</span>
              </div>
              <p>{operation.reason}</p>
              <small>
                {operation.beforeSummary} → {operation.afterSummary}
              </small>
            </article>
          ))}
        </div>
        <button className="primary-action" type="button" onClick={() => void onConfirm()}>
          <CheckCircle2 size={17} aria-hidden="true" />
          <span>{locale === "zh-CN" ? "确认 dry-run" : "Confirm dry-run"}</span>
        </button>
      </div>
      <section className="target-discovery-panel">
        <div className="section-title">
          <h3>{locale === "zh-CN" ? "安全目标集成" : "Safe Target Integration"}</h3>
          <span className="status-pill">{targetReadAuthorized ? (locale === "zh-CN" ? "已授权" : "Authorized") : locale === "zh-CN" ? "本地读取未授权" : "Local read not authorized"}</span>
        </div>
        <p className="muted-line">
          {locale === "zh-CN"
            ? "默认只使用 fixture target；读取 ~/.codex 或 ~/.claude 需要显式授权，并且只返回安全摘要。"
            : "Fixture targets stay default; reading ~/.codex or ~/.claude requires explicit authorization and returns safe summaries only."}
        </p>
        <button className="secondary-action" type="button" onClick={() => void onAuthorizeTargetRead()}>
          <Search size={16} aria-hidden="true" />
          <span>{locale === "zh-CN" ? "授权读取本地 target" : "Authorize local target read"}</span>
        </button>
        {targetDiscoveries.length > 0 ? (
          <div className="target-discovery-list">
            {targetDiscoveries.map((target) => (
              <article key={target.kind}>
                <div>
                  <strong>{target.name}</strong>
                  <span>{target.discovered ? (locale === "zh-CN" ? "已发现" : "discovered") : target.schemaStatus}</span>
                </div>
                <small>{target.candidatePaths.join(" · ")}</small>
                {target.configSummary ? (
                  <div className="config-summary">
                    {target.configSummary.model ? (
                      <small>{locale === "zh-CN" ? "模型" : "Model"}: {target.configSummary.model}</small>
                    ) : null}
                    {target.configSummary.editorMode ? (
                      <small>{locale === "zh-CN" ? "编辑器模式" : "Editor mode"}: {target.configSummary.editorMode}</small>
                    ) : null}
                    {target.configSummary.version ? (
                      <small>{locale === "zh-CN" ? "版本" : "Version"}: {target.configSummary.version}</small>
                    ) : null}
                    <small>
                      {locale === "zh-CN"
                        ? `${target.configSummary.mcpServerCount} MCP · ${target.configSummary.skillCount} 技能 · ${target.configSummary.hookCount} hook · ${target.configSummary.pluginCount} 插件`
                        : `${target.configSummary.mcpServerCount} MCP · ${target.configSummary.skillCount} skills · ${target.configSummary.hookCount} hooks · ${target.configSummary.pluginCount} plugins`}
                    </small>
                    <small>
                      {locale === "zh-CN"
                        ? `${target.configSummary.permissionAllowCount} 允许 · ${target.configSummary.permissionDenyCount} 拒绝 · ${target.configSummary.projectCount} 项目 · ${target.configSummary.startupCount} 启动`
                        : `${target.configSummary.permissionAllowCount} allow · ${target.configSummary.permissionDenyCount} deny · ${target.configSummary.projectCount} projects · ${target.configSummary.startupCount} startups`}
                    </small>
                  </div>
                ) : (
                  <em>{target.rawConfigPreview ?? (locale === "zh-CN" ? "原始配置已隐藏" : "raw config hidden")}</em>
                )}
              </article>
            ))}
          </div>
        ) : null}
      </section>
      {syncGovernance ? (
        <section className="governance-grid" aria-label="Sync governance">
          <article>
            <h3>{locale === "zh-CN" ? "三路对比" : "Three-way Diff"}</h3>
            <div className="governance-list">
              {syncGovernance.threeWayDiff.map((entry) => (
                <div key={entry.path}>
                  <strong>{entry.path}</strong>
                  <span>{entry.baseSummary}</span>
                  <span>{entry.targetSummary}</span>
                  <span>{entry.plannedSummary}</span>
                </div>
              ))}
            </div>
          </article>
          <article>
            <h3>{locale === "zh-CN" ? "冲突队列" : "Conflict Queue"}</h3>
            {syncGovernance.conflicts.length > 0 ? (
              <div className="governance-list">
                {syncGovernance.conflicts.map((conflict) => (
                  <div key={conflict.id}>
                    <strong>{conflict.path}</strong>
                    <span>{conflict.summary}</span>
                    <span>{conflict.resolution}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-line">{locale === "zh-CN" ? "无冲突" : "No conflicts detected"}</p>
            )}
          </article>
          <article>
            <h3>{locale === "zh-CN" ? "漂移检测" : "Drift Detection"}</h3>
            <p>{syncGovernance.drift.summary}</p>
            <small>{syncGovernance.drift.detected ? `${syncGovernance.drift.count} drift signals` : "no drift"}</small>
          </article>
          <article>
            <h3>{locale === "zh-CN" ? "回滚预览" : "Rollback Preview"}</h3>
            <p>{syncGovernance.rollbackPreview.summary}</p>
            <small>
              {locale === "zh-CN" ? "备份" : "backup"} {syncGovernance.rollbackPreview.backupRequired ? (locale === "zh-CN" ? "必需" : "required") : (locale === "zh-CN" ? "可选" : "optional")} · {locale === "zh-CN" ? "清单" : "manifest"}{" "}
              {syncGovernance.rollbackPreview.manifestRequired ? (locale === "zh-CN" ? "必需" : "required") : (locale === "zh-CN" ? "可选" : "optional")}
            </small>
          </article>
        </section>
      ) : null}
    </div>
  );
}
