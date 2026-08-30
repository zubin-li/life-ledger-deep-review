CREATE TABLE IF NOT EXISTS photo_attachments (
  id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER NOT NULL DEFAULT 0,
  height INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photo_attachments_date
  ON photo_attachments(key_hash, entry_date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS photo_usage (
  key_hash TEXT PRIMARY KEY,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
