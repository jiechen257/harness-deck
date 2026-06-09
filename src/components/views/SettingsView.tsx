import { useState } from "react";
import { Zap } from "lucide-react";

import type {
  AccountWorkspace,
  Locale,
  ProfileSummary,
  SyncGovernance,
  TargetKind,
  TargetSummary,
  Theme,
  WakeControlSummary,
  WakeSession,
} from "../../lib/types";

type SettingsTab = "general" | "installed" | "sync" | "guard" | "wake";

const tabLabels: Record<SettingsTab, { zh: string; en: string }> = {
  general: { zh: "通用", en: "General" },
  installed: { zh: "已安装", en: "Installed" },
  sync: { zh: "同步", en: "Sync" },
  guard: { zh: "守护", en: "Guard" },
  wake: { zh: "防睡", en: "Wake" },
};

interface SettingsViewProps {
  accountWorkspace: AccountWorkspace | null;
  locale: Locale;
  theme: Theme;
  profiles: ProfileSummary[];
  selectedProfileId: string;
  setSelectedProfileId: (id: string) => void;
  targets: TargetSummary[];
  selectedTargetKind: TargetKind;
  setSelectedTargetKind: (kind: TargetKind) => void;
  syncGovernance: SyncGovernance | null;
  wakeSummary: WakeControlSummary | null;
  confirmedWakeSession: WakeSession | null;
  onConfirmExperimentalWake: () => Promise<void>;
}

export function SettingsView({
  accountWorkspace,
  locale,
  theme,
  profiles,
  selectedProfileId,
  setSelectedProfileId,
  targets,
  selectedTargetKind,
  setSelectedTargetKind,
  syncGovernance,
  wakeSummary,
  confirmedWakeSession,
  onConfirmExperimentalWake,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <div className="settings-workspace">
      <nav className="settings-tabs" aria-label="Settings sections">
        {(Object.keys(tabLabels) as SettingsTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? "settings-tab active" : "settings-tab"}
            aria-current={tab === activeTab ? "page" : undefined}
            onClick={() => setActiveTab(tab)}
          >
            {locale === "zh-CN" ? tabLabels[tab].zh : tabLabels[tab].en}
          </button>
        ))}
      </nav>

      <div className="settings-content">
        {activeTab === "general" ? (
          <GeneralTab accountWorkspace={accountWorkspace} locale={locale} theme={theme} />
        ) : activeTab === "installed" ? (
          <InstalledTab
            locale={locale}
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            setSelectedProfileId={setSelectedProfileId}
            targets={targets}
            selectedTargetKind={selectedTargetKind}
            setSelectedTargetKind={setSelectedTargetKind}
          />
        ) : activeTab === "sync" ? (
          <SyncTab locale={locale} syncGovernance={syncGovernance} />
        ) : activeTab === "guard" ? (
          <GuardTab accountWorkspace={accountWorkspace} locale={locale} />
        ) : (
          <WakeTab
            confirmedWakeSession={confirmedWakeSession}
            locale={locale}
            onConfirmExperimentalWake={onConfirmExperimentalWake}
            wakeSummary={wakeSummary}
          />
        )}
      </div>
    </div>
  );
}

function GeneralTab({ accountWorkspace, locale, theme }: { accountWorkspace: AccountWorkspace | null; locale: Locale; theme: Theme }) {
  if (!accountWorkspace) {
    return <p className="muted-line">{locale === "zh-CN" ? "账户工作区加载中" : "Loading account workspace"}</p>;
  }

  return (
    <div className="account-workspace">
      <section className="account-hero">
        <div>
          <h3>{locale === "zh-CN" ? "账户工作区" : "Account Workspace"}</h3>
          <p>{locale === "zh-CN" ? "账户、预算、模型和 Keychain 引用。" : "Account, budget, model, and Keychain references."}</p>
        </div>
      </section>

      <div className="account-grid">
        <article>
          <span>{locale === "zh-CN" ? "提供商" : "Provider"}</span>
          <strong>{accountWorkspace.provider}</strong>
          <small>{accountWorkspace.baseUrl}</small>
        </article>
        <article>
          <span>{locale === "zh-CN" ? "默认模型" : "Default model"}</span>
          <strong>{accountWorkspace.defaultModel}</strong>
          <small>${accountWorkspace.monthlyBudgetUsd.toFixed(2)} {locale === "zh-CN" ? "总成本" : "total cost"}</small>
        </article>
        <article>
          <span>{locale === "zh-CN" ? "会话" : "Sessions"}</span>
          <strong>{accountWorkspace.requestLimitPerDay} {locale === "zh-CN" ? "次" : "total"}</strong>
          <small>{accountWorkspace.tokenLimitPerDay.toLocaleString()} tokens</small>
        </article>
        <article>
          <span>{locale === "zh-CN" ? "偏好设置" : "Preferences"}</span>
          <strong>{locale}</strong>
          <small>{theme} {locale === "zh-CN" ? "主题" : "theme"}</small>
        </article>
      </div>

      <section className="keychain-panel">
        <div>
          <span>{locale === "zh-CN" ? "Keychain 引用" : "Keychain reference"}</span>
          <code>{accountWorkspace.keychainRef.reference}</code>
        </div>
        <strong>{accountWorkspace.keychainRef.secretPreview ?? (locale === "zh-CN" ? "密钥值已隐藏" : "secret value hidden")}</strong>
      </section>

      <section className="switch-preview">
        <div className="section-title">
          <h3>{locale === "zh-CN" ? "切换计划预览" : "Switch-plan preview"}</h3>
          <span className="status-pill">{accountWorkspace.switchPlanPreview.writesRealConfig ? (locale === "zh-CN" ? "真实写入" : "Real write") : (locale === "zh-CN" ? "仅预览" : "Preview only")}</span>
        </div>
        <p>
          {accountWorkspace.switchPlanPreview.fromModel} → {accountWorkspace.switchPlanPreview.toModel}
        </p>
        <small>
          +${accountWorkspace.switchPlanPreview.budgetDeltaUsd.toFixed(0)} {locale === "zh-CN" ? "预估预算" : "projected budget"} ·{" "}
          {accountWorkspace.switchPlanPreview.requiresSecretValue ? (locale === "zh-CN" ? "需要密钥" : "requires secret") : (locale === "zh-CN" ? "使用已有 Keychain 引用" : "uses existing Keychain reference")}
        </small>
      </section>

      <section className="audit-list">
        {accountWorkspace.auditTrail.map((entry) => (
          <article key={entry.id}>
            <strong>{entry.severity}</strong>
            <span>{entry.summary}</span>
          </article>
        ))}
      </section>
    </div>
  );
}

