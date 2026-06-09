use crate::domain::usage::{RealUsageSummary, UsageSummary};
use crate::services::usage_service::{local_usage_summary, real_usage_summary};

#[tauri::command]
pub fn get_usage_summary() -> UsageSummary {
    local_usage_summary()
}

#[tauri::command]
pub fn get_real_usage_summary() -> RealUsageSummary {
    real_usage_summary()
}
