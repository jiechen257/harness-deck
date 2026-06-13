use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, Instant};

use crate::domain::byoa::{AgentAvailability, AgentInvocation, AgentKind, AgentResult};
use crate::domain::errors::CommandError;

const CODEX_JSON_OBJECT_SCHEMA: &str = r#"{
  "type": "object",
  "additionalProperties": true
}"#;

trait AgentCliAdapter: Sync {
    fn kind(&self) -> AgentKind;
    fn binary_name(&self) -> &'static str;
    fn build_args(
        &self,
        invocation: &AgentInvocation,
        json_schema_path: Option<&Path>,
    ) -> Vec<String>;
}

struct ClaudeCliAdapter;
struct CodexCliAdapter;

impl AgentCliAdapter for ClaudeCliAdapter {
    fn kind(&self) -> AgentKind {
        AgentKind::Claude
    }

    fn binary_name(&self) -> &'static str {
        "claude"
    }

    fn build_args(
        &self,
        invocation: &AgentInvocation,
        _json_schema_path: Option<&Path>,
    ) -> Vec<String> {
        let mut args = vec![
            "--print".to_string(),
            "-p".to_string(),
            invocation.prompt.clone(),
        ];
        if invocation.request_json_output {
            args.push("--output-format".to_string());
            args.push("json".to_string());
        }
        args
    }
}

impl AgentCliAdapter for CodexCliAdapter {
    fn kind(&self) -> AgentKind {
        AgentKind::Codex
    }

    fn binary_name(&self) -> &'static str {
        "codex"
    }

    fn build_args(
        &self,
        invocation: &AgentInvocation,
        json_schema_path: Option<&Path>,
    ) -> Vec<String> {
        let mut args = vec![
            "exec".to_string(),
            "--ephemeral".to_string(),
            "--ignore-rules".to_string(),
            "--skip-git-repo-check".to_string(),
            "--sandbox".to_string(),
            "read-only".to_string(),
        ];
        if let Some(path) = json_schema_path {
            args.push("--output-schema".to_string());
            args.push(path.to_string_lossy().to_string());
        }
        args.push(invocation.prompt.clone());
        args
    }
}

static CLAUDE_ADAPTER: ClaudeCliAdapter = ClaudeCliAdapter;
static CODEX_ADAPTER: CodexCliAdapter = CodexCliAdapter;

fn adapter_for(kind: AgentKind) -> &'static dyn AgentCliAdapter {
    match kind {
        AgentKind::Claude => &CLAUDE_ADAPTER,
        AgentKind::Codex => &CODEX_ADAPTER,
    }
}

pub fn detect_agent(kind: AgentKind) -> AgentAvailability {
    let adapter = adapter_for(kind);
    let binary = adapter.binary_name();

    let which_result = Command::new("which").arg(binary).output();

    let binary_path = match which_result {
        Ok(output) if output.status.success() => {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if path.is_empty() {
                None
            } else {
                Some(path)
            }
        }
        _ => None,
    };

    let version = binary_path.as_ref().and_then(|path| {
        Command::new(path)
            .arg("--version")
            .output()
            .ok()
            .and_then(|output| {
                if output.status.success() {
                    let v = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if v.is_empty() {
                        None
                    } else {
                        Some(v)
                    }
                } else {
                    None
                }
            })
    });

    let available = binary_path.is_some();

    AgentAvailability {
        kind: adapter.kind(),
        binary_path,
        version,
        available,
    }
}

pub fn detect_all_agents() -> Vec<AgentAvailability> {
    vec![
        detect_agent(AgentKind::Claude),
        detect_agent(AgentKind::Codex),
    ]
}

struct InvocationArtifacts {
    output_schema_path: Option<PathBuf>,
}

impl Drop for InvocationArtifacts {
    fn drop(&mut self) {
        if let Some(path) = &self.output_schema_path {
            let _ = std::fs::remove_file(path);
        }
    }
}

fn prepare_invocation_artifacts(
    invocation: &AgentInvocation,
) -> Result<InvocationArtifacts, CommandError> {
    let output_schema_path =
        if invocation.kind == AgentKind::Codex && invocation.request_json_output {
            Some(write_codex_json_schema()?)
        } else {
            None
        };

    Ok(InvocationArtifacts { output_schema_path })
}

fn write_codex_json_schema() -> Result<PathBuf, CommandError> {
    let path = std::env::temp_dir().join(format!(
        "harness-deck-codex-output-schema-{}-{}.json",
        std::process::id(),
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or_default()
    ));
    std::fs::write(&path, CODEX_JSON_OBJECT_SCHEMA)?;
    Ok(path)
}

fn build_agent_args(invocation: &AgentInvocation, json_schema_path: Option<&Path>) -> Vec<String> {
    adapter_for(invocation.kind).build_args(invocation, json_schema_path)
}

