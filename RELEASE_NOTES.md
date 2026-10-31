# v1.3.0

A calmer, more consistent interface — same data, same endpoints.

## Highlights

- A neutral, minimal visual language now runs through every page: subscription list, editor, settings, tools, preview, comparison, icon and tag pickers.
- Shared form and layout primitives (`Field`, `TextInput`, `SelectInput`, `Card`, `ListRow`, `EmptyState`, and more) keep spacing, sizing and focus states consistent.
- Light and dark themes were rebuilt on the new palette, and six extended themes were refreshed to match.
- Settings, editors and tools group related controls into cards with clearer labels, hints and inline errors.
- Framework styles now sit in a cascade layer, so application styles override them cleanly instead of piling up `!important` rules.

## Fixes

- Tertiary text and danger actions now meet WCAG AA contrast in light and dark themes.
- Settings forms switch to a stacked label layout at 520px and below, so labels no longer truncate on phones.
- Repeated notifications are collapsed, and raw network or timeout errors are replaced with readable guidance.
- The batch panel uses a segmented control with an independent close button and consistent fields.
- Swipe actions use neutral surfaces with semantic icons; swipe is disabled in dual-column mode.

## Upgrade

This release contains front-end and API version changes only. No database migrations are required.

```bash
git pull --ff-only
pnpm run build
pnpm run install:cloudflare
```

Existing sources, collections, templates, settings, and share links are untouched. The `check:design` command is available if you customize the UI and want to keep the design-debt budget from growing.
