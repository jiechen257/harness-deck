use crate::domain::usage::RealUsageSummary;
use crate::services::usage_service;

#[tauri::command]
pub fn get_real_usage_summary() -> RealUsageSummary {
    usage_service::real_usage_summary()
}
