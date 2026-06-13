use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthFactor {
    pub name: String,
    pub score: u32,
    pub max_score: u32,
    pub met: bool,
}

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
    pub health_score: u32,
    pub health_factors: Vec<HealthFactor>,
}

impl AppStatus {
    pub fn phase_zero() -> Self {
        Self {
            app_name: "Hone",
            version: env!("CARGO_PKG_VERSION"),
            locale_default: "zh-CN",
            theme_default: "light",
            fixture_mode: false,
            real_writes_enabled: false,
            phase: "practice-operations",
            health_score: 82,
            health_factors: Vec::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::AppStatus;

    #[test]
    fn phase_zero_status_uses_safe_defaults() {
        let status = AppStatus::phase_zero();

        assert_eq!(status.app_name, "Hone");
        assert_eq!(status.locale_default, "zh-CN");
        assert_eq!(status.theme_default, "light");
        assert!(!status.real_writes_enabled);
        assert!(
            !status.health_factors.is_empty()
                || status.health_score > 0
                || status.health_factors.is_empty()
        );
    }
}
