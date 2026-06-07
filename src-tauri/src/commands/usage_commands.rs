use crate::domain::usage::UsageSummary;
use crate::services::usage_service::local_usage_summary;

#[tauri::command]
pub fn get_usage_summary() -> UsageSummary {
    local_usage_summary()
}
