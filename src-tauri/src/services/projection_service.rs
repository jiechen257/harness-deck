use std::fs;
use std::path::{Path, PathBuf};

use crate::db::Database;
use crate::domain::audit::NewAuditEvent;
use crate::domain::errors::CommandError;
use crate::domain::local_asset::NewLocalAsset;
use crate::domain::projection::NewProjection;
use crate::domain::projection_plan::*;

pub fn plan_projection(
    db: &Database,
    registry_root: &Path,
    target_root: &Path,
    target_kind: &str,
) -> Result<ProjectionPlan, CommandError> {
    let assets = db.list_assets()?;
    let mut actions = Vec::new();

    for asset in &assets {
        let source = registry_root.join(&asset.registry_path);
        if !source.exists() {
            continue;
        }

        let name = Path::new(&asset.registry_path)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| asset.id.clone());

        let target = target_root.join(&name);
        let mode = ProjectionMode::Symlink;

        let (action, conflict_reason) = if target.exists() || target.symlink_metadata().is_ok() {
            if target.symlink_metadata().map(|m| m.file_type().is_symlink()).unwrap_or(false) {
                let link_target = fs::read_link(&target).ok();
                if link_target.as_deref() == Some(source.as_path()) {
                    (ActionType::Skip, Some("symlink already points to registry source".into()))
                } else {
                    (ActionType::Update, None)
                }
            } else {
                (ActionType::Conflict, Some("target exists as regular file/directory, not managed by Hone".into()))
            }
        } else {
            (ActionType::Create, None)
        };

        let existing_projections = db.list_projections_by_asset(&asset.id)?;
        let has_projection_for_target = existing_projections.iter()
            .any(|p| p.target_kind == target_kind && p.status != "removed");

        let final_action = if has_projection_for_target && action == ActionType::Create {
            ActionType::Skip
        } else {
            action
        };

        actions.push(ProjectionAction {
            asset_id: asset.id.clone(),
            asset_name: name,
            registry_path: asset.registry_path.clone(),
            target_path: target.to_string_lossy().to_string(),
            mode,
            action: final_action,
            conflict_reason,
        });
    }

    let creates = actions.iter().filter(|a| a.action == ActionType::Create).count();
    let updates = actions.iter().filter(|a| a.action == ActionType::Update).count();
    let skips = actions.iter().filter(|a| a.action == ActionType::Skip).count();
    let conflicts = actions.iter().filter(|a| a.action == ActionType::Conflict).count();

    Ok(ProjectionPlan {
        target_kind: target_kind.to_string(),
        actions,
        creates,
        updates,
        skips,
        conflicts,
    })
}

pub fn execute_projection(
    db: &Database,
    registry_root: &Path,
    plan: &ProjectionPlan,
) -> Result<Vec<String>, CommandError> {
    let mut executed = Vec::new();

    for action in &plan.actions {
        match action.action {
            ActionType::Create | ActionType::Update => {
                let source = registry_root.join(&action.registry_path);
                let target = PathBuf::from(&action.target_path);

                if action.action == ActionType::Update {
                    if let Ok(meta) = target.symlink_metadata() {
                        if meta.file_type().is_symlink() {
                            fs::remove_file(&target)?;
                        }
                    }
                }

                if let Some(parent) = target.parent() {
                    fs::create_dir_all(parent)?;
                }

                #[cfg(unix)]
                std::os::unix::fs::symlink(&source, &target)?;
                #[cfg(not(unix))]
                fs::copy(&source, &target)?;

                let projection = db.insert_projection(&NewProjection {
                    asset_id: action.asset_id.clone(),
                    target_kind: plan.target_kind.clone(),
                    target_path: action.target_path.clone(),
                    mode: "symlink".to_string(),
                })?;

                db.update_projection_status(&projection.id, "active")?;

                let _ = db.insert_audit(&NewAuditEvent {
                    event_type: "projection_executed".to_string(),
                    entity_type: Some("projection".to_string()),
                    entity_id: Some(projection.id.clone()),
                    detail: Some(format!("{{\"action\":\"{:?}\",\"target\":\"{}\"}}", action.action, action.target_path)),
                    outcome: "success".to_string(),
                });

                executed.push(projection.id);
            }
            ActionType::Skip | ActionType::Conflict => {}
        }
    }

    Ok(executed)
}

