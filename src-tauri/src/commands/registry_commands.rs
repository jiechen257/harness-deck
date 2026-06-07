use crate::domain::registry::{FindBestSkillResult, RegistrySkillTemplate};
use crate::services::registry_service::{
    curated_registry_templates, find_best_skill as score_best_skill,
};

#[tauri::command]
pub fn list_registry_templates() -> Vec<RegistrySkillTemplate> {
    curated_registry_templates()
}

#[tauri::command]
pub fn find_best_skill(task: String, allow_github_discovery: bool) -> FindBestSkillResult {
    score_best_skill(&task, allow_github_discovery)
}
