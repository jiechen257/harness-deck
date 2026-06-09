use crate::domain::crawl::{InstallRequest, InstallResult};
use crate::domain::errors::CommandError;
use crate::services::target_adapter;

pub fn install_skill(request: InstallRequest) -> Result<InstallResult, CommandError> {
    let adapter = target_adapter::get_adapter(&request.target);

    let content = format!(
        "# {}\n\nInstalled from: {}\n\nInstalled by Hone.\n",
        request.skill_name, request.source_url
    );

    let installed_path = adapter.install_skill(&request.skill_name, &content)?;

    Ok(InstallResult {
        success: true,
        target: request.target,
        installed_path,
        message: format!("Skill '{}' installed successfully", request.skill_name),
    })
}
