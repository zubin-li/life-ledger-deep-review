# Life Ledger overnight build — 2.1.0 (web) / Mac 3.1.0

You are an autonomous senior product engineer + designer working ALONE overnight in this repository
(`/Users/ashan/Documents/Codex/ll-overnight`, an isolated clone with no git remote). Nobody will answer questions.
Decide, build, test, look at your own screenshots, criticise, improve, repeat. The owner reviews everything tomorrow
morning in a local browser. Budget is not a concern: be ambitious, explore, try alternatives, throw away what is weak.

You are called repeatedly (one "round" at a time). **Every round starts by reading `.overnight/PROGRESS.md`** (create
it in round 1) and ends by updating it: what is done, what is half-done, what you will do next, known bugs, and the
result of `npm test`. The driver commits your work after each round and appends the gate result to PROGRESS.md.

## Product
Life Ledger is a personal life dashboard (Today cards, habits, journal, week/month/long-range goals, review, photo wall,
weather, focus timer). Plain HTML/CSS/vanilla JS in `public/` (no framework, no build step), service worker `public/sw.js`,
Cloudflare Pages Functions for the online edition (state stored as one JSON payload, synced with CAS revisions),
a Tauri 2 Mac app (`src-tauri/`, `desktop/mac/shell.{js,css}`) that loads the same `public/` files.
Four editions = the same code: web local (`?mode=local`), web online (Cloudflare), Mac local window, Mac online window.
Three UI languages everywhere: zh-CN, en, de (`tr()` / `languageText()`); every new string needs all three.

