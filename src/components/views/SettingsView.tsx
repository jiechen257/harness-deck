import type { AccountWorkspace, Locale, Theme } from "../../lib/types";

export function SettingsView({
  accountWorkspace,
  locale,
  theme,
}: {
  accountWorkspace: AccountWorkspace | null;
  locale: Locale;
  theme: Theme;
}) {
  if (!accountWorkspace) {
    return <p className="muted-line">{locale === "zh-CN" ? "账户工作区加载中" : "Loading account workspace"}</p>;
  }

  return (
    <div className="account-workspace">
      <section className="account-hero">
        <div>
          <h3>{locale === "zh-CN" ? "账户工作区" : "Account Workspace"}</h3>
          <p>{locale === "zh-CN" ? "账户、预算、模型和 Keychain 引用先以 mock/interface 形式落地。" : "Account, budget, model, and Keychain references are modeled through a mock/interface boundary."}</p>
        </div>
        <span className="status-pill">{locale === "zh-CN" ? "不存储 secret 值" : "No secret values"}</span>
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
