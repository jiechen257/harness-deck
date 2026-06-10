use rusqlite::params;

use crate::domain::errors::CommandError;
use crate::domain::source_config::SourceConfig;
use super::Database;

impl Database {
    pub fn upsert_source_config(
        &self, id: &str, name: &str, source_type: &str, source_tier: &str, url: Option<&str>,
    ) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "INSERT INTO source_configs (id, name, source_type, source_tier, url, enabled, auto_refresh, updated_at)
             VALUES (?1,?2,?3,?4,?5,0,0,?6)
             ON CONFLICT(id) DO UPDATE SET name=?2, source_type=?3, source_tier=?4, url=?5, updated_at=?6",
            params![id, name, source_type, source_tier, url, now],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }

    pub fn get_source_config(&self, id: &str) -> Result<Option<SourceConfig>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, name, source_type, source_tier, url, enabled, auto_refresh, updated_at FROM source_configs WHERE id = ?1"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let mut rows = stmt.query_map(params![id], |row| Ok(SourceConfig {
            id: row.get(0)?,
            name: row.get(1)?,
            source_type: row.get(2)?,
            source_tier: row.get(3)?,
            url: row.get(4)?,
            enabled: row.get::<_, i32>(5)? != 0,
            auto_refresh: row.get::<_, i32>(6)? != 0,
            updated_at: row.get(7)?,
        })).map_err(|e| CommandError::storage(e.to_string()))?;
        match rows.next() {
            Some(Ok(c)) => Ok(Some(c)),
            Some(Err(e)) => Err(CommandError::storage(e.to_string())),
            None => Ok(None),
        }
    }

    pub fn list_source_configs(&self) -> Result<Vec<SourceConfig>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, name, source_type, source_tier, url, enabled, auto_refresh, updated_at FROM source_configs ORDER BY name"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt.query_map([], |row| Ok(SourceConfig {
            id: row.get(0)?,
            name: row.get(1)?,
            source_type: row.get(2)?,
            source_tier: row.get(3)?,
            url: row.get(4)?,
            enabled: row.get::<_, i32>(5)? != 0,
            auto_refresh: row.get::<_, i32>(6)? != 0,
            updated_at: row.get(7)?,
        })).map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn set_source_enabled(&self, id: &str, enabled: bool) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "UPDATE source_configs SET enabled = ?1, updated_at = ?2 WHERE id = ?3",
            params![enabled as i32, now, id],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }

    pub fn set_source_auto_refresh(&self, id: &str, auto_refresh: bool) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "UPDATE source_configs SET auto_refresh = ?1, updated_at = ?2 WHERE id = ?3",
            params![auto_refresh as i32, now, id],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }
}
