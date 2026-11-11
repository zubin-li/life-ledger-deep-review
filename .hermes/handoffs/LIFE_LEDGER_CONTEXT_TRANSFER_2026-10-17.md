# Life Ledger project context transfer

Status: context synchronization only  
Prepared: 2026-10-17  
Hermes project: `personal-growth`  
Target Hermes session: `Website — Portfolio 起始构建` (`20260927_003216_30e5f2`)

## 1. Read this first

This document transfers the current Life Ledger product context, decisions, failures, and working constraints from the long Codex conversation into Hermes. It is intentionally a structured summary rather than a verbatim transcript, so future models can understand the project without spending tokens replaying weeks of chat.

This transfer does **not** authorize implementation. Do not edit source code, commit, push, deploy, package, install, or launch a new delegated coding run merely because this file was received. The next implementation step requires an explicit user request.

Credentials and temporary authorization codes that appeared in the historical conversation are intentionally omitted.

## 2. Repository and current state

- Repository: `/Users/ashan/Documents/Codex/ll-361-blank-fix`
- Current branch: `codex/today-direction-prototype`
- Current HEAD baseline: `fc1aa6434d2911d6c86e4e69d53566cbc79979f0`
- Product: Life Ledger / Deep Review — personal habit, reflection, memory, timeline, and periodic-review product.
- Current architecture: responsive Web/PWA plus a Tauri macOS wrapper/local mode. The Web product and the macOS product must remain two real deliverables, not one UI blindly reused in both shells.
- Working tree: heavily modified and contains many untracked design/evidence/source files accumulated across the redesign. Treat every existing change as user-owned. Do not clean, reset, overwrite, stage, or commit it without a reviewed plan and explicit authorization.
- Current ordinary-web preview used during the latest review: `http://127.0.0.1:43117/?mode=local&lang=zh&preview=local&v=web5`

The repository `AGENTS.md` contains release discipline. The global `/Users/ashan/.codex/AGENTS.md` contains the newer feasibility, content-contract, vertical-slice, and real-runtime acceptance rules. Both are mandatory.

## 3. User's actual product goal

The user wants a polished, lightweight, local-first personal-growth application that feels intentionally designed for macOS while also retaining a first-class responsive Web/PWA edition.

The core value is not a generic productivity dashboard. It is a calm private record of habits, mood, calendar context, daily reflection, weekly review, monthly insight, photos, and longer-term direction. It should feel open, lively, refined, and personal — closer to the approved Web visual language than to a beige enterprise dashboard or a web page merely embedded in a desktop frame.

The two editions should share:

- data model and import/export compatibility;
- habit icons and existing illustration assets;
- widget/component semantics;
- color, typography, motion principles, and content hierarchy;
- the meaning of Today, Week, Timeline, Insights, Habits, and long-term planning.

They should not share one rigid layout implementation:

- Web/PWA must reflow responsively and remain natural at wide desktop, narrow desktop/tablet, and mobile widths.
- macOS/Tauri may use a native-style window shell, desktop navigation, local storage/folder choices, and Mac-specific interaction conventions.
- A Web preview is not proof that the packaged Mac application is correct. A Tauri screenshot is not proof that the responsive Web page is correct.

The immediate product priority, as last clarified by the user, is: **repair and visually approve the real Web Today page first; only then continue the macOS application.**

## 4. User-approved design direction

The strongest approved direction is represented by the later prototype/evidence checkpoints, especially:

- `docs/today-widgets/weather-gallery/`
- `docs/week-reflection/`
- `docs/timeline-insights/`
- `docs/horizon-habits/`
- `docs/integrated-shell/`

These are references and evidence, not automatically accepted production code. The user liked the warmer, more lively, web-derived visual direction, the weather/gallery treatment, and the clearer page-specific structure. They explicitly rejected later production implementations that drifted from those references.

Desired visual qualities:

- bright but refined paper/sage/blue palette derived from the established Web edition;
- richer light, shadow, tint, and hover response without heavy glass gimmicks;
- rounded, coherent outer shell as well as rounded inner cards;
- original habit icons and generated line illustrations reused consistently;
- clear typographic hierarchy and generous breathing room;
- responsive reflow rather than clipped fixed desktop geometry;
- subtle pointer/hover/focus motion and card response;
- equally intentional light mode, dark mode, and reduced-motion behavior;
- no generic yellow/black dashboard, no stale beige enterprise look, no low-resolution embedded-page feeling.

## 5. Page and feature decisions already discussed

### Today

Today is a configurable collection of useful cards, but configurability must remain understandable.

Relevant cards discussed:

- welcome/date/current status, optionally including current weather;
- mood using the existing mood icon language;
- habits using the original habit icons;
- focus timer;
- daily reflection/note;
- photos/photo wall, including local images and possibly GIF/video later;
- calendar/day context;
- habit heatmap for the full current month;
- seven-day rhythm/recent completion;
- detailed weather with a time axis/chart, high/low, and rain/snow emphasis;
- optional quotation with a library plus user customization.

