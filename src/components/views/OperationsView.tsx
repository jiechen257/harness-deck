import type { Locale } from "../../lib/types";

const scripts = [
  ["~/start-codex.sh", "Codex proxy", "launchctl 环境和 Codex 重启控制", "运行中", "badge-good"],
  ["~/dsleep", "Sleep guard", "caffeinate 防睡，需要停止入口", "活跃", "badge-warn"],
  ["~/dwake", "Wake display", "pmset displaysleepnow 快捷动作", "空闲", "badge-info"],
] as const;

export function OperationsView({ locale }: { locale: Locale }) {
  const zh = locale === "zh-CN";

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <h2 className="view-title">{zh ? "运维" : "Operations"}</h2>
          <p className="view-subtitle">{zh ? "本机 agent 操作环境的集中控制，和实践卡片分离。" : "Controlled local agent operations, separate from Practice Cards."}</p>
        </div>
        <span className="badge badge-good">{zh ? "默认只读" : "Read-only by default"}</span>
      </div>

      <div className="compact-card-grid">
        {scripts.map(([path, name, detail, status, tone]) => (
          <article key={path} className="info-block">
            <div className="surface-head"><h3>{name}</h3><span className={`badge ${tone}`}>{status}</span></div>
            <code className="row-path">{path}</code>
            <p>{detail}</p>
            <div className="inline-actions">
              <button className="action-button" type="button">{zh ? "预览" : "Preview"}</button>
              <button className="action-button primary" type="button">{zh ? "确认运行" : "Confirm Run"}</button>
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
