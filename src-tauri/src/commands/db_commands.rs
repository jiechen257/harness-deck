use std::sync::Mutex;
use std::path::PathBuf;

use tauri::State;

use crate::db::Database;
use crate::domain::auth_state::AuthorizationEntry;
use crate::domain::audit::AuditEvent;
use crate::domain::registry_connection::{RegistryCandidate, RegistryConnection, NewRegistryConnection};
use crate::domain::signal::SignalCard;
use crate::domain::errors::CommandError;

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

fn registry_candidate(path: PathBuf, registry_type: &str, active: bool, read_only: bool, reason: &str) -> RegistryCandidate {
    let exists = path.exists();
    let writable = exists && std::fs::metadata(&path)
        .map(|metadata| !metadata.permissions().readonly())
        .unwrap_or(false);
    RegistryCandidate {
        path: path.to_string_lossy().to_string(),
        registry_type: registry_type.into(),
        exists,
        writable,
        read_only,
        active,
        reason: reason.into(),
    }
}

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
pub fn detect_registry_candidates(
    db: State<'_, Mutex<Database>>,
) -> Result<Vec<RegistryCandidate>, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    let active = db.get_active_registry()?;
    let mut candidates = Vec::new();

    if let Some(active_registry) = active.as_ref() {
        candidates.push(registry_candidate(
            expand_user_path(&active_registry.path),
            &active_registry.registry_type,
            true,
            active_registry.registry_type == "starter",
            "saved active registry",
        ));
    }

    let known = PathBuf::from("/Users/zhici/work-pro/my-agent-skill");
    let known_string = known.to_string_lossy().to_string();
    if active.as_ref().map(|r| r.path.as_str()) != Some(known_string.as_str()) {
        candidates.push(registry_candidate(
            known,
            "user",
            false,
            false,
            "known local registry candidate",
        ));
    }

    let home_registry = expand_user_path("~/HoneRegistry");
    candidates.push(registry_candidate(
        home_registry,
        "initialized",
        false,
        false,
        "default Hone registry location",
    ));

    candidates.push(RegistryCandidate {
        path: "starter://bundled".into(),
        registry_type: "starter".into(),
        exists: true,
        writable: false,
        read_only: true,
        active: active.as_ref().map(|r| r.path == "starter://bundled").unwrap_or(false),
        reason: "bundled starter registry read-only fallback".into(),
    });

    Ok(candidates)
}

#[tauri::command]
pub fn initialize_registry(
    path: String,
    db: State<'_, Mutex<Database>>,
) -> Result<RegistryConnection, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    let registry_path = expand_user_path(&path);
    for child in ["system-skills", "rules", "hooks", "mcp", "profiles"] {
        std::fs::create_dir_all(registry_path.join(child))?;
    }
    let readme = registry_path.join("README.md");
    if !readme.exists() {
        std::fs::write(&readme, "# Hone Registry\n\nLocal harness assets managed by Hone.\n")?;
    }
    db.insert_registry(&NewRegistryConnection {
        path: registry_path.to_string_lossy().to_string(),
        registry_type: "initialized".into(),
    })
}

#[tauri::command]
pub fn use_starter_registry_readonly(
    db: State<'_, Mutex<Database>>,
) -> Result<RegistryConnection, CommandError> {
    let db = db.lock().map_err(|e| CommandError::storage(e.to_string()))?;
    db.insert_registry(&NewRegistryConnection {
        path: "starter://bundled".into(),
        registry_type: "starter".into(),
    })
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
