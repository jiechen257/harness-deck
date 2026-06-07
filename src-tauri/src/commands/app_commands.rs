use tauri::{AppHandle, Manager};

use crate::domain::app::AppStatus;
use crate::domain::errors::CommandError;
use crate::services::app_paths::{paths_for_app, HarnessDeckPaths};

#[tauri::command]
pub fn get_app_status() -> AppStatus {
    AppStatus::phase_zero()
}

#[tauri::command]
pub fn get_app_paths(app: AppHandle) -> Result<HarnessDeckPaths, CommandError> {
    let paths = paths_for_app(&app)?;
    paths.ensure()?;
    Ok(paths)
}

#[tauri::command]
pub fn open_workbench(app: AppHandle) -> Result<bool, CommandError> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }

    Ok(true)
}
