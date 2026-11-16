-- QA-only schema for .overnight/fakecloud.sh (local Miniflare D1). Not used in production deploy.
CREATE TABLE IF NOT EXISTS states (
  key_hash TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_states_updated_at ON states(updated_at);
