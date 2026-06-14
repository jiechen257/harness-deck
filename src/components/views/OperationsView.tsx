import { useCallback, useEffect, useState } from "react";

import { confirmOpsScript, listAuditEvents, listOpsScripts, previewOpsScript } from "../../lib/api";
import type { AuditEvent, Locale, OpsScript, OpsScriptExecutionResult, OpsScriptPreview } from "../../lib/types";

function statusTone(status: string) {
  if (status === "running") return "badge-good";
  if (status === "disabled") return "badge-warn";
  return "badge-info";
}

function statusLabel(status: string, zh: boolean) {
  const labels: Record<string, { zh: string; en: string }> = {
    registered: { zh: "已登记", en: "registered" },
    running: { zh: "运行中", en: "running" },
    idle: { zh: "空闲", en: "idle" },
    disabled: { zh: "已禁用", en: "disabled" },
  };
  const label = labels[status] ?? { zh: status, en: status };
  return zh ? label.zh : label.en;
}

function riskLabel(riskLevel: string, zh: boolean) {
  return `${zh ? "风险" : "Risk"}: ${riskLevel}`;
}

export function OperationsView({ locale }: { locale: Locale }) {
  const zh = locale === "zh-CN";
  const [scripts, setScripts] = useState<OpsScript[]>([]);
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [preview, setPreview] = useState<OpsScriptPreview | null>(null);
  const [result, setResult] = useState<OpsScriptExecutionResult | null>(null);
  const [busyScriptId, setBusyScriptId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [nextScripts, nextAudits] = await Promise.all([
      listOpsScripts(),
      listAuditEvents(8),
    ]);
    setScripts(nextScripts);
    setAudits(nextAudits);
  }, []);

  useEffect(() => {
    void loadData().catch((error: unknown) => {
      setActionError(error instanceof Error ? error.message : String(error));
    });
  }, [loadData]);

  const handlePreview = async (script: OpsScript) => {
    setBusyScriptId(script.id);
    setActionError(null);
    setResult(null);
    try {
      setPreview(await previewOpsScript(script.id));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyScriptId(null);
    }
  };

  const handleConfirm = async (script: OpsScript) => {
    setBusyScriptId(script.id);
    setActionError(null);
    try {
      const nextResult = await confirmOpsScript(script.id);
      setResult(nextResult);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setActionError(message.includes("script_execution")
        ? (zh ? "需要先在设置中授予脚本执行权限。当前只会确认并写审计，不直接执行 shell。" : "Grant script execution in Settings first. The current flow only confirms and audits; it does not execute shell.")
        : message);
    } finally {
      setBusyScriptId(null);
    }
  };

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <span className="view-kicker">OPERATIONS</span>
          <h1 className="view-title">{zh ? "本机脚本默认只读展示，运行必须先预览再确认。" : "Local scripts are read-only by default; every run starts with preview and confirmation."}</h1>
          <p className="view-subtitle">{zh ? "集中管理 Codex proxy、Sleep guard 和 Wake display；高风险操作会先展示计划、检查授权并写入审计。" : "Manage Codex proxy, Sleep guard, and Wake display; risky actions preview the plan, check authorization, and write audit."}</p>
        </div>
        <span className="badge badge-good">{zh ? "默认只读" : "Read-only by default"}</span>
      </div>

      {actionError ? (
        <div className="info-block warning-block">
          <strong>{zh ? "操作未完成" : "Action did not complete"}</strong>
          <p>{actionError}</p>
        </div>
      ) : null}

      <div className="compact-card-grid">
        {scripts.map((script) => (
          <article key={script.id} className="info-block">
            <div className="surface-head"><h3>{script.name}</h3><span className={`badge ${statusTone(script.status)}`}>{statusLabel(script.status, zh)}</span></div>
            <code className="row-path">{script.path}</code>
            <p>{script.description ?? (zh ? "没有脚本说明。" : "No script description.")}</p>
            <span className={`badge ${script.riskLevel === "high" ? "badge-warn" : "badge-info"}`}>{riskLabel(script.riskLevel, zh)}</span>
            {preview?.scriptId === script.id ? (
              <div className="ops-preview-block">
                <div className="surface-head">
                  <strong>{zh ? "预览计划" : "Preview plan"}</strong>
                  <span className="badge">{preview.willExecute ? (zh ? "将执行" : "will execute") : (zh ? "安全确认" : "safe confirm")}</span>
                </div>
                <div className="item-list">
                  {preview.steps.map((step) => (
                    <div key={step} className="list-row">
                      <div className="row-primary">
                        <strong>{step}</strong>
                        <span className="row-meta">{zh ? "确认前检查" : "Pre-confirm check"}</span>
                      </div>
                      <span className="badge">{preview.requiresAuthorization}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {result?.scriptId === script.id ? (
              <p className="empty-hint">{zh ? "已确认并写入审计；当前安全 MVP 不直接执行 shell。" : result.message}</p>
            ) : null}
            <div className="inline-actions">
              <button className="action-button" type="button" disabled={busyScriptId === script.id} onClick={() => handlePreview(script)}>{zh ? "预览计划" : "Preview Plan"}</button>
              <button className="action-button primary" type="button" disabled={preview?.scriptId !== script.id || busyScriptId === script.id} onClick={() => handleConfirm(script)}>{zh ? "确认并审计" : "Confirm & Audit"}</button>
            </div>
          </article>
        ))}
      </div>

      <section className="card-section">
        <h3 className="section-title">{zh ? "运行审计" : "Run Audit"}</h3>
        <div className="item-list">
          {audits.filter((audit) => audit.eventType.startsWith("ops_") || audit.eventType.includes("script")).map((audit) => (
            <div className="list-row" key={audit.id}>
              <div className="row-primary">
                <strong>{audit.eventType}</strong>
                <span className="row-meta">{audit.detail ?? audit.entityId ?? ""}</span>
              </div>
              <span className={`badge ${audit.outcome === "success" ? "badge-good" : "badge-warn"}`}>{audit.outcome}</span>
            </div>
          ))}
          {audits.filter((audit) => audit.eventType.startsWith("ops_") || audit.eventType.includes("script")).length === 0 ? (
            <p className="empty-hint">{zh ? "暂无运维审计记录。预览不会写入审计，确认后才会记录。" : "No operations audit events yet. Preview does not audit; confirmation records one."}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
