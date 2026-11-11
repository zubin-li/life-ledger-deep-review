# Brief: fill the Life Ledger sample workspace completely (round 12)

Repo: /Users/ashan/Documents/Codex/ll-web-cards (static web app, no build step). Node 26. `npm test` must stay green.

## Ponytail rules
Simplest working change. Pure data + the minimum generator code. No new dependencies, no new files
other than data modules if a file would exceed ~600 lines. Do not refactor unrelated code.

## Who the sample user is (keep exactly)
林知遥 / Lin Zhiyao, AI data analyst (AI 从业者) at a Berlin mobility start-up, ~3 months of history.
Story arcs already in the data — keep them consistent across every field:
- Work: summer = build the LLM evaluation pipeline (dataset versioning, metric registry, daily runs) →
  autumn = drift monitoring, eval set to 500 labelled items, 10% rollout of a new model, moving from
  analyst toward AI product analytics (weekly product-decision review). Meetup talk, internal hackathon,
  pipeline outage, experiment reviews (ranking v3), prompt/eval comparisons.
- German: Goethe B1 passed → B2 sprint (class Tue/Thu, listening 20–30 min daily, goal: host a stand-up in German).
- Running: back to 3 runs/week → 14 km long run → winter half-marathon block (sub 2h). Strength 3×/week.
- Life: friends in Kreuzberg, museum Sunday, forest hike, lake offsite, tax + insurance renewal, annual check-up,
  sleep before 23:30 is the weak habit.

## Files you may edit
- public/demo-workspace.js (generator `buildDemoWorkspace`, `relocalizeDemoWorkspace`)
- public/demo-persona.js (per-language packs zh / en / de, `demoScheduleFor`)
- public/demo-life.js (dated events `DEMO_EVENTS`, `demoDayLine`)
- tests/demo-workspace.test.mjs
Do NOT edit app.js, index.html, any CSS, long-range.js, today-widgets.js, sw.js. Another engineer is editing those
right now; touching them will be reverted.

## Measured current state (generator run for now = 2026-10-22, lang zh)
- logs: 90 days, all have a note, but 32 notes are template lines from `demoDayLine` ("写了一份实验设计文档。跑了 7 公里，读了 30 页书…")
  repeated with small number changes; only 58 unique first lines. moodReason on only 48/90 days.
- dailyGoals: only the last 14 days (and some skipped). Nothing for future days.
- weeklyGoals/weeklyOutputs/weeklyReviews: 13 weeks but texts cycle from short pools (repeats).
- reviews (monthly): only 3 months (Aug/Sep/Oct). The July days in range have no monthly review.
- longTermGoals: 9; each has `events` with only one "created" event; few steps.
- planning.phases: 4 phases, events only created/closed.
- focusSessions: 32 random + recent weekdays only.
- schedule (`demoScheduleFor`): routines on weekdays + a few one-offs around today.

## Target (all must hold for zh, en AND de; de may be shorter but must exist and be real German)
1. Every past day (90) has a UNIQUE, specific journal note (1–4 sentences; ~1 in 4 uses the "今天：… 明天：…" two-part
   form like the existing today note). No template sentence may repeat across days. Notes follow the story arcs and the
   weekday (weekends = life, not work). Dated events in DEMO_EVENTS keep their story text.
2. Every past day has a mood AND a short moodReason (zh ≤ 22 chars) that matches the note.
3. dailyGoals: every past day 2–4 goals (done flags plausible; past days mostly done), plus the next 7 future days
   2–3 open goals each (planning ahead).
4. Every ISO week in range: 2–4 weekly goals, a weekly output and a weekly review — unique texts per week, matching
   that week's events. The current week keeps a draft-style text.
5. Monthly review (`reviews["YYYY-MM"]`) for EVERY month that has days in range (incl. the partial first month),
   3–5 sentences, real reflection with numbers that match the data story.
6. Long-range: keep the 4 phases; each phase gets 3–5 events over time (created, adjusted, pinned, notes with `detail`).
   Long-term goals: at least 11 (add 2 that fit the arcs, e.g. "写一篇如何评估 LLM 功能的长文", "在 Meetup 再讲一次").
   Each goal 3–6 steps with plausible done flags, a concrete nextAction, a reviewDate, and 3–6 `events`
   (type "created" / "step" / "note" / "status" with a `detail` sentence) spread over the 90 days.
   planning.note (long-term notepad) = a short real list of someday ideas.
7. focusSessions: every weekday has 1–2 sessions (25–90 min) whose labels match that period's work; some weekend
   sessions for German/reading. Deterministic (use the existing seeded rng, no Math.random in content).
8. Schedule (`demoScheduleFor`): keep routines; add one-off events for the next 14 days and for the past 14 days
   (meetings, German class, long run, dinner, dentist, tax appointment…) so the week calendar is never empty.
9. Habits: if the habit version object supports a note/description field (check `seed.habits` in public/app.js
   read-only, and the habit dialog field names), give each sample habit a one-line note that fits the persona.
   Otherwise skip this item and say so.
10. Bump `DEMO_PERSONA_VERSION` (public/demo-workspace.js) so an untouched older demo is re-seeded.
11. Keep the generator deterministic: same `now` + seed ⇒ identical output. All dates stay relative to `now`.
12. Keep `relocalizeDemoWorkspace` working (switching language re-renders the sample in that language).

## Acceptance (run all, paste real output in your final message)
```
cd /Users/ashan/Documents/Codex/ll-web-cards
npm test
node -e 'import("./public/demo-workspace.js").then(m=>{for(const lang of ["zh","en","de"]){const d=m.buildDemoWorkspace({now:new Date("2026-10-22T18:00:00"),lang,seedHabits:[]});const L=Object.entries(d.logs).filter(([k])=>k<="2026-10-22");const notes=L.map(([,v])=>v.note);const days=L.length;const uniq=new Set(notes).size;const reasons=L.filter(([,v])=>v.moodReason).length;const dg=Object.keys(d.dailyGoals);const fut=dg.filter(k=>k>"2026-10-22").length;const months=Object.keys(d.reviews).length;const ev=Math.min(...d.longTermGoals.map(g=>g.events.length));const wd=new Set(d.focusSessions.map(s=>s.date)).size;console.log(lang,{days,uniq,reasons,dailyGoalDays:dg.length,futureGoalDays:fut,months,goals:d.longTermGoals.length,minGoalEvents:ev,focusDays:wd,weeks:Object.keys(d.weeklyReviews).length,uniqWeekReviews:new Set(Object.values(d.weeklyReviews)).size})}})'
```
Targets per language: days 90, uniq 90, reasons 90, dailyGoalDays ≥ 97, futureGoalDays 7, months 4,
goals ≥ 11, minGoalEvents ≥ 3, focusDays ≥ 64, uniqWeekReviews = weeks.
Add a test in tests/demo-workspace.test.mjs that asserts these numbers for zh and en.

## No fabrication
Report only what the commands printed. If a target cannot be met, say which and why. Do not commit, push or deploy.