The weather detail must behave like a useful forecast visualization, not a row of arbitrary hourly labels. Pointer/keyboard exploration should reveal temperature at meaningful times, with a clear day timeline and daily high/low.

Cards are added from a widget catalog. Cards not added should not occupy empty grid slots. Normal mode should be calm and fixed. Moving/reordering/configuration should occur only in an explicit edit mode. Card-specific settings belong in a card settings sheet/panel, not permanently on the card face.

### Week

Week must focus on the week rather than repeat Today seven times. Important content:

- weekly reflection as a primary card;
- weekly goals;
- read-only weekly calendar context;
- useful weekly insights;
- optional weekly weather slice;
- no unnecessary emphasis on daily completion blocks when they do not aid weekly understanding.

### Timeline and Insights

Timeline is the longitudinal browsing surface:

- daily, weekly, and monthly modes on one clear vertical time axis;
- month selection/filtering;
- daily records may contain more photos;
- weekly entries prioritize written review, with photos optional rather than dominant;
- monthly entries are primarily text reviews;
- clicking/browsing previous periods should feel chronological, not like disconnected dashboard cards.

Insights must distinguish actual completion data, recording coverage, and focus time. Comparisons should use equal windows and should not overstate conclusions when there are too few recorded days.

### Long-term direction and Habits

A long-term page/area should support:

- a pinned current phase or longer-term direction;
- several life-area plans;
- dated steps/milestones;
- long-term notes such as future obligations;
- phase review, archive, extension, or carry-forward;
- monthly reflection attached to the broader direction without becoming a plain saved text box.

Habits must preserve the established icons, effective-date logic, ordering, and history. New filters/search must not accidentally hide or corrupt saved habits.

### macOS shell

The approved shell direction borrows the integration quality of modern Mac apps: traffic-light space, a coherent top bar, collapsible navigation, account/avatar area, and one visually unified outer frame. It should not simply paint a fake browser frame around Web content.

## 6. Critical sizing decision: retire universal S/M/L

The latest implementation exposed a fundamental design error: every widget was given generic S/M/L controls before each size had a deliberate content design. This produced clipped text, nearly empty cards, overlapping controls, broken calendar rendering, partial glyphs, and layouts that differed radically from the approved references.

This was not a character-encoding problem. It was a content-contract and responsive-layout failure.

Do not continue the global S/M/L model. There are too many states to make safe by incidental CSS: 11 widgets × 3 sizes × 3 languages × 4 breakpoints × 2 themes already creates 792 combinations before edit/normal modes and interaction states.

Recommended footprint contract for the next checkpoint:

| Component | Supported Web footprint | Notes |
|---|---|---|
| Welcome/date/current status | fixed wide/hero | no generic compact version |
| Mood | fixed small square | content is naturally compact |
| Focus | fixed compact | opens detail/full controls when needed |
| Current-weather chip | fixed compact within welcome | separate from forecast detail |
| Detailed weather | fixed wide landscape | timeline/chart needs width |
| Month heatmap | fixed small/medium calendar tile | complete month and visible empty-day borders |
| Seven-day rhythm | fixed small/medium | no arbitrary large empty state |
| Habits | fixed medium/wide | complete icon rail/list; no clipped labels |
| Reflection | fixed compact preview | opens full editor/detail rather than shrinking text |
| Photos | fixed medium landscape | gallery/media behavior needs space |
| Calendar | fixed large | no small size; compact calendar is a different component if ever needed |
| Photo wall | separate large/gallery component | not a squeezed variant of Photos |

These are a starting contract for user confirmation, not permission to implement all widgets. A component may support one size only. Any second size is a separate designed state with its own hierarchy and fit evidence.

For narrow Web widths, use automatic responsive reflow (for example two columns then one column). Save order and visibility; do not persist absolute desktop coordinates that make mobile layouts collapse.

The user still values edit-mode drag/reorder and add/remove. Those interactions are feasible and should remain, provided the layout model uses valid footprints and responsive placement.

## 7. Latest visible failure evidence

The two screenshots below capture the most recent rejected real-Web state:

- `.hermes/handoffs/assets/web-sml-overflow-2026-10-17.png`
- `.hermes/handoffs/assets/web-edit-layout-collapse-2026-10-17.png`

Observed failures:

- content clipped outside card boundaries;
- calendar and text compressed into unreadable fragments;
- S/M/L controls present even where the content has no viable small state;
- large empty regions with tiny isolated controls/content;
- edit-mode grid no longer resembles the approved composition;
- desktop assumptions leaking into responsive Web rendering;
- implementation was handed to the user without a real visual-parity gate.

These screenshots are retained inside the repository because their original clipboard paths were temporary.

## 8. Why previous work failed

The project has gone through many rounds involving Codex, Hermes, Cursor, AntiGravity, Claude Code, cloud sessions, prototypes, and evidence scripts. Considerable token/time cost did not produce consistent quality. The recurring causes were process and model errors, not a lack of available code-generation capacity:

