# Privacy

Life Ledger is local-first and self-hosted.

## Local-only use

Habit records, goals, moods, and journal entries are stored in the browser's `localStorage`. They do not leave the device unless cloud sync is configured or the user exports them.

## Optional Cloudflare sync

When a deployment is protected by Cloudflare Access, the Worker validates the Access JWT signature, issuer, and audience. It then normalizes the verified email claim, hashes it with SHA-256, and uses only that hash as the D1 lookup key. The complete Life Ledger state is stored in the deployer's own D1 database.

The application does not provide application-layer end-to-end encryption. Anyone with administrative access to that Cloudflare account may be able to inspect the stored payload.

## Optional Tencent CloudBase sync

The mainland-China build uses CloudBase email OTP authentication and the deployer's `life_ledger_states` document collection. The collection must be configured as **Only the creator can read and write**. CloudBase attaches ownership metadata to browser-created records and enforces the collection rule for client SDK requests.

The build contains the deployer's CloudBase environment ID and Publishable Key. Both are public browser configuration; it never contains a Tencent Cloud API `SecretId` or `SecretKey`. The application does not provide application-layer end-to-end encryption, so administrators of that CloudBase environment may be able to inspect stored payloads.

## External services

The repository contains no analytics, advertising, telemetry, or social tracking integrations. Cloudflare or Tencent CloudBase may process normal hosting, security, and authentication metadata according to the deployer's selected configuration and the provider's own terms.

## Data control

Users can export a selected day, week, month, or complete history as JSON. A self-hoster can delete the D1 database, CloudBase collection, or individual records through their own cloud account.

Life Ledger is a personal organization tool, not a medical device or healthcare service.
