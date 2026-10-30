-- Track the last fetch outcome per source so the UI can show freshness,
-- cache fallback, and fetch errors instead of failing silently.
-- NULL means "never fetched"; they are cleared when a source is edited.
ALTER TABLE sources ADD COLUMN last_fetched_at INTEGER;
ALTER TABLE sources ADD COLUMN last_error TEXT;
ALTER TABLE sources ADD COLUMN last_node_count INTEGER;
ALTER TABLE sources ADD COLUMN last_cache_status TEXT;
