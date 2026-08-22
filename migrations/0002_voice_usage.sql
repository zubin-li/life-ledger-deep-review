CREATE TABLE IF NOT EXISTS voice_usage (
  key_hash TEXT NOT NULL,
  usage_day TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  reserved_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (key_hash, usage_day)
);

CREATE INDEX IF NOT EXISTS idx_voice_usage_updated_at ON voice_usage(updated_at);