1. Ambiguous product intent was treated as implementation authorization before feasibility and state-space costs were explained.
2. A flexible dashboard was generalized too early instead of proving one real vertical slice.
3. The approved visual references drifted while work continued; later agents optimized code around a different composition.
4. Generic S/M/L was added mechanically to components whose information architecture cannot survive all three sizes.
5. Tests checked selectors, persistence, or geometry but not whether the page still looked coherent to a person.
6. Generated evidence/mockups were sometimes mistaken for the real runtime.
7. Web and macOS requirements were mixed together, causing each to lose its own layout logic.
8. Green tests and delegated self-reports were accepted despite visible failures.
9. Too many implementation/review loops consumed tokens without a stable user-approved acceptance image.
10. Existing Web icons, colors, and layout assets were sometimes replaced instead of reused.

The user explicitly lost trust because the system repeatedly claimed completion while obvious layout defects remained. Future reports must distinguish: code implemented, automated gates passed, real-runtime checked, visual parity checked, and user approved. These are five separate states.

## 9. Mandatory engineering and product rules

Before any ambitious implementation:

1. Classify context as sufficient, limited, or critical.
2. Run an engineering feasibility gate: straightforward parts, structural difficulty, required separate designs, phases, validation cost, and simpler alternatives.
3. For configurable/resizable UI, write a content contract for every component and supported size before writing layout code.
4. Never fake a size by clipping, shrinking, arbitrary hiding, partial glyphs, or mostly empty cards.
5. Build one representative vertical slice in the real target runtime and get explicit visual/interaction approval before scaling to other components/pages.
6. Explain migration and persistence implications before changing the layout model.
7. If the checkpoint fails, stop and revise the model. Do not multiply the defect across the application.
8. Acceptance must use the real target runtime and exact viewport; mockups, evidence pages, unit tests, or builds are not substitutes.
9. Compare against the latest user-approved reference. Treat visual parity, responsive behavior, content integrity, persistence, and interaction as separate gates.
10. Use a single writer and a read-only reviewer if delegation is later authorized. Stop after two materially distinct failed attempts.
11. Prefer existing project code/assets and native capabilities. Do not add speculative dependencies.
12. Keep the user informed of cost/complexity before committing to a broad design system.

## 10. Correct next checkpoint (proposal only)

The next implementation should be small enough to prove the model:

1. Work on the real Web Today route only.
2. Preserve all user data and existing historical work.
3. Remove/disable universal S/M/L in the Web editing experience.
4. Establish a small set of fixed, deliberate component footprints.
5. Retain add/remove and edit-mode reorder.
6. Implement a non-destructive layout migration/version so old saved layouts do not silently corrupt the new grid.
7. Reuse the original habit icons, mood icons, illustrations, palette, and approved Today composition.
8. Validate real Web runtime at 1440, 1180, 800, and 390 CSS-pixel widths; Chinese, English, and German; light and dark mode; normal and edit mode; pointer and keyboard basics.
9. Manually compare screenshots to the approved reference and reject any clipping, overlap, partial glyph, unreadable text, or unexplained empty space.
10. Ask the user to visually confirm this single Today checkpoint before changing Week, Timeline, Habits, or the macOS shell.

Only after Web Today is approved should the same design language be translated into the Tauri/macOS runtime and verified there independently.

## 11. Relevant files and evidence

Core implementation areas currently involved:

- `public/index.html`
- `public/styles.css`
- `public/app.js`
- `public/layout-engine.js`
- `public/widget-registry.js`
- `public/desk-polish.css`
- `public/desk-polish.js`
- `public/today-extras.js`
- `public/weather-widget.js`
- `public/widget-gallery.js`
- `public/window-shell.js`
- `scripts/local-preview.mjs`
- `scripts/evidence/`
- `tests/today-*.test.mjs`

Design and checkpoint directories:

- `docs/prototypes/`
- `docs/today-widgets/`
- `docs/week-polish/`
- `docs/week-reflection/`
- `docs/timeline-insights/`
- `docs/horizon-habits/`
- `docs/integrated-shell/`
- `docs/local-web/`
- `docs/today-web-parity/`

The README already contains many checkpoint descriptions. Some describe superseded ideas and must not be interpreted as the current acceptance contract without checking this handoff and the user's latest confirmation.

## 12. Current transfer boundary

This handoff is now the compact authoritative bridge from the Codex conversation to Hermes for future planning. It does not erase the repository history or replace the user's decisions. When Hermes resumes work later, it should:

- read this file, repository `AGENTS.md`, global AGENTS instructions, and only the task-relevant skill;
- inspect the actual working tree before proposing changes;
- state a feasibility/cost checkpoint first;
- avoid replaying the previous multi-agent implementation loop;
- ask for explicit implementation authorization if the user has only asked for planning or analysis.

End of transfer.
