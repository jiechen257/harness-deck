use crate::domain::byoa::AgentKind;
use crate::domain::crawl::{CrawlItem, CrawlSummary, InstallRequest, InstallResult};
use crate::domain::errors::CommandError;
use crate::services::{crawl_service, install_service};

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
