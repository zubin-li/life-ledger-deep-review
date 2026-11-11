# Life Ledger — final design proposal (Web + Mac, local → connected)

Status: PROPOSAL for user approval. No code until approved. Target: whole product, first slice = Web Today.

## 0. What the user needs (restated)
- One product, two real deliverables: responsive Web/PWA and a Mac app (Tauri). Same data, same widgets, same look; each shell behaves natively.
- Today = a widget board: original 3.5 look and functions, plus the freedom to add/remove/resize/reorder cards without redesigning the page.
- Works fully offline/local now; later connects to the user's own cloud and syncs Web ⇄ Mac ⇄ phone without losing edits. Calendar, voice, photos, weather, macOS widget keep working.
- Nothing already built is thrown away.

## 1. Why the last rounds failed (root causes)
1. Layout model = absolute x/y coordinates + per-widget ad-hoc sizes (4/6/8/12 cols × 2/3/7 rows). No shared unit → cards don't tile, holes appear, user can't reason about sizes.
2. Today was capped to 1120px while every other page uses ~1272px.
3. Web shell kept the 3.6 flush square frame instead of the original floating rounded sidebar/background; Today scrolls inside its own container → visible scrollbar.
4. Design target drifted between "original page" and "approved mock"; no single acceptance image.

## 2. Mature reference: the Apple widget model (iOS/iPadOS/macOS desktop widgets)
- One square base cell. Discrete families: Small 1×1, Medium 2×1, Large 2×2, Extra-large 4×2 (iPad/Mac).
- A widget supports only the sizes that have a real design (HIG: "not all sizes required"; "don't just scale up").
- Users reorder; the system packs cards automatically. No free coordinates, no holes.
- Edit mode: remove (−), size picker, drag to reorder, "+" opens gallery.
Same pattern in Homarr / Grafana / Notion Home (order + span). Our grid needs no library: native CSS Grid
`grid-template-columns: repeat(N, 1fr); grid-auto-rows: <cell>; grid-auto-flow: row dense;` and each card `grid-column: span w; grid-row: span h`.
GridStack 14 (MIT) was spiked 2026-10-12 and rejected (absolute px positioning, inline width/height transitions, no discrete sizes, no keyboard). CSS Grid dense packing replaces it at zero bytes.

## 3. Layout contract (all platforms)
| Canvas width (content) | Columns | Cell |
|---|---|---|
| ≥ 1100px | 4 | square, (width − 3 gaps)/4 (≈ 290px at 1440) |
| 600–1099px | 2 | square |
| < 600px (phone) | 2 | square (iPhone-style: two smalls per row) |
- Sizes: S 1×1, M 2×1, L 2×2, XL 4×2. On 2-column canvases XL renders as L (deterministic, no new design).
- Gap 20px (phone 12px). Card radius 26px (phone 22px). Same tokens as original 3.5.
- Persisted layout per view: `{ schemaVersion: 3, order: [id…], sizes: {id: "S|M|L|XL"}, hidden: [id…] }`. No x/y. One layout synced for all devices; columns adapt. Old v1/v2 layouts migrate once (keep order by old y,x; keep hidden; map size to nearest allowed).
- Today uses the full content width like Week/Timeline (no 1120 cap).

## 4. Widget content matrix (each cell = a designed state; blank = not offered)
| Widget | S 1×1 | M 2×1 | L 2×2 | XL 4×2 | Default |
|---|---|---|---|---|---|
| Today hero (greeting, quote, progress ring, weather chip) | — | ✓ original hero | — | — | M |
| Mood (3 options + quote) | ✓ original card | — | — | — | S |
| Focus timer | ✓ start/time | ✓ + presets/today total | — | — | S |
| Foundations / habits (original cards) | ✓ ring + next habit | ✓ 4 cards, paged | ✓ 2×2 cards, paged | ✓ 8 cards | XL |
| Daily calendar (5-day roll + schedule) | — | ✓ roll + next 2 events | ✓ original card | — | L |
| Daily reflection (Reflection/Focus tabs, quick record, voice) | ✓ status + quick record | ✓ excerpt + write | ✓ original editor | — | L |
| Month in view (mood/heatmap switch) | — | — | ✓ month grid | ✓ original band + grid | XL |
| Weather forecast (uPlot curve) | ✓ now + hi/lo | ✓ curve | ✓ curve + days | — | not added |
| Habit heatmap | ✓ month | ✓ month + legend | — | — | not added |
| 7-day rhythm | ✓ % + bars | ✓ per-day bars | — | — | not added |
| Photos | ✓ latest | ✓ 3 thumbs | ✓ memory strip | — | not added |
| Photo wall | — | — | ✓ gallery | ✓ gallery | not added |
Default Today at 4 columns = original 3.5 order: [hero M][mood S][focus S] / [foundations XL] / [daily calendar L][reflection L] / [month XL]. Dense packing keeps it hole-free; added widgets flow in after their position.

## 5. Interaction
- Normal mode: calm, no drag. Toolbar: date nav, Today, theme, language, "Edit cards", search, create.
- Edit mode (one toggle): every card shows − (remove, undoable), size chips only for supported sizes, drag handle; "+" opens the existing gallery (gallery mock already approved). Reorder by pointer drag (insertion index, other cards animate with FLIP transforms) and keyboard (Alt+←/→ move, S/M/L/XL keys). Esc cancels session, Undo restores.
- Motion: keep original section entrances, habit card check pop, progress ring, hover lift; transform/opacity only; prefers-reduced-motion and the app's Motion setting respected.
- No inner scroll containers on Web: the document scrolls; scrollbar visually hidden (scrollbar-width:none) as in the original.

