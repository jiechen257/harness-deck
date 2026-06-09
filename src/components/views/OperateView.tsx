import { Zap } from "lucide-react";

import type { Locale, WakeControlSummary, WakeSession } from "../../lib/types";

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

interface OperateViewProps {
  confirmedWakeSession: WakeSession | null;
  locale: Locale;
  onConfirmExperimentalWake: () => Promise<void>;
  wakeSummary: WakeControlSummary | null;
}

export function OperateView({ confirmedWakeSession, locale, onConfirmExperimentalWake, wakeSummary }: OperateViewProps) {
  if (!wakeSummary) {
    return <p className="muted-line">{locale === "zh-CN" ? "Wake Control 加载中" : "Loading Wake Control"}</p>;
  }

  return (
    <div className="wake-workbench">
      <section className="wake-hero">
        <div>
          <h3>{locale === "zh-CN" ? "防睡控制" : "Wake Control"}</h3>
          <p>{locale === "zh-CN" ? "当前阶段使用 mock/system-safe 控制，不修改系统电源策略。" : "This phase uses mock/system-safe controls and does not change system power policy."}</p>
        </div>
        <span className="status-pill">{locale === "zh-CN" ? "当前：" : "current: "}{wakeModeLabel(wakeSummary.currentState.mode, locale)}</span>
      </section>

      <div className="wake-grid">
        {wakeSummary.quickActions.map((session) => (
          <article key={session.mode}>
            <strong>{session.mode === "ExperimentalLidAwake" ? (locale === "zh-CN" ? "实验性合盖唤醒模式" : "experimental lid-awake mode") : wakeModeLabel(session.mode, locale)}</strong>
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
