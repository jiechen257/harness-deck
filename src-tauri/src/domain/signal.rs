use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignalCard {
    pub id: String,
    pub title: String,
    pub source_url: Option<String>,
    pub source_tier: String,
    pub signal_type: String,
    pub impact: String,
    pub confidence: String,
    pub excerpt: Option<String>,
    pub published_at: Option<String>,
    pub fetched_at: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewSignalCard {
    pub title: String,
    pub source_url: Option<String>,
    pub source_tier: String,
    pub signal_type: String,
    pub impact: String,
    pub confidence: String,
    pub excerpt: Option<String>,
    pub published_at: Option<String>,
    pub fetched_at: String,
}
