#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use crate::db::Database;
    use crate::services::skill_service;

    fn test_db() -> Database {
        Database::open_in_memory().expect("in-memory db should open")
    }

    #[test]
    fn parse_intake_skill_md() {
        let content = include_str!("../bundled-skills/intake-source-research/SKILL.md");
        let meta = skill_service::parse_skill_md(content).expect("parse");
        assert_eq!(meta.id, "intake-source-research");
        assert_eq!(meta.version, "1.0.0");
        assert_eq!(meta.output_type, "relevance_scores");
        assert!(!meta.template.is_empty());
    }

    #[test]
    fn parse_normalize_skill_md() {
        let content = include_str!("../bundled-skills/normalize-practice-card/SKILL.md");
        let meta = skill_service::parse_skill_md(content).expect("parse");
        assert_eq!(meta.id, "normalize-practice-card");
        assert_eq!(meta.output_type, "practice_card");
        assert!(meta.template.contains("{{signal_title}}"));
    }

    #[test]
    fn parse_review_skill_md() {
        let content = include_str!("../bundled-skills/local-harness-review/SKILL.md");
        let meta = skill_service::parse_skill_md(content).expect("parse");
        assert_eq!(meta.id, "local-harness-review");
        assert_eq!(meta.output_type, "review_findings");
        assert!(meta.template.contains("{{asset_inventory}}"));
    }

    #[test]
    fn parse_invalid_frontmatter() {
        let content = "no frontmatter here";
        let result = skill_service::parse_skill_md(content);
        assert!(result.is_err());
    }

    #[test]
    fn skill_config_crud() {
        let db = test_db();
        db.upsert_skill_config("test-skill", "1.0.0").expect("upsert");

        let config = db.get_skill_config("test-skill").expect("get");
        assert!(config.is_some());
        let config = config.unwrap();
        assert!(config.enabled);
        assert_eq!(config.version, Some("1.0.0".to_string()));

        db.set_skill_enabled("test-skill", false).expect("disable");
        let config = db.get_skill_config("test-skill").expect("get").unwrap();
        assert!(!config.enabled);

        let all = db.list_skill_configs().expect("list");
        assert_eq!(all.len(), 1);
    }

    #[test]
    fn seed_bundled_skills_is_idempotent() {
        let db = test_db();
        let dir = tempfile::tempdir().expect("tempdir");

        skill_service::seed_bundled_skills(dir.path(), &db).expect("first seed");
        let configs_after_first = db.list_skill_configs().expect("list");
        assert_eq!(configs_after_first.len(), 3);

        skill_service::seed_bundled_skills(dir.path(), &db).expect("second seed");
        let configs_after_second = db.list_skill_configs().expect("list");
        assert_eq!(configs_after_second.len(), 3);

        assert!(dir.path().join("system-skills/intake-source-research/SKILL.md").exists());
        assert!(dir.path().join("system-skills/normalize-practice-card/SKILL.md").exists());
        assert!(dir.path().join("system-skills/local-harness-review/SKILL.md").exists());
    }

    #[test]
    fn template_variable_substitution() {
        let content = include_str!("../bundled-skills/normalize-practice-card/SKILL.md");
        let meta = skill_service::parse_skill_md(content).expect("parse");

        let mut vars = HashMap::new();
        vars.insert("signal_title".to_string(), "Test Title".to_string());
        vars.insert("signal_source".to_string(), "official".to_string());
        vars.insert("source_tier".to_string(), "official".to_string());
        vars.insert("signal_excerpt".to_string(), "Some excerpt".to_string());

        let rendered = meta.template
            .replace("{{signal_title}}", &vars["signal_title"])
            .replace("{{signal_source}}", &vars["signal_source"])
            .replace("{{source_tier}}", &vars["source_tier"])
            .replace("{{signal_excerpt}}", &vars["signal_excerpt"]);

        assert!(rendered.contains("Test Title"));
        assert!(rendered.contains("Some excerpt"));
        assert!(!rendered.contains("{{signal_title}}"));
    }
}
