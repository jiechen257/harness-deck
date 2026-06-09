use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DataConfidence {
    Official,
    LocalLog,
    Estimated,
    Missing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageMetric {
    pub id: String,
    pub label: String,
    pub value: String,
    pub unit: String,
    pub confidence: DataConfidence,
    pub confidence_label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageSummary {
    pub window_hours: u32,
    pub total_tokens: u64,
    pub cost_usd: f64,
    pub duration_minutes: u32,
    pub drift_events: u32,
    pub burn_rate_usd_per_hour: f64,
    pub metrics: Vec<UsageMetric>,
}

// ---- Real data types ----

/// Info about a data source used in the real usage summary.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSourceInfo {
    pub name: String,
    pub path: String,
    pub available: bool,
}

/// A single day of activity for the real usage summary.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyActivityEntry {
    pub date: String,
    pub sessions: u32,
    pub messages: u32,
    pub tool_calls: u32,
}

/// Per-model usage for the real usage summary.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelUsageItem {
    pub model: String,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cache_read_tokens: u64,
    pub cost_usd: f64,
}

/// Summary of a single Codex thread for the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexThreadItem {
    pub id: String,
    pub title: Option<String>,
    pub created_at: String,
    pub model: Option<String>,
    pub tokens_used: Option<u64>,
    pub cwd: Option<String>,
}

/// Aggregated real usage data from local Claude Code and Codex sources.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RealUsageSummary {
    pub total_sessions: u32,
    pub total_messages: u32,
    pub total_cost_usd: f64,
    pub total_tokens: u64,
    pub window_hours: f64,
    pub burn_rate_per_hour: f64,
    pub drift_events: u32,
    pub daily_activity: Vec<DailyActivityEntry>,
    pub model_usage: Vec<ModelUsageItem>,
    pub codex_thread_count: u32,
    pub codex_recent_threads: Vec<CodexThreadItem>,
    pub data_sources: Vec<DataSourceInfo>,
    pub longest_session_minutes: Option<f64>,
}
