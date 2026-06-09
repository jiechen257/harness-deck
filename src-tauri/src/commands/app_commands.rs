use tauri::{AppHandle, Manager};

use crate::domain::app::AppStatus;
use crate::domain::errors::CommandError;
use crate::services::account_service::compute_health_score;
use crate::services::app_paths::{paths_for_app, HarnessDeckPaths};

#[tauri::command]
pub fn get_app_status() -> AppStatus {
    let mut status = AppStatus::phase_zero();
    let (score, factors) = compute_health_score();
    status.health_score = score;
    status.health_factors = factors;
    status
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
