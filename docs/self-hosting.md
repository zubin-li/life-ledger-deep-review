# Self-hosting

## Recommended path: Deploy to Cloudflare

The deployment button in the README asks Cloudflare to clone this repository into your GitHub account, provision a Worker and D1 database, apply the migration, and deploy the application. Accept the detected `npm run deploy` command.

After the first deployment, protect the Worker with Cloudflare Access before relying on cloud sync. Until Access is enabled, the interface still works locally in the browser and the API intentionally returns `401`.

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

When a Cloudflare Free-plan limit is reached, the API can temporarily reject synchronization requests. Local browser saves remain available. Do not upgrade a Cloudflare plan unless you intentionally accept its billing terms.
