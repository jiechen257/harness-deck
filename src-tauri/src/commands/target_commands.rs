use crate::domain::adapter::TargetSummary;
use crate::services::adapter_service::list_fixture_targets;

#[tauri::command]
pub fn list_targets() -> Vec<TargetSummary> {
    list_fixture_targets()
}
