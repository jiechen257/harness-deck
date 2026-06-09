use crate::domain::crawl::{InstallRequest, InstallResult, InstallTarget};
use crate::domain::errors::CommandError;

pub fn install_skill(request: InstallRequest) -> Result<InstallResult, CommandError> {
    // Determine target directory
    let home = dirs::home_dir()
        .ok_or_else(|| CommandError::storage("Cannot determine home directory"))?;
    let skills_dir = match request.target {
        InstallTarget::ClaudeCode => home.join(".claude").join("skills"),
        InstallTarget::Codex => home.join(".codex").join("skills"),
    };

    // Sanitize skill name for directory
    let safe_name = request
        .skill_name
        .replace(['/', '\\', ' '], "-")
        .to_lowercase();
    let skill_dir = skills_dir.join(&safe_name);

    // Create directory
    std::fs::create_dir_all(&skill_dir)
        .map_err(|e| CommandError::storage(format!("Failed to create skill directory: {e}")))?;

    // Write SKILL.md
    let content = format!(
        "# {}\n\nInstalled from: {}\n\nInstalled by Hone.\n",
        request.skill_name, request.source_url
    );
    let skill_path = skill_dir.join("SKILL.md");
    std::fs::write(&skill_path, &content)
        .map_err(|e| CommandError::storage(format!("Failed to write SKILL.md: {e}")))?;

    Ok(InstallResult {
        success: true,
        target: request.target,
        installed_path: skill_path.to_string_lossy().to_string(),
        message: format!("Skill '{}' installed successfully", request.skill_name),
    })
}
