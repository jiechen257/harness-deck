import { useState } from "react";

import type { FindBestSkillResult, LocalSkillEntry, Locale, RegistrySkillTemplate } from "../../lib/types";

const INITIAL_DISPLAY_COUNT = 20;

interface DiscoverViewProps {
  locale: Locale;
  localSkills: LocalSkillEntry[];
  registryTemplates: RegistrySkillTemplate[];
  skillRecommendation: FindBestSkillResult | null;
}

export function DiscoverView({ locale, localSkills, registryTemplates, skillRecommendation }: DiscoverViewProps) {
  const [showAll, setShowAll] = useState(false);

  const hasLocalSkills = localSkills.length > 0;
  const displayedSkills = showAll ? localSkills : localSkills.slice(0, INITIAL_DISPLAY_COUNT);
  const hiddenCount = localSkills.length - INITIAL_DISPLAY_COUNT;
  const claudeCount = localSkills.filter((s) => s.source === "claude").length;
  const codexCount = localSkills.filter((s) => s.source === "codex").length;

  return (
    <div className="registry-workbench">
      <section className="registry-hero">
        <div>
          <h3>{locale === "zh-CN" ? "注册表与技能推荐" : "Registry and find-best-skill"}</h3>
          <p>
            {hasLocalSkills
              ? (locale === "zh-CN"
                ? `已扫描到 ${localSkills.length} 个本地技能（Claude ${claudeCount}、Codex ${codexCount}）`
                : `Found ${localSkills.length} local skills (Claude ${claudeCount}, Codex ${codexCount})`)
              : (locale === "zh-CN"
                ? "优先使用本地注册表；GitHub 发现功能需授权且不会自动调用。"
                : "Curated local registry first; GitHub discovery is gated and never called automatically.")}
          </p>
        </div>
        <span className="status-pill">{locale === "zh-CN" ? "未执行远程调用" : "Remote call not performed"}</span>
      </section>

      {hasLocalSkills ? (
        <>
          <div className="template-grid">
            {displayedSkills.map((skill) => (
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

          {!showAll && hiddenCount > 0 ? (
            <button
              className="show-all-toggle"
              type="button"
              onClick={() => setShowAll(true)}
            >
              {locale === "zh-CN"
                ? `显示全部（还有 ${hiddenCount} 个）`
                : `Show all (${hiddenCount} more)`}
            </button>
          ) : null}
        </>
      ) : (
        <div className="template-grid">
          {registryTemplates.map((template) => (
            <article key={template.id}>
              <div>
                <strong>{template.name}</strong>
                <span>{template.source}</span>
              </div>
              <p>{template.description}</p>
              <small>{locale === "zh-CN" ? "风险" : "risk"} {template.safetyRisk}</small>
            </article>
          ))}
        </div>
      )}

      {skillRecommendation ? (
        <section className="skill-recommendation">
          <div>
            <span>{locale === "zh-CN" ? "推荐" : "Recommended"}</span>
            <strong>{locale === "zh-CN" ? "推荐技能：" : "Recommended skill: "}{skillRecommendation.recommendedSkill.name}</strong>
            <p>{skillRecommendation.task}</p>
          </div>
          <div className="score-board">
            <span>{Math.round(skillRecommendation.score * 100)} {locale === "zh-CN" ? "评分" : "score"}</span>
            <span>{skillRecommendation.safetySummary}</span>
            <span>{skillRecommendation.githubDiscoveryEnabled ? (locale === "zh-CN" ? "GitHub 发现已管控" : "GitHub discovery gated") : (locale === "zh-CN" ? "GitHub 发现已关闭" : "GitHub discovery off")}</span>
          </div>
        </section>
      ) : null}
    </div>
  );
}
