use tauri::AppHandle;

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
pub fn open_workbench() -> Result<bool, CommandError> {
    Ok(true)
}
