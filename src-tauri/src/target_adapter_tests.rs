use crate::domain::crawl::InstallTarget;
use crate::services::target_adapter::{
    all_adapters, get_adapter, ClaudeCodeAdapter, CodexAdapter, TargetAdapter,
};

#[test]
fn claude_code_adapter_kind() {
    let adapter = ClaudeCodeAdapter;
    assert_eq!(adapter.kind(), "ClaudeCode");
    assert_eq!(adapter.display_name(), "Claude Code");
}

#[test]
fn codex_adapter_kind() {
    let adapter = CodexAdapter;
    assert_eq!(adapter.kind(), "Codex");
    assert_eq!(adapter.display_name(), "Codex");
}

#[test]
fn get_adapter_returns_correct_kind() {
    let claude = get_adapter(&InstallTarget::ClaudeCode);
    assert_eq!(claude.kind(), "ClaudeCode");

    let codex = get_adapter(&InstallTarget::Codex);
    assert_eq!(codex.kind(), "Codex");
}

#[test]
fn all_adapters_returns_both() {
    let adapters = all_adapters();
    assert_eq!(adapters.len(), 2);

    let kinds: Vec<&str> = adapters.iter().map(|a| a.kind()).collect();
    assert!(kinds.contains(&"ClaudeCode"));
    assert!(kinds.contains(&"Codex"));
}

#[test]
fn adapters_have_consistent_paths() {
    for adapter in all_adapters() {
        // skills_dir and config_dir should either both be Some or both be None
        // (they depend on home_dir which is either available or not).
        let has_skills = adapter.skills_dir().is_some();
        let has_config = adapter.config_dir().is_some();
        assert_eq!(has_skills, has_config);

        // If available, config_dir must exist on disk
        if adapter.is_available() {
            assert!(adapter.config_dir().unwrap().is_dir());
        }
    }
}
