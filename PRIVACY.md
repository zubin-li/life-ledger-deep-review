# Privacy

Life Ledger is local-first and self-hosted.

## Local-only use

Habit records, goals, moods, and journal entries are stored in the browser's `localStorage`. They do not leave the device unless cloud sync is configured or the user exports them.

## Optional cloud sync

When a deployment is protected by Cloudflare Access, the Worker validates the Access JWT signature, issuer, and audience. It then normalizes the verified email claim, hashes it with SHA-256, and uses only that hash as the D1 lookup key. The complete Life Ledger state is stored in the deployer's own D1 database.

The application does not provide application-layer end-to-end encryption. Anyone with administrative access to that Cloudflare account may be able to inspect the stored payload.

## External services

The repository contains no analytics, advertising, telemetry, or social tracking integrations. Cloudflare may process normal hosting, security, and authentication metadata according to the deployer's Cloudflare configuration and Cloudflare's own terms.

## Data control

Users can export a selected day, week, month, or complete history as JSON. A self-hoster can delete the D1 database or individual records through their Cloudflare account.

Life Ledger is a personal organization tool, not a medical device or healthcare service.
