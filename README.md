<div align="center">
  <img src="public/assets/app-icon-192.png" width="96" height="96" alt="Life Ledger icon" />
  <h1>Life Ledger · Deep Review</h1>
  <p>A calm, multilingual, local-first space for habits, daily notes, and meaningful reflection.</p>

  <p>
    <a href="README.md">English</a> ·
    <a href="README.zh-CN.md">简体中文</a>
  </p>

  <p>
    <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/zubin-li/life-ledger-deep-review">
      <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare" />
    </a>
  </p>
</div>

> **Beta:** Life Ledger is ready for personal use and self-hosting. Keep regular JSON exports while the synchronization model continues to mature.

## Why Life Ledger

Most trackers separate habits, tasks, mood, journaling, and reviews. Life Ledger keeps them in one quiet workflow:

- record what happened today;
- plan the current or next week;
- compare habit trends without turning life into a scoreboard;
- write weekly and monthly reflections in context;
- keep the data on your device or in your own Cloudflare account.

There is no hosted Life Ledger account, advertising layer, or central user database.

## Highlights

- Daily habits with adjustable targets and effective dates
- Daily goals, mood, journal, and event notes
- Weekly goals, checklist behavior, outputs, and archived notes
- Monthly review with habit comparisons and line/bar charts
- Daily, weekly, monthly, or complete JSON export
- English, Simplified Chinese, and German interfaces
- Light, dark, and system appearance
- Installable PWA with offline app shell
- Optional Cloudflare Access + D1 cross-device synchronization
- Responsive Apple-inspired interface for desktop and mobile

## Choose how to use it

### 1. Local only — fastest and most private

```bash
git clone https://github.com/zubin-li/life-ledger-deep-review.git
cd life-ledger-deep-review
npm install
npm run dev
```

Open the local URL shown by Wrangler. The first start applies the D1 schema locally, but the app itself works without cloud login. Browser data remains in `localStorage`.

### 2. Create your own copy

Use GitHub's **Use this template** button. Your new repository has an independent history and can be customized without sharing data with this project.

### 3. Deploy your own private cloud copy

Select **Deploy to Cloudflare** above. Cloudflare will copy the public repository, create a Worker and D1 database in your account, apply the migration, and deploy the app.

After deployment, enable Cloudflare Access:

1. Open **Workers & Pages** in Cloudflare.
2. Select the new `life-ledger-deep-review` Worker.
3. Open **Settings → Domains & Routes**.
4. Next to the `workers.dev` route, select **Enable Cloudflare Access**.
5. Allow only your email address or trusted household members.
6. Copy the Access application's **Application Audience (AUD) Tag**.
7. In the Worker's **Settings → Variables and Secrets**, add `TEAM_DOMAIN` as `https://<your-team>.cloudflareaccess.com` and `POLICY_AUD` as the copied AUD tag.
8. Open the app and authenticate once. Cloud sync will then use the verified Access identity.

See [Self-hosting](docs/self-hosting.md) and [Cloudflare Access setup](docs/cloudflare-access.md) for the complete walkthrough.

## Data ownership

```text
Browser / installed PWA
   ├── localStorage     immediate local persistence
   ├── JSON export     user-controlled backup
   └── /api/state      optional authenticated sync
            ↓
      Cloudflare Worker
            ↓
      Your own D1 database
```

Cloud synchronization is optional. The Worker validates the Access JWT before the verified email is hashed into a D1 record key. Journal content is not application-layer end-to-end encrypted, so the owner of the Cloudflare account can inspect their own D1 data. Read [PRIVACY.md](PRIVACY.md) before storing sensitive information.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Apply local migrations and start Wrangler development mode |
| `npm test` | Run syntax, privacy-marker, structure, and Worker tests |
| `npm run check` | Run fast repository checks |
| `npm run db:migrations:apply` | Apply D1 migrations to the configured remote database |
| `npm run deploy` | Migrate and deploy to Cloudflare |

Requires Node.js 20 or newer.

## Project structure

```text
public/       browser application, PWA shell, and visual assets
src/          Cloudflare Worker API and static-asset routing
migrations/   D1 database schema
tests/        dependency-light Worker tests
docs/         self-hosting and data guides
.github/      CI and issue templates
```

## Cost expectations

Life Ledger is designed for one person or a small household. Static asset requests on Cloudflare are free, while Worker and D1 usage stays inside the deployer's own Cloudflare plan. A normal personal tracker is expected to remain far below the Free plan's daily limits, but the deployer is responsible for reviewing current Cloudflare pricing and account settings.

## Roadmap

- Safer conflict handling for concurrent offline edits
- Import and guided restore from JSON backups
- Optional monthly partitioning for very long journal histories
- Automated accessibility and browser regression coverage
- Community-contributed translations

## Contributing

Issues and focused pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and the [changelog](CHANGELOG.md). Never attach private journal exports to public issues.

## License

Life Ledger is released under the [MIT License](LICENSE). Adapted Lucide paths are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
