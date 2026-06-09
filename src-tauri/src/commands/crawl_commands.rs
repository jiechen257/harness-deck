use crate::domain::byoa::AgentKind;
use crate::domain::crawl::{CrawlItem, CrawlSummary, InstallRequest, InstallResult, TargetInfo};
use crate::domain::errors::CommandError;
use crate::services::{crawl_service, install_service, target_adapter};

#[tauri::command]
pub async fn crawl_all_sources(
    custom_keywords: Option<Vec<String>>,
) -> Result<CrawlSummary, CommandError> {
    crawl_service::crawl_all(custom_keywords).await
}

#[tauri::command]
pub async fn rank_crawl_results(
    items: Vec<CrawlItem>,
    agent_kind: AgentKind,
) -> Result<Vec<CrawlItem>, CommandError> {
    crawl_service::rank_with_agent(items, agent_kind).await
}

#[tauri::command]
pub fn install_skill_command(
    request: InstallRequest,
) -> Result<InstallResult, CommandError> {
    install_service::install_skill(request)
}

#[tauri::command]
pub fn list_available_targets() -> Vec<TargetInfo> {
    target_adapter::all_adapters()
        .iter()
        .map(|adapter| TargetInfo {
            kind: adapter.kind().to_string(),
            display_name: adapter.display_name().to_string(),
            available: adapter.is_available(),
            skills_count: adapter.list_installed_skills().len(),
            config_path: adapter.config_dir().map(|p| p.to_string_lossy().to_string()),
        })
        .collect()
}