function InstalledTab({
  locale,
  profiles,
  selectedProfileId,
  setSelectedProfileId,
  targets,
  selectedTargetKind,
  setSelectedTargetKind,
}: {
  locale: Locale;
  profiles: ProfileSummary[];
  selectedProfileId: string;
  setSelectedProfileId: (id: string) => void;
  targets: TargetSummary[];
  selectedTargetKind: TargetKind;
  setSelectedTargetKind: (kind: TargetKind) => void;
}) {
  return (
    <div className="workflow-grid">
      <div>
        <h3>{locale === "zh-CN" ? "配置集" : "Profiles"}</h3>
        <div className="profile-grid">
          {profiles.map((profile) => (
            <button
              className={profile.id === selectedProfileId ? "profile-card selected" : "profile-card"}
              key={profile.id}
              type="button"
              onClick={() => setSelectedProfileId(profile.id)}
            >
              <strong>{profile.name}</strong>
              <span>{profile.description}</span>
              <small>
                {locale === "zh-CN"
                  ? `${profile.rules} 条规则 · ${profile.skills} 个技能 · ${profile.mcpReferences} 个 MCP`
                  : `${profile.rules} rules · ${profile.skills} skills · ${profile.mcpReferences} MCP`}
              </small>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3>{locale === "zh-CN" ? "目标" : "Targets"}</h3>
        <div className="target-list">
          {targets.map((target) => (
            <button
              className={target.kind === selectedTargetKind ? "target-card selected" : "target-card"}
              key={target.kind}
              type="button"
              onClick={() => setSelectedTargetKind(target.kind)}
            >
              <strong>{target.name}</strong>
              <span>{target.status}</span>
              <small>{target.fixture ? (locale === "zh-CN" ? "模拟数据" : "Fixture") : (locale === "zh-CN" ? "真实目标" : "Real target")}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SyncTab({ locale, syncGovernance }: { locale: Locale; syncGovernance: SyncGovernance | null }) {
  if (!syncGovernance) {
    return <p className="muted-line">{locale === "zh-CN" ? "同步治理加载中" : "Loading sync governance"}</p>;
  }

  return (
    <div className="sync-governance">
      <section className="account-hero">
        <div>
          <h3>{locale === "zh-CN" ? "同步治理" : "Sync Governance"}</h3>
          <p>{locale === "zh-CN" ? "高级同步功能：三向 diff、冲突解决、漂移检测。" : "Advanced sync: three-way diff, conflict resolution, drift detection."}</p>
        </div>
      </section>

      {syncGovernance.threeWayDiff.length > 0 ? (
        <div className="insight-grid">
          {syncGovernance.threeWayDiff.map((entry) => (
            <article key={entry.path}>
              <strong>{entry.path}</strong>
              <small>{entry.baseSummary} → {entry.targetSummary}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted-line">{locale === "zh-CN" ? "无配置差异" : "No configuration diff"}</p>
      )}

      {syncGovernance.conflicts.length > 0 ? (
        <>
          <h4>{locale === "zh-CN" ? "冲突" : "Conflicts"}</h4>
          <div className="insight-grid">
            {syncGovernance.conflicts.map((conflict) => (
              <article key={conflict.id}>
                <strong>{conflict.path}</strong>
                <span>{conflict.resolution}</span>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function GuardTab({ accountWorkspace, locale }: { accountWorkspace: AccountWorkspace | null; locale: Locale }) {
  return (
    <div className="guard-workbench">
      <section className="guard-hero">
        <div>
          <h3>{locale === "zh-CN" ? "守护策略" : "Guard Policy"}</h3>
          <p>{locale === "zh-CN" ? "所有真实写入保持关闭；任何破坏性动作都需要 dry-run、manifest、backup 和显式确认。" : "All real writes stay disabled; destructive actions require dry-run, manifest, backup, and explicit confirmation."}</p>
        </div>
        <span className="status-pill">{locale === "zh-CN" ? "真实写入已关闭" : "real writes blocked"}</span>
      </section>

      <div className="guard-grid">
        <article>
          <strong>{locale === "zh-CN" ? "隐私保护" : "Privacy"}</strong>
          <span>{locale === "zh-CN" ? "不上传 prompt、源码、密钥或本地配置" : "No prompts, source code, secrets, or local config uploaded"}</span>
        </article>
        <article>
          <strong>Keychain</strong>
          <code>{accountWorkspace?.keychainRef.reference ?? "keychain://Hone/accounts/openai"}</code>
        </article>
        <article>
          <strong>{locale === "zh-CN" ? "备份保护" : "Backup"}</strong>
          <span>{locale === "zh-CN" ? "真实写入前必须备份" : "backup required before real write"}</span>
        </article>
        <article>
          <strong>{locale === "zh-CN" ? "部署清单" : "Manifest"}</strong>
          <span>{locale === "zh-CN" ? "部署前必须生成 dry-run 清单" : "dry-run manifest required before deploy"}</span>
        </article>
      </div>
    </div>
  );
}

function wakeModeLabel(mode: WakeSession["mode"], locale: Locale = "en-US") {
  switch (mode) {
    case "StandardAwake":
      return locale === "zh-CN" ? "标准唤醒" : "standard awake";
    case "TimedAwake":
      return locale === "zh-CN" ? "定时唤醒" : "timed awake";
    case "DisplaySleep":
      return locale === "zh-CN" ? "显示器休眠控制" : "display sleep control";
    case "ExperimentalLidAwake":
      return locale === "zh-CN" ? "实验性合盖唤醒" : "experimental lid-awake";
  }
}

function WakeTab({
  confirmedWakeSession,
  locale,
  onConfirmExperimentalWake,
  wakeSummary,
}: {
  confirmedWakeSession: WakeSession | null;
  locale: Locale;
  onConfirmExperimentalWake: () => Promise<void>;
  wakeSummary: WakeControlSummary | null;
}) {
  if (!wakeSummary) {
    return <p className="muted-line">{locale === "zh-CN" ? "Wake Control 加载中" : "Loading Wake Control"}</p>;
  }

  return (
    <div className="wake-workbench">
      <section className="wake-hero">
        <div>
          <h3>{locale === "zh-CN" ? "防睡控制" : "Wake Control"}</h3>
          <p>{locale === "zh-CN" ? "防止 macOS 在长时间 agent 会话期间进入睡眠。" : "Prevent macOS from sleeping during long agent sessions."}</p>
        </div>
        <span className="status-pill">{locale === "zh-CN" ? "当前：" : "current: "}{wakeModeLabel(wakeSummary.currentState.mode, locale)}</span>
      </section>

      <div className="wake-grid">
        {wakeSummary.quickActions.map((session) => (
          <article key={session.mode}>
            <strong>{wakeModeLabel(session.mode, locale)}</strong>
            <span>{session.implementation}</span>
            <small>
              {session.durationMinutes ? `${session.durationMinutes} ${locale === "zh-CN" ? "分钟" : "min"}` : (locale === "zh-CN" ? "持续" : "continuous")} ·{" "}
              {session.requiresConfirmation ? (locale === "zh-CN" ? "需要确认" : "confirmation required") : (locale === "zh-CN" ? "就绪" : "ready")}
            </small>
          </article>
        ))}
      </div>

      <section className="experimental-wake-panel">
        <div>
          <strong>{locale === "zh-CN" ? "实验性合盖唤醒" : "experimental lid-awake"}</strong>
          <span>{locale === "zh-CN" ? "需要显式确认" : "Requires explicit confirmation"}</span>
        </div>
        <button className="secondary-action" type="button" onClick={() => void onConfirmExperimentalWake()}>
          <Zap size={16} aria-hidden="true" />
          <span>{locale === "zh-CN" ? "确认实验性合盖防睡" : "Confirm experimental lid-awake"}</span>
        </button>
      </section>

      {confirmedWakeSession ? (
        <div className="wake-confirmed">{locale === "zh-CN" ? "实验性合盖唤醒已确认（模拟）" : "experimental lid-awake confirmed (mock)"}</div>
      ) : null}
    </div>
  );
}
