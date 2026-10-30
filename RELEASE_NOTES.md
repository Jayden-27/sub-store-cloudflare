# v1.2.0

Templates you own, and a clearer picture of every subscription.

## Highlights

- Built-in rule templates are seeded into D1 on first upgrade and become normal records: edit, delete, reset to default, or refresh from a remote YAML source.
- Template updates no longer require a Worker release. Built-in templates sync from the repository `config/templates` directory, and upgrades only seed newly added ones.
- The settings page shows template sync state (default / synced / modified / failed) and moves secondary actions into a menu.
- A read-only template source viewer keeps YAML comments for reference.
- Subscriptions now show the last fetch result: last success time, node count, cache hit, or a readable failure reason.
- Added link self-test (nodes, size, duration, preview) and QR codes for client setup.
- Added batch enable, disable, tag, and delete for subscriptions and collections.
- Added an import tool for upstream Sub-Store backups.
- Editor previews now show how many nodes each rule action keeps or removes.
- Download links accept `template` and `filters` overrides.

## Upgrade

Keep the existing Worker, D1 database, and Worker Secrets. Pull the repository, apply the new migrations, and deploy:

```bash
git pull --ff-only
pnpm run build
pnpm run install:cloudflare
```

This release adds three additive D1 migrations:

- `0004_seed_templates.sql` seeds the built-in templates as editable records.
- `0005_source_fetch_status.sql` adds fetch status columns to `sources`.
- `0006_template_remote_sync.sql` adds remote update columns to `templates`.

No data is rewritten or removed. Existing sources, collections, and custom templates are preserved.

If your deployment should use a template mirror, set `SUB_STORE_TEMPLATE_BASE_URL`; leaving it empty keeps templates fully manual.

Deploy Button repository copies do not receive upstream releases automatically. See `docs/upgrading.md` before merging upstream into a deployed copy.
