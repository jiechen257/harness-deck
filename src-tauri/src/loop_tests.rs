#[cfg(test)]
mod tests {
    use crate::db::Database;
    use crate::domain::audit::NewAuditEvent;
    use crate::domain::local_asset::NewLocalAsset;
    use crate::domain::practice::{NewPracticeCard, PracticeDraft};
    use crate::domain::projection::NewProjection;
    use crate::domain::signal::NewSignalCard;
    use crate::services::loop_service;

    fn test_db() -> Database {
        Database::open_in_memory().expect("in-memory db should open")
    }

    fn insert_signal(db: &Database, title: &str) -> String {
        db.insert_signal(&NewSignalCard {
            title: title.into(),
            source_url: Some("https://example.com/release".into()),
            source_tier: "official".into(),
            signal_type: "changelog".into(),
            impact: "high".into(),
            confidence: "confirmed".into(),
            excerpt: Some("Agent profile loading changed.".into()),
            published_at: Some("2026-06-10T00:00:00Z".into()),
            fetched_at: "2026-06-10T12:00:00Z".into(),
        })
        .expect("insert signal")
        .id
    }

    #[test]
    fn loop_summary_aggregates_current_database_state() {
        let db = test_db();
        let signal_id = insert_signal(&db, "Codex release");
        let practice = db
            .insert_practice(&NewPracticeCard {
                title: "Registry projection workflow".into(),
                practice_type: "workflow".into(),
                summary: Some("Project registry assets into agent runtimes.".into()),
                scenarios: Some(r#"["Claude Code and Codex need shared skills"]"#.into()),
                comparable: None,
                applicability: Some("can_generate_asset".into()),
                generated_by: Some("test".into()),
            })
            .expect("insert practice");
        db.link_signal_to_practice(&signal_id, &practice.id)
            .expect("link signal");
        let asset = db
            .insert_asset(&NewLocalAsset {
                practice_id: Some(practice.id.clone()),
                asset_type: "skill".into(),
                registry_path: "system-skills/registry-projection".into(),
                checksum: None,
                is_system: true,
            })
            .expect("insert asset");
        let projection = db
            .insert_projection(&NewProjection {
                asset_id: asset.id,
                target_kind: "claude_code".into(),
                target_path: "~/.claude/skills/registry-projection".into(),
                mode: "symlink".into(),
            })
            .expect("insert projection");
        db.update_projection_status(&projection.id, "active")
            .expect("activate projection");
        db.insert_audit(&NewAuditEvent {
            event_type: "projection_created".into(),
            entity_type: Some("projection".into()),
            entity_id: Some(projection.id),
            detail: Some("test projection".into()),
            outcome: "success".into(),
        })
        .expect("insert audit");

        let summary = loop_service::get_loop_summary(&db).expect("summary");

        assert!(!summary.fixture_mode);
        assert_eq!(summary.sections.iter().find(|s| s.id == "signals").unwrap().count, 1);
        assert_eq!(summary.sections.iter().find(|s| s.id == "practices").unwrap().count, 1);
        assert_eq!(summary.sections.iter().find(|s| s.id == "assets").unwrap().count, 1);
        assert!(summary.targets.iter().any(|target| target.name == "Claude Code"));
        assert_eq!(summary.recent_audits.len(), 1);
    }

    #[test]
    fn create_practice_from_signal_links_signal_and_records_audit() {
        let db = test_db();
        let signal_id = insert_signal(&db, "Claude Code skill discovery update");
        let draft = PracticeDraft {
            title: "Skill discovery guardrail".into(),
            practice_type: "workflow".into(),
            summary: "Keep project-scoped skills aligned before agent work.".into(),
            scenarios: vec!["Before starting a Trellis implementation".into()],
            comparable: vec!["Manual skill lookup".into()],
            can_generate_asset: true,
            suggested_asset_types: vec!["skill".into()],
        };

        let practice = loop_service::create_practice_from_signal(&db, &signal_id, draft)
            .expect("create practice");

        assert_eq!(practice.status, "draft");
        assert_eq!(practice.generated_by.as_deref(), Some("normalize-practice-card"));
        assert_eq!(db.get_signal(&signal_id).expect("signal").status, "normalized");
        assert_eq!(db.list_practices().expect("practices").len(), 1);
        let audits = db
            .list_audits_by_entity("practice", &practice.id)
            .expect("audit by practice");
        assert_eq!(audits.len(), 1);
        assert_eq!(audits[0].event_type, "practice_created");
    }

    #[test]
    fn create_local_asset_from_practice_marks_practice_adoptable_and_records_audit() {
        let db = test_db();
        let practice = db
            .insert_practice(&NewPracticeCard {
                title: "Local review skill".into(),
                practice_type: "skill".into(),
                summary: Some("Review local harness assets.".into()),
                scenarios: None,
                comparable: None,
                applicability: Some("can_generate_asset".into()),
                generated_by: Some("test".into()),
            })
            .expect("insert practice");

        let asset = loop_service::create_local_asset_from_practice(
            &db,
            &practice.id,
            "skill",
            "system-skills/local-review",
            true,
        )
        .expect("create asset");

        assert_eq!(asset.practice_id.as_deref(), Some(practice.id.as_str()));
        assert_eq!(asset.status, "ready");
        assert!(asset.is_system);
        assert_eq!(db.get_practice(&practice.id).expect("practice").status, "adoptable");
        let audits = db
            .list_audits_by_entity("local_asset", &asset.id)
            .expect("asset audits");
        assert_eq!(audits.len(), 1);
        assert_eq!(audits[0].event_type, "local_asset_created");
    }
}
