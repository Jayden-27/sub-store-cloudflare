# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning where practical.

## [Unreleased]

## [1.3.0] - 2026-10-31

### Changed

- Redesigned the whole interface around a neutral, minimal visual language: tokenised spacing, type, radius and semantic colours; reusable `Field`, `TextInput`, `NumberInput`, `SelectInput`, `CheckRow`, `Card`, `ListRow`, `TriggerRow` and `EmptyState` primitives; and refreshed light, dark and six extended themes.
- Migrated the subscription list, editor, settings, tools, preview, comparison, icon and tag pickers, and the UI kit page (`/dev/ui`) to the new system.
- Grouped related controls into cards with consistent 56px rows, inline hints and field-level error text.
- Moved NutUI styles into a cascade layer so application styles win without `!important`, cutting the design-debt budget and component-level colour literals.
- Settings now show the project logo for the Cloudflare backend and keep avatars within a fixed size.

### Fixed

- Raised text contrast to WCAG AA: light tertiary text is now `#6B707C`, light danger actions `#C7453F`, and dark tertiary text `#9297A3`.
- Form labels no longer truncate on narrow screens: inline fields switch to a stacked layout at 520px and below.
- Identical notifications within five seconds are collapsed, and raw network or timeout errors are translated into actionable messages.
- Redesigned the batch panel with a segmented type switch, an independent close control and consistent input styling.
- Swipe actions now use neutral surfaces with semantic icon colours, and swipe is disabled in dual-column mode to avoid gesture conflicts.
- Restored the release checks: the open-source guard no longer flags the icon-collection picker that was re-ported from upstream, and the worker startup smoke test tears down the whole `wrangler dev` process tree so it exits instead of hanging on Windows.

## [1.2.0] - 2026-10-31

### Added

- Added sing-box routing templates with target isolation and deep outbound merging.
- Added unsaved-change guards, route-leave protection, and accessible keyboard and focus handling for dialogs and primary actions.
- Added resource dropdowns and inline validation for scoped share links and request settings.
- Added a build-time client-fingerprint operator for supported TLS proxy nodes.
- Added smart node import for URI, Base64, Mihomo YAML, and JSON content with region preview, duplicate detection, and transactional source merging.
- Smart import now infers regions from flags, names, and endpoint labels, and requires manual target selection for unrecognized regions.
- Built-in rule templates are now seeded into D1 and owned by the user: edit, delete, reset to default, or refresh from a remote YAML source.
- Added a read-only template source viewer that preserves YAML comments.
- Added per-source fetch status (last success, node count, cache hit, failure reason) to the subscription list.
- Added subscription link self-test returning node count, size, duration, and a content preview.
- Added QR codes for download links.
- Added batch enable, disable, tag, and delete for subscriptions and collections.
- Added import of upstream Sub-Store backups, migrating sources, collections, and supported node actions with a preview step.
- Added per-action node counts to editor previews.
- Added `template` and `filters` overrides to download links.
- Added readable fetch error classification for DNS, timeout, TLS, and HTTP status failures.

### Changed

- Preserved template top-level field order in generated Mihomo YAML.
- Aligned the default UI layout at an 800px centered desktop width and refined template editing dialogs.
- Improved download error classification with explicit 422, 502, and 504 responses.
- Template updates are decoupled from Worker releases: built-in templates refresh from `config/templates` and upgrades only seed new ones.
- The template list shows sync state (default, synced, modified, failed) and moves secondary actions into a menu.

### Fixed

- Prevented deletion of templates that are still referenced by collections and linked the warning to the affected collections.
- Restored default icons, fixed CSP blocking for HTTPS icons, and improved icon repository validation.
- Added restore previews and clearer empty, loading, and failure states.
- Fixed Windows front-end builds failing on POSIX-style environment prefixes.
- Fixed Wrangler version drift caused by the nested workspace configuration.

### Documentation

- Reorganized the README as an independent project homepage and aligned repository links and package metadata with the standalone repository.
- Documented template remote sync, download link overrides, link self-test, and the explicit local migration step.

## [1.1.0] - 2026-07-11

### Added

- Added a guided interactive CLI setup, an explicit empty quick-install mode, and cross-platform deployment token generation.
- Added a first-run admin checklist for Source, Collection, and client-link creation.
- Added five-minute quick-start and upgrade guides for Deploy Button, Agent/CLI, D1 migrations, backup, and rollback.
- Added installer helper tests and a deployment-experience release check.

### Changed

- Rebuilt the Chinese and English README files around a three-step ordinary-user deployment path.
- Non-interactive installs without private setup now stop before deployment instead of risking example source import.
- Deploy Button documentation now explains repository copies, required secrets, and upstream upgrade behavior.

### Security

- Removed the root `.dev.vars.example` that caused Cloudflare's Deploy form to prefill public placeholder values for required Worker Secrets.

## [1.0.0] - 2026-07-11

### Added

