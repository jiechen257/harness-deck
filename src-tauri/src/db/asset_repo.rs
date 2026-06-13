use rusqlite::params;

use super::Database;
use crate::domain::errors::CommandError;
use crate::domain::local_asset::{LocalAsset, NewLocalAsset};

impl Database {
    pub fn insert_asset(&self, a: &NewLocalAsset) -> Result<LocalAsset, CommandError> {
        let id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "INSERT INTO local_assets (id, practice_id, asset_type, registry_path, checksum, is_system, status, created_at, updated_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
            params![id, a.practice_id, a.asset_type, a.registry_path, a.checksum, a.is_system as i32, "ready", now, now],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        self.get_asset(&id)
    }

    pub fn get_asset(&self, id: &str) -> Result<LocalAsset, CommandError> {
        self.conn().query_row(
            "SELECT id, practice_id, asset_type, registry_path, checksum, is_system, status, created_at, updated_at FROM local_assets WHERE id = ?1",
            params![id],
            |row| Ok(LocalAsset {
                id: row.get(0)?,
                practice_id: row.get(1)?,
                asset_type: row.get(2)?,
                registry_path: row.get(3)?,
                checksum: row.get(4)?,
                is_system: row.get::<_, i32>(5)? != 0,
                status: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            }),
        ).map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn list_assets(&self) -> Result<Vec<LocalAsset>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, practice_id, asset_type, registry_path, checksum, is_system, status, created_at, updated_at FROM local_assets ORDER BY created_at DESC"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt
            .query_map([], |row| {
                Ok(LocalAsset {
                    id: row.get(0)?,
                    practice_id: row.get(1)?,
                    asset_type: row.get(2)?,
                    registry_path: row.get(3)?,
                    checksum: row.get(4)?,
                    is_system: row.get::<_, i32>(5)? != 0,
                    status: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })
            .map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn list_assets_by_practice(
        &self,
        practice_id: &str,
    ) -> Result<Vec<LocalAsset>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, practice_id, asset_type, registry_path, checksum, is_system, status, created_at, updated_at FROM local_assets WHERE practice_id = ?1 ORDER BY created_at DESC"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt
            .query_map(params![practice_id], |row| {
                Ok(LocalAsset {
                    id: row.get(0)?,
                    practice_id: row.get(1)?,
                    asset_type: row.get(2)?,
                    registry_path: row.get(3)?,
                    checksum: row.get(4)?,
                    is_system: row.get::<_, i32>(5)? != 0,
                    status: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })
            .map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn update_asset_status(&self, id: &str, status: &str) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn()
            .execute(
                "UPDATE local_assets SET status = ?1, updated_at = ?2 WHERE id = ?3",
                params![status, now, id],
            )
            .map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }
}
