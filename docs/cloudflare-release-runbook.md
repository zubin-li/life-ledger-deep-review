# Cloudflare Worker release and rollback runbook

**English** · [简体中文](cloudflare-release-runbook.zh-CN.md)

This runbook describes the **canonical Cloudflare edition** topology and the guarded release flow introduced in package `2.0.6`. Local tests and dry-runs do **not** prove production identity, Access policy, binding parity, or migration state on your account.

## Canonical topology (unchanged resource names)

| Piece | Location / name |
| --- | --- |
| Worker entry | `src/index.js` |
| Static assets | `public/` (Workers Assets binding `ASSETS`) |
| D1 | binding `DB`, database `life-ledger-deep-review-db` |
| R2 photos | binding `PHOTOS`, bucket `life-ledger-deep-review-photos` |
| Workers AI | binding `AI` |
| Migrations | `migrations/` (latest additive revision **0006** adds `states.revision` for CAS sync protocol **2**) |
| Config | `wrangler.jsonc` |

Do **not** deploy the GitHub Pages / local-only static host as the connected cloud service. Production is always this Worker + Assets deployment behind Cloudflare Access.

## Release order

1. **Backup / inventory** — export personal backups; note current Worker URL and deployment id.
2. **Local gates** — `npm ci`, `npm test`, `npx wrangler deploy --dry-run`.
3. **Preflight manifest** — `npm run deploy:preflight` (local dry-run plus read-only remote inventory: deployments list, pending D1 migrations). Manifests land in `.life-ledger-deployments/` (git-ignored).
4. **Inspect pending migrations** — confirm only additive migrations remain (especially `0006_state_revision.sql`).
5. **Deploy with confirmation** — `npm run deploy:cloudflare -- --confirm` applies pending remote migrations, then `wrangler deploy --strict --keep-vars` with `BUILD_SHA` and a release message. A failed preflight or migration blocks deploy.
6. **Authenticated version check** — `npm run deploy:verify -- --url https://<your-worker-origin>` (optional service-token headers via `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET`). Expect JSON from `GET /api/version` with `readiness.ready: true`, schema revision **6**, backup schema **3**, sync protocol **2**, and all binding flags true. HTML login pages are failures.
7. **Functional smoke** — `/deployment-mode.js`, authenticated `/api/state`, photos, voice, calendar (if enabled), PWA shell.

### Why `--keep-vars`

Dashboard-managed Worker variables and secrets (`TEAM_DOMAIN`, `POLICY_AUD`, Google Calendar OAuth values, etc.) must survive CLI deploys. `--keep-vars` merges code without wiping those values.

## Rollback boundary

- **Application code**: print a rollback command from a preflight manifest — `npm run deploy:rollback-command -- --manifest .life-ledger-deployments/manifest-....json` — then execute the printed `wrangler rollback <previous-version-id> --name life-ledger-deep-review` yourself.
- **Database**: migration **0006** is additive (`states.revision` column). Rolling Worker code back does **not** remove that column and must not run destructive SQL. Older code should tolerate the extra column.

## Parity checks (live only)

| Check | How |
| --- | --- |
| D1 schema | `/api/version` → `readiness.d1.revisionColumnReady` |
| R2 / AI bindings | `/api/version` binding booleans |
| Access | `/api/version` with a valid Access session or service token; unauthenticated calls must not return release metadata |
| CAS protocol | Client sends `baseRevision` on PUT; server returns `409 STATE_CONFLICT` when stale |

## npm scripts

| Script | Purpose |
| --- | --- |
| `deploy:preflight` | Local gates + read-only inventory manifest |
| `deploy:cloudflare -- --confirm` | Guarded migrate + strict deploy |
| `deploy:verify -- --url …` | Post-deploy `/api/version` check |
| `deploy:rollback-command -- --manifest …` | Print rollback command only |
| `deploy` | Same entry as `deploy:cloudflare` (requires `--confirm`) |

Legacy one-liner `npm run db:migrations:apply && wrangler deploy` is replaced by the release tool; use explicit phases above.