- Added JSON5 subscription input, a distinct Surge Mac output target, and structured Snell, SSH, and HTTP/2 CONNECT client-line compatibility.
- Added authenticated one-shot proxy/subscription conversion and Mihomo, Surge, Loon, and Quantumult X rule conversion APIs plus an admin Tools page.
- Added allowlisted remote subscription metadata propagation, hashed Cache API keys, configurable edge-cache TTL, forced refresh, conditional requests, and stale-on-error fallback.
- Added scoped download grants with one-time plaintext tokens, D1-stored SHA-256 hashes, target restrictions, expiration, revocation, and deployment-token compatibility.
- Added a bounded 50-entry recycle bin for deleted sources, collections, custom templates, and scoped download grants.
- Added configurable HTTPS node IP, location, organization, and ASN lookup from the preview node panel.
- Added an upstream compatibility matrix and a D1 migration for the new compatibility resources.

### Changed

- Repositioned the project as a tested Cloudflare-native compatibility edition while keeping Workers Static Assets + Worker API + D1 + Worker Secrets.
- Updated product and Agent boundaries to preserve scoped private links and the bounded recycle bin while continuing to reject public sharing, unbounded archives, runtime scripts, files, artifacts, queues, cron, and persistent logs.
- Download responses now propagate safe subscription metadata and expose a non-sensitive edge-cache status header.

### Verification

- Added rule conversion, JSON5, Surge Mac, response metadata, scoped authorization, and recycle/restore tests.
- Kept the full release gate, dry-run bundle measurement, startup profiling, and deployed smoke verification as release requirements.

## [0.3.0] - 2026-07-11

### Added

- Added build-time JavaScript Filter / Operator support without runtime `eval()` or `new Function()`.
- Added code-owned script metadata at `/api/scripts`, metadata-driven admin UI controls, and two Free-verified built-ins: TLS fingerprint and name regex filter.
- Added gitignored personal script manifests and source directories that the Agent/CLI installer compiles into the Worker registry.
- Added Worker/D1 integration coverage for script metadata, validation, execution, arguments, unavailable scripts, and per-stage limits.

### Changed

- Aligned source and collection validation, immutable IDs, partial updates, and empty-collection membership semantics across the Worker, frontend, installer, and documentation.
- Removed the advertised `surge-mac` target because it had no independent renderer; use `surge` or a supported YAML target instead.

### Documentation

- Documented Free-compatible build-time JavaScript filters and operators, personal deployment steps, upstream compatibility levels, security boundaries, and performance gates.

## [0.2.0] - 2026-07-10

### Added

- Added Workers runtime and D1 migration integration tests for auth, storage restore, downloads, parsers, and payload limits.
- Added a real `wrangler dev` startup smoke test and production dependency audits to the release gate.
- Added bounded readers for API bodies, remote subscriptions, flow metadata, and DoH responses.

### Changed

- Moved built-in routing templates from D1 seed rows into Worker-owned code so template fixes reach existing deployments immediately.
- Removed request-time schema creation and default seeding; D1 migrations are now the only schema path.
- Consolidated the repository into one pnpm workspace and one root lockfile.
- Updated Wrangler, Workers types, Hono, Axios, Vite, Vue tooling, TypeScript, and YAML dependencies.
- Lazy-loaded the settings route and CodeMirror editor, and removed redundant precompression output.
- Updated Wrangler compatibility settings to `2026-07-08` with `nodejs_compat` across all generated and checked configs.

### Security

- Added CSP, frame denial, no-referrer, no-sniff, and permissions-policy response headers.
- Changed unhandled failures to structured server logs plus generic client-facing 500 responses.
- Removed the admin token from the browser URL after ingest and changed backup export to authenticated blob download.
- Stopped the installer from printing private D1 database IDs and strengthened ignored-file privacy verification.

### Documentation

- Documented the new runtime limits, code-owned template model, release checks, and header-authenticated backup export.

## [0.1.1] - 2026-06-28

### Changed

- Removed repository GitHub Actions and Dependabot so the upstream project does not depend on GitHub automation.
- Kept lightweight GitHub issue forms and a pull request template for contributor intake; they do not run CI/CD.
- Clarified that the Cloudflare Deploy Button is the Cloudflare-hosted template import path, while `pnpm run install:cloudflare` is the local Agent/CLI deployment path.
- Updated Worker compatibility dates and documented the Node 22 + pnpm local development baseline.

### Verification

- Local release checks and Wrangler dry-run deployment remain the release gate.

## [0.1.0] - 2026-06-28

### Added

- Cloudflare-native Worker application with Static Assets, Worker API, D1, and Worker Secrets.
- Source and collection management for remote subscription URLs and local node text.
- Node filters for include/exclude, rename, delete-field, dedupe, sort, regex-sort, flag handling, quick options, and DNS resolve workflows.
- Built-in routing templates for Mihomo-compatible YAML output.
- Output targets for Mihomo, Stash, Surge, Surfboard, Loon, Egern, Shadowrocket, Quantumult X, sing-box, v2ray, URI, and JSON.
- Preview, backup/restore, temporary `url` / `content` / `ua` conversion parameters, and subscription usage metadata.
- Deploy to Cloudflare button support with root `wrangler.jsonc`.
- Agent/CLI installer via `pnpm run install:cloudflare`.
- Release checks for Worker/frontend builds, agent setup, deployment config, worker contract, module format, open-source hygiene, and git history privacy.

### Documentation

- Added deployment, AI agent install, architecture, and product-scope documentation.
- Added contributing, support, security, code of conduct, release notes, and local release checks.
