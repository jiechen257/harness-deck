use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentKind {
    Claude,
    Codex,
}

impl AgentKind {
    pub fn binary_name(&self) -> &'static str {
        match self {
            AgentKind::Claude => "claude",
            AgentKind::Codex => "codex",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentAvailability {
    pub kind: AgentKind,
    pub binary_path: Option<String>,
    pub version: Option<String>,
    pub available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentInvocation {
    pub kind: AgentKind,
    pub prompt: String,
    pub timeout_secs: u64,
    pub request_json_output: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentResult {
    pub kind: AgentKind,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub parsed_json: Option<serde_json::Value>,
    pub duration_ms: u64,
    pub timed_out: bool,
}
