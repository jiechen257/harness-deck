#[cfg(test)]
mod tests {
    use crate::db::Database;
    use crate::services::intake_service;

    fn test_db() -> Database {
        Database::open_in_memory().expect("in-memory db should open")
    }

    #[test]
    fn seed_default_sources() {
        let db = test_db();
        intake_service::seed_default_sources(&db).expect("seed");
        let sources = db.list_source_configs().expect("list");
        assert_eq!(sources.len(), 7);
        assert!(sources.iter().any(|s| s.id == "github-trending"));
        assert!(sources.iter().any(|s| s.id == "codex-changelog"));
        assert!(sources.iter().any(|s| s.id == "model-news"));
        assert!(sources.iter().all(|s| !s.enabled));
    }

    #[test]
    fn seed_is_idempotent() {
        let db = test_db();
        intake_service::seed_default_sources(&db).expect("first");
        intake_service::seed_default_sources(&db).expect("second");
        let sources = db.list_source_configs().expect("list");
        assert_eq!(sources.len(), 7);
    }

    #[test]
    fn source_config_toggle() {
        let db = test_db();
        intake_service::seed_default_sources(&db).expect("seed");

        db.set_source_enabled("github-trending", true).expect("enable");
        let config = db.get_source_config("github-trending").expect("get").unwrap();
        assert!(config.enabled);

        db.set_source_auto_refresh("github-trending", true).expect("auto");
        let config = db.get_source_config("github-trending").expect("get").unwrap();
        assert!(config.auto_refresh);
    }

    #[test]
    fn refresh_requires_authorization() {
        let db = test_db();
        db.seed_authorization().expect("seed auth");
        intake_service::seed_default_sources(&db).expect("seed sources");
        db.set_source_enabled("github-trending", true).expect("enable");

        let result = intake_service::refresh_source(&db, "github-trending");
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.code, "AuthorizationRequired");
    }

    #[test]
    fn refresh_creates_signals_and_records() {
        let db = test_db();
        db.seed_authorization().expect("seed auth");
        db.grant_authorization("external_signals").expect("grant");
        intake_service::seed_default_sources(&db).expect("seed sources");
        db.set_source_enabled("codex-changelog", true).expect("enable");

        let ids = intake_service::refresh_source(&db, "codex-changelog").expect("refresh");
        assert!(!ids.is_empty());

        let signal = db.get_signal(&ids[0]).expect("get signal");
        assert_eq!(signal.source_tier, "official");
        assert_eq!(signal.signal_type, "changelog");
        assert_eq!(signal.confidence, "confirmed");

        let refreshes = db.list_recent_refreshes(10).expect("list refreshes");
        assert_eq!(refreshes.len(), 1);
        assert_eq!(refreshes[0].outcome, "success");

        let audits = db.list_recent_audits(10).expect("audits");
        assert!(audits.iter().any(|a| a.event_type == "signal_refresh"));
    }

    #[test]
    fn refresh_disabled_source_fails() {
        let db = test_db();
        db.seed_authorization().expect("seed auth");
        db.grant_authorization("external_signals").expect("grant");
        intake_service::seed_default_sources(&db).expect("seed");

        let result = intake_service::refresh_source(&db, "github-trending");
        assert!(result.is_err());
    }

    #[test]
    fn community_signals_are_unverified() {
        let db = test_db();
        db.seed_authorization().expect("seed auth");
        db.grant_authorization("external_signals").expect("grant");
        intake_service::seed_default_sources(&db).expect("seed");
        db.set_source_enabled("hackernews", true).expect("enable");

        let ids = intake_service::refresh_source(&db, "hackernews").expect("refresh");
        let signal = db.get_signal(&ids[0]).expect("get");
        assert_eq!(signal.source_tier, "community");
        assert_eq!(signal.confidence, "unverified");
    }
}
