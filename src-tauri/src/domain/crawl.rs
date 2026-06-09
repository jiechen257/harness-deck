use serde::{Deserialize, Serialize};

use crate::domain::byoa::AgentKind;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CrawlSource {
    GitHub,
    HackerNews,
    Reddit,
    LinuxDo,
    Curated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ItemType {
    Repository,
    Discussion,
    Article,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrawlItem {
    pub id: String,
    pub title: String,
    pub url: String,
    pub source: CrawlSource,
    pub item_type: ItemType,
    pub score: Option<u32>,
    pub summary: Option<String>,
    pub author: Option<String>,
    pub created_at: Option<String>,
    pub relevance: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrawlResult {
    pub source: CrawlSource,
    pub items: Vec<CrawlItem>,
    pub crawled_at: String,
    pub filter_keywords: Vec<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrawlSummary {
    pub results: Vec<CrawlResult>,
    pub total_raw: usize,
    pub total_filtered: usize,
    pub total_ranked: usize,
    pub agent_used: Option<AgentKind>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TargetInfo {
    pub kind: String,
    pub display_name: String,
    pub available: bool,
    pub skills_count: usize,
    pub config_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InstallTarget {
    ClaudeCode,
    Codex,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InstallAction {
    CopySkill,
    AppendRule,
    AddMcpServer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallRequest {
    pub source_url: String,
    pub target: InstallTarget,
    pub action: InstallAction,
    pub skill_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallResult {
    pub success: bool,
    pub target: InstallTarget,
    pub installed_path: String,
    pub message: String,
}
