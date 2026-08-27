# Privacy

Life Ledger is local-first and self-hosted.

## Local-only use

Habit records, goals, moods, and journal entries are stored in the browser's `localStorage`. They do not leave the device unless cloud sync is configured or the user exports them.

## Optional Cloudflare sync

When a deployment is protected by Cloudflare Access, the Worker validates the Access JWT signature, issuer, and audience. It then normalizes the verified email claim, hashes it with SHA-256, and uses only that hash as the D1 lookup key. The complete Life Ledger state is stored in the deployer's own D1 database.

The application does not provide application-layer end-to-end encryption. Anyone with administrative access to that Cloudflare account may be able to inspect the stored payload.

## Optional Cloudflare AI voice reflection

In a self-hosted Cloudflare deployment, a user may explicitly record a daily reflection. The browser sends that recording to the deployer's authenticated Worker, which passes it to Cloudflare Workers AI for speech transcription and text refinement. This is a user-initiated external processing step.

Life Ledger does not persist the recording: it is held only long enough to process the request and is not written to D1, browser storage, synchronization state, backups, or application logs. The original transcript is shown temporarily for review. Only the edited reflection that the user confirms is appended to the journal and synchronized normally.

The voice endpoint records only per-user daily request counts and reserved recording seconds for abuse and cost control. The identity remains the same one-way email hash used by synchronization. Local-only and CloudBase editions do not expose this AI voice function.

## Optional Google Calendar connection

The self-hosted Cloudflare edition can connect to Google Calendar after the user explicitly grants read-only access. Life Ledger requests only the permissions required to list calendars and read events. It cannot create, edit, or delete Google Calendar events.

The deployment stores the Google refresh token encrypted with the self-hoster's `CALENDAR_TOKEN_KEY`; the token never enters browser storage, synchronized Life Ledger state, exports, or application logs. A limited event cache may contain calendar name and color, event title, start and end time, time zone, recurrence status, and provider identifiers. Life Ledger does not request or cache descriptions, locations, attachments, guests, or attendee email addresses.

Disconnecting Google Calendar revokes the connection and deletes the stored credential, OAuth state, and cached calendar data. Calendar events are schedule context only: they do not automatically count as completed goals, habits, journal days, or focus time.

## Optional Tencent CloudBase sync

The mainland-China build uses CloudBase email OTP authentication and the deployer's `life_ledger_states` document collection. The collection must be configured as **Only the creator can read and write**. CloudBase attaches ownership metadata to browser-created records and enforces the collection rule for client SDK requests.

The build contains the deployer's CloudBase environment ID and Publishable Key. Both are public browser configuration; it never contains a Tencent Cloud API `SecretId` or `SecretKey`. The application does not provide application-layer end-to-end encryption, so administrators of that CloudBase environment may be able to inspect stored payloads.

## External services

The repository contains no analytics, advertising, telemetry, or social tracking integrations. Cloudflare may process hosting, authentication, encrypted Google credentials, limited calendar cache data, and explicitly submitted voice-reflection content. Google processes OAuth authorization and Calendar API requests when the optional connection is enabled. Tencent CloudBase may process hosting and authentication metadata according to the deployer's selected configuration and the providers' own terms.

## Data control

Users can export a selected day, week, month, or complete history as JSON and restore compatible backups entirely in the browser. Restore files are parsed locally and are not uploaded by the import flow. A self-hoster can delete the D1 database, CloudBase collection, or individual records through their own cloud account.

Life Ledger is a personal organization tool, not a medical device or healthcare service.
