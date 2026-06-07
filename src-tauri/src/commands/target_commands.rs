use crate::domain::adapter::TargetSummary;
use crate::domain::errors::CommandError;
use crate::domain::target_integration::TargetDiscoverySummary;
use crate::services::adapter_service::list_fixture_targets;
use crate::services::target_integration_service::discover_real_targets;

#[tauri::command]
pub fn list_targets() -> Vec<TargetSummary> {
    list_fixture_targets()
}

#[tauri::command]
pub fn discover_targets(
    authorized_for_local_read: bool,
) -> Result<Vec<TargetDiscoverySummary>, CommandError> {
    discover_real_targets(authorized_for_local_read)
}
