use std::path::PathBuf;

use crate::domain::crawl::InstallTarget;
use crate::domain::errors::CommandError;

/// A pluggable adapter for an AI coding tool target (Claude Code, Codex, etc.).
/// Adding support for a new tool requires only implementing this trait and
/// registering the adapter in `get_adapter` / `all_adapters`.
pub trait TargetAdapter: Send + Sync {
    /// Machine-readable identifier, e.g. `"ClaudeCode"` or `"Codex"`.
    fn kind(&self) -> &str;

    /// Human-readable name shown in the UI.
    fn display_name(&self) -> &str;

    /// Directory where skills are stored, e.g. `~/.claude/skills/`.
    fn skills_dir(&self) -> Option<PathBuf>;

    /// Root config directory, e.g. `~/.claude/`.
    fn config_dir(&self) -> Option<PathBuf>;

    /// Whether the target is installed on this machine (config dir exists).
    fn is_available(&self) -> bool;

    /// Install a skill by writing `SKILL.md` into the target's skills directory.
    /// Returns the absolute path to the created file.
    fn install_skill(&self, name: &str, content: &str) -> Result<String, CommandError>;

    /// List the names of skills currently installed in the target's skills directory.
    fn list_installed_skills(&self) -> Vec<String>;
}

// ---------------------------------------------------------------------------
// Claude Code adapter
// ---------------------------------------------------------------------------

pub struct ClaudeCodeAdapter;

impl TargetAdapter for ClaudeCodeAdapter {
    fn kind(&self) -> &str {
        "ClaudeCode"
    }

    fn display_name(&self) -> &str {
        "Claude Code"
    }

    fn skills_dir(&self) -> Option<PathBuf> {
        dirs::home_dir().map(|h| h.join(".claude").join("skills"))
    }

    fn config_dir(&self) -> Option<PathBuf> {
        dirs::home_dir().map(|h| h.join(".claude"))
    }

    fn is_available(&self) -> bool {
        self.config_dir()
            .map(|p| p.is_dir())
            .unwrap_or(false)
    }

    fn install_skill(&self, name: &str, content: &str) -> Result<String, CommandError> {
        install_skill_to(self, name, content)
    }

    fn list_installed_skills(&self) -> Vec<String> {
        list_skills_in(self)
    }
}

// ---------------------------------------------------------------------------
// Codex adapter
// ---------------------------------------------------------------------------

pub struct CodexAdapter;

impl TargetAdapter for CodexAdapter {
    fn kind(&self) -> &str {
        "Codex"
    }

    fn display_name(&self) -> &str {
        "Codex"
    }

    fn skills_dir(&self) -> Option<PathBuf> {
        dirs::home_dir().map(|h| h.join(".codex").join("skills"))
    }

    fn config_dir(&self) -> Option<PathBuf> {
        dirs::home_dir().map(|h| h.join(".codex"))
    }

    fn is_available(&self) -> bool {
        self.config_dir()
            .map(|p| p.is_dir())
            .unwrap_or(false)
    }

    fn install_skill(&self, name: &str, content: &str) -> Result<String, CommandError> {
        install_skill_to(self, name, content)
    }

    fn list_installed_skills(&self) -> Vec<String> {
        list_skills_in(self)
    }
}

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

/// Return the adapter for a given `InstallTarget`.
pub fn get_adapter(target: &InstallTarget) -> Box<dyn TargetAdapter> {
    match target {
        InstallTarget::ClaudeCode => Box::new(ClaudeCodeAdapter),
        InstallTarget::Codex => Box::new(CodexAdapter),
    }
}

/// Return adapters for every known target.
pub fn all_adapters() -> Vec<Box<dyn TargetAdapter>> {
    vec![Box::new(ClaudeCodeAdapter), Box::new(CodexAdapter)]
}

// ---------------------------------------------------------------------------
// Shared implementation helpers (avoid duplicating across adapters)
// ---------------------------------------------------------------------------

fn install_skill_to(
    adapter: &dyn TargetAdapter,
    name: &str,
    content: &str,
) -> Result<String, CommandError> {
    let skills_dir = adapter
        .skills_dir()
        .ok_or_else(|| CommandError::storage("Cannot determine home directory"))?;

    let safe_name = name
        .replace(['/', '\\', ' '], "-")
        .to_lowercase();
    let skill_dir = skills_dir.join(&safe_name);

    std::fs::create_dir_all(&skill_dir)
        .map_err(|e| CommandError::storage(format!("Failed to create skill directory: {e}")))?;

    let skill_path = skill_dir.join("SKILL.md");
    std::fs::write(&skill_path, content)
        .map_err(|e| CommandError::storage(format!("Failed to write SKILL.md: {e}")))?;

    Ok(skill_path.to_string_lossy().to_string())
}

fn list_skills_in(adapter: &dyn TargetAdapter) -> Vec<String> {
    let Some(skills_dir) = adapter.skills_dir() else {
        return Vec::new();
    };

    let entries = match std::fs::read_dir(&skills_dir) {
        Ok(entries) => entries,
        Err(_) => return Vec::new(),
    };

    let mut names: Vec<String> = entries
        .flatten()
        .filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
        .filter(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            !name.starts_with('.')
        })
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect();

    names.sort();
    names
}
