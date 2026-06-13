#[cfg(test)]
mod tests {
    use crate::db::Database;
    use crate::services::operations_service;

    fn test_db() -> Database {
        let db = Database::open_in_memory().expect("in-memory db should open");
        db.seed_authorization().expect("seed auth");
        db
    }

    #[test]
    fn list_scripts_seeds_default_operations() {
        let db = test_db();

        let scripts = operations_service::list_scripts(&db).expect("list scripts");

        assert_eq!(scripts.len(), 3);
        assert!(scripts.iter().any(|script| script.name == "Codex proxy"));
        assert!(scripts.iter().any(|script| script.name == "Sleep guard"));
        assert!(scripts.iter().any(|script| script.name == "Wake display"));
    }

    #[test]
    fn preview_script_is_read_only_and_names_authorization_scope() {
        let db = test_db();
        let script = operations_service::list_scripts(&db)
            .expect("list scripts")
            .into_iter()
            .find(|script| script.name == "Codex proxy")
            .expect("codex proxy script");

        let preview = operations_service::preview_script(&db, &script.id).expect("preview");

        assert_eq!(preview.script_id, script.id);
        assert_eq!(preview.requires_authorization, "script_execution");
        assert!(!preview.will_execute);
        assert!(preview
            .steps
            .iter()
            .any(|step| step.contains("Record an audit event")));
    }

    #[test]
    fn confirm_script_requires_script_execution_authorization() {
        let db = test_db();
        let script = operations_service::list_scripts(&db)
            .expect("list scripts")
            .into_iter()
            .next()
            .expect("script");

        let error = operations_service::confirm_script(&db, &script.id)
            .expect_err("script confirmation should require authorization");

        assert_eq!(error.code, "AuthorizationRequired");
    }

    #[test]
    fn confirm_script_records_audit_when_authorized() {
        let db = test_db();
        db.grant_authorization("script_execution")
            .expect("grant script execution");
        let script = operations_service::list_scripts(&db)
            .expect("list scripts")
            .into_iter()
            .find(|script| script.name == "Wake display")
            .expect("wake display script");

        let result = operations_service::confirm_script(&db, &script.id).expect("confirm");

        assert_eq!(result.audit_event_type, "ops_script_confirmed");
        assert_eq!(result.status, "confirmed_safe_mvp");
        let audits = db.list_recent_audits(5).expect("audits");
        assert!(audits
            .iter()
            .any(|audit| audit.event_type == "ops_script_confirmed"
                && audit.entity_id.as_deref() == Some(script.id.as_str())));
    }
}
