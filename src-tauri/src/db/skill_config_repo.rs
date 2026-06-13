use rusqlite::params;

use super::Database;
use crate::domain::errors::CommandError;
use crate::domain::system_skill::SkillConfig;

impl Database {
    pub fn upsert_skill_config(&self, skill_id: &str, version: &str) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn()
            .execute(
                "INSERT INTO system_skill_configs (skill_id, enabled, version, updated_at)
             VALUES (?1, 1, ?2, ?3)
             ON CONFLICT(skill_id) DO UPDATE SET version = ?2, updated_at = ?3",
                params![skill_id, version, now],
            )
            .map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }

    pub fn get_skill_config(&self, skill_id: &str) -> Result<Option<SkillConfig>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT skill_id, enabled, version, updated_at FROM system_skill_configs WHERE skill_id = ?1"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let mut rows = stmt
            .query_map(params![skill_id], |row| {
                Ok(SkillConfig {
                    skill_id: row.get(0)?,
                    enabled: row.get::<_, i32>(1)? != 0,
                    version: row.get(2)?,
                    updated_at: row.get(3)?,
                })
            })
            .map_err(|e| CommandError::storage(e.to_string()))?;
        match rows.next() {
            Some(Ok(config)) => Ok(Some(config)),
            Some(Err(e)) => Err(CommandError::storage(e.to_string())),
            None => Ok(None),
        }
    }

    pub fn list_skill_configs(&self) -> Result<Vec<SkillConfig>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT skill_id, enabled, version, updated_at FROM system_skill_configs ORDER BY skill_id"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt
            .query_map([], |row| {
                Ok(SkillConfig {
                    skill_id: row.get(0)?,
                    enabled: row.get::<_, i32>(1)? != 0,
                    version: row.get(2)?,
                    updated_at: row.get(3)?,
                })
            })
            .map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn set_skill_enabled(&self, skill_id: &str, enabled: bool) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn()
            .execute(
                "UPDATE system_skill_configs SET enabled = ?1, updated_at = ?2 WHERE skill_id = ?3",
                params![enabled as i32, now, skill_id],
            )
            .map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }
}
