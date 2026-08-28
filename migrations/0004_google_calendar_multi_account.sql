CREATE TABLE IF NOT EXISTS calendar_connections (
  connection_id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google',
  provider_account_id TEXT NOT NULL,
  account_label TEXT NOT NULL DEFAULT 'Google Calendar',
  encrypted_refresh_token TEXT NOT NULL,
  token_nonce TEXT NOT NULL,
  scopes TEXT NOT NULL,
  selected_calendar_ids TEXT NOT NULL DEFAULT '[]',
  hide_recurring INTEGER NOT NULL DEFAULT 1,
  connected_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (key_hash, provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_identity
  ON calendar_connections(key_hash, updated_at DESC);

INSERT OR IGNORE INTO calendar_connections (
  connection_id, key_hash, provider, provider_account_id, account_label,
  encrypted_refresh_token, token_nonce, scopes, selected_calendar_ids,
  hide_recurring, connected_at, updated_at
)
SELECT
  'legacy-' || substr(key_hash, 1, 24), key_hash, provider,
  'legacy:' || key_hash, 'Google Calendar', encrypted_refresh_token,
  token_nonce, scopes, selected_calendar_ids, hide_recurring,
  connected_at, updated_at
FROM calendar_accounts;

CREATE TABLE IF NOT EXISTS calendar_event_cache_v2 (
  key_hash TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  account_label TEXT NOT NULL DEFAULT 'Google Calendar',
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
  PRIMARY KEY (key_hash, connection_id, calendar_id, instance_key)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_cache_v2_range
  ON calendar_event_cache_v2(key_hash, start_date);

INSERT OR IGNORE INTO calendar_event_cache_v2 (
  key_hash, connection_id, account_label, calendar_id, instance_key,
  provider_event_id, title, start_value, end_value, start_date,
  all_day, recurring, calendar_name, calendar_color,
  provider_updated_at, synced_at
)
SELECT
  cache.key_hash,
  'legacy-' || substr(cache.key_hash, 1, 24),
  'Google Calendar',
  cache.calendar_id,
  cache.instance_key,
  cache.provider_event_id,
  cache.title,
  cache.start_value,
  cache.end_value,
  cache.start_date,
  cache.all_day,
  cache.recurring,
  cache.calendar_name,
  cache.calendar_color,
  cache.provider_updated_at,
  cache.synced_at
FROM calendar_event_cache AS cache;
