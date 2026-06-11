use std::sync::Mutex;

use tauri::State;

use crate::db::Database;
use crate::domain::byoa::AgentKind;
use crate::domain::errors::CommandError;
use crate::domain::local_asset::LocalAsset;
use crate::domain::loop_summary::LoopSummary;
use crate::domain::practice::{NormalizeResult, PracticeCard, PracticeDraft};
use crate::services::loop_service;

#[tauri::command]
pub fn list_practices(
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<PracticeCard>, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.list_practices()
}

#[tauri::command]
pub fn list_local_assets(
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<LocalAsset>, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.list_assets()
}

#[tauri::command]
pub fn get_loop_summary(
    db: State<'_, Mutex<Database>>,
) -> Result<LoopSummary, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    loop_service::get_loop_summary(&db)
}

#[tauri::command]
pub fn normalize_signal(
    signal_id: String,
    agent_kind: Option<String>,
    db: State<'_, Mutex<Database>>,
) -> Result<NormalizeResult, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    let kind = match agent_kind.as_deref() {
        Some("Codex") => AgentKind::Codex,
        _ => AgentKind::Claude,
    };
    loop_service::normalize_signal(&db, &signal_id, kind)
}

#[tauri::command]
pub fn create_practice_from_signal(
    signal_id: String,
    draft: PracticeDraft,
    db: State<'_, Mutex<Database>>,
) -> Result<PracticeCard, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    loop_service::create_practice_from_signal(&db, &signal_id, draft)
}

#[tauri::command]
pub fn create_local_asset_from_practice(
    practice_id: String,
    asset_type: String,
    registry_path: String,
    is_system: Option<bool>,
    db: State<'_, Mutex<Database>>,
) -> Result<LocalAsset, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    loop_service::create_local_asset_from_practice(
        &db,
        &practice_id,
        &asset_type,
        &registry_path,
        is_system.unwrap_or(false),
    )
}
