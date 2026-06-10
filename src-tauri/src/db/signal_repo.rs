use rusqlite::params;

use crate::domain::errors::CommandError;
use crate::domain::signal::{SignalCard, NewSignalCard};
use super::Database;

impl Database {
    pub fn insert_signal(&self, s: &NewSignalCard) -> Result<SignalCard, CommandError> {
        let id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "INSERT INTO signal_cards (id, title, source_url, source_tier, signal_type, impact, confidence, excerpt, published_at, fetched_at, status, created_at, updated_at)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)",
            params![id, s.title, s.source_url, s.source_tier, s.signal_type, s.impact, s.confidence, s.excerpt, s.published_at, s.fetched_at, "inbox", now, now],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        self.get_signal(&id)
    }

    pub fn get_signal(&self, id: &str) -> Result<SignalCard, CommandError> {
        self.conn().query_row(
            "SELECT id, title, source_url, source_tier, signal_type, impact, confidence, excerpt, published_at, fetched_at, status, created_at, updated_at FROM signal_cards WHERE id = ?1",
            params![id],
            |row| Ok(SignalCard {
                id: row.get(0)?,
                title: row.get(1)?,
                source_url: row.get(2)?,
                source_tier: row.get(3)?,
                signal_type: row.get(4)?,
                impact: row.get(5)?,
                confidence: row.get(6)?,
                excerpt: row.get(7)?,
                published_at: row.get(8)?,
                fetched_at: row.get(9)?,
                status: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            }),
        ).map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn list_signals(&self) -> Result<Vec<SignalCard>, CommandError> {
        let mut stmt = self.conn().prepare(
            "SELECT id, title, source_url, source_tier, signal_type, impact, confidence, excerpt, published_at, fetched_at, status, created_at, updated_at FROM signal_cards ORDER BY created_at DESC"
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        let rows = stmt.query_map([], |row| Ok(SignalCard {
            id: row.get(0)?,
            title: row.get(1)?,
            source_url: row.get(2)?,
            source_tier: row.get(3)?,
            signal_type: row.get(4)?,
            impact: row.get(5)?,
            confidence: row.get(6)?,
            excerpt: row.get(7)?,
            published_at: row.get(8)?,
            fetched_at: row.get(9)?,
            status: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })).map_err(|e| CommandError::storage(e.to_string()))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| CommandError::storage(e.to_string()))
    }

    pub fn update_signal_status(&self, id: &str, status: &str) -> Result<(), CommandError> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute(
            "UPDATE signal_cards SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![status, now, id],
        ).map_err(|e| CommandError::storage(e.to_string()))?;
        Ok(())
    }
}
