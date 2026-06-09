use crate::domain::registry::{FindBestSkillResult, LocalSkillEntry, RegistrySkillTemplate};
use crate::services::registry_service::{
    curated_registry_templates, find_best_skill as score_best_skill, local_skill_registry,
};

#[tauri::command]
pub fn list_registry_templates() -> Vec<RegistrySkillTemplate> {
    curated_registry_templates()
}

#[tauri::command]
pub fn list_local_skills() -> Vec<LocalSkillEntry> {
    let skills = local_skill_registry();
    if skills.is_empty() {
        // Fallback: convert curated templates to LocalSkillEntry format
        curated_registry_templates()
            .into_iter()
            .map(|t| LocalSkillEntry {
                name: t.id,
                title: Some(t.name),
                description: Some(t.description),
                source: t.source,
                path: String::new(),
            })
            .collect()
    } else {
        skills
    }
}

#[tauri::command]
pub fn find_best_skill(task: String, allow_github_discovery: bool) -> FindBestSkillResult {
    score_best_skill(&task, allow_github_discovery)
}
