use std::path::PathBuf;

use crate::domain::errors::CommandError;

pub trait TargetAdapter: Send + Sync {
    fn kind(&self) -> &str;
    fn display_name(&self) -> &str;
    fn skills_dir(&self) -> Option<PathBuf>;
    fn config_dir(&self) -> Option<PathBuf>;
    fn is_available(&self) -> bool;
}

pub struct ClaudeCodeAdapter;

impl TargetAdapter for ClaudeCodeAdapter {
    fn kind(&self) -> &str { "claude_code" }
    fn display_name(&self) -> &str { "Claude Code" }
    fn skills_dir(&self) -> Option<PathBuf> { dirs::home_dir().map(|h| h.join(".claude").join("skills")) }
    fn config_dir(&self) -> Option<PathBuf> { dirs::home_dir().map(|h| h.join(".claude")) }
    fn is_available(&self) -> bool { self.config_dir().map(|p| p.is_dir()).unwrap_or(false) }
}

pub struct CodexAdapter;

impl TargetAdapter for CodexAdapter {
    fn kind(&self) -> &str { "codex" }
    fn display_name(&self) -> &str { "Codex" }
    fn skills_dir(&self) -> Option<PathBuf> { dirs::home_dir().map(|h| h.join(".codex").join("skills")) }
    fn config_dir(&self) -> Option<PathBuf> { dirs::home_dir().map(|h| h.join(".codex")) }
    fn is_available(&self) -> bool { self.config_dir().map(|p| p.is_dir()).unwrap_or(false) }
}

pub fn get_adapter(target_kind: &str) -> Result<Box<dyn TargetAdapter>, CommandError> {
    match target_kind {
        "claude_code" => Ok(Box::new(ClaudeCodeAdapter)),
        "codex" => Ok(Box::new(CodexAdapter)),
        _ => Err(CommandError::validation(format!("unknown target kind: {target_kind}"))),
    }
}

pub fn all_adapters() -> Vec<Box<dyn TargetAdapter>> {
    vec![Box::new(ClaudeCodeAdapter), Box::new(CodexAdapter)]
}
