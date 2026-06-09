import type { AccountWorkspace, Locale } from "../../lib/types";

export function GuardView({ accountWorkspace, locale }: { accountWorkspace: AccountWorkspace | null; locale: Locale }) {
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
          <code>{accountWorkspace?.keychainRef.reference ?? "keychain://HarnessDeck/accounts/openai"}</code>
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
