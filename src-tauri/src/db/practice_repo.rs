use rusqlite::params;

use crate::domain::errors::CommandError;
use crate::domain::practice::{PracticeCard, NewPracticeCard};
use super::Database;

impl Database {
    pub fn insert_practice(&self, p: &NewPracticeCard) -> Result<PracticeCard, CommandError> {
        let id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "INSERT INTO practice_cards (id, title, practice_type, summary, scenarios, comparable, applicability, generated_by, status, created_at, updated_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![id, p.title, p.practice_type, p.summary, p.scenarios, p.comparable, p.applicability, p.generated_by, "draft", now, now],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        self.get_practice(&id)
    }

    pub fn get_practice(&self, id: &str) -> Result<PracticeCard, CommandError> {
        self.conn().query_row(
            "SELECT id, title, practice_type, summary, scenarios, comparable, applicability, generated_by, status, created_at, updated_at FROM practice_cards WHERE id = ?1",
            params![id],
            |row| Ok(PracticeCard {
                id: row.get(0)?,
                title: row.get(1)?,
                practice_type: row.get(2)?,
                summary: row.get(3)?,
                scenarios: row.get(4)?,
                comparable: row.get(5)?,
                applicability: row.get(6)?,
                generated_by: row.get(7)?,
                status: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            }),
        ).map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn list_practices(&self) -> Result<Vec<PracticeCard>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, title, practice_type, summary, scenarios, comparable, applicability, generated_by, status, created_at, updated_at FROM practice_cards ORDER BY created_at DESC"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt.query_map([], |row| Ok(PracticeCard {
            id: row.get(0)?,
            title: row.get(1)?,
            practice_type: row.get(2)?,
            summary: row.get(3)?,
            scenarios: row.get(4)?,
            comparable: row.get(5)?,
            applicability: row.get(6)?,
            generated_by: row.get(7)?,
            status: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })).map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn link_signal_to_practice(&self, signal_id: &str, practice_id: &str) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "INSERT OR IGNORE INTO signal_practice_links (signal_id, practice_id, created_at) VALUES (?1, ?2, ?3)",
            params![signal_id, practice_id, now],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }

    pub fn update_practice_status(&self, id: &str, status: &str) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "UPDATE practice_cards SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![status, now, id],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }
}
