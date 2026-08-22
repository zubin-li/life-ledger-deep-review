# Self-hosting

Life Ledger supports two private cloud paths:

- **Cloudflare Workers + D1 + Workers AI**, documented below and including AI voice reflection;
- **Tencent CloudBase**, recommended for mainland China and documented in the [CloudBase guide](cloudbase-china.md).

## Recommended path: Deploy to Cloudflare

The deployment button in the README asks Cloudflare to clone this repository into your GitHub account, provision a Worker and D1 database, apply the migration, and deploy the application. Accept the detected `npm run deploy` command.

After the first deployment, protect the Worker with Cloudflare Access before relying on cloud sync. Until Access is enabled, the interface still works locally in the browser and the API intentionally returns `401`.

The checked-in Wrangler configuration provisions the Workers AI binding automatically. No OpenAI account or separate API key is required. **Quick record** appears in Daily Reflection only after the app identifies itself as a Cloudflare deployment; it sends audio through the Access-protected Worker, creates an editable draft, and discards the recording. The `0002_voice_usage.sql` migration adds only daily counters for three requests and 20 recorded minutes per user.

## Manual deployment

```bash
npm install
npx wrangler login
npx wrangler d1 create life-ledger-deep-review-db
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
