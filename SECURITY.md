# Security policy

## Supported versions

Security fixes are provided for the latest release on the `main` branch.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that could expose private journal or habit data. Use GitHub's private vulnerability reporting feature on this repository instead.

Include the affected version, reproduction steps, impact, and any suggested mitigation. Please allow a reasonable period for investigation before public disclosure.

## Security model

- Local-only data remains in the browser's `localStorage`.
- Cloud sync is optional and uses the deployer's own Cloudflare D1 database.
- Cloudflare Access must protect a deployment before cloud sync can identify a user.
- The Worker cryptographically validates the Access JWT signature, issuer, and audience before accepting a sync request.
- The verified JWT email is hashed with SHA-256 before it is used as the D1 key.
- Journal payloads are not end-to-end encrypted by this application. The Cloudflare account owner can access their D1 database.
- No analytics, advertising SDKs, or third-party trackers are included.

Never commit Cloudflare API tokens, Access service tokens, database exports, `.dev.vars`, or personal journal data.
