# Self-hosting

Life Ledger supports two private cloud paths:

- **Cloudflare Workers + D1 + Workers AI**, documented below and including AI voice reflection;
- **Tencent CloudBase**, recommended for mainland China and documented in the [CloudBase guide](cloudbase-china.md).

## Recommended path: Deploy to Cloudflare

The deployment button in the README asks Cloudflare to clone this repository into your GitHub account, provision a Worker and D1 database, apply the migration, and deploy the application. Accept the detected `npm run deploy` command.

After the first deployment, protect the Worker with Cloudflare Access before relying on cloud sync. Until Access is enabled, the interface still works locally in the browser and the API intentionally returns `401`.

The checked-in Wrangler configuration provisions the Workers AI binding automatically. No OpenAI account or separate API key is required. **Quick record** appears in Daily Reflection only after the app identifies itself as a Cloudflare deployment; it sends audio through the Access-protected Worker, creates an editable draft, and discards the recording. The `0002_voice_usage.sql` migration adds only daily counters for three requests and 20 recorded minutes per user.

## Optional private photo memories

Photo memories require Cloudflare R2. Enable R2 once in the Cloudflare dashboard, then create the private bucket declared in `wrangler.jsonc` before deployment:

```bash
npx wrangler r2 bucket create life-ledger-deep-review-photos
```

The app compresses each photo in the browser, stores at most three photos per day, limits each compressed file to 1.2 MB, and enforces an 8 GB ceiling across the deployment. It also stops before 10,000 writes or 1,000,000 reads in one UTC calendar month—1% and 10% of R2's published Standard free allowances. R2 objects are never exposed through a public bucket URL; authenticated Worker endpoints enforce ownership on every operation. The Timeline then presents photos beside the mood and reason for each day. Monthly `.llmedia` export and restore keep the media portable.

## Optional read-only Google Calendar

Google Calendar is intentionally opt-in and available only from a Cloudflare deployment with a secure backend. Every self-hoster creates their own Google OAuth client; the project does not provide a shared client, proxy, or quota. Life Ledger asks only for calendar-list and event read access and cannot change Google Calendar.

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project and enable **Google Calendar API**.
2. Configure **Google Auth Platform → Branding** with your deployed Life Ledger home page, its `/privacy.html` page, and a developer contact email.
3. Set the audience to **External**. For continuous personal use, publish the app to **In production**; a project left in Testing normally issues refresh tokens that expire after seven days.
4. Create an **OAuth client ID → Web application**. Add exactly this authorized redirect URI, using your own deployment origin:

   ```text
   https://your-life-ledger.example/api/calendar/callback
   ```

5. Store the client values as encrypted Cloudflare secrets—never in source control or browser storage:

   ```bash
   npx wrangler secret put GOOGLE_CALENDAR_CLIENT_ID
   npx wrangler secret put GOOGLE_CALENDAR_CLIENT_SECRET
   npx wrangler secret put CALENDAR_TOKEN_KEY
   npx wrangler secret put GOOGLE_CALENDAR_REDIRECT_URI
   ```

   `CALENDAR_TOKEN_KEY` must be a URL-safe base64 string containing exactly 32 random bytes. `GOOGLE_CALENDAR_REDIRECT_URI` must exactly match the URI registered in Google. For a Pages project, use `wrangler pages secret put <NAME> --project-name <PROJECT>` instead.

6. Deploy again, open **Today → Day Plan → Connect Google Calendar**, grant the read-only permissions, and choose which calendars appear. Use **Add another Google account** to connect one additional personal or work account. Recurring routines are collapsed by default and can be revealed from the same settings panel.

The `0003_google_calendar.sql` migration stores encrypted authorization data and a rebuildable, review-safe event cache outside the main Life Ledger state. The cache excludes descriptions, locations, attachments, and attendees. Disconnecting revokes Google access and deletes the stored connection and cache. See [Privacy](../PRIVACY.md) for the complete boundary.

## Manual deployment

```bash
npm install
npx wrangler login
npx wrangler d1 create life-ledger-deep-review-db
npx wrangler r2 bucket create life-ledger-deep-review-photos
```

Copy the returned database ID into `wrangler.jsonc`, replacing the placeholder `database_id`, then run:

```bash
npm run deploy
```

Do not commit the personalized database ID back to an upstream pull request.

## Updating

If you used the deployment button, Cloudflare connects the generated repository to Workers Builds. Review upstream releases, merge the changes you want into your copy, and let Cloudflare deploy the updated commit.

Before a major update:

1. export a complete JSON backup from Life Ledger;
2. review `CHANGELOG.md` and database migrations;
3. deploy;
4. verify one recent day and one historical review on each important device.

## Free-plan behavior

When a Cloudflare Free-plan or Workers AI limit is reached, the API can temporarily reject synchronization or voice requests. Local browser saves and manual text entry remain available. Do not upgrade a Cloudflare plan unless you intentionally accept its billing terms. Before allowing many users into one deployment, review usage in the Cloudflare dashboard; the application-level per-account limit does not replace an account-wide provider limit.

CloudBase's current Free environment cannot enable pay-as-you-go billing. See the [mainland-China cost and domain notes](cloudbase-china.md#what-it-costs); the assigned domain does not require a purchase, but Tencent documents it for development/testing rather than public production.
