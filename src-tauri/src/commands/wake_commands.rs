use crate::domain::errors::CommandError;
use crate::domain::wake_control::{WakeControlSummary, WakeMode, WakeSession};
use crate::services::wake_service::{request_wake_mode, wake_control_summary};

#[tauri::command]
pub fn get_wake_control() -> WakeControlSummary {
    wake_control_summary()
}

#[tauri::command]
pub fn request_wake_mode_command(
    mode: WakeMode,
    confirmed: bool,
) -> Result<WakeSession, CommandError> {
    request_wake_mode(mode, confirmed)
}
