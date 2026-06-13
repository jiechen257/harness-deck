import { useCallback, useEffect, useState } from "react";

import {
  detectRegistryCandidates,
  getActiveRegistry,
  getAuthorizationState,
  grantAuthorization,
  initializeRegistry,
  listAuditEvents,
  revokeAuthorization,
  setRegistryConnection,
  useStarterRegistryReadonly,
} from "../../lib/api";
import type { AuditEvent, AuthorizationEntry, AuthScope, Locale, RegistryCandidate, RegistryConnection, Theme } from "../../lib/types";

interface SettingsViewProps {
  locale: Locale;
  theme: Theme;
}

type SettingsTab = "general" | "authorization" | "history";

export function SettingsView({ locale, theme }: SettingsViewProps) {
  const [tab, setTab] = useState<SettingsTab>("general");
  const zh = locale === "zh-CN";
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "general", label: zh ? "通用" : "General" },
    { id: "authorization", label: zh ? "授权" : "Authorization" },
    { id: "history", label: zh ? "审计" : "Audit" },
  ];

  return (
    <div className="view-content">
      <div className="view-header">
        <div>
          <span className="view-kicker">SETTINGS</span>
          <h1 className="view-title">{zh ? "每个本地边界单独授权，默认关闭，按需开启。" : "Every local boundary is authorized separately, off by default."}</h1>
          <p className="view-subtitle">{zh ? "管理注册表路径、候选仓库、只读 starter、授权开关、外观语言、本地数据和审计历史。" : "Manage registry paths, candidates, read-only starter, authorization, appearance, local data, and audit history."}</p>
        </div>
      </div>
      <div className="tabs-bar">
        {tabs.map((t) => (
          <button key={t.id} className={`tab-button ${tab === t.id ? "active" : ""}`} type="button" onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "general" && <GeneralTab locale={locale} theme={theme} />}
      {tab === "authorization" && <AuthorizationTab locale={locale} />}
      {tab === "history" && <AuditTab locale={locale} />}
    </div>
  );
}

function GeneralTab({ locale, theme }: { locale: Locale; theme: Theme }) {
  const [registry, setRegistry] = useState<RegistryConnection | null>(null);
  const [registryInput, setRegistryInput] = useState("");
  const [candidates, setCandidates] = useState<RegistryCandidate[]>([]);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const zh = locale === "zh-CN";

  const loadRegistry = useCallback(async () => {
    const [r, nextCandidates] = await Promise.all([getActiveRegistry(), detectRegistryCandidates()]);
      setRegistry(r);
      if (r) setRegistryInput(r.path);
      setCandidates(nextCandidates);
  }, []);

  useEffect(() => {
    void loadRegistry().catch((error: unknown) => setRegistryError(error instanceof Error ? error.message : String(error)));
  }, [loadRegistry]);

  const saveRegistry = async (path: string, registryType: string) => {
    setRegistryError(null);
    try {
      const conn = await setRegistryConnection(path, registryType);
      setRegistry(conn);
      setRegistryInput(conn.path);
      await loadRegistry();
    } catch (error) {
      setRegistryError(error instanceof Error ? error.message : String(error));
    }
  };

  const initializeAt = async (path: string) => {
    setRegistryError(null);
    try {
      const conn = await initializeRegistry(path);
      setRegistry(conn);
      setRegistryInput(conn.path);
      await loadRegistry();
    } catch (error) {
      setRegistryError(error instanceof Error ? error.message : String(error));
    }
  };

  const useStarter = async () => {
    setRegistryError(null);
    try {
      const conn = await useStarterRegistryReadonly();
      setRegistry(conn);
      setRegistryInput(conn.path);
      await loadRegistry();
    } catch (error) {
      setRegistryError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleSave = async () => {
    if (!registryInput.trim()) return;
    await saveRegistry(registryInput.trim(), "user");
  };

  const handleCandidate = (candidate: RegistryCandidate) => {
    if (candidate.registryType === "starter") {
      void useStarter();
      return;
    }
    if (candidate.exists) {
      void saveRegistry(candidate.path, candidate.registryType === "initialized" ? "initialized" : "user");
      return;
    }
    void initializeAt(candidate.path);
  };

  return (
    <div className="settings-section">
      <section className="settings-group">
        <h3 className="section-title">{zh ? "注册表路径" : "Registry Path"}</h3>
        <p className="field-hint">{zh ? "Git 管理的 registry 仓库路径，存放 skills、rules、hooks 和 MCP 片段。" : "Git-managed registry repo path for skills, rules, hooks, and MCP fragments."}</p>
        <div className="input-row">
          <input type="text" className="text-input" value={registryInput} onChange={(e) => setRegistryInput(e.target.value)} placeholder="~/HoneRegistry" />
          <button className="action-button primary" onClick={handleSave}>{zh ? "保存" : "Save"}</button>
        </div>
        {registry && (
          <div className="settings-meta-row">
            <span className={`badge ${registry.isActive ? "badge-good" : ""}`}>{zh ? "类型" : "Type"}: {registry.registryType}</span>
            <span className={`badge ${registry.isActive ? "badge-good" : "badge-warn"}`}>{registry.isActive ? (zh ? "已连接" : "Connected") : (zh ? "未连接" : "Disconnected")}</span>
          </div>
        )}
        {registryError ? <p className="empty-hint">{registryError}</p> : null}
      </section>

      <section className="settings-group">
        <h3 className="section-title">{zh ? "Registry Bootstrap" : "Registry Bootstrap"}</h3>
        <p className="field-hint">{zh ? "优先复用已有 registry；没有时可初始化 ~/HoneRegistry，或使用 starter read-only。" : "Reuse an existing registry first; initialize ~/HoneRegistry when needed, or use the starter read-only registry."}</p>
        <div className="item-list">
          {candidates.map((candidate) => (
            <div key={`${candidate.registryType}-${candidate.path}`} className="list-row">
              <div className="row-primary">
                <strong>{candidate.path}</strong>
                <span className="row-meta">{candidate.reason} · {candidate.registryType}</span>
              </div>
              <div className="inline-actions">
                <span className={`badge ${candidate.active ? "badge-good" : candidate.exists ? "badge-info" : "badge-warn"}`}>
                  {candidate.active ? (zh ? "当前" : "Active") : candidate.exists ? (zh ? "已存在" : "Exists") : (zh ? "可初始化" : "Can init")}
                </span>
                <button className="action-button" type="button" onClick={() => handleCandidate(candidate)}>
                  {candidate.registryType === "starter" ? (zh ? "使用只读 starter" : "Use starter") : candidate.exists ? (zh ? "选择" : "Select") : (zh ? "初始化" : "Initialize")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-group">
        <h3 className="section-title">{zh ? "外观" : "Appearance"}</h3>
        <div className="settings-appearance-grid">
          <div className="settings-appearance-item">
            <div><strong>{zh ? "主题" : "Theme"}</strong><span className="field-hint">{zh ? "浅色或深色模式" : "Light or dark mode"}</span></div>
            <span className="badge">{theme === "light" ? (zh ? "浅色" : "Light") : (zh ? "深色" : "Dark")}</span>
          </div>
          <div className="settings-appearance-item">
            <div><strong>{zh ? "语言" : "Language"}</strong><span className="field-hint">{zh ? "界面显示语言" : "Display language"}</span></div>
            <span className="badge">{locale === "zh-CN" ? "中文" : "English"}</span>
          </div>
        </div>
      </section>

      <section className="settings-group">
        <h3 className="section-title">{zh ? "数据" : "Data"}</h3>
        <div className="settings-appearance-grid">
          <div className="settings-appearance-item">
            <div><strong>{zh ? "数据库" : "Database"}</strong><span className="field-hint">hone.db (SQLite)</span></div>
            <span className="badge badge-good">{zh ? "正常" : "OK"}</span>
          </div>
          <div className="settings-appearance-item">
            <div><strong>{zh ? "审计日志" : "Audit Log"}</strong><span className="field-hint">{zh ? "所有变更和操作都被记录" : "All changes and operations are logged"}</span></div>
            <span className="badge badge-good">{zh ? "已启用" : "Enabled"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthorizationTab({ locale }: { locale: Locale }) {
  const [entries, setEntries] = useState<AuthorizationEntry[]>([]);
  const zh = locale === "zh-CN";

  const load = useCallback(async () => {
    setEntries(await getAuthorizationState());
  }, []);

  useEffect(() => { void load(); }, [load]);

  const scopeLabels: Record<string, { zh: string; en: string; desc_zh: string; desc_en: string }> = {
    registry: { zh: "注册表", en: "Registry", desc_zh: "连接本地 registry repo", desc_en: "Connect to local registry repo" },
    local_read: { zh: "本地读取", en: "Local Read", desc_zh: "读取 ~/.claude 和 ~/.codex", desc_en: "Read ~/.claude and ~/.codex" },
    external_signals: { zh: "外部信号", en: "External Signals", desc_zh: "访问外部信息源", desc_en: "Access external signal sources" },
    write_projection: { zh: "写入投射", en: "Write Projection", desc_zh: "Symlink/copy 到 target 目录", desc_en: "Symlink/copy to target dirs" },
    script_execution: { zh: "脚本执行", en: "Script Execution", desc_zh: "运行本机 agent 脚本", desc_en: "Run local agent scripts" },
  };

  const handleToggle = async (scope: AuthScope, granted: boolean) => {
    if (granted) {
      await grantAuthorization(scope);
    } else {
      await revokeAuthorization(scope);
    }
    await load();
  };

  return (
    <div className="settings-section">
      <p className="field-hint" style={{ marginBottom: 16 }}>
        {zh ? "每个权限边界独立授权。默认关闭，按需开启。" : "Each permission scope is independently authorized. Off by default."}
      </p>
      <div className="item-list">
        {entries.map((entry) => {
          const labels = scopeLabels[entry.scope] ?? { zh: entry.scope, en: entry.scope, desc_zh: "", desc_en: "" };
          return (
            <div key={entry.scope} className="list-row">
              <div className="row-primary">
                <strong>{zh ? labels.zh : labels.en}</strong>
                <span className="row-meta">{zh ? labels.desc_zh : labels.desc_en}</span>
              </div>
              <label className="toggle-label">
                <input type="checkbox" checked={entry.granted} onChange={(e) => handleToggle(entry.scope as AuthScope, e.target.checked)} />
                <span>{entry.granted ? (zh ? "已授权" : "Granted") : (zh ? "未授权" : "Denied")}</span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditTab({ locale }: { locale: Locale }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const zh = locale === "zh-CN";

  useEffect(() => {
    void listAuditEvents(50).then(setEvents);
  }, []);

  return (
    <div className="settings-section">
      <div className="item-list">
        {events.map((event) => (
          <div key={event.id} className="list-row">
            <div className="row-primary">
              <strong>{event.eventType}</strong>
              <span className="row-meta">
                {event.entityType ?? ""}{event.entityId ? ` · ${event.entityId}` : ""}
              </span>
            </div>
            <span className={`badge ${event.outcome === "success" ? "badge-good" : event.outcome === "failure" ? "badge-warn" : ""}`}>
              {event.outcome}
            </span>
          </div>
        ))}
        {events.length === 0 && <p className="empty-hint">{zh ? "暂无审计记录" : "No audit events"}</p>}
      </div>
    </div>
  );
}
