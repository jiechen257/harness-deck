use std::process::Command;
use std::time::{Duration, Instant};

use crate::domain::byoa::{AgentAvailability, AgentInvocation, AgentKind, AgentResult};
use crate::domain::errors::CommandError;

pub fn detect_agent(kind: AgentKind) -> AgentAvailability {
    let binary = kind.binary_name();

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
                    if v.is_empty() { None } else { Some(v) }
                } else {
                    None
                }
            })
    });

    let available = binary_path.is_some();

    AgentAvailability {
        kind,
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

pub fn invoke_agent(invocation: AgentInvocation) -> Result<AgentResult, CommandError> {
    let availability = detect_agent(invocation.kind);
    let binary_path = availability
        .binary_path
        .ok_or_else(|| CommandError::subprocess(format!(
            "{:?} CLI not found on this machine",
            invocation.kind
        )))?;

    let args: Vec<String> = match invocation.kind {
        AgentKind::Claude => {
            let mut a = vec![
                "--print".to_string(),
                "-p".to_string(),
                invocation.prompt.clone(),
            ];
            if invocation.request_json_output {
                a.push("--output-format".to_string());
                a.push("json".to_string());
            }
            a
        }
        AgentKind::Codex => {
            let mut a = vec![
                "-q".to_string(),
                "--prompt".to_string(),
                invocation.prompt.clone(),
            ];
            if invocation.request_json_output {
                a.push("--json".to_string());
            }
            a
        }
    };

    let start = Instant::now();

    let mut child = Command::new(&binary_path)
        .args(&args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| CommandError::subprocess(format!("failed to spawn {:?}: {e}", invocation.kind)))?;

    let timeout = Duration::from_secs(invocation.timeout_secs);
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
                        kind: invocation.kind,
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
                    invocation.kind
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
        kind: invocation.kind,
        exit_code,
        stdout,
        stderr,
        parsed_json,
        duration_ms,
        timed_out: false,
    })
}
