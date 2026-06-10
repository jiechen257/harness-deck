use tauri::{AppHandle, Manager};

use crate::domain::app::AppStatus;
use crate::domain::errors::CommandError;

#[tauri::command]
pub fn get_app_status() -> AppStatus {
    AppStatus::phase_zero()
}

#[tauri::command]
pub fn open_workbench(app: AppHandle) -> Result<bool, CommandError> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
    Ok(true)
}
