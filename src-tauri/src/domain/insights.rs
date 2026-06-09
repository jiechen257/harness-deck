use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Insight {
    pub id: String,
    pub title: String,
    pub summary: String,
    pub severity: String,
    pub related_profile_id: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FeedItem {
    pub id: String,
    pub title: String,
    pub summary: String,
    pub priority: String,
    pub source: String,
    pub profile_impact: bool,
}

// ---- Real insight types ----

/// Category of a real insight derived from local data analysis.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RealInsightCategory {
    TokenAnomaly,
    SessionActivity,
    ModelConcentration,
}

/// An insight generated from real local data rather than fixtures.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RealInsight {
    pub id: String,
    pub category: RealInsightCategory,
    pub title: String,
    pub summary: String,
    pub severity: String,
    pub evidence: String,
    pub source: String,
}
