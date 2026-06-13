import { useState } from "react";

import type { Locale } from "../../lib/types";

const scripts = [
  ["~/start-codex.sh", "Codex proxy", "launchctl 环境和 Codex 重启控制", "运行中", "badge-good", "high"],
  ["~/dsleep", "Sleep guard", "caffeinate 防睡，需要停止入口", "活跃", "badge-warn", "medium"],
  ["~/dwake", "Wake display", "pmset displaysleepnow 快捷动作", "空闲", "badge-info", "medium"],
] as const;

export function OperationsView({ locale }: { locale: Locale }) {
  const zh = locale === "zh-CN";
  const [previewedScript, setPreviewedScript] = useState<string | null>(null);
  const [blockedScript, setBlockedScript] = useState<string | null>(null);

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

      <div className="compact-card-grid">
        {scripts.map(([path, name, detail, status, tone, risk]) => (
          <article key={path} className="info-block">
            <div className="surface-head"><h3>{name}</h3><span className={`badge ${tone}`}>{status}</span></div>
            <code className="row-path">{path}</code>
            <p>{detail}</p>
            <span className={`badge ${risk === "high" ? "badge-warn" : "badge-info"}`}>{zh ? "风险" : "Risk"}: {risk}</span>
            {previewedScript === path ? (
              <div className="ops-preview-block">
                <strong>{zh ? "预览计划" : "Preview plan"}</strong>
                <p>{zh ? "将生成命令差异、检查授权和记录审计；当前未执行系统写入。" : "Generates command diff, checks authorization, and records audit; no system write has run."}</p>
              </div>
            ) : null}
            {blockedScript === path ? (
              <p className="empty-hint">{zh ? "需要先在设置中授予脚本执行权限。菜单栏不会直接运行高风险脚本。" : "Grant script execution in Settings first. The menu bar never runs high-risk scripts directly."}</p>
            ) : null}
            <div className="inline-actions">
              <button className="action-button" type="button" onClick={() => { setPreviewedScript(path); setBlockedScript(null); }}>{zh ? "预览计划" : "Preview Plan"}</button>
              <button className="action-button primary" type="button" disabled={previewedScript !== path} onClick={() => setBlockedScript(path)}>{zh ? "确认运行" : "Confirm Run"}</button>
            </div>
          </article>
        ))}
      </div>

      <section className="card-section">
        <h3 className="section-title">{zh ? "运行审计" : "Run Audit"}</h3>
        <div className="item-list">
          <div className="list-row"><div className="row-primary"><strong>start-codex.sh {zh ? "预览" : "preview"}</strong><span className="row-meta">{zh ? "已生成 launchctl 环境差异，未重启" : "launchctl diff generated, no restart yet"}</span></div><span className="badge">preview</span></div>
          <div className="list-row"><div className="row-primary"><strong>dsleep {zh ? "已停止" : "stopped"}</strong><span className="row-meta">{zh ? "没有运行中的 caffeinate 进程" : "No running caffeinate process"}</span></div><span className="badge badge-good">idle</span></div>
        </div>
      </section>
    </div>
  );
}
