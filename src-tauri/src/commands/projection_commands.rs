use std::path::PathBuf;
use std::sync::Mutex;

use tauri::State;

use crate::db::Database;
use crate::domain::errors::CommandError;
use crate::domain::projection::Projection;
use crate::domain::projection_plan::*;
use crate::services::projection_service;

fn expand_user_path(path: &str) -> PathBuf {
    if path == "~" {
        return dirs::home_dir().unwrap_or_else(|| PathBuf::from(path));
    }
    if let Some(rest) = path.strip_prefix("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(rest);
        }
    }
    PathBuf::from(path)
}

fn default_target_path(target_kind: &str) -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    match target_kind {
        "claude_code" => home.join(".claude").join("skills"),
        "codex" => home.join(".codex").join("skills"),
        _ => home.join(".hone").join("skills"),
    }
}

#[tauri::command]
pub fn list_projection_targets() -> Result<Vec<ProjectionTarget>, CommandError> {
    let targets = [
        ("claude_code", "Claude Code", true),
        ("codex", "Codex", true),
    ];
    Ok(targets
        .into_iter()
        .map(|(target_kind, label, recommended)| {
            let path = default_target_path(target_kind);
            ProjectionTarget {
                target_kind: target_kind.to_string(),
                label: label.to_string(),
                target_path: path.to_string_lossy().to_string(),
                exists: path.exists(),
                recommended,
            }
        })
        .collect())
}

#[tauri::command]
pub fn list_adapter_capabilities() -> Result<Vec<AdapterCapability>, CommandError> {
    Ok(projection_service::adapter_capabilities())
}

#[tauri::command]
pub fn list_projections(
    target_kind: Option<String>,
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<Projection>, CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    let projections = db.list_projections()?;
    Ok(match target_kind {
        Some(kind) => projections
            .into_iter()
            .filter(|projection| projection.target_kind == kind)
            .collect(),
        None => projections,
    })
}

#[tauri::command]
pub fn list_drift_timeline(
    target_kind: String,
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<DriftTimelineItem>, CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    projection_service::drift_timeline(&db, &target_kind)
}

#[tauri::command]
pub fn preview_asset_diff(
    registry_path: String,
    registry_asset_path: String,
    target_path: String,
) -> Result<DiffPayload, CommandError> {
    let registry_path = expand_user_path(&registry_path);
    let target_path = expand_user_path(&target_path);
    Ok(projection_service::preview_diff(
        registry_path.as_path(),
        &registry_asset_path,
        target_path.as_path(),
    ))
}

#[tauri::command]
pub fn preview_projection(
    registry_path: String,
    target_path: String,
    target_kind: String,
    db: State<'_, Mutex<Database>>,
) -> Result<ProjectionPlan, CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    let registry_path = expand_user_path(&registry_path);
    let target_path = expand_user_path(&target_path);
    projection_service::plan_projection(
        &db,
        registry_path.as_path(),
        target_path.as_path(),
        &target_kind,
    )
}

#[tauri::command]
pub fn confirm_projection(
    registry_path: String,
    target_path: String,
    target_kind: String,
    db: State<'_, Mutex<Database>>,
) -> Result<ProjectionExecutionResult, CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    let registry_path = expand_user_path(&registry_path);
    let target_path = expand_user_path(&target_path);
    let plan = projection_service::plan_projection(
        &db,
        registry_path.as_path(),
        target_path.as_path(),
        &target_kind,
    )?;
    let skipped = plan.skips;
    let conflicts = plan.conflicts;
    let executed_projection_ids =
        projection_service::execute_projection(&db, registry_path.as_path(), &plan)?;
    Ok(ProjectionExecutionResult {
        target_kind,
        executed_projection_ids,
        skipped,
        conflicts,
    })
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
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    let target_path = expand_user_path(&target_path);
    let registry_path = expand_user_path(&registry_path);
    let backup_path = expand_user_path(&backup_path);
    projection_service::adopt_unmanaged(
        &db,
        target_path.as_path(),
        registry_path.as_path(),
        &registry_dest,
        &asset_type,
        backup_path.as_path(),
        &target_kind,
    )
}

#[tauri::command]
pub fn rollback_projection(
    projection_id: String,
    db: State<'_, Mutex<Database>>,
) -> Result<(), CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    projection_service::rollback_projection(&db, &projection_id)
}

#[tauri::command]
pub fn check_projection_health(
    target_kind: String,
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<HealthFinding>, CommandError> {
    let db = db
        .lock()
        .map_err(|e| CommandError::storage(e.to_string()))?;
    projection_service::check_health(&db, &target_kind)
}
