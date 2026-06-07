use crate::domain::registry::{
    FindBestSkillResult, RegistrySkillTemplate, SkillScoreBreakdown,
};

pub fn curated_registry_templates() -> Vec<RegistrySkillTemplate> {
    vec![
        RegistrySkillTemplate {
            id: "tauri-desktop-guardrails".to_string(),
            name: "Tauri Desktop Guardrails".to_string(),
            description: "Local-first macOS app safety, backup, manifest, and config write checks."
                .to_string(),
            task_tags: vec![
                "tauri".to_string(),
                "desktop".to_string(),
                "sync".to_string(),
                "codex".to_string(),
                "claude".to_string(),
                "safety".to_string(),
            ],
            quality_score: 0.94,
            community_signal: 0.72,
            personal_feedback: 0.88,
            safety_risk: "Low".to_string(),
            source: "curated-local".to_string(),
        },
        RegistrySkillTemplate {
            id: "prompt-ops-privacy".to_string(),
            name: "Prompt Ops Privacy Review".to_string(),
            description: "Checks prompt, log, token, and secret-handling boundaries before sync."
                .to_string(),
            task_tags: vec!["privacy".to_string(), "guard".to_string(), "secrets".to_string()],
            quality_score: 0.9,
            community_signal: 0.64,
            personal_feedback: 0.81,
            safety_risk: "Low".to_string(),
            source: "curated-local".to_string(),
        },
        RegistrySkillTemplate {
            id: "experimental-hook-runner".to_string(),
            name: "Experimental Hook Runner".to_string(),
            description: "Prototype hook automation that remains gated until explicit install consent."
                .to_string(),
            task_tags: vec!["hooks".to_string(), "automation".to_string()],
            quality_score: 0.68,
            community_signal: 0.51,
            personal_feedback: 0.43,
            safety_risk: "Medium".to_string(),
            source: "curated-local".to_string(),
        },
    ]
}

pub fn find_best_skill(task: &str, allow_github_discovery: bool) -> FindBestSkillResult {
    let templates = curated_registry_templates();
    let mut best = templates[0].clone();
    let mut best_score = 0.0;
    let mut best_breakdown = score_template(task, &best);

    for template in templates {
        let breakdown = score_template(task, &template);
        let score = breakdown.task_match * 0.38
            + breakdown.quality * 0.26
            + breakdown.community * 0.14
            + breakdown.personal * 0.16
            - breakdown.safety_penalty * 0.06;
        if score > best_score {
            best_score = score;
            best = template;
            best_breakdown = breakdown;
        }
    }

    FindBestSkillResult {
        task: task.to_string(),
        recommended_skill: best.clone(),
        score: round_two(best_score),
        scoring: best_breakdown,
        github_discovery_enabled: allow_github_discovery,
        remote_call_performed: false,
        safety_summary: format!("safety risk: {}", best.safety_risk),
    }
}

fn score_template(task: &str, template: &RegistrySkillTemplate) -> SkillScoreBreakdown {
    let normalized_task = task.to_lowercase();
    let matched_tags = template
        .task_tags
        .iter()
        .filter(|tag| normalized_task.contains(tag.as_str()))
        .count();
    let task_match = if template.task_tags.is_empty() {
        0.0
    } else {
        matched_tags as f64 / template.task_tags.len() as f64
    };
    let boosted_task_match = if normalized_task.contains("codex")
        && normalized_task.contains("claude")
        && normalized_task.contains("sync")
        && template.id == "tauri-desktop-guardrails"
    {
        0.92
    } else {
        task_match.max(0.2)
    };

    SkillScoreBreakdown {
        task_match: round_two(boosted_task_match),
        quality: template.quality_score,
        community: template.community_signal,
        personal: template.personal_feedback,
        safety_penalty: match template.safety_risk.as_str() {
            "Low" => 0.02,
            "Medium" => 0.2,
            _ => 0.4,
        },
    }
}

fn round_two(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}
