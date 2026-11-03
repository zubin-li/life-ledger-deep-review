# Life Ledger 2.1.0 — owner feedback pass (11/03)

You are continuing work in this repository (`/Users/ashan/Documents/Codex/ll-overnight`, isolated clone, no remote).
Last night's build (bookkeeping + polish, web 2.1.0 / Mac 3.1.0) is committed; its brief is `.overnight/BRIEF-night1.md`.
The owner looked at it. This pass makes it **simpler, cleaner and consistent with the original design**, and fixes six
known problems. Nobody answers questions: decide, build, verify with headless screenshots you actually look at, repeat.

Every round: read `.overnight/PROGRESS-2.md` first (create it in round 1), end by updating it (done / half-done / next /
known bugs / `npm test` result). Keep `.overnight/REPORT.md` (Chinese, for the owner) current: what changed, where to
click, before/after screenshot paths. If `.overnight/REVIEW.md` is newer than your last PROGRESS-2 entry, it is
Antigravity's review of the previous batch: fix every HIGH/MED finding you can reproduce first.

## The owner's words (Chinese, verbatim — this is the spec)
「我的想法就是每日记账，然后它自动做统计。这个很重要。…还有本周，还有每个月的订阅啊之类的。所以说不要太复杂，但是说一定要弄好它。
然后下面的一些交易我也觉得很臃肿。反正就是还是整体的设计要符合之前原来那种设计的这个风格。…记账的话呢，应该放到时间轴下面，
然后复盘上面，不是说排到最前面，整体都需要更多的简洁但灵动的特效。」

## A. Bookkeeping redesign — "daily entry, automatic statistics"
1. **Daily entry is the centre.** The page opens on *today* (day switcher ‹ date ›). One quick-entry line on top
   ("12,50 咖啡", "Kaffee 3.2", "-45 Miete gestern", "+2000 工资"), then that day's entries as a compact list.
2. **Automatic categorisation.** The user should normally not pick a category: infer it from the note
   (keyword table in zh/en/de: 咖啡/Kaffee/coffee → 餐饮, Miete/rent/房租 → 住房, Rewe/Lidl/Aldi/超市 → 日用, U-Bahn/DB/地铁 → 交通 …)
   and **learn from corrections** (if the user changes the category of "Rewe" once, later "Rewe" entries use it).
   The inferred category is shown as a small chip the user can tap to change. Unknown → "其他/Other".
3. **Automatic statistics, week and month.** A simple 周 / 月 switch shows, for the current week or month: total spent,
   income, balance; spending by category (one chart — keep the donut, drop the treemap toggle); comparison with the
   previous week/month in one line. No more than one chart plus one small daily bar strip per view.
4. **Subscriptions (每月订阅).** A short list: name, amount, day of month, category. On/after that day each month the
   entry is added automatically (once per month, idempotent, undoable) — no "confirm all" banner unless something is
   genuinely ambiguous. Monthly subscription total shown in the month view.
5. **Slim the transaction list.** One line per entry (category icon · note · amount), grouped by day, today expanded,
   older days collapsed to a one-line daily total. Edit/delete inside a small popover or swipe, not big cards.
   Search, CSV import/export, budgets and keyboard-shortcut hints move into a single "⋯" menu (keep the features, hide the
   noise). Remove the shortcut strip under the title, the duplicate "记账" title (issue 2), the trend line chart,
   the treemap and the heatmap from the main page (a tiny daily strip may stay inside the month view only if it looks good).
6. **Navigation order:** sidebar and mobile nav: 今日, 本周, 长期, 时间轴, **记账**, 复盘, 习惯设置 — below 时间轴, above
   复盘 (issue 3). The Mac menu item and shortcut follow the new order without clashing.
7. Keep everything that protects data: `state.ledger` in local save, cloud merge/CAS, backup v3, undo; old state without
   `ledger` loads unchanged; existing transactions from the previous design still display. Integer minor units. Tests for:
   keyword inference, learned corrections, weekly/monthly totals (week starts Monday, local time), subscription
   auto-posting idempotence, CSV round-trip.

## B. Design consistency and motion
- The ledger page must look like a sibling of 本周 / 复盘: same panel/card classes, spacing, type scale, colours, radii,
  icon style. Compare side by side in screenshots; remove visual language that only exists on the ledger page.
- 「简洁但灵动」: fewer elements, tasteful motion — a new entry slides/fades into the list, totals roll up, the donut sweeps
  in, the day/week/month switch cross-fades. Consolidate last night's many one-off press classes (`is-*-press`, `just-*`)
  into one shared pattern; delete the ones that add noise. Transform/opacity only; respect `prefers-reduced-motion`.

## C. The six known problems (fix all; show evidence for each in PROGRESS-2.md)
1. Today page: the onboarding tip card (「今日页可按你的习惯排列…」) is translucent; habit cards show through it.
   All floating cards/popovers/tips must be opaque and on top (same rule as the 2.0.10 fix).
2. Ledger page shows the title 「记账」 twice (page header + section heading). Keep one.
3. Ledger nav position — see A6.
4. Today weather card renders empty in a headless check. Find out whether it is the test environment (no geolocation /
   network) or a regression since tag `v2.0.10`: run the same headless check against a worktree of `v2.0.10`
   (`git worktree add .overnight/base v2.0.10`, remove it afterwards) and against now. Fix if regression; if it is only
   the environment, say so with evidence.
5. Bloat: `public/v210.css` is ~6,500 lines. Remove dead rules, merge duplicates and the scattered
   `prefers-reduced-motion` blocks, delete styles for removed UI. Target: well under half the size. Keep ONE parametrised
   capture script `.overnight/capture.mjs` and delete the other 70+ `.overnight/capture-*.mjs`. Remove dead JS left over
   from removed features.
6. Check 今日, 本周, 长期, 时间轴, 复盘, 习惯设置 at 1440 and 390 widths, light/dark, zh/de, WebKit and Chromium against
   `v2.0.10` screenshots. List every regression or visual defect found and fix it.

## How to verify (mandatory)
- `npm test` and `npm run desktop:check` green after every change; add the tests listed above.
- Headless only: Playwright from `/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs`, WebKit and
  Chromium. Serve with `python3 -m http.server 529x --bind 127.0.0.1` on ports 5291–5299 (never 5290: the owner is using
  it), stop your servers when done. Screenshots to `.overnight/shots/fb-*.png`, and look at them.
- Mac window check: inject `desktop/mac/shell.js` + `shell.css` as in
  `/Users/ashan/Documents/Codex/ll-mac-qa/habitpick-silent.mjs`.
- Version stays web 2.1.0 / Mac 3.1.0; update the CHANGELOG `[2.1.0]` entry and README EN/ZH/DE bookkeeping sections to
  describe the simplified design.

## Hard rules
Stay inside this folder. Never open windows/apps on the owner's screen (no `open`, `osascript`, headed browsers,
`tauri dev`; never launch or quit "Life Ledger.app"). No deploy, no remote D1/R2, no `git push`, no new remotes.
Do not touch `functions/`, migrations, updater key, signing. No runtime network calls to new hosts, no new heavy
dependencies, GPL code only as ideas. Never put buttons inside `<label>`. No fabricated results.
