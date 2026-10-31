-- Monotonic server revision used for compare-and-swap state writes.
-- Existing rows become revision 0; payloads are not rewritten.
ALTER TABLE states ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
