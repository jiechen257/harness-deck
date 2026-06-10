import { useEffect, useState } from "react";

import { getActiveRegistry, previewProjection } from "../../lib/api";
import type { Locale, ProjectionPlan, RegistryConnection } from "../../lib/types";

type SyncMode = "plan" | "conflict" | "adopt" | "audit";

export function ApplySyncView({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<SyncMode>("plan");
  const [registry, setRegistry] = useState<RegistryConnection | null>(null);
  const [plan, setPlan] = useState<ProjectionPlan | null>(null);
  const zh = locale === "zh-CN";

  useEffect(() => {
    void getActiveRegistry().then((nextRegistry) => {
      setRegistry(nextRegistry);
      return previewProjection(nextRegistry?.path ?? "~/HoneRegistry", "~/.codex/skills", "codex");
    }).then(setPlan);
  }, []);

  const tabs: { id: SyncMode; label: string }[] = [
    { id: "plan", label: zh ? "计划" : "Plan" },
    { id: "conflict", label: zh ? "冲突" : "Conflicts" },
    { id: "adopt", label: zh ? "采纳" : "Adopt" },
    { id: "audit", label: zh ? "审计" : "Audit" },
  ];

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2 className="view-title">{zh ? "应用与同步" : "Apply & Sync"}</h2>
          <p className="view-subtitle">{zh ? "默认软链接，复制只作为兼容兜底。所有动作先生成计划。" : "Symlink by default, copy only as compatibility fallback. Every action starts as a plan."}</p>
        </div>
      </div>

      <section className="projection-card" aria-labelledby="projection-title">
        <div className="projection-title-block">
          <h3 id="projection-title">{zh ? "注册表投射" : "Registry Projection"}</h3>
          <p>{zh ? "registry repo 到 Claude Code / Codex target 的试运行预览。" : "Dry-run projection from registry repo to Claude Code / Codex targets."}</p>
        </div>
        <div className="projection-node">
          <span className="badge badge-good">{zh ? "事实源" : "Source of truth"}</span>
          <h3>{registry?.path ?? "~/HoneRegistry"}</h3>
          <p>{zh ? "system-skills、user skills、rules、hooks、MCP 片段由 Git 管理。" : "System skills, user skills, rules, hooks, and MCP fragments are Git-managed."}</p>
        </div>
        <div className="projection-line">
          <span>{zh ? "软链接预览 -> ~/.claude/skills/local-harness-review" : "Symlink preview -> ~/.claude/skills/local-harness-review"}</span>
          <span>{zh ? "软链接预览 -> ~/.codex/skills/normalize-practice-card" : "Symlink preview -> ~/.codex/skills/normalize-practice-card"}</span>
          <span>{zh ? "复制兜底 -> MCP 配置片段" : "Copy fallback -> MCP config fragment"}</span>
        </div>
        <div className="projection-node">
          <span className="badge badge-warn">{zh ? "目标" : "Targets"}</span>
          <h3>Claude Code + Codex</h3>
          <p>{zh ? "目标目录只是投射结果；差异、备份、断链和复制偏移都进入审计。" : "Target dirs are projections; diffs, backups, broken links, and copy drift are audited."}</p>
        </div>
      </section>

      <div className="tabs-bar">
        {tabs.map((item) => <button key={item.id} className={`tab-button ${mode === item.id ? "active" : ""}`} type="button" onClick={() => setMode(item.id)}>{item.label}</button>)}
      </div>

      <section className="card-section">
        <h3 className="section-title">{tabs.find((item) => item.id === mode)?.label}</h3>
        {mode === "plan" ? (
          <div className="item-list">
            {(plan?.actions ?? []).map((action) => (
              <div key={`${action.assetId}-${action.targetPath}`} className="list-row">
                <div className="row-primary">
                  <strong>{action.assetName}</strong>
                  <code className="row-path">{action.registryPath} {"->"} {action.targetPath}</code>
                </div>
                <span className="badge badge-good">{action.mode} · {action.action}</span>
              </div>
            ))}
          </div>
        ) : null}
        {mode === "conflict" ? (
          <div className="item-list">
            <div className="list-row"><div className="row-primary"><strong>~/.codex/skills/grill-me</strong><span className="row-meta">{zh ? "目标资产存在，但没有 registry 关系。" : "Target asset exists without registry relation."}</span></div><span className="badge badge-warn">{zh ? "冲突" : "Conflict"}</span></div>
            <div className="list-row"><div className="row-primary"><strong>~/.claude/skills/local-harness-review</strong><span className="row-meta">{zh ? "复制模式目标和 registry 源不一致。" : "Copy-mode target differs from registry source."}</span></div><span className="badge badge-info">{zh ? "偏移" : "Drift"}</span></div>
          </div>
        ) : null}
        {mode === "adopt" ? (
          <div className="item-list">
            <div className="list-row"><strong>{zh ? "1. 复制到 registry" : "1. Copy into registry"}</strong><span className="badge">staged</span></div>
            <div className="list-row"><strong>{zh ? "2. 备份目标" : "2. Back up target"}</strong><span className="badge">planned</span></div>
            <div className="list-row"><strong>{zh ? "3. 替换为软链接" : "3. Replace with symlink"}</strong><span className="badge badge-warn">{zh ? "待确认" : "Confirm"}</span></div>
          </div>
        ) : null}
        {mode === "audit" ? (
          <div className="item-list">
            <div className="list-row"><strong>{zh ? "软链接投射" : "Symlink projection"}</strong><span className="row-meta">{zh ? "2 个链接已修复" : "2 links repaired"}</span></div>
            <div className="list-row"><strong>{zh ? "回滚预览" : "Rollback preview"}</strong><span className="row-meta">{zh ? "不会删除 registry 源文件" : "Registry source files stay intact"}</span></div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
