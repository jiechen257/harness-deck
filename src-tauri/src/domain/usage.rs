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
