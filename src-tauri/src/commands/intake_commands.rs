use std::sync::Mutex;

use tauri::State;

use crate::db::Database;
use crate::domain::errors::CommandError;
use crate::domain::source_config::SourceConfig;
use crate::services::intake_service;

#[tauri::command]
pub fn refresh_signals(
    source_id: Option<String>,
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<String>, CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    match source_id {
        Some(id) => intake_service::refresh_source(&db, &id),
        None => intake_service::refresh_all_enabled(&db),
    }
}

#[tauri::command]
pub fn list_signal_sources(
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<SourceConfig>, CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    db.list_source_configs()
}

#[tauri::command]
pub fn toggle_signal_source(
    source_id: String,
    enabled: bool,
    db: State<'_, Mutex<Database>>,
) -> Result<(), CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    db.set_source_enabled(&source_id, enabled)
}

#[tauri::command]
pub fn toggle_auto_refresh(
    source_id: String,
    auto_refresh: bool,
    db: State<'_, Mutex<Database>>,
) -> Result<(), CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    db.set_source_auto_refresh(&source_id, auto_refresh)
}
