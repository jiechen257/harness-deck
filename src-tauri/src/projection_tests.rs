#[cfg(test)]
mod tests {
    use crate::db::Database;
    use crate::domain::local_asset::NewLocalAsset;
    use crate::services::projection_service;

    fn test_db() -> Database {
        Database::open_in_memory().expect("in-memory db should open")
    }

    fn setup_asset(db: &Database, registry_path: &str) -> String {
        let asset = db.insert_asset(&NewLocalAsset {
            practice_id: None,
            asset_type: "skill".into(),
            registry_path: registry_path.into(),
            checksum: None,
            is_system: false,
        }).expect("insert asset");
        asset.id
    }

    #[test]
    fn plan_creates_symlink_for_new_target() {
        let db = test_db();
        let dir = tempfile::tempdir().expect("tempdir");
        let registry = dir.path().join("registry");
        let target = dir.path().join("target");
        std::fs::create_dir_all(registry.join("skills/my-skill")).unwrap();
        std::fs::write(registry.join("skills/my-skill/SKILL.md"), "test").unwrap();
        std::fs::create_dir_all(&target).unwrap();

        setup_asset(&db, "skills/my-skill");

        let plan = projection_service::plan_projection(&db, &registry, &target, "claude_code")
            .expect("plan");
        assert_eq!(plan.creates, 1);
        assert_eq!(plan.conflicts, 0);
    }

    #[test]
    fn plan_detects_conflict_for_existing_regular_dir() {
        let db = test_db();
        let dir = tempfile::tempdir().expect("tempdir");
        let registry = dir.path().join("registry");
        let target = dir.path().join("target");
        std::fs::create_dir_all(registry.join("skills/my-skill")).unwrap();
        std::fs::write(registry.join("skills/my-skill/SKILL.md"), "test").unwrap();
        std::fs::create_dir_all(target.join("my-skill")).unwrap();
        std::fs::write(target.join("my-skill/README.md"), "existing").unwrap();

        setup_asset(&db, "skills/my-skill");

        let plan = projection_service::plan_projection(&db, &registry, &target, "claude_code")
            .expect("plan");
        assert_eq!(plan.conflicts, 1);
        assert_eq!(plan.creates, 0);
    }

    #[test]
    fn execute_creates_symlink() {
        let db = test_db();
        let dir = tempfile::tempdir().expect("tempdir");
        let registry = dir.path().join("registry");
        let target = dir.path().join("target");
        std::fs::create_dir_all(registry.join("skills/test-skill")).unwrap();
        std::fs::write(registry.join("skills/test-skill/SKILL.md"), "content").unwrap();
        std::fs::create_dir_all(&target).unwrap();

        setup_asset(&db, "skills/test-skill");

        let plan = projection_service::plan_projection(&db, &registry, &target, "codex")
            .expect("plan");
        let ids = projection_service::execute_projection(&db, &registry, &plan)
            .expect("execute");

        assert_eq!(ids.len(), 1);
        let symlink_path = target.join("test-skill");
        assert!(symlink_path.symlink_metadata().unwrap().file_type().is_symlink());

        let audits = db.list_recent_audits(10).expect("audits");
        assert!(audits.iter().any(|a| a.event_type == "projection_executed"));
    }

    #[test]
    fn rollback_removes_symlink_keeps_registry() {
        let db = test_db();
        let dir = tempfile::tempdir().expect("tempdir");
        let registry = dir.path().join("registry");
        let target = dir.path().join("target");
        std::fs::create_dir_all(registry.join("skills/rb-skill")).unwrap();
        std::fs::write(registry.join("skills/rb-skill/SKILL.md"), "content").unwrap();
        std::fs::create_dir_all(&target).unwrap();

        setup_asset(&db, "skills/rb-skill");

        let plan = projection_service::plan_projection(&db, &registry, &target, "claude_code")
            .expect("plan");
        let ids = projection_service::execute_projection(&db, &registry, &plan)
            .expect("execute");

        projection_service::rollback_projection(&db, &ids[0]).expect("rollback");

        assert!(!target.join("rb-skill").exists());
        assert!(registry.join("skills/rb-skill/SKILL.md").exists());

        let projection = db.get_projection(&ids[0]).expect("get");
        assert_eq!(projection.status, "removed");
    }

    #[test]
    fn adopt_creates_registry_entry_and_symlink() {
        let db = test_db();
        let dir = tempfile::tempdir().expect("tempdir");
        let registry = dir.path().join("registry");
        let target = dir.path().join("target");
        let backups = dir.path().join("backups");
        std::fs::create_dir_all(&registry).unwrap();
        std::fs::create_dir_all(&target).unwrap();
        std::fs::create_dir_all(&backups).unwrap();

        let unmanaged = target.join("orphan-skill");
        std::fs::create_dir_all(&unmanaged).unwrap();
        std::fs::write(unmanaged.join("SKILL.md"), "orphan content").unwrap();

        let result = projection_service::adopt_unmanaged(
            &db,
            &unmanaged,
            &registry,
            "skills/adopted/orphan-skill",
            "skill",
            &backups,
            "codex",
        ).expect("adopt");

        assert!(registry.join("skills/adopted/orphan-skill/SKILL.md").exists());
        assert!(unmanaged.symlink_metadata().unwrap().file_type().is_symlink());
        assert!(!result.backup_path.is_empty());

        let assets = db.list_assets().expect("list");
        assert_eq!(assets.len(), 1);
        assert!(!assets[0].is_system);
    }

    #[test]
    fn health_detects_broken_symlink() {
        let db = test_db();
        let dir = tempfile::tempdir().expect("tempdir");
        let target = dir.path().join("target");
        std::fs::create_dir_all(&target).unwrap();

        let asset_id = setup_asset(&db, "skills/gone-skill");

        let projection = db.insert_projection(&crate::domain::projection::NewProjection {
            asset_id,
            target_kind: "claude_code".into(),
            target_path: target.join("gone-skill").to_string_lossy().to_string(),
            mode: "symlink".into(),
        }).expect("insert projection");
        db.update_projection_status(&projection.id, "active").expect("status");

        #[cfg(unix)]
        std::os::unix::fs::symlink("/nonexistent/path", target.join("gone-skill")).unwrap();

        let findings = projection_service::check_health(&db, "claude_code").expect("health");
        assert!(findings.iter().any(|f| f.finding_type == "broken_symlink"));
    }
}
