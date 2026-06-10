use std::collections::HashMap;
use std::sync::Mutex;

use tauri::State;

use crate::db::Database;
use crate::domain::byoa::AgentKind;
use crate::domain::errors::CommandError;
use crate::domain::system_skill::{SkillExecutionResult, SystemSkillMeta};
use crate::services::skill_service;

#[tauri::command]
pub fn list_system_skills(
    registry_path: String,
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<SystemSkillMeta>, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    skill_service::list_system_skills(std::path::Path::new(&registry_path), &db)
}

#[tauri::command]
pub fn execute_system_skill(
    registry_path: String,
    skill_id: String,
    variables: HashMap<String, String>,
    agent_kind: String,
    db: State<'_, Mutex<Database>>,
) -> Result<SkillExecutionResult, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    let kind = match agent_kind.as_str() {
        "Codex" => AgentKind::Codex,
        _ => AgentKind::Claude,
    };
    skill_service::execute_skill(
        std::path::Path::new(&registry_path),
        &db,
        &skill_id,
        &variables,
        kind,
    )
}

#[tauri::command]
pub fn toggle_system_skill(
    skill_id: String,
    enabled: bool,
    db: State<'_, Mutex<Database>>,
) -> Result<(), CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.set_skill_enabled(&skill_id, enabled)
}
