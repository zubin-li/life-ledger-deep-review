# Cloudflare Access setup

Life Ledger uses Cloudflare Access as the identity boundary for cloud synchronization. The Worker never implements passwords or OAuth itself.

## Protect the Worker

1. In Cloudflare, open **Workers & Pages**.
2. Select your Life Ledger Worker.
3. Open **Settings → Domains & Routes**.
4. Find the `workers.dev` route and select **Enable Cloudflare Access**.
5. Open **Manage Cloudflare Access** if you want to change the policy.
6. Create an **Allow** policy for your own email address or a small list of trusted people.
7. Choose the Cloudflare identity provider, or configure email one-time PIN if you prefer it.
8. Open the Access application and copy its **Application Audience (AUD) Tag** from Additional settings.
9. Find your team domain under Zero Trust settings; it has the form `https://<team>.cloudflareaccess.com`.
10. In the Worker's **Settings → Variables and Secrets**, add two text variables:
    - `TEAM_DOMAIN`: the complete HTTPS team domain;
    - `POLICY_AUD`: the Application Audience tag.

Protecting the complete Worker is the simplest option: static pages and `/api/state` pass through Access together. The Worker independently validates the `Cf-Access-Jwt-Assertion` signature, issuer, and audience, then uses its verified email claim.

## Session duration

Choose a session duration that balances convenience and the sensitivity of the journal. A personal device can use a longer session, while a shared computer should use a shorter session and be signed out after use.

## Verify

1. Open the deployed URL in a private browser window.
2. Confirm that Access appears before Life Ledger.
3. Authenticate with an allowed account.
4. Make one harmless test change.
5. Open the app on a second authenticated device and confirm that the change arrives.

If `TEAM_DOMAIN` or `POLICY_AUD` is missing, cloud sync remains safely disabled and local use continues. Never make the D1 API publicly writable by adding a fallback identity header or shared password to the Worker code.
