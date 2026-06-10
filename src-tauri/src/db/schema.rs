pub const MIGRATIONS: &[&str] = &[CREATE_TABLES];

const CREATE_TABLES: &str = "
CREATE TABLE IF NOT EXISTS signal_cards (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  source_url    TEXT,
  source_tier   TEXT NOT NULL CHECK(source_tier IN ('official','maintainer','community')),
  signal_type   TEXT NOT NULL CHECK(signal_type IN ('changelog','model_news','community_discussion','product_update')),
  impact        TEXT NOT NULL DEFAULT 'medium' CHECK(impact IN ('high','medium','low')),
  confidence    TEXT NOT NULL DEFAULT 'unverified' CHECK(confidence IN ('confirmed','unverified','community_reported')),
  excerpt       TEXT,
  published_at  TEXT,
  fetched_at    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'inbox' CHECK(status IN ('inbox','processing','normalized','archived','dismissed')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS practice_cards (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  practice_type TEXT NOT NULL CHECK(practice_type IN ('product','skill','mcp','workflow','methodology')),
  summary       TEXT,
  scenarios     TEXT,
  comparable    TEXT,
  applicability TEXT,
  generated_by  TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','adoptable','applied','outdated','archived')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS signal_practice_links (
  signal_id   TEXT NOT NULL REFERENCES signal_cards(id),
  practice_id TEXT NOT NULL REFERENCES practice_cards(id),
  created_at  TEXT NOT NULL,
  PRIMARY KEY (signal_id, practice_id)
);

CREATE TABLE IF NOT EXISTS local_assets (
  id              TEXT PRIMARY KEY,
  practice_id     TEXT REFERENCES practice_cards(id),
  asset_type      TEXT NOT NULL CHECK(asset_type IN ('skill','mcp_config','rule','hook','agent_profile_fragment')),
  registry_path   TEXT NOT NULL,
  checksum        TEXT,
  is_system       INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','pending','broken','archived')),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projections (
  id            TEXT PRIMARY KEY,
  asset_id      TEXT NOT NULL REFERENCES local_assets(id),
  target_kind   TEXT NOT NULL CHECK(target_kind IN ('claude_code','codex')),
  target_path   TEXT NOT NULL,
  mode          TEXT NOT NULL DEFAULT 'symlink' CHECK(mode IN ('symlink','copy')),
  status        TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','active','broken','drifted','removed')),
  last_checked  TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS operations_scripts (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  path        TEXT NOT NULL,
  description TEXT,
  risk_level  TEXT NOT NULL DEFAULT 'medium' CHECK(risk_level IN ('low','medium','high')),
  status      TEXT NOT NULL DEFAULT 'registered' CHECK(status IN ('registered','running','idle','disabled')),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  detail      TEXT,
  outcome     TEXT NOT NULL DEFAULT 'success' CHECK(outcome IN ('success','failure','skipped','cancelled')),
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_events(created_at);

CREATE TABLE IF NOT EXISTS registry_connections (
  id            TEXT PRIMARY KEY,
  path          TEXT NOT NULL,
  registry_type TEXT NOT NULL DEFAULT 'user' CHECK(registry_type IN ('user','starter','initialized')),
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS authorization_state (
  scope       TEXT PRIMARY KEY CHECK(scope IN ('registry','local_read','external_signals','write_projection','script_execution')),
  granted     INTEGER NOT NULL DEFAULT 0,
  granted_at  TEXT,
  revoked_at  TEXT
);

CREATE TABLE IF NOT EXISTS refresh_records (
  id            TEXT PRIMARY KEY,
  source_name   TEXT NOT NULL,
  source_url    TEXT,
  triggered_by  TEXT NOT NULL DEFAULT 'manual' CHECK(triggered_by IN ('manual','scheduled')),
  result_count  INTEGER,
  error_message TEXT,
  outcome       TEXT NOT NULL DEFAULT 'success' CHECK(outcome IN ('success','failure','partial')),
  started_at    TEXT NOT NULL,
  finished_at   TEXT
);
";
