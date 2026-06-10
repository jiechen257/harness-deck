import { Boxes, CheckCircle2, GitBranch, Library, ShieldCheck } from "lucide-react";

import type { ViewId } from "../../constants/types";
import type { Locale } from "../../lib/types";

interface HomeViewProps {
  healthScore: number;
  locale: Locale;
  onSelectView: (view: ViewId) => void;
  t: Record<string, string>;
}

export function HomeView({ locale, onSelectView, t }: HomeViewProps) {
  const zh = locale === "zh-CN";
  const rows = [
    {
      icon: Library,
      name: zh ? "信号" : "Signals",
      cn: zh ? "信息源" : "Sources",
      count: "18",
      caption: zh ? "新信号" : "new signals",
      metrics: zh ? ["高影响更新  3", "Codex 桌面版 1.19.0  新", "Claude Code 1.0.49  新"] : ["High impact  3", "Codex Desktop 1.19.0  New", "Claude Code 1.0.49  New"],
      action: zh ? "规范化 6 条信号" : "Normalize 6 signals",
      view: "library" as ViewId,
      tone: "blue",
    },
    {
      icon: CheckCircle2,
      name: zh ? "实践" : "Practices",
      cn: zh ? "最佳实践" : "Best practices",
      count: "30",
      caption: zh ? "已规范化" : "normalized",
      metrics: zh ? ["可采纳  23", "待生成资产  7", "不适用  3"] : ["Adoptable  23", "Assets pending  7", "Dismissed  3"],
      action: zh ? "准备 2 个资产" : "Prepare 2 assets",
      view: "library" as ViewId,
      tone: "teal",
    },
    {
      icon: GitBranch,
      name: zh ? "本地资产" : "Local Assets",
      cn: zh ? "本地资产" : "Local assets",
      count: "142",
      caption: zh ? "已就绪" : "ready",
      metrics: zh ? ["注册表就绪  142", "Claude 已投射  136", "Codex 已投射  129"] : ["Registry  142", "Claude  136", "Codex  129"],
      action: zh ? "修复 2 个断链" : "Fix 2 broken links",
      view: "apply" as ViewId,
      tone: "blue",
    },
    {
      icon: ShieldCheck,
      name: zh ? "评审" : "Review",
      cn: zh ? "评审" : "Review",
      count: "5",
      caption: zh ? "待处理" : "open",
      metrics: zh ? ["偏移  2", "孤立  1", "可替换  1"] : ["Drift  2", "Orphan  1", "Replaceable  1"],
      action: zh ? "评审 2 个偏移" : "Review 2 drifts",
      view: "review" as ViewId,
      tone: "purple",
    },
    {
      icon: Boxes,
      name: zh ? "运维" : "Operations",
      cn: zh ? "运营" : "Ops",
      count: "3",
      caption: zh ? "运行中" : "running",
      metrics: zh ? ["Codex 代理  运行中", "防睡守护  活跃", "脚本运行  今日 6 次"] : ["Codex proxy  Running", "Sleep guard  Active", "Scripts  6 today"],
      action: zh ? "查看最近运行" : "Open run log",
      view: "operations" as ViewId,
      tone: "gold",
    },
  ];

  return (
    <section className="loop-home" data-testid="home-view">
      <div className="context-strip">
        <span className="status-pill" aria-label={t.productHealthLabel}>
          <CheckCircle2 size={14} aria-hidden="true" />
          {t.localReady}
        </span>
        <span>{zh ? "所有数据与配置均保存在本机" : "All data and configuration stay local"}</span>
        <span>{zh ? "注册表路径  ~/my-agent-skill/registry  |  配置集  默认" : "Registry  ~/my-agent-skill/registry  |  Profile  Default"}</span>
      </div>

      <div className="loop-layout">
        <section className="loop-main">
          <div className="view-header">
            <div>
              <h1 className="view-title">{zh ? "闭环状态总览" : "Loop Status Overview"}</h1>
            </div>
            <span className="row-meta">{zh ? "2 分钟前更新 ↻" : "Updated 2 min ago ↻"}</span>
          </div>

          <div className="loop-status-list">
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <article key={row.name} className={`loop-status-row ${row.tone}`}>
                  <div className="loop-status-icon"><Icon size={18} aria-hidden="true" /></div>
                  <div className="loop-status-primary">
                    <span><b>{row.name}</b> {row.cn}</span>
                    <strong>{row.count}</strong>
                    <span>{row.caption}</span>
                  </div>
                  <div className="loop-status-metrics">
                    {row.metrics.map((metric) => {
                      const parts = metric.split("  ");
                      return (
                        <div className="status-metric" key={metric}>
                          <span>{parts[0]}</span>
                          <b>{parts[1] ?? ""}</b>
                        </div>
                      );
                    })}
                  </div>
                  <div className="row-action">
                    <span className="row-meta">{zh ? "下一步" : "Next"}</span>
                    <button className="action-button" type="button" onClick={() => onSelectView(row.view)}>
                      {row.action} →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="workbench-footer">
            <span className="local-dot">{zh ? "数据库  hone.db（SQLite）" : "Database  hone.db (SQLite)"}</span>
            <span>{zh ? "最近备份  昨天 22:10" : "Last backup  yesterday 22:10"}</span>
            <span>{zh ? "审计  已启用" : "Audit  enabled"}</span>
          </div>
        </section>

        <aside className="loop-side-rail">
          <section className="rail-card">
            <h3>{zh ? "待决策队列" : "Decision Queue"}</h3>
            <div className="decision-row">
              <span className="mini-icon blue">⌁</span>
              <div><strong>{zh ? "规范化 6 条信号" : "Normalize 6 signals"}</strong><span className="row-meta">{zh ? "生成实践预览" : "Generate practice preview"}</span></div>
              <span className="badge">6</span>
            </div>
            <div className="decision-row">
              <span className="mini-icon purple">◇</span>
              <div><strong>{zh ? "评审 2 个偏移" : "Review 2 drifts"}</strong><span className="row-meta">{zh ? "查看证据" : "View evidence"}</span></div>
              <span className="badge badge-warn">2</span>
            </div>
            <div className="decision-row">
              <span className="mini-icon teal">□</span>
              <div><strong>{zh ? "采纳 1 个未管理技能" : "Adopt 1 unmanaged skill"}</strong><span className="row-meta">{zh ? "进入安全采纳流" : "Enter safe adopt flow"}</span></div>
              <span className="badge">1</span>
            </div>
          </section>
          <section className="rail-card">
            <h3>{zh ? "目标健康度" : "Target Health"}</h3>
            <div className="target-row">
              <span className="mini-icon">AI</span>
              <div><strong>Claude Code</strong><span className="row-meta">v1.0.49 · {zh ? "已投射" : "projected"}</span></div>
              <span className="badge badge-good">98%</span>
            </div>
            <div className="target-row">
              <span className="mini-icon">⌬</span>
              <div><strong>Codex</strong><span className="row-meta">v1.19.0 · {zh ? "已投射" : "projected"}</span></div>
              <span className="badge badge-good">94%</span>
            </div>
          </section>
          <section className="rail-card">
            <h3>{zh ? "审计轨迹" : "Audit Trail"}</h3>
            <span className="badge" style={{ cursor: "pointer" }}>{zh ? "查看全部" : "View all"}</span>
            <div className="audit-row">
              <span className="badge badge-good">✓</span>
              <div><strong>{zh ? "软链接投射" : "Symlink projection"}</strong><span className="row-meta">{zh ? "更新：2 个链接已修复" : "Updated: 2 links fixed"}</span></div>
              <span className="row-meta">{zh ? "2 分钟前" : "2 min ago"}</span>
            </div>
            <div className="audit-row">
              <span className="badge badge-good">✓</span>
              <div><strong>{zh ? "脚本运行" : "Script run"}</strong><span className="row-meta">apply-to-claude.sh {zh ? "成功" : "success"}</span></div>
              <span className="row-meta">{zh ? "18 分钟前" : "18 min ago"}</span>
            </div>
            <div className="audit-row">
              <span className="badge badge-warn">!</span>
              <div><strong>{zh ? "检测到偏移" : "Drift detected"}</strong><span className="row-meta">{zh ? "Codex 代理端口不一致" : "Codex proxy port mismatch"}</span></div>
              <span className="row-meta">{zh ? "1 小时前" : "1 hr ago"}</span>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
