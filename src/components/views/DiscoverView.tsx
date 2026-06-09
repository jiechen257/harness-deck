import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, RefreshCw, Sparkles, Star } from "lucide-react";

import {
  crawlAllSources,
  detectAgents,
  installSkill,
  listLocalSkills,
  rankCrawlResults,
} from "../../lib/api";
import type {
  AgentAvailability,
  CrawlItem,
  CrawlSummary,
  InstallResult,
  InstallTarget,
  LocalSkillEntry,
  Locale,
} from "../../lib/types";

const SOURCE_LABELS: Record<string, { zh: string; en: string }> = {
  GitHub: { zh: "GitHub", en: "GitHub" },
  HackerNews: { zh: "Hacker News", en: "Hacker News" },
  Reddit: { zh: "Reddit", en: "Reddit" },
  LinuxDo: { zh: "linux.do", en: "linux.do" },
  Curated: { zh: "策展推荐", en: "Curated" },
};

export function DiscoverView({ locale }: { locale: Locale }) {
  const [localSkills, setLocalSkills] = useState<LocalSkillEntry[]>([]);
  const [crawlSummary, setCrawlSummary] = useState<CrawlSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [agents, setAgents] = useState<AgentAvailability[]>([]);
  const [installResult, setInstallResult] = useState<InstallResult | null>(null);
  const [installTarget, setInstallTarget] = useState<InstallTarget>("ClaudeCode");
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    void listLocalSkills().then(setLocalSkills);
    void detectAgents().then(setAgents);
  }, []);

  const availableAgent = agents.find((a) => a.available);

  const handleCrawl = useCallback(async () => {
    setIsLoading(true);
    setInstallResult(null);
    try {
      const summary = await crawlAllSources();
      setCrawlSummary(summary);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRank = useCallback(async () => {
    if (!crawlSummary || !availableAgent) return;
    setIsRanking(true);
    try {
      const allItems = crawlSummary.results.flatMap((r) => r.items);
      const ranked = await rankCrawlResults(allItems, availableAgent.kind);
      setCrawlSummary({
        ...crawlSummary,
        totalRanked: ranked.length,
        agentUsed: availableAgent.kind,
        results: [{
          source: "GitHub" as const,
          items: ranked,
          crawledAt: crawlSummary.results[0]?.crawledAt ?? new Date().toISOString(),
          filterKeywords: [],
          error: null,
        }],
      });
    } finally {
      setIsRanking(false);
    }
  }, [crawlSummary, availableAgent]);

  const handleInstall = useCallback(async (item: CrawlItem) => {
    setInstallingId(item.id);
    setInstallResult(null);
    try {
      const result = await installSkill({
        sourceUrl: item.url,
        target: installTarget,
        action: "CopySkill",
        skillName: item.title,
      });
      setInstallResult(result);
      if (result.success) {
        const updated = await listLocalSkills();
        setLocalSkills(updated);
      }
    } finally {
      setInstallingId(null);
    }
  }, [installTarget]);

  const curatedItems = crawlSummary?.results
    .find((r) => r.source === "Curated")?.items ?? [];
  const githubItems = crawlSummary?.results
    .find((r) => r.source === "GitHub")?.items ?? [];
  const communityItems = crawlSummary?.results
    .filter((r) => ["HackerNews", "Reddit", "LinuxDo"].includes(r.source))
    .flatMap((r) => r.items) ?? [];

  const isRanked = (crawlSummary?.totalRanked ?? 0) > 0;

  return (
    <div className="registry-workbench">
      <section className="registry-hero">
        <div>
          <h3>{locale === "zh-CN" ? "发现 AI Coding 范式" : "Discover AI Coding Practices"}</h3>
          <p>
            {crawlSummary
              ? locale === "zh-CN"
                ? `已聚合 ${crawlSummary.totalFiltered} 条相关内容（原始 ${crawlSummary.totalRaw} 条）`
                : `${crawlSummary.totalFiltered} relevant items aggregated (${crawlSummary.totalRaw} raw)`
              : locale === "zh-CN"
                ? "从 GitHub、Hacker News、Reddit、linux.do 聚合最新实践"
                : "Aggregate latest practices from GitHub, HN, Reddit, linux.do"}
          </p>
        </div>
        <div className="discover-actions">
          <button
            className="primary-action compact"
            type="button"
            disabled={isLoading}
            onClick={() => void handleCrawl()}
          >
            <RefreshCw size={14} aria-hidden="true" className={isLoading ? "spinning" : ""} />
            <span>{isLoading
              ? (locale === "zh-CN" ? "爬取中..." : "Crawling...")
              : (locale === "zh-CN" ? "更新热榜" : "Update Feed")}</span>
          </button>
          {crawlSummary && availableAgent && !isRanked ? (
            <button
              className="secondary-action compact"
              type="button"
              disabled={isRanking}
              onClick={() => void handleRank()}
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>{isRanking
                ? (locale === "zh-CN" ? "精排中..." : "Ranking...")
                : (locale === "zh-CN" ? `Agent 精排 (${availableAgent.kind})` : `Agent Rank (${availableAgent.kind})`)}</span>
            </button>
          ) : null}
        </div>
      </section>

      {installResult ? (
        <div className={`install-toast ${installResult.success ? "success" : "error"}`}>
          {installResult.message}
        </div>
      ) : null}

      {/* Install target selector */}
      {crawlSummary ? (
        <div className="install-target-bar">
          <span>{locale === "zh-CN" ? "安装目标：" : "Install to: "}</span>
          <button
            type="button"
            className={installTarget === "ClaudeCode" ? "target-chip active" : "target-chip"}
            onClick={() => setInstallTarget("ClaudeCode")}
          >Claude Code</button>
          <button
            type="button"
            className={installTarget === "Codex" ? "target-chip active" : "target-chip"}
            onClick={() => setInstallTarget("Codex")}
          >Codex</button>
        </div>
      ) : null}

      {/* Curated recommendations (always show when crawled) */}
      {curatedItems.length > 0 ? (
        <section className="discover-section">
          <h4>{locale === "zh-CN" ? "策展推荐" : "Curated Recommendations"}</h4>
          <div className="template-grid">
            {curatedItems.map((item) => (
              <CrawlCard
                key={item.id}
                item={item}
                locale={locale}
                onInstall={handleInstall}
                installing={installingId === item.id}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* GitHub repos (tool radar) */}
      {githubItems.length > 0 ? (
        <section className="discover-section">
          <h4>
            {locale === "zh-CN" ? "工具雷达" : "Tool Radar"}
            <span className="section-badge">GitHub</span>
            {isRanked ? <span className="section-badge ranked">{locale === "zh-CN" ? "已精排" : "Ranked"}</span> : null}
          </h4>
          <div className="template-grid">
            {githubItems.slice(0, 20).map((item) => (
              <CrawlCard
                key={item.id}
                item={item}
                locale={locale}
                onInstall={handleInstall}
                installing={installingId === item.id}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Community pulse (HN + Reddit + linux.do) */}
      {communityItems.length > 0 ? (
        <section className="discover-section">
          <h4>{locale === "zh-CN" ? "社区脉搏" : "Community Pulse"}</h4>
          <div className="feed-list">
            {communityItems.slice(0, 30).map((item) => (
              <article key={item.id}>
                <div>
                  <span className="source-badge" data-source={item.source}>
                    {SOURCE_LABELS[item.source]?.[locale === "zh-CN" ? "zh" : "en"] ?? item.source}
                  </span>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <strong>{item.title}</strong>
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
                <small>
                  {item.score != null ? `▲${item.score}` : ""}
                  {item.author ? ` · ${item.author}` : ""}
                  {item.relevance != null ? ` · ${locale === "zh-CN" ? "相关性" : "relevance"} ${Math.round(item.relevance * 100)}` : ""}
                </small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Crawl errors */}
      {crawlSummary?.results.some((r) => r.error) ? (
        <section className="discover-section">
          <h4>{locale === "zh-CN" ? "爬取异常" : "Crawl Errors"}</h4>
          {crawlSummary.results.filter((r) => r.error).map((r) => (
            <p key={r.source} className="muted-line">
              {SOURCE_LABELS[r.source]?.[locale === "zh-CN" ? "zh" : "en"] ?? r.source}: {r.error}
            </p>
          ))}
        </section>
      ) : null}

      {/* Local installed skills */}
      <section className="discover-section">
        <h4>
          {locale === "zh-CN" ? "已安装 Skills" : "Installed Skills"}
          <span className="section-badge">{localSkills.length}</span>
        </h4>
        {localSkills.length > 0 ? (
          <div className="template-grid">
            {localSkills.slice(0, 20).map((skill) => (
              <article key={`${skill.source}-${skill.name}`}>
                <div>
                  <strong>{skill.title ?? skill.name}</strong>
                  <span className="source-badge" data-source={skill.source}>
                    {skill.source === "claude" ? "Claude Code" : "Codex"}
                  </span>
                </div>
                {skill.description ? <p>{skill.description}</p> : null}
                <small>{skill.name}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-line">
            {locale === "zh-CN" ? "未检测到本地 skill" : "No local skills detected"}
          </p>
        )}
      </section>
    </div>
  );
}

function CrawlCard({
  item,
  locale,
  onInstall,
  installing,
}: {
  item: CrawlItem;
  locale: Locale;
  onInstall: (item: CrawlItem) => Promise<void>;
  installing: boolean;
}) {
  return (
    <article className="crawl-card">
      <div className="crawl-card-head">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          <strong>{item.title}</strong>
          <ExternalLink size={12} aria-hidden="true" />
        </a>
        {item.score != null ? (
          <span className="star-count">
            <Star size={12} aria-hidden="true" /> {item.score}
          </span>
        ) : null}
      </div>
      {item.summary ? <p>{item.summary}</p> : null}
      <div className="crawl-card-footer">
        <small>
          {SOURCE_LABELS[item.source]?.[locale === "zh-CN" ? "zh" : "en"] ?? item.source}
          {item.author ? ` · ${item.author}` : ""}
          {item.relevance != null ? ` · ${Math.round(item.relevance * 100)}%` : ""}
        </small>
        {item.itemType === "Repository" ? (
          <button
            className="install-button"
            type="button"
            disabled={installing}
            onClick={() => void onInstall(item)}
          >
            <Download size={13} aria-hidden="true" />
            <span>{installing
              ? (locale === "zh-CN" ? "安装中" : "Installing")
              : (locale === "zh-CN" ? "安装" : "Install")}</span>
          </button>
        ) : null}
      </div>
    </article>
  );
}
