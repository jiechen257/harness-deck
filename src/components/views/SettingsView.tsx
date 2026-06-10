import { useCallback, useEffect, useState } from "react";

import {
  getActiveRegistry,
  getAuthorizationState,
  grantAuthorization,
  listAuditEvents,
  revokeAuthorization,
  setRegistryConnection,
} from "../../lib/api";
import type { AuditEvent, AuthorizationEntry, AuthScope, Locale, RegistryConnection, Theme } from "../../lib/types";

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
        <h2 className="view-title">{zh ? "设置" : "Settings"}</h2>
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
  const zh = locale === "zh-CN";

  useEffect(() => {
    void getActiveRegistry().then((r) => {
      setRegistry(r);
      if (r) setRegistryInput(r.path);
    });
  }, []);

  const handleSave = async () => {
    if (!registryInput.trim()) return;
    const conn = await setRegistryConnection(registryInput.trim(), "user");
    setRegistry(conn);
  };

  return (
    <div className="settings-section">
      <h3 className="section-title">{zh ? "注册表路径" : "Registry Path"}</h3>
      <div className="input-row">
        <input type="text" className="text-input" value={registryInput} onChange={(e) => setRegistryInput(e.target.value)} placeholder="~/HoneRegistry" />
        <button className="action-button primary" onClick={handleSave}>{zh ? "保存" : "Save"}</button>
      </div>
      {registry && (
        <p className="field-hint">
          {zh ? "类型" : "Type"}: {registry.registryType} · {zh ? "活跃" : "Active"}: {registry.isActive ? "✓" : "✗"}
        </p>
      )}

      <h3 className="section-title" style={{ marginTop: 24 }}>{zh ? "外观" : "Appearance"}</h3>
      <p className="field-hint">{zh ? "当前主题" : "Current theme"}: {theme}</p>
      <p className="field-hint">{zh ? "当前语言" : "Current locale"}: {locale}</p>
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
