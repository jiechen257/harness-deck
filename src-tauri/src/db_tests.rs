#[cfg(test)]
mod tests {
    use crate::db::Database;
    use crate::domain::signal::NewSignalCard;
    use crate::domain::practice::NewPracticeCard;
    use crate::domain::local_asset::NewLocalAsset;
    use crate::domain::projection::NewProjection;
    use crate::domain::ops_script::NewOpsScript;
    use crate::domain::audit::NewAuditEvent;
    use crate::domain::registry_connection::NewRegistryConnection;
    use crate::domain::refresh::NewRefreshRecord;

    fn test_db() -> Database {
        Database::open_in_memory().expect("in-memory db should open")
    }

    #[test]
    fn schema_initializes_without_error() {
        let _db = test_db();
    }

    #[test]
    fn signal_crud() {
        let db = test_db();
        let signal = db.insert_signal(&NewSignalCard {
            title: "Codex 1.19.0 released".into(),
            source_url: Some("https://example.com/changelog".into()),
            source_tier: "official".into(),
            signal_type: "changelog".into(),
            impact: "high".into(),
            confidence: "confirmed".into(),
            excerpt: Some("New local config handling".into()),
            published_at: Some("2026-06-10T00:00:00Z".into()),
            fetched_at: "2026-06-10T12:00:00Z".into(),
        }).expect("insert signal");

        assert_eq!(signal.title, "Codex 1.19.0 released");
        assert_eq!(signal.status, "inbox");
        assert!(!signal.id.is_empty());

        let fetched = db.get_signal(&signal.id).expect("get signal");
        assert_eq!(fetched.id, signal.id);
        assert_eq!(fetched.source_tier, "official");

        db.update_signal_status(&signal.id, "normalized").expect("update status");
        let updated = db.get_signal(&signal.id).expect("get updated");
        assert_eq!(updated.status, "normalized");

        let all = db.list_signals().expect("list signals");
        assert_eq!(all.len(), 1);
    }

    #[test]
    fn practice_crud_and_signal_link() {
        let db = test_db();
        let signal = db.insert_signal(&NewSignalCard {
            title: "Test signal".into(),
            source_url: None,
            source_tier: "community".into(),
            signal_type: "community_discussion".into(),
            impact: "medium".into(),
            confidence: "unverified".into(),
            excerpt: None,
            published_at: None,
            fetched_at: "2026-06-10T12:00:00Z".into(),
        }).expect("insert signal");

        let practice = db.insert_practice(&NewPracticeCard {
            title: "Registry symlink workflow".into(),
            practice_type: "workflow".into(),
            summary: Some("Use symlinks for agent skill projection".into()),
            scenarios: None,
            comparable: None,
            applicability: None,
            generated_by: None,
        }).expect("insert practice");

        assert_eq!(practice.status, "draft");

        db.link_signal_to_practice(&signal.id, &practice.id)
            .expect("link signal to practice");

        let practices = db.list_practices().expect("list");
        assert_eq!(practices.len(), 1);
    }

    #[test]
    fn asset_and_projection_crud() {
        let db = test_db();
        let asset = db.insert_asset(&NewLocalAsset {
            practice_id: None,
            asset_type: "skill".into(),
            registry_path: "system-skills/local-harness-review".into(),
            checksum: Some("abc123".into()),
            is_system: true,
        }).expect("insert asset");

        assert!(asset.is_system);
        assert_eq!(asset.status, "ready");

        let projection = db.insert_projection(&NewProjection {
            asset_id: asset.id.clone(),
            target_kind: "claude_code".into(),
            target_path: "~/.claude/skills/local-harness-review".into(),
            mode: "symlink".into(),
        }).expect("insert projection");

        assert_eq!(projection.status, "planned");

        db.update_projection_status(&projection.id, "active").expect("update");
        let updated = db.get_projection(&projection.id).expect("get");
        assert_eq!(updated.status, "active");

        let by_asset = db.list_projections_by_asset(&asset.id).expect("list");
        assert_eq!(by_asset.len(), 1);
    }