fn run_agent_process(
    kind: AgentKind,
    binary_path: &str,
    args: &[String],
    timeout_secs: u64,
) -> Result<AgentResult, CommandError> {
    let start = Instant::now();

    let mut child = Command::new(binary_path)
        .args(args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| CommandError::subprocess(format!("failed to spawn {:?}: {e}", kind)))?;

    let timeout = Duration::from_secs(timeout_secs);
    let poll_interval = Duration::from_millis(500);

    loop {
        match child.try_wait() {
            Ok(Some(_status)) => break,
            Ok(None) => {
                if start.elapsed() >= timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    let duration_ms = start.elapsed().as_millis() as u64;
                    return Ok(AgentResult {
                        kind,
                        exit_code: -1,
                        stdout: String::new(),
                        stderr: "process timed out".to_string(),
                        parsed_json: None,
                        duration_ms,
                        timed_out: true,
                    });
                }
                std::thread::sleep(poll_interval);
            }
            Err(e) => {
                return Err(CommandError::subprocess(format!(
                    "error waiting for {:?} process: {e}",
                    kind
                )));
            }
        }
    }

    let output = child
        .wait_with_output()
        .map_err(|e| CommandError::subprocess(format!("failed to read output: {e}")))?;

    let duration_ms = start.elapsed().as_millis() as u64;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let exit_code = output.status.code().unwrap_or(-1);
    let parsed_json = serde_json::from_str::<serde_json::Value>(&stdout).ok();

    Ok(AgentResult {
        kind,
        exit_code,
        stdout,
        stderr,
        parsed_json,
        duration_ms,
        timed_out: false,
    })
}

pub fn invoke_agent(invocation: AgentInvocation) -> Result<AgentResult, CommandError> {
    let availability = detect_agent(invocation.kind);
    let binary_path = availability.binary_path.ok_or_else(|| {
        CommandError::subprocess(format!(
            "{:?} CLI not found on this machine",
            invocation.kind
        ))
    })?;

    let artifacts = prepare_invocation_artifacts(&invocation)?;
    let args = build_agent_args(&invocation, artifacts.output_schema_path.as_deref());

    run_agent_process(
        invocation.kind,
        &binary_path,
        &args,
        invocation.timeout_secs,
    )
}

#[cfg(test)]
mod tests {
    use super::{build_agent_args, prepare_invocation_artifacts};
    use crate::domain::byoa::{AgentInvocation, AgentKind};
    use std::path::Path;

    fn invocation(kind: AgentKind) -> AgentInvocation {
        AgentInvocation {
            kind,
            prompt: "Return JSON only.".into(),
            timeout_secs: 1,
            request_json_output: true,
        }
    }

    #[test]
    fn codex_args_use_current_exec_cli_and_safe_defaults() {
        let schema_path = Path::new("/tmp/practice-schema.json");
        let args = build_agent_args(&invocation(AgentKind::Codex), Some(schema_path));

        assert_eq!(args[0], "exec");
        assert!(args.contains(&"--ephemeral".to_string()));
        assert!(args.contains(&"--ignore-rules".to_string()));
        assert!(args.contains(&"--skip-git-repo-check".to_string()));
        assert!(args
            .windows(2)
            .any(|pair| pair == ["--sandbox", "read-only"]));
        assert!(args
            .windows(2)
            .any(|pair| pair == ["--output-schema", "/tmp/practice-schema.json"]));
        assert_eq!(args.last().map(String::as_str), Some("Return JSON only."));
        assert!(!args.contains(&"-q".to_string()));
        assert!(!args.contains(&"--prompt".to_string()));
        assert!(!args.contains(&"--json".to_string()));
        assert!(!args.contains(&"--ask-for-approval".to_string()));
    }

    #[test]
    fn claude_args_preserve_print_json_mode() {
        let args = build_agent_args(&invocation(AgentKind::Claude), None);

        assert_eq!(
            args,
            vec![
                "--print",
                "-p",
                "Return JSON only.",
                "--output-format",
                "json",
            ]
        );
    }

    #[test]
    fn codex_json_invocation_prepares_temporary_schema_file() {
        let invocation = invocation(AgentKind::Codex);
        let artifacts = prepare_invocation_artifacts(&invocation).expect("prepare artifacts");
        let path = artifacts.output_schema_path.as_ref().expect("schema path");
        let content = std::fs::read_to_string(path).expect("schema file");

        assert!(content.contains("\"type\": \"object\""));
    }

    #[test]
    fn claude_json_invocation_does_not_prepare_codex_schema() {
        let invocation = invocation(AgentKind::Claude);
        let artifacts = prepare_invocation_artifacts(&invocation).expect("prepare artifacts");

        assert!(artifacts.output_schema_path.is_none());
    }
}
