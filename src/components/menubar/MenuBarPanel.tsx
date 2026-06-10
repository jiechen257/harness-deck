import { Menu, Settings } from "lucide-react";
import type { CSSProperties } from "react";

import type { Locale } from "../../lib/types";
import { MacChrome } from "../shared/MacChrome";
import { HarnessLogo } from "../shared/HarnessLogo";

interface MenuBarPanelProps {
  healthScore: number;
  locale: Locale;
  onRefresh: () => void;
  onOpenWorkbench: () => void;
  refreshing: boolean;
  standalone?: boolean;
}

type HealthRingStyle = CSSProperties & { "--score": string };

export function MenuBarPanel({
  healthScore,
  locale,
  onOpenWorkbench,
  standalone,
}: MenuBarPanelProps) {
  const zh = locale === "zh-CN";

  return (
    <div className={standalone ? "menubar-panel standalone" : "menubar-panel"}>
      <MacChrome title={standalone ? "Hone" : ""} compact={standalone} />
      <div className="panel-content">
        <div className="menu-top">
          <div className="menu-product">
            <HarnessLogo size={standalone ? 34 : 40} />
            <div>
              <h2 className="menu-product-name">Hone</h2>
              <span className="local-dot">{zh ? "本地优先" : "Local-first"}</span>
            </div>
          </div>
          {!standalone ? (
            <div className="menu-icons">
              <Settings size={14} aria-hidden="true" />
              <Menu size={15} aria-hidden="true" />
            </div>
          ) : null}
        </div>

        <div className="panel-today">
          <strong>{zh ? "今日" : "Today"}</strong>
          <span>{zh ? "6月10日 周三" : "Jun 10 Wed"}</span>
        </div>

        <div className="menu-body">
          <div className="menu-stack">
            <section className="status-card">
              <div className="status-head">
                <div>
                  <strong>{zh ? "闭环健康度" : "Loop Health"}</strong>
                  <span>{zh ? "闭环状态" : "Loop status"}</span>
                </div>
              </div>
              <div className="panel-health-card">
                <div className="health-ring" style={{ "--score": `${healthScore}%` } as HealthRingStyle}>
                  <strong>{healthScore}%</strong>
                  <span>{zh ? "良好" : "Good"}</span>
                </div>
                <div className="health-legend">
                  <span><i className="dot teal" />{zh ? "信号" : "Signals"} <b>76%</b></span>
                  <span><i className="dot teal" />{zh ? "实践" : "Practices"} <b>85%</b></span>
                  <span><i className="dot teal" />{zh ? "资产" : "Assets"} <b>90%</b></span>
                  <span><i className="dot gold" />{zh ? "评审" : "Review"} <b>62%</b></span>
                  <span><i className="dot muted" />{zh ? "运维" : "Ops"} <b>88%</b></span>
                </div>
              </div>
            </section>

            <section className="status-card">
              <div className="status-head">
                <div><strong>{zh ? "实践健康度" : "Practice Health"}</strong></div>
              </div>
              <div className="menu-timeline">
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "可采纳" : "Adoptable"}</strong><span>{zh ? "待转本地资产" : "To local assets"}</span></div>
                  <span className="menu-pill good">23</span>
                </div>
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "资产待就绪" : "Assets pending"}</strong><span>{zh ? "等待确认" : "Awaiting confirm"}</span></div>
                  <span className="menu-pill warn">7</span>
                </div>
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "偏移" : "Drift"}</strong><span>{zh ? "需要评审" : "Needs review"}</span></div>
                  <span className="menu-pill risk">2</span>
                </div>
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "孤立" : "Orphan"}</strong><span>{zh ? "缺少实践关系" : "No practice link"}</span></div>
                  <span className="menu-pill">1</span>
                </div>
              </div>
            </section>

            <section className="status-card">
              <div className="status-head">
                <div><strong>{zh ? "本机运维" : "Local Ops"}</strong></div>
              </div>
              <div className="menu-timeline">
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "Codex 代理" : "Codex proxy"}</strong></div>
                  <span className="menu-pill good">{zh ? "运行中" : "Running"}</span>
                </div>
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "防睡守护" : "Sleep guard"}</strong></div>
                  <span className="menu-pill good">{zh ? "活跃" : "Active"}</span>
                </div>
                <div className="menu-timeline-row">
                  <div><strong>{zh ? "最近脚本" : "Recent script"}</strong></div>
                  <span className="menu-pill">{zh ? "18 分钟前" : "18 min ago"}</span>
                </div>
              </div>
            </section>

            <section className="status-card">
              <div className="status-head">
                <div><strong>{zh ? "快捷入口" : "Quick Actions"}</strong></div>
              </div>
              <div className="menu-quick-grid">
                <button className="quick-tile" type="button"><b>{zh ? "规范化信号" : "Normalize"}</b><span>{zh ? "生成实践预览" : "Preview practices"}</span></button>
                <button className="quick-tile" type="button"><b>{zh ? "评审偏移" : "Review Drift"}</b><span>{zh ? "查看证据" : "View evidence"}</span></button>
                <button className="quick-tile" type="button"><b>{zh ? "投射到 Claude" : "Project Claude"}</b><span>{zh ? "先预览差异" : "Preview diff"}</span></button>
                <button className="quick-tile" type="button"><b>{zh ? "投射到 Codex" : "Project Codex"}</b><span>{zh ? "先预览差异" : "Preview diff"}</span></button>
              </div>
              <button className="quick-action" type="button" onClick={onOpenWorkbench}>
                <div>
                  <strong>{zh ? "打开工作台" : "Open Workbench"}</strong>
                  <span>{zh ? "进入完整运营台" : "Enter full ops desk"}</span>
                </div>
                <span>→</span>
              </button>
            </section>

            <div className="menu-footer">
              <span className="menu-pill">{zh ? "配置集：默认" : "Profile: Default"}</span>
              <span className="menu-pill good">{zh ? "同步：正常" : "Sync: OK"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