    #[test]
    fn ops_script_crud() {
        let db = test_db();
        let script = db.insert_ops_script(&NewOpsScript {
            name: "Codex Agent Launcher".into(),
            path: "~/start-codex.sh".into(),
            description: Some("Sets launchctl env and restarts Codex".into()),
            risk_level: "high".into(),
        }).expect("insert ops script");

        assert_eq!(script.status, "registered");
        assert_eq!(script.risk_level, "high");

        let all = db.list_ops_scripts().expect("list");
        assert_eq!(all.len(), 1);
    }

    #[test]
    fn audit_event_crud() {
        let db = test_db();
        let event = db.insert_audit(&NewAuditEvent {
            event_type: "projection_created".into(),
            entity_type: Some("projection".into()),
            entity_id: Some("proj-001".into()),
            detail: Some(r#"{"target":"claude_code","mode":"symlink"}"#.into()),
            outcome: "success".into(),
        }).expect("insert audit");

        assert_eq!(event.event_type, "projection_created");

        let by_entity = db.list_audits_by_entity("projection", "proj-001").expect("list by entity");
        assert_eq!(by_entity.len(), 1);

        let recent = db.list_recent_audits(10).expect("list recent");
        assert_eq!(recent.len(), 1);
    }

    #[test]
    fn authorization_state_lifecycle() {
        let db = test_db();
        db.seed_authorization().expect("seed");

        let all = db.get_all_authorizations().expect("get all");
        assert_eq!(all.len(), 5);
        assert!(all.iter().all(|a| !a.granted));

        db.grant_authorization("registry").expect("grant");
        let all = db.get_all_authorizations().expect("after grant");
        let registry = all.iter().find(|a| a.scope == "registry").expect("find registry");
        assert!(registry.granted);
        assert!(registry.granted_at.is_some());

        db.revoke_authorization("registry").expect("revoke");
        let all = db.get_all_authorizations().expect("after revoke");
        let registry = all.iter().find(|a| a.scope == "registry").expect("find registry");
        assert!(!registry.granted);
        assert!(registry.revoked_at.is_some());
    }

    #[test]
    fn registry_connection_crud() {
        let db = test_db();
        let conn = db.insert_registry(&NewRegistryConnection {
            path: "/Users/test/my-agent-skill".into(),
            registry_type: "user".into(),
        }).expect("insert registry");

        assert!(conn.is_active);

        let active = db.get_active_registry().expect("get active");
        assert!(active.is_some());
        assert_eq!(active.unwrap().path, "/Users/test/my-agent-skill");

        let conn2 = db.insert_registry(&NewRegistryConnection {
            path: "/Users/test/HoneRegistry".into(),
            registry_type: "initialized".into(),
        }).expect("insert second");

        assert!(conn2.is_active);
        let old = db.get_registry(&conn.id).expect("get old");
        assert!(!old.is_active);
    }

    #[test]
    fn refresh_record_crud() {
        let db = test_db();
        let record = db.insert_refresh(&NewRefreshRecord {
            source_name: "GitHub Trending".into(),
            source_url: Some("https://github.com/trending".into()),
            triggered_by: "manual".into(),
            result_count: Some(15),
            error_message: None,
            outcome: "success".into(),
            started_at: "2026-06-10T12:00:00Z".into(),
            finished_at: Some("2026-06-10T12:00:05Z".into()),
        }).expect("insert refresh");

        assert_eq!(record.result_count, Some(15));

        let recent = db.list_recent_refreshes(10).expect("list recent");
        assert_eq!(recent.len(), 1);
    }

    #[test]
    fn excerpt_length_is_bounded() {
        let db = test_db();
        let long_excerpt = "x".repeat(500);
        let signal = db.insert_signal(&NewSignalCard {
            title: "test".into(),
            source_url: None,
            source_tier: "community".into(),
            signal_type: "community_discussion".into(),
            impact: "low".into(),
            confidence: "unverified".into(),
            excerpt: Some(long_excerpt.clone()),
            published_at: None,
            fetched_at: "2026-06-10T00:00:00Z".into(),
        }).expect("insert");

        assert_eq!(signal.excerpt.unwrap().len(), 500);
    }
}