Read first: `AGENTS.md`, `README.md`, `CHANGELOG.md`, `public/app.js` structure (it is large; search, don't read all),
`public/interaction.js` (motion helpers, `LifeLedgerInteraction`), `public/weather-widget.js` (uPlot charts already vendored),
`public/today-widgets.js`, `public/styles.css` + `pages-858.css` + `v202.css` (cascade order: styles, pages-858, widget-ui,
today-cards, v202 — put new CSS in a NEW file loaded last, e.g. `public/v210.css`), and
`/Users/ashan/Documents/Codex/ll-361-blank-fix/.hermes/requirements/REQUIREMENTS.md` (the owner's past wishes, cite them).

## Goal 1 — Bookkeeping (记账), a first-class new area
Research before building: look at open-source money trackers on GitHub (e.g. Actual Budget, ezBookkeeping, Firefly III,
Cashew, Money Manager Ex, Ivy Wallet, Maybe) for data models, quick-entry UX, category sets, charts, CSV import.
Reuse ideas freely; copy code ONLY from MIT/Apache-2.0/BSD/ISC projects, record each in `THIRD_PARTY_NOTICES.md`
(GPL/AGPL: ideas only, no code). Write a short design note `.overnight/LEDGER-DESIGN.md` first (data model, screens,
entry flow, what you borrowed from where), then build.

Must have:
- Data in `state.ledger` (e.g. accounts, categories with icon+colour, transactions, budgets, recurring templates).
  Amounts as integer minor units + ISO currency (default EUR, owner lives in Germany; also CNY). A missing
  `state.ledger` = empty ledger; old data must load unchanged. It must travel with everything that already moves state:
  local save, cloud sync (check `mergeRemoteCloudPayload`, conflict copies, CAS), backup export/import (v3), demo/sample data.
  Deleting must be undoable like habits.
- Very fast, friendly entry: one field that understands "12,50 咖啡", "Kaffee 3.2", "-45 Miete gestern", "+2000 工资";
  big amount keypad on touch; recent/frequent categories as chips; edit/duplicate/swipe-delete; keyboard first on desktop.
- Views: month overview (income/expense/balance), category breakdown (donut or treemap), daily spend calendar heatmap,
  trend line, budget progress per category, search/filter. Charts with the vendored uPlot or hand-made SVG — no new
  heavy chart library unless you justify it in the design note.
- Integrations: a Today card "今日支出/Spending today" (fits the existing card system, sizes, hide/reorder), month review shows
  spending summary, CSV import (German bank CSVs: `;` separator, decimal comma, DD.MM.YYYY) and CSV export.
- Navigation entry in the sidebar like the other pages; works in all four editions, light + dark theme, mobile width.

## Goal 2 — Polish everything, boldly
Make the whole app feel more alive and more crafted. Explore the web (Apple HIG, Linear, Things, Arc, Raycast, Stripe,
Dribbble/Mobbin patterns) and bring back concrete ideas: composition and layout of Today and other pages, typography
rhythm, spacing, empty states, onboarding hints, micro-interactions (press, hover, drag, reorder, success feedback),
page transitions, number roll-ups, chart animations, skeletons instead of jumps, better charts/insights for habits, mood,
journal and goals (streaks, correlations e.g. mood vs habits vs spending), and a few daring new ideas you judge worthwhile.
Respect `prefers-reduced-motion`. Keep 60 fps (transform/opacity only). Do NOT regress existing behaviour: two bugs just
fixed were (a) interactive pickers inside `<label>` (WebKit forwards clicks to the label's first button — never put
buttons inside `<label>`), (b) translucent popovers covered by later stacking contexts (popovers must be opaque and on top).

## How to work and verify (mandatory)
- Small steps, each verified. After each meaningful change: `npm test` (must stay green; add tests for new logic —
  ledger parsing, totals, merge/backup round-trip, CSV import) and a headless visual check.
- Visual checks: Playwright from `/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs`, WebKit
  (= Mac engine) AND Chromium, HEADLESS ONLY. Serve `public/` with `python3 -m http.server 529x --bind 127.0.0.1`
  (use ports 5291–5299 only, stop your servers when done). Save screenshots to `.overnight/shots/` (light, dark, zh/de,
  1440 and 390 widths) and LOOK at them; fix what looks off. Mac-window check: inject `desktop/mac/shell.js` + `shell.css`
  as in `/Users/ashan/Documents/Codex/ll-mac-qa/habitpick-silent.mjs`.
- Online-edition check without the internet: `/Users/ashan/Documents/Codex/ll-mac-qa/fakecloud.sh` shows how a local
  wrangler Pages stand-in works; you may copy it into `.overnight/` and point it at this repo on port 5298.
- Versions: bump to web 2.1.0 / Mac 3.1.0 everywhere the release-metadata test expects (package.json, package-lock,
  index.html ?v=, sw.js cache name, src/release-metadata.js, tauri.conf.json, Cargo.toml/lock), CHANGELOG `[2.1.0]`
  entry, README EN/ZH/DE sections for the bookkeeping feature.

## Hard rules
- Stay inside this repository folder. Do not modify anything under `~/Desktop`, `~/Library`, `~/Applications`,
  `/Users/ashan/Documents/Codex/ll-pr13`, or any other project.
- Never open windows or apps on the owner's screen: no `open`, no `osascript`, no non-headless browsers, no `tauri dev`,
  never launch or quit "Life Ledger.app". (`open`/`osascript` are disabled on PATH.) A Mac build (`npx tauri build`) is
  allowed only if you need it; never run the result.
- No deploy, no `wrangler pages deploy`, no remote D1/R2 commands, no `git push`, no new remotes, no GitHub writes.
- Do not touch the updater public key, signing settings, `functions/` server logic, or migrations. No server/database
  schema changes: the ledger lives inside the existing state payload.
- No secrets in code. No telemetry, no external API calls at runtime (fonts/CDNs included); everything works offline.
- No fabricated results: report real test counts; if something is unfinished, say so in PROGRESS.md.

## End of the night
Keep `.overnight/REPORT.md` up to date (in Chinese, for the owner): what is new, where to click, before/after
screenshots (paths), what you tried and rejected, known issues, and ideas for next time.
