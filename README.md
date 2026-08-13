<div align="center">
  <img src="public/assets/app-icon-192.png" width="96" height="96" alt="Life Ledger icon" />
  <h1>Life Ledger · Deep Review</h1>
  <p><strong>Understand your past. Shape your future.</strong></p>
  <p><em>A personal reflection system that helps you understand your past, not just plan your future.</em></p>

  <p>
    <strong><a href="README.md">English</a></strong> ·
    <strong><a href="README.zh-CN.md">简体中文</a></strong>
  </p>

  <p>
    <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/zubin-li/life-ledger-deep-review">
      <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare" />
    </a>
  </p>
</div>

> **Beta:** Life Ledger is ready for personal use and self-hosting. Keep regular JSON exports while the synchronization model continues to mature.

## Why Life Ledger

Most productivity tools focus on what you should do next.

Life Ledger focuses on what you have already experienced.

It provides a simple place to record your daily habits, mood, priorities, and weekly reflections—allowing small everyday moments to gradually become a meaningful history of your personal growth.

The goal is not to quantify life.

It is to understand it more clearly.

Over time, your own data becomes something far more valuable than isolated notes or completed tasks. It becomes a record of how you think, grow, struggle, and improve.

Life Ledger is designed around a simple principle:

> **Your data belongs to you. Your history belongs to you.**

Deploy it to your own Cloudflare account, keep everything local, or export your data whenever you want.

There is no hosted platform, no advertising, and no central database.

## Deep Review

Deep Review is the methodology behind Life Ledger.

Instead of collecting more information, it encourages a habit of reflection.

Small daily records become weekly reviews. Weekly reviews become monthly understanding. Months eventually become a personal history that helps you see your own growth instead of forgetting it.

The purpose is not productivity.

The purpose is perspective.

## AI-assisted Reflection

Life Ledger records your journey. AI helps you understand it.

Future versions are planned to let you connect your own AI provider with an API key and generate weekly, monthly, and yearly reflection reports based entirely on your own history.

Instead of uploading your life to someone else's platform, your own data becomes the foundation for your own insights.

AI is not here to replace reflection. It is here to make reflection more meaningful.

> **Roadmap note:** AI-assisted reflection is a planned capability and is not included in the current beta.

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

## Product tour

<p align="center">
  <img src="docs/images/demo-preview/04-monthly-review-july.png" width="100%" alt="Life Ledger monthly review dashboard on desktop" />
</p>

<p align="center"><sub>One month, seen clearly: completion rhythm, habit comparisons, and a reflection that keeps the numbers in context.</sub></p>

<table>
  <tr>
    <td width="50%"><img src="docs/images/demo-preview/01-today-planning-july-30.png" alt="Daily planning and reflection" /></td>
    <td width="50%"><img src="docs/images/demo-preview/03-weekly-plan-jul-27.png" alt="Weekly goals and output" /></td>
  </tr>
  <tr>
    <td><strong>Daily clarity</strong><br />Plan the day, complete a small set of goals, and leave a reflection beside the calendar.</td>
    <td><strong>Weekly direction</strong><br />Keep must-finish work and the week's written output in one calm workspace.</td>
  </tr>
</table>

<p align="center">
  <img src="docs/images/demo-preview/en-mobile/01-today-planning-mobile.png" width="30%" alt="Daily planning on mobile" />
  <img src="docs/images/demo-preview/en-mobile/02-daily-review-mobile.png" width="30%" alt="Daily review drawer on mobile" />
  <img src="docs/images/demo-preview/en-mobile/04-monthly-review-mobile.png" width="30%" alt="Monthly review on mobile" />
</p>

<p align="center"><strong>Responsive by design.</strong> The installed PWA uses a bottom navigation bar and a focused, full-height daily review on smaller screens.</p>

<p align="center"><a href="docs/SHOWCASE.md"><strong>Explore the complete desktop and mobile product showcase →</strong></a></p>

<sub>The screenshots use fictional July 2026 sample data created only for demonstration.</sub>

## Choose how to use it

### 1. Local only — download and open

No account, terminal, Node.js, or Cloudflare setup is required:

1. On GitHub, choose **Code → Download ZIP**.
2. Unzip the download.
3. Double-click `OPEN-LIFE-LEDGER.html`.

The app starts in local-only mode and saves to that browser's `localStorage`. In direct-file mode, cloud sync, PWA installation, and service-worker caching remain disabled by design.

For a more consistent browser origin without installing project dependencies, start a small local server from the repository folder:

```bash
python3 -m http.server 4173 --directory public
```

Then open `http://localhost:4173`.

### 2. Developer mode

```bash
git clone https://github.com/zubin-li/life-ledger-deep-review.git
cd life-ledger-deep-review
npm install
npm run dev
```

Open the local URL shown by Wrangler. The first start applies the D1 schema locally. This mode is intended for changing the Worker API or testing D1 integration.

### 3. Create your own copy

Use GitHub's **Use this template** button. Your new repository has an independent history and can be customized without sharing data with this project.

### 4. Deploy your own private cloud copy

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

The development and deployment commands require Node.js 20 or newer. Direct local use does not require Node.js.

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
