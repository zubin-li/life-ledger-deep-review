# Deploy or update Life Ledger with Codex

Copy the prompt below into a Codex session that can use your terminal and browser. It works for both a new installation and an existing deployment.

It does not bypass owner-only decisions: Cloudflare or Google login, the R2 pay-as-you-go subscription, Google's unverified-app warning, and deletion or replacement of data still require the account owner's confirmation. Read-only inventory, tests, non-destructive migrations, deployment, and verification should otherwise continue without repeated prompts.

```text
Deploy or update my own Life Ledger from:
https://github.com/zubin-li/life-ledger-deep-review

Target the complete Cloudflare edition: Worker, D1, Workers AI, Cloudflare Access, private R2 photos, Quick record, and optional read-only Google Calendar. First determine whether this is a new installation or an upgrade. Reuse every existing resource; do not duplicate resources, clear databases, replace personal records, or publish sample data.

Work in five gates and do not mix them together.

1. Inventory: read README, self-hosting, privacy, changelog, Wrangler config, package scripts, and migrations. Fetch main, record the commit, run npm ci and npm test. Inspect existing Worker URL/deployment, D1 and migration state, R2 bucket, AI binding, Access, and secret names without printing secret values. Preserve local changes and account-specific configuration outside upstream commits.

2. Core: deploy and verify Worker/static assets, D1, Workers AI, and Access before touching Google Cloud. Apply only pending non-destructive migrations. Verify /deployment-mode.js, authenticated /api/state persistence, Quick record availability, PWA, and backup/restore. Do not modify product source merely to fit the account.

3. R2: the complete edition requires the PHOTOS binding. Reuse an existing R2 subscription and life-ledger-deep-review-photos bucket. If R2 is not enabled, explain the $0 starting checkout, included monthly allowance, automatic overage billing, and that the app's 8 GB/operation safeguards are not a provider hard spending cap. Wait for the owner to accept the subscription, then keep the Standard bucket private and verify photo upload/read/Timeline with fictional test media.

4. Google Calendar, only when selected: reuse any existing Google project and OAuth web client. Enable Calendar API and request only calendar.calendarlist.readonly and calendar.events.readonly. The Google authorized redirect URI and GOOGLE_CALENDAR_REDIRECT_URI secret must exactly equal https://<production-origin>/api/calendar/callback. Verify the four Calendar secret names without exposing values. Start a fresh connection from the production app after deployment.

OAuth must finish in the same tab. Life Ledger navigates that tab to Google. If an unverified-app warning appears, the owner personally chooses Advanced, Go to Life Ledger, and Continue, then waits for that same tab to return automatically to /?calendar=connected&view=today. Do not switch back to an older app tab. OAuth state expires after ten minutes, so restart from Life Ledger instead of reusing an old URL.

Do not accept a verbal "done" as proof. Verify the returned URL, /api/calendar/status configured:true and connected:true with at least one account, at least one D1 calendar_connections row, readable calendars/events, and persistence after refresh. On failure inspect the callback error, Worker logs, redirect URI, and state before recreating credentials.

5. Acceptance: report the production URL, GitHub commit, test results, D1 migration state, Access state, R2 bucket/binding, AI/Quick record state, Calendar state, PWA state, stable Deployment ID, and rollback point. Claim completion only with evidence.

Pause only for login, persistent authorization, R2 subscription, Google's security warning, or destructive data changes. Otherwise continue. After two evidence-based attempts without progress, report the exact blocker instead of creating more resources.
```