## 6. Visual system
- Web shell = original 3.5 (`main`): floating dark rounded sidebar (radius 30, inset 16), soft radial gradient background, glass cards (radius 26, white edge, deep soft shadow), Noto Serif SC headings, sage/blue palette. Copy CSS from `main`, not re-invent.
- Mac shell = same tokens, native chrome: sidebar attached to window edge with traffic-light inset, overlay titlebar, unified toolbar (existing `data-desktop` path). Content board identical to Web.
- Light/dark, zh/en/de designed equally.

## 7. Data & sync architecture
Today: one JSON state blob (`life-ledger-v1`) in localStorage per runtime. Cloud: Worker `/api/state` stores the whole blob in D1 (`states`), last-write-wins by `meta.updatedAt`; CloudBase variant for China. Mac "local" = separate silo inside the WebView; Mac "connected" just opens the remote URL (no offline).
Problems: whole-blob LWW silently drops one device's offline edits; Web and Mac local data never meet; localStorage 5MB limit.
Proposal (incremental, no new backend):
1. Storage: same state shape, moved to IndexedDB (existing IDB helper) in Web and Mac; localStorage kept only for small prefs. Automatic one-time migration + backup.
2. Record-level merge: every mergeable record (habit, day log fields, goal, week/month review, layout) carries `updatedAt` (+ tombstone `deletedAt`). Sync = pull remote blob → merge per record (newest wins per record, not per blob) → push with `If-Match` revision; server rejects stale revision (409) → client re-merges. Works for D1 and CloudBase unchanged except a revision column. (A per-record LWW map is the minimal CRDT; Automerge/Yjs/op-log engines were considered and rejected as a data-layer rewrite for a single-user app.)
3. Mac app = always the bundled local UI (offline, fast) + optional background sync to the user's cloud. Auth via a device sync token issued once in Web Settings and stored in the macOS Keychain (Cloudflare Access cookies don't reach the app origin). Replaces "open remote URL" mode later.
4. Connected-only features declare a capability (calendar, voice, photo upload): in local mode the widget shows a calm "connect" state instead of disappearing. Weather (Open-Meteo) works everywhere. macOS WidgetKit bridge reads the same local state.
5. Import/export JSON + .llmedia stay as the manual path and the safety net before every migration.

## 8. What is reused vs replaced
Reused as is: data model, app.js section renderers (habits carousel, day roll, schedule, reflection tabs, month view — already restored), icons, illustrations, i18n, focus/voice/photos/weather/uPlot/heatmap, widget registry + gallery, Worker/D1/R2/CloudBase, Tauri shell + WidgetKit, tests harness.
Replaced: layout-engine coordinate model (x/y + collisions, ~1.5k lines) → order+size on CSS Grid (much smaller); Web Today shell CSS → original `main` CSS; ad-hoc WEB_DIMS → contract above.
Kept for later phases: sync token, IndexedDB move, record-level merge (Phase 3), Mac adoption (Phase 4).

## 8b. Revisions after 4-model review (Opus / GPT-6.1 Sol / Gemini Pro / Composer) + measuring 3.5
Measured original 3.5 at 1440: content 1036w; hero 705×289, mood 313×289, habit band 1036×222(+heading), day plan & reflection 511×477 each, month 1036×(93+926).
1. Cells NOT square: fixed row unit 250px (tablet/desktop), gap 20. Gives hero 250, day plan/reflection 2 rows = 520, month 4 rows ≈ 1060 → within ~10–15% of 3.5. Square cells would make 2-col tablet L ≈ 1000px tall (all four reviewers flagged).
2. No `dense` (4/4 flagged): order-preserving flow, so screen order = saved order = keyboard order. Holes possible → in edit mode a hole shows a dashed "+ add a widget that fits here" slot (answers "what do I put next to the photo wall").
3. Columns: ≥1100 → 4; 600–1099 → 2 (XL→L); <600 → 1 column, every widget full width with its declared phone height. Phone 2-col S would be 170px wide — too small for mood (Opus).
4. Reorder: first move buttons (← →) + keyboard + remove/size/add with undo; pointer drag with live preview added after the board passes visual approval (4/4).
5. Sync: field-level timestamps for day logs (mood / reflection / habit checks separately), hybrid logical clock (device id + counter) instead of wall clock, tombstones with cleanup; start stamping `updatedAt` already in Phase 2 to avoid a 2nd migration.
6. Mac storage: WKWebView IndexedDB can be evicted and is unreadable by WidgetKit → Mac app keeps its source of truth in a native file in the App Group container via Tauri commands; WebView is a cache. Device tokens revocable with a device list; same path for CloudBase.
7. Tauri smoke test (packaged WebView) during Phase 2, not only in Phase 4.
Rejected simpler alternatives: fixed sections with show/hide only (Codex, AGY) — user explicitly wants add/remove/resize/reorder.

## 9. Delivery and acceptance (stop after each gate for user approval)
- Phase 1 — Design sign-off (no production code): static mock rendered from real CSS/components: Web Today 1440 light/dark, 1180, 390; edit mode; gallery; every widget in each supported size. User approves the image.
- Phase 2 — Web Today build to that image: layout engine v3, migration, shell restore, scrollbar removal, edit mode. Gates: tests, real-data screenshots side-by-side with the approved mock, user visual approval → commit.
- Phase 3 — Data layer: IndexedDB + record-level merge + revision check; sync tests with two simulated devices editing offline.
- Phase 4 — Mac app: same board in Tauri, bundled UI + background sync + Keychain token; verified in the real packaged app.
- Week/Timeline/Insights/Habits keep their current pages; they adopt the same shell in Phase 2 (shell only) and the widget board later only if wanted.
