# Consultation: Life Ledger 2.0 release (read-only — do not modify any file)

You are reviewing a release plan for the open-source repo in this workspace (`zubin-li/life-ledger-deep-review`).
You produced the earlier README/SHOWCASE screenshots and the social preview in past Codex sessions. Those transcripts are on disk;
read them with grep/rg (they are large JSONL files, grep, don't cat):
- /Users/ashan/.codex/sessions/2026/09/20/ (file with `14-48-34` in the name: social-preview.jpg + Timeline screenshots, release 1.2.1)
- /Users/ashan/.codex/sessions/2026/08/21/ (file with `15-49-08`: the `-v2` screenshot refresh)
- /Users/ashan/.codex/sessions/2026/09/27/ (file with `20-25-23`)
- git history: `git show --stat 97f6aef`, `git show --stat ec8293c`, `git show --stat 6814512`

## Measured current state (verified by Hermes)
- Working tree = branch `codex/web-today-cards-classic` at 780b6a1 plus the uncommitted 2.0 web work (Today widget cards, Week/Horizon/Timeline/Review/Habits pages, `public/demo-workspace.js` 3-month fictional local demo with zh/en/de relocalization, `public/assets/demo-memories/` demo photos, local "clear sample data" in Settings). `git status` shows it.
- `origin/main` = 780b6a1's exact tree + revert commit 9834709 on top (trees identical). Tags v1.0.0…v1.3.0 exist; latest GitHub Release v1.3.0.
- Tests on the final tree: `npm test` 86/86, `npm run check` ok, `npm run desktop:check` 12/12; headless QA 19/19 functional, 0 overflow, 0 language leftovers.
- Production cloud = Cloudflare Pages project `life-ledger` (direct upload, not git-connected), Access-protected, D1 `life-ledger-db`, Pages Functions in `/Users/ashan/Desktop/Website/Life-Ledger/functions` (identical to v1.2.1 `src/` logic). Candidate bundle = `public/` + those functions unchanged; tested locally against a copy of real D1: 16/16 at 1440/1024/430/390. Full backup of prod site + D1 export exists.
- GitHub Pages (`.github/workflows/pages.yml`) publishes `public/` from main as the local-only PWA (mode=local). Release workflow creates a GitHub Release from `.github/releases/vX.Y.Z.md` on tag push.
- AGENTS.md release discipline: align package.json, lockfile, PWA cache + asset `?v=` versions, changelog, `.github/releases/vX.Y.Z.md`; refresh fictional en/zh/de desktop+mobile screenshots and docs/SHOWCASE* for visible features; `tests/readme-locales.test.mjs` enforces versioned, per-language screenshot paths incl. `-07-timeline-vN`.
- Existing screenshots: desktop 1600x1050 PNG, mobile 860x1864 PNG, social preview 1280x640 JPG.

## Plan to review (Hermes executes; you only advise)
1. Version 2.0.0 everywhere (package, lockfile, tauri.conf.json, sw cache, `?v=` in index.html), CHANGELOG `[2.0.0]`, `.github/releases/v2.0.0.md` incl. a "Roll back to 1.3.0" section.
2. Commit on a branch from origin/main (trees identical, no conflict), push, fast-forward main, tag `v2.0.0` → Release + Pages (local demo version).
3. Deploy the cloud: `wrangler pages deploy <candidate> --project-name life-ledger` (production branch), then read-only live check. Rollback: redeploy the backup folder / Pages dashboard rollback; GitHub: tag v1.3.0 stays, Pages can be re-run from v1.3.0.
4. New screenshots `-v6` for en/zh/de desktop+mobile from the local demo mode, new social preview, rewritten README product tour + SHOWCASE pages for the 2.0 pages, update repo description/topics if needed.

## Answer (≤500 words, concrete)
A. ACCEPT / MODIFY(how) / REJECT for steps 1–4, top risks, anything missing (e.g. files that pin versions, Pages cache, Access, D1 migrations needed or not).
B. Exactly how you produced and post-processed the earlier screenshots and social preview: viewport + deviceScaleFactor, which pages/states, demo data/date pinning, light/dark, crop, compression tool/quality, naming. Quote the commands/code you find in the transcripts; say "not found" where you can't find it — do not guess.
C. Which screenshot set you recommend for 2.0 (list file names), and how the demo photos (`public/assets/demo-memories/`) should be handled for the screenshots.
