CREATE TABLE IF NOT EXISTS states (
  key_hash TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_states_updated_at ON states(updated_at);
