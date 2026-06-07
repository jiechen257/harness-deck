use std::fs;
use std::path::PathBuf;

use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HarnessDeckPaths {
    pub base: PathBuf,
    pub profiles: PathBuf,
    pub manifests: PathBuf,
    pub backups: PathBuf,
    pub registry_cache: PathBuf,
    pub feed_cache: PathBuf,
}

impl HarnessDeckPaths {
    pub fn for_base(base: PathBuf) -> Self {
        Self {
            profiles: base.join("profiles"),
            manifests: base.join("manifests"),
            backups: base.join("backups"),
            registry_cache: base.join("registry-cache"),
            feed_cache: base.join("feed-cache"),
            base,
        }
    }

    pub fn ensure(&self) -> std::io::Result<()> {
        for path in [
            &self.base,
            &self.profiles,
            &self.manifests,
            &self.backups,
            &self.registry_cache,
            &self.feed_cache,
        ] {
            fs::create_dir_all(path)?;
        }

        Ok(())
    }
}

pub fn paths_for_app(app: &AppHandle) -> Result<HarnessDeckPaths, tauri::Error> {
    Ok(HarnessDeckPaths::for_base(app.path().app_data_dir()?))
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::HarnessDeckPaths;

    #[test]
    fn creates_expected_application_support_directories() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock should be after epoch")
            .as_nanos();
        let base = std::env::temp_dir().join(format!("harnessdeck-paths-{unique}"));

        let paths = HarnessDeckPaths::for_base(base.clone());
        paths.ensure().expect("app paths should be created");

        for child in [
            "profiles",
            "manifests",
            "backups",
            "registry-cache",
            "feed-cache",
        ] {
            assert!(base.join(child).is_dir(), "{child} directory should exist");
        }

        fs::remove_dir_all(base).expect("test directory should be removable");
    }
}
