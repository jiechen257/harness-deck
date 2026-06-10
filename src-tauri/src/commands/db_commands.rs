use std::sync::Mutex;

use tauri::State;

use crate::db::Database;
use crate::domain::auth_state::AuthorizationEntry;
use crate::domain::audit::AuditEvent;
use crate::domain::registry_connection::{RegistryConnection, NewRegistryConnection};
use crate::domain::signal::SignalCard;
use crate::domain::errors::CommandError;

#[tauri::command]
pub fn get_authorization_state(
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<AuthorizationEntry>, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.get_all_authorizations()
}

#[tauri::command]
pub fn grant_authorization(
    scope: String,
    db: State<'_, Mutex<Database>>,
) -> Result<(), CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.grant_authorization(&scope)
}

#[tauri::command]
pub fn revoke_authorization(
    scope: String,
    db: State<'_, Mutex<Database>>,
) -> Result<(), CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.revoke_authorization(&scope)
}

#[tauri::command]
pub fn get_active_registry(
    db: State<'_, Mutex<Database>>,
) -> Result<Option<RegistryConnection>, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.get_active_registry()
}

#[tauri::command]
pub fn set_registry_connection(
    path: String,
    registry_type: String,
    db: State<'_, Mutex<Database>>,
) -> Result<RegistryConnection, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.insert_registry(&NewRegistryConnection { path, registry_type })
}

#[tauri::command]
pub fn list_signals(
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<SignalCard>, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.list_signals()
}

#[tauri::command]
pub fn list_audit_events(
    limit: Option<u32>,
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<AuditEvent>, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.list_recent_audits(limit.unwrap_or(50))
}
