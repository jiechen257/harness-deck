use crate::domain::insights::{FeedItem, Insight, RealInsight};
use crate::services::insight_service::{high_priority_feed, local_feed, local_insights, real_insights};

#[tauri::command]
pub fn list_insights() -> Vec<Insight> {
    local_insights()
}

#[tauri::command]
pub fn list_feed_items() -> Vec<FeedItem> {
    local_feed()
}

#[tauri::command]
pub fn list_high_priority_feed() -> Vec<FeedItem> {
    high_priority_feed()
}

#[tauri::command]
pub fn list_real_insights() -> Vec<RealInsight> {
    real_insights()
}
