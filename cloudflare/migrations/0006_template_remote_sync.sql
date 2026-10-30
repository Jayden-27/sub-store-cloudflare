-- Let a template refresh its config from a remote URL so rule-set fixes can
-- reach existing deployments without redeploying the Worker.
-- remote_url NULL = use the built-in default URL; '' = sync disabled.
ALTER TABLE templates ADD COLUMN remote_url TEXT;
ALTER TABLE templates ADD COLUMN synced_config_hash TEXT;
ALTER TABLE templates ADD COLUMN last_synced_at INTEGER;
ALTER TABLE templates ADD COLUMN sync_error TEXT;