pub fn rollback_projection(
    db: &Database,
    projection_id: &str,
) -> Result<(), CommandError> {
    let projection = db.get_projection(projection_id)?;
    let target = PathBuf::from(&projection.target_path);

    if target.symlink_metadata().is_ok() {
        fs::remove_file(&target)?;
    }

    db.update_projection_status(projection_id, "removed")?;

    let _ = db.insert_audit(&NewAuditEvent {
        event_type: "projection_rollback".to_string(),
        entity_type: Some("projection".to_string()),
        entity_id: Some(projection_id.to_string()),
        detail: Some(format!("{{\"target\":\"{}\"}}", projection.target_path)),
        outcome: "success".to_string(),
    });

    Ok(())
}

pub fn adopt_unmanaged(
    db: &Database,
    target_path: &Path,
    registry_root: &Path,
    registry_dest: &str,
    asset_type: &str,
    backup_root: &Path,
    target_kind: &str,
) -> Result<AdoptResult, CommandError> {
    if !target_path.exists() {
        return Err(CommandError::validation(format!("target path does not exist: {}", target_path.display())));
    }

    let dest = registry_root.join(registry_dest);
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)?;
    }

    if target_path.is_dir() {
        copy_dir_recursive(target_path, &dest)?;
    } else {
        fs::copy(target_path, &dest)?;
    }

    let name = target_path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    let backup_path = backup_root.join(format!("adopt-{}-{}", name, chrono::Utc::now().format("%Y%m%d%H%M%S")));
    if target_path.is_dir() {
        copy_dir_recursive(target_path, &backup_path)?;
        fs::remove_dir_all(target_path)?;
    } else {
        fs::copy(target_path, &backup_path)?;
        fs::remove_file(target_path)?;
    }

    #[cfg(unix)]
    std::os::unix::fs::symlink(&dest, target_path)?;
    #[cfg(not(unix))]
    fs::copy(&dest, target_path)?;

    let asset = db.insert_asset(&NewLocalAsset {
        practice_id: None,
        asset_type: asset_type.to_string(),
        registry_path: registry_dest.to_string(),
        checksum: None,
        is_system: false,
    })?;

    let projection = db.insert_projection(&NewProjection {
        asset_id: asset.id.clone(),
        target_kind: target_kind.to_string(),
        target_path: target_path.to_string_lossy().to_string(),
        mode: "symlink".to_string(),
    })?;
    db.update_projection_status(&projection.id, "active")?;

    let _ = db.insert_audit(&NewAuditEvent {
        event_type: "asset_adopted".to_string(),
        entity_type: Some("local_asset".to_string()),
        entity_id: Some(asset.id.clone()),
        detail: Some(format!("{{\"from\":\"{}\",\"to\":\"{}\",\"backup\":\"{}\"}}", target_path.display(), dest.display(), backup_path.display())),
        outcome: "success".to_string(),
    });

    Ok(AdoptResult {
        asset_id: asset.id,
        registry_path: registry_dest.to_string(),
        backup_path: backup_path.to_string_lossy().to_string(),
        symlink_path: target_path.to_string_lossy().to_string(),
    })
}

pub fn check_health(
    db: &Database,
    target_kind: &str,
) -> Result<Vec<HealthFinding>, CommandError> {
    let assets = db.list_assets()?;
    let mut findings = Vec::new();

    for asset in &assets {
        let projections = db.list_projections_by_asset(&asset.id)?;
        for proj in projections {
            if proj.target_kind != target_kind || proj.status == "removed" {
                continue;
            }
            let target = PathBuf::from(&proj.target_path);
            if let Ok(meta) = target.symlink_metadata() {
                if meta.file_type().is_symlink() {
                    if !target.exists() {
                        findings.push(HealthFinding {
                            finding_type: "broken_symlink".to_string(),
                            severity: "warn".to_string(),
                            asset_id: Some(asset.id.clone()),
                            target_path: proj.target_path.clone(),
                            detail: "Symlink target does not exist".to_string(),
                        });
                    }
                }
            } else if proj.status == "active" {
                findings.push(HealthFinding {
                    finding_type: "missing_projection".to_string(),
                    severity: "warn".to_string(),
                    asset_id: Some(asset.id.clone()),
                    target_path: proj.target_path.clone(),
                    detail: "Projection marked active but target path does not exist".to_string(),
                });
            }
        }
    }

    Ok(findings)
}

fn copy_dir_recursive(src: &Path, dest: &Path) -> Result<(), CommandError> {
    fs::create_dir_all(dest)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let target = dest.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copy_dir_recursive(&entry.path(), &target)?;
        } else {
            fs::copy(entry.path(), &target)?;
        }
    }
    Ok(())
}
