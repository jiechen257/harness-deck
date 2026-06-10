use std::sync::Mutex;

use tauri::State;

use crate::db::Database;
use crate::domain::errors::CommandError;
use crate::domain::projection_plan::*;
use crate::services::projection_service;

#[tauri::command]
pub fn preview_projection(
    registry_path: String,
    target_path: String,
    target_kind: String,
    db: State<'_, Mutex<Database>>,
) -> Result<ProjectionPlan, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    projection_service::plan_projection(
        &db,
        std::path::Path::new(&registry_path),
        std::path::Path::new(&target_path),
        &target_kind,
    )
}

#[tauri::command]
pub fn confirm_projection(
    registry_path: String,
    target_path: String,
    target_kind: String,
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<String>, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    let plan = projection_service::plan_projection(
        &db,
        std::path::Path::new(&registry_path),
        std::path::Path::new(&target_path),
        &target_kind,
    )?;
    projection_service::execute_projection(&db, std::path::Path::new(&registry_path), &plan)
}

#[tauri::command]
pub fn adopt_asset(
    target_path: String,
    registry_path: String,
    registry_dest: String,
    asset_type: String,
    backup_path: String,
    target_kind: String,
    db: State<'_, Mutex<Database>>,
) -> Result<AdoptResult, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    projection_service::adopt_unmanaged(
        &db,
        std::path::Path::new(&target_path),
        std::path::Path::new(&registry_path),
        &registry_dest,
        &asset_type,
        std::path::Path::new(&backup_path),
        &target_kind,
    )
}

#[tauri::command]
pub fn rollback_projection(
    projection_id: String,
    db: State<'_, Mutex<Database>>,
) -> Result<(), CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    projection_service::rollback_projection(&db, &projection_id)
}

#[tauri::command]
pub fn check_projection_health(
    target_kind: String,
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<HealthFinding>, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    projection_service::check_health(&db, &target_kind)
}
