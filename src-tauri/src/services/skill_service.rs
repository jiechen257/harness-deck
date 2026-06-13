use std::collections::HashMap;
use std::fs;
use std::path::Path;

use gray_matter::{engine::YAML, Matter};
use serde::Deserialize;

use crate::db::Database;
use crate::domain::audit::NewAuditEvent;
use crate::domain::byoa::{AgentInvocation, AgentKind};
use crate::domain::errors::CommandError;
use crate::domain::system_skill::{SkillExecutionResult, SystemSkillMeta};
use crate::services::byoa_service;

struct BundledSkill {
    id: &'static str,
    content: &'static str,
}

#[derive(Debug, Deserialize)]
struct SkillFrontmatter {
    id: String,
    version: Option<String>,
    description: Option<String>,
    output_type: Option<String>,
}

const BUNDLED_SKILLS: &[BundledSkill] = &[
    BundledSkill {
        id: "intake-source-research",
        content: include_str!("../../bundled-skills/intake-source-research/SKILL.md"),
    },
    BundledSkill {
        id: "normalize-practice-card",
        content: include_str!("../../bundled-skills/normalize-practice-card/SKILL.md"),
    },
    BundledSkill {
        id: "local-harness-review",
        content: include_str!("../../bundled-skills/local-harness-review/SKILL.md"),
    },
];

pub fn seed_bundled_skills(registry_path: &Path, db: &Database) -> Result<(), CommandError> {
    let system_dir = registry_path.join("system-skills");
    for skill in BUNDLED_SKILLS {
        let skill_dir = system_dir.join(skill.id);
        let skill_file = skill_dir.join("SKILL.md");
        if !skill_file.exists() {
            fs::create_dir_all(&skill_dir)?;
            fs::write(&skill_file, skill.content)?;
        }
        let meta = parse_skill_md(skill.content)?;
        db.upsert_skill_config(skill.id, &meta.version)?;
    }
    Ok(())
}

pub fn list_system_skills(
    registry_path: &Path,
    db: &Database,
) -> Result<Vec<SystemSkillMeta>, CommandError> {
    let mut result = Vec::new();
    for skill in BUNDLED_SKILLS {
        let content = load_skill_content(registry_path, skill.id)?;
        let mut meta = parse_skill_md(&content)?;
        if let Ok(Some(config)) = db.get_skill_config(skill.id) {
            meta.enabled = config.enabled;
        }
        result.push(meta);
    }
    Ok(result)
}

pub fn execute_skill(
    registry_path: &Path,
    db: &Database,
    skill_id: &str,
    variables: &HashMap<String, String>,
    agent_kind: AgentKind,
) -> Result<SkillExecutionResult, CommandError> {
    let config = db.get_skill_config(skill_id)?;
    if let Some(ref c) = config {
        if !c.enabled {
            return Err(CommandError::validation(format!(
                "skill {skill_id} is disabled"
            )));
        }
    }

    let content = load_skill_content(registry_path, skill_id)?;
    let meta = parse_skill_md(&content)?;
    let prompt = render_template(&meta.template, variables);

    let invocation = AgentInvocation {
        kind: agent_kind,
        prompt,
        timeout_secs: 90,
        request_json_output: true,
    };

    let start = std::time::Instant::now();
    let agent_result = byoa_service::invoke_agent(invocation)?;
    let duration_ms = start.elapsed().as_millis() as u64;

    let success = agent_result.exit_code == 0 && !agent_result.timed_out;
    let output_json = if success {
        Some(agent_result.stdout.clone())
    } else {
        None
    };
    let error = if !success {
        Some(if agent_result.timed_out {
            "agent timed out".to_string()
        } else {
            agent_result.stderr.clone()
        })
    } else {
        None
    };

    let exec_result = SkillExecutionResult {
        skill_id: skill_id.to_string(),
        agent_kind: format!("{:?}", agent_kind),
        output_json,
        duration_ms,
        success,
        error,
    };

    let detail = serde_json::to_string(&exec_result).ok();
    let _ = db.insert_audit(&NewAuditEvent {
        event_type: "skill_execution".to_string(),
        entity_type: Some("system_skill".to_string()),
        entity_id: Some(skill_id.to_string()),
        detail,
        outcome: if success { "success" } else { "failure" }.to_string(),
    });

    Ok(exec_result)
}

fn load_skill_content(registry_path: &Path, skill_id: &str) -> Result<String, CommandError> {
    let path = registry_path
        .join("system-skills")
        .join(skill_id)
        .join("SKILL.md");
    if path.exists() {
        return fs::read_to_string(&path).map_err(|e| CommandError::storage(e.to_string()));
    }
    for bundled in BUNDLED_SKILLS {
        if bundled.id == skill_id {
            return Ok(bundled.content.to_string());
        }
    }
    Err(CommandError::validation(format!(
        "skill {skill_id} not found"
    )))
}

pub fn parse_skill_md(content: &str) -> Result<SystemSkillMeta, CommandError> {
    let matter = Matter::<YAML>::new();
    let parsed = matter
        .parse::<SkillFrontmatter>(content.trim())
        .map_err(|e| CommandError::validation(format!("SKILL.md frontmatter parse failed: {e}")))?;
    let frontmatter = parsed
        .data
        .ok_or_else(|| CommandError::validation("SKILL.md missing frontmatter"))?;

    if frontmatter.id.trim().is_empty() {
        return Err(CommandError::validation("SKILL.md frontmatter missing id"));
    }

    Ok(SystemSkillMeta {
        id: frontmatter.id,
        version: frontmatter.version.unwrap_or_default(),
        description: frontmatter.description.unwrap_or_default(),
        output_type: frontmatter.output_type.unwrap_or_default(),
        enabled: true,
        template: parsed.content.trim().to_string(),
    })
}

fn render_template(template: &str, variables: &HashMap<String, String>) -> String {
    let mut result = template.to_string();
    for (key, value) in variables {
        result = result.replace(&format!("{{{{{key}}}}}"), value);
    }
    result
}
