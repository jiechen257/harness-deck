use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppStatus {
    pub app_name: &'static str,
    pub version: &'static str,
    pub locale_default: &'static str,
    pub theme_default: &'static str,
    pub fixture_mode: bool,
    pub real_writes_enabled: bool,
    pub phase: &'static str,
}

impl AppStatus {
    pub fn phase_zero() -> Self {
        Self {
            app_name: "HarnessDeck",
            version: env!("CARGO_PKG_VERSION"),
            locale_default: "zh-CN",
            theme_default: "light",
            fixture_mode: true,
            real_writes_enabled: false,
            phase: "implementation-design-phase-0",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::AppStatus;

    #[test]
    fn phase_zero_status_uses_safe_defaults() {
        let status = AppStatus::phase_zero();

        assert_eq!(status.locale_default, "zh-CN");
        assert_eq!(status.theme_default, "light");
        assert!(status.fixture_mode);
        assert!(!status.real_writes_enabled);
    }
}
