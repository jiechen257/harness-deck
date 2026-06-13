use std::sync::Mutex;

use tauri::State;

use crate::db::Database;
use crate::domain::errors::CommandError;
use crate::domain::ops_script::{OpsScript, OpsScriptExecutionResult, OpsScriptPreview};
use crate::services::operations_service;

#[tauri::command]
pub fn list_ops_scripts(db: State<'_, Mutex<Database>>) -> Result<Vec<OpsScript>, CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    operations_service::list_scripts(&db)
}

#[tauri::command]
pub fn preview_ops_script(
    script_id: String,
    db: State<'_, Mutex<Database>>,
) -> Result<OpsScriptPreview, CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    operations_service::preview_script(&db, &script_id)
}

#[tauri::command]
pub fn confirm_ops_script(
    script_id: String,
    db: State<'_, Mutex<Database>>,
) -> Result<OpsScriptExecutionResult, CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    operations_service::confirm_script(&db, &script_id)
}
