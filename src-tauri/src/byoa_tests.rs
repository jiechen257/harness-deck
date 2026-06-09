use crate::domain::byoa::{AgentInvocation, AgentKind};
use crate::services::byoa_service::{detect_agent, detect_all_agents, invoke_agent};

#[test]
fn test_detect_nonexistent_agent() {
    // AgentKind::Codex may or may not be installed; instead we test the
    // detect_agent path with a kind whose binary definitely won't resolve
    // by verifying that detect_all_agents returns a Vec and each entry
    // has consistent available/binary_path state.
    let results = detect_all_agents();
    assert_eq!(results.len(), 2);

    for result in &results {
        if result.available {
            assert!(result.binary_path.is_some());
        } else {
            assert!(result.binary_path.is_none());
        }
    }
}

#[test]
fn test_detect_agent_consistency() {
    // detect_agent for Claude returns consistent fields
    let result = detect_agent(AgentKind::Claude);
    assert_eq!(result.kind, AgentKind::Claude);

    // If available, binary_path must be Some; if not, must be None
    if result.available {
        assert!(result.binary_path.is_some());
        let path = result.binary_path.as_ref().unwrap();
        assert!(!path.is_empty());
    } else {
        assert!(result.binary_path.is_none());
    }
}

#[test]
fn test_invoke_nonexistent_agent_returns_error() {
    // Invoking an agent that isn't installed should return a SubprocessError.
    // We use Codex which is less likely to be installed in test environments.
    let availability = detect_agent(AgentKind::Codex);
    if availability.available {
        // Skip: codex is actually installed, can't test the not-found path
        return;
    }

    let invocation = AgentInvocation {
        kind: AgentKind::Codex,
        prompt: "test".to_string(),
        timeout_secs: 5,
        request_json_output: false,
    };

    let result = invoke_agent(invocation);
    assert!(result.is_err());

    let err = result.unwrap_err();
    assert_eq!(err.code, "SubprocessError");
}
