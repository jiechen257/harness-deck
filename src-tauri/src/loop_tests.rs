#[cfg(test)]
mod tests {
    use std::sync::{Mutex, OnceLock};

    use crate::db::Database;
    use crate::domain::audit::NewAuditEvent;
    use crate::domain::byoa::AgentKind;
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

    fn env_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    struct PathRestore {
        old_path: Option<std::ffi::OsString>,
    }

    impl Drop for PathRestore {
        fn drop(&mut self) {
            if let Some(path) = self.old_path.take() {
                std::env::set_var("PATH", path);
            } else {
                std::env::remove_var("PATH");
            }
        }
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
        assert_eq!(
            summary
                .sections
                .iter()
                .find(|s| s.id == "signals")
                .unwrap()
                .count,
            1
        );
        assert_eq!(
            summary
                .sections
                .iter()
                .find(|s| s.id == "practices")
                .unwrap()
                .count,
            1
        );
        assert_eq!(
            summary
                .sections
                .iter()
                .find(|s| s.id == "assets")
                .unwrap()
                .count,
            1
        );
        assert!(summary
            .targets
            .iter()
            .any(|target| target.name == "Claude Code"));
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
        assert_eq!(
            practice.generated_by.as_deref(),
            Some("normalize-practice-card")
        );
        assert_eq!(
            db.get_signal(&signal_id).expect("signal").status,
            "normalized"
        );
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
        assert_eq!(
            db.get_practice(&practice.id).expect("practice").status,
            "adoptable"
        );
        let audits = db
            .list_audits_by_entity("local_asset", &asset.id)
            .expect("asset audits");
        assert_eq!(audits.len(), 1);
        assert_eq!(audits[0].event_type, "local_asset_created");
    }

    #[test]
    fn normalize_signal_uses_codex_exec_schema_flow_end_to_end() {
        let _guard = env_lock().lock().expect("env lock");
        let db = test_db();
        let signal_id = insert_signal(&db, "Codex changelog updates agent profile loading");
        let dir = tempfile::tempdir().expect("tempdir");
        let args_log = dir.path().join("codex-args.log");
        let codex_bin = dir.path().join("codex");
        let script = format!(
            r#"#!/bin/sh
if [ "${{1:-}}" = "--version" ]; then
  echo "codex 0.139.0"
  exit 0
fi
printf '%s\n' "$@" > "{args_log}"
schema_seen=0
previous=""
for arg in "$@"; do
  if [ "$arg" = "--ask-for-approval" ]; then
    echo "unexpected approval flag" >&2
    exit 7
  fi
  if [ "$previous" = "--output-schema" ]; then
    if [ ! -f "$arg" ]; then
      echo "missing output schema file" >&2
      exit 8
    fi
    schema_seen=1
  fi
  previous="$arg"
done
if [ "$schema_seen" -ne 1 ]; then
  echo "missing output schema arg" >&2
  exit 9
fi
cat <<'JSON'
{{"title":"Profile loading practice","practiceType":"workflow","summary":"Keep agent profile loading changes synchronized across local harness assets.","scenarios":["Generate a practice preview from a changelog signal"],"comparable":["Manual release-note tracking"],"canGenerateAsset":true,"suggestedAssetTypes":["skill"]}}
JSON
"#,
            args_log = args_log.display()
        );
        std::fs::write(&codex_bin, script).expect("fake codex");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut permissions = std::fs::metadata(&codex_bin)
                .expect("metadata")
                .permissions();
            permissions.set_mode(0o755);
            std::fs::set_permissions(&codex_bin, permissions).expect("permissions");
        }

        let path_restore = PathRestore {
            old_path: std::env::var_os("PATH"),
        };
        let next_path = match path_restore.old_path.as_ref() {
            Some(path) => {
                let mut paths = std::env::split_paths(path).collect::<Vec<_>>();
                paths.insert(0, dir.path().to_path_buf());
                std::env::join_paths(paths).expect("join path")
            }
            None => dir.path().as_os_str().to_os_string(),
        };
        std::env::set_var("PATH", next_path);

        let result = loop_service::normalize_signal(&db, &signal_id, AgentKind::Codex)
            .expect("normalize signal");

        assert!(result.success);
        assert_eq!(
            result.draft.as_ref().expect("draft").title,
            "Profile loading practice"
        );

        let args = std::fs::read_to_string(args_log).expect("args log");
        assert!(args.contains("exec\n"));
        assert!(args.contains("--output-schema\n"));
        assert!(args.contains("--sandbox\nread-only\n"));
        assert!(!args.contains("--ask-for-approval"));
    }
}
