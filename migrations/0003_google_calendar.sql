CREATE TABLE IF NOT EXISTS calendar_accounts (
  key_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'google',
  encrypted_refresh_token TEXT NOT NULL,
  token_nonce TEXT NOT NULL,
  scopes TEXT NOT NULL,
  selected_calendar_ids TEXT NOT NULL DEFAULT '[]',
  hide_recurring INTEGER NOT NULL DEFAULT 1,
  connected_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_oauth_states (
  state_hash TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  return_to TEXT NOT NULL DEFAULT '/',
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calendar_oauth_states_expiry
  ON calendar_oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS calendar_event_cache (
  key_hash TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  instance_key TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_value TEXT NOT NULL,
  end_value TEXT NOT NULL,
  start_date TEXT NOT NULL,
  all_day INTEGER NOT NULL DEFAULT 0,
  recurring INTEGER NOT NULL DEFAULT 0,
  calendar_name TEXT NOT NULL DEFAULT '',
  calendar_color TEXT NOT NULL DEFAULT '',
  provider_updated_at TEXT NOT NULL DEFAULT '',
  synced_at INTEGER NOT NULL,
  PRIMARY KEY (key_hash, calendar_id, instance_key)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_cache_range
  ON calendar_event_cache(key_hash, start_date);
