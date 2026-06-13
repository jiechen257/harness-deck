use crate::domain::insights::RealInsight;
use crate::services::insight_service;

#[tauri::command]
pub fn list_real_insights() -> Vec<RealInsight> {
    insight_service::real_insights()
}
