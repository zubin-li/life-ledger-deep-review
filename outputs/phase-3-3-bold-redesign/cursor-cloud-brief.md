# Life Ledger 3.3 — bold macOS product redesign

## Mission

Rebuild the current 3.2 beta into a visibly different, coherent macOS productivity app. This is not a polish pass. It is authorized to make large structural changes on the existing test branch.

Repository: `zubin-li/life-ledger-deep-review`

Branch: `codex/macos-3-wip`

Pull request: draft PR #12

Current baseline: commit `3654c31f4c652a82af22c2c696d5e200835983a8`, version 3.2.0

Work only in the cloud. Do not access or depend on the user's Mac. Do not merge the PR.

## Why 3.2 failed

Read the attached `failure-audit-3.2.md` first. The key failure is that 3.2 added interaction utilities but preserved the same first-frame composition. A moving sidebar pill, `Cmd+K`, rolling numbers, and a 7/5 card grid do not constitute a new app experience.

The user explicitly says the current build still feels old, static, crowded, and insufficiently user-friendly. Treat that judgment as the acceptance baseline.

## Research gate — do this before coding

Create `docs/phase-3-3-design-contract.md` with a concise reference-to-decision matrix. Use these primary references and the attached dashboard video/contact sheets:

1. Apple HIG — Sidebars: https://developer.apple.com/design/human-interface-guidelines/sidebars
2. Apple HIG — Toolbars: https://developer.apple.com/design/human-interface-guidelines/toolbars
3. Apple HIG — Motion: https://developer.apple.com/design/human-interface-guidelines/motion
4. Things — all-new design and interactions: https://culturedcode.com/things/features/
5. Day One macOS journal views: https://dayoneapp.com/guides/day-one-for-mac/journal-views-in-day-one-for-macos/
6. Day One Today view: https://dayoneapp.com/guides/tips-and-tutorials/today-view/
7. Linear redesign process: https://linear.app/now/how-we-redesigned-the-linear-ui
8. Linear calmer interface: https://linear.app/now/behind-the-latest-design-refresh
9. Raycast’s native UI consistency principle: https://www.raycast.com/blog/how-raycast-api-extensions-work

Also inspect these skill references before implementation. Do not merely mention them; extract applicable rules into the design contract:

- `leonxlnx/taste-skill@redesign-existing-projects`
- `emilkowalski/skills@apple-design`
- `pbakaus/impeccable@animate`
- `anthropics/skills@frontend-design`

The design contract must state exactly what is adopted, adapted, and rejected. Do not copy the video’s brand, yellow/black color scheme, or all six navigation patterns.

## Product architecture to implement

### 1. Navigation

Use one macOS-style sidebar, collapsible with a toolbar button. Keep no more than five top-level destinations:

1. Today
2. Week
3. Journal (rename/recompose Timeline)
4. Insights (rename/recompose Review)
5. Habits

Global search/command access belongs in the toolbar and `Cmd+K`. Do not add a bottom dock, top tab bar, or second competing navigation system.

### 2. Today — one job, not a dashboard wall

The first frame must focus on completing today’s habits.

- Main canvas: date, one concise progress indicator, and the habit list.
- The habit list owns most of the visual area and has clear hierarchy, generous rhythm, keyboard navigation, and immediate completion feedback.
- Calendar events may appear as one compact contextual strip, not another card grid.
- Mood is a compact daily check-in near the progress/header, not a permanent equal-size panel.
- Reflection and photos live in a **day detail sheet/inspector** opened from a visible “Reflect on today” action or selected-day affordance. The inspector is hidden by default and must not permanently consume one third of the window.
- Focus is a compact toolbar/mini-player control. Expanding it opens a focused floating panel or dedicated focus mode. Remove the permanent right Focus rail.
- Completed habits move into a collapsible completed section with spatial continuity.

Delete or fundamentally replace the current permanent Today card grid (`today-primary`, `today-context`, `today-journal`, `today-photos-zone`) and the persistent three-band composition. Merely restyling those selectors is a rejection.

### 3. Week — planning surface

Use a calm agenda/list with a single selected-day detail surface. Switching days should retarget the same surface. Do not show every secondary function at once.

### 4. Journal — memory and reflection

Make this the home for entries, photos, mood, and daily reflections.

- Use a Day One-like list/detail split view when the window is wide.
- Timeline cells may show one photo thumbnail and concise metadata.
- Offer Timeline / Photos / Calendar as modes inside Journal, not as top-level app destinations.
- Selecting an entry updates the detail pane with a shared-container transition; it should not rebuild or flash the whole page.

### 5. Insights — readable analytics, not KPI-card clutter

- At most three top summary metrics.
- Primary chart: completion trend over time.
- Secondary: calendar consistency heatmap.
- Habit comparison: sorted horizontal bars with visible values.
- Monthly reflection is below or beside analytics only when space supports it; no cramped permanent score table rail.
- Use locale-aware dates/numbers, tooltips or direct labels, clear empty states, and a text/table alternative where needed.
- Avoid radar charts, gauges, decorative gradients, and dozens of small metric cards.

### 6. Habits — management only

Creation, schedule, color, target, archive, and reorder belong here. Today should not expose full editing controls until requested.

## Visual language

- Preserve the best part of 3.1: warm paper-like neutrals, restrained sage/teal accent, calm personal tone.
- Explicitly remove the high-saturation yellow/black dashboard feeling.
- Use the macOS system font stack. Do not add Google Fonts.
- Prefer native/system control proportions, familiar symbols, subtle separators, and content hierarchy over a grid of outlined cards.
- Use one elevation/radius system. Do not put every section in an identical rounded rectangle.
- Body text must remain comfortably readable at narrow and wide desktop widths; never compress labels into unusable columns.
- Support light and dark themes with semantic tokens, not one-off colors.

## Motion system — meaningful and visible

Motion must explain cause and continuity, remain interruptible, and respect reduced motion.

Implement these real product transitions:

1. **Habit completion:** press feedback within 100ms; checkbox/checkmark morph; progress updates; completed row moves into the completed group using FLIP/shared-layout motion. Undo reverses it.
2. **Day navigation:** date content slides consistently by temporal direction while stable chrome stays mounted.
3. **Day detail:** reflection/photo inspector opens from the selected day or “Reflect” trigger with shared spatial origin; close reverses toward the trigger.
4. **Journal selection:** the list selection indicator glides; the detail content crossfades/retargets inside a stable container.
5. **Focus:** compact controller expands into focus mode from its source, and collapses back to the same source.
6. **Insights:** charts animate only on first reveal or range change; use restrained draw/grow transitions and direct labels. No perpetual animation.
7. **Command palette:** fast scale/fade from toolbar/shortcut context with complete keyboard behavior.

Use transform/opacity, a consistent 150–320ms rhythm, faster exits, and spring-like easing where it adds physical continuity. All interactions remain usable while animation runs. `prefers-reduced-motion` and the app’s motion-off setting must provide equivalent static feedback.

## Preserve

- Existing user data and storage schema.
- Habit logs, notes/reflections, mood, photos, focus history, backup/import/export, languages, themes, and offline/local-first behavior.
- Existing native Tauri shell, permissions, widget code, and CI unless a directly necessary adjustment is required.
- Widget work is out of scope for this phase.

Features may move or become progressively disclosed. Preserving a feature does not mean showing it in the first frame.

## Required implementation evidence

Do not declare completion without all of the following committed to the branch:

1. Actual-app screenshots from the built Tauri app at 1180×760 and 1440×900 for Today, Journal, and Insights in `docs/phase-3-3/`.
2. A 20–45 second actual-app video or GIF showing habit completion/reorder, day navigation, day-detail opening, Journal selection, Focus expansion, and an Insights range change.
3. A side-by-side contact sheet comparing 3.2 and 3.3 actual-app Today/Insights screens.
4. `docs/phase-3-3-design-contract.md` and `docs/phase-3-3-verification.md` describing adopted references, rejected patterns, tested window sizes, languages, dark mode, keyboard behavior, and reduced motion.

Separate mock HTML, prototype-only PNGs, or screenshots that do not come from the built app do **not** satisfy this requirement.

## Acceptance tests

- A first-frame screenshot must be unmistakably different from 3.2 in composition, not just color, spacing, or card radius.
- The permanent right Focus rail and old Today four-card grid are gone.
- Today has one obvious primary task and does not expose photos/reflection/focus simultaneously.
- Journal makes photos/reflections first-class and usable.
- Insights reads cleanly without clipped labels or squeezed columns at 1180px and 1440px.
- English, German, and Chinese strings fit without clipping.
- Keyboard: Tab order follows visual order; Enter/Space complete habits; arrows navigate where appropriate; Escape closes sheets/palette; shortcuts do not collide.
- Every visible control responds; no dead buttons.
- Reduced motion, light theme, and dark theme remain functional.
- No data-loss regression and no storage migration unless explicitly documented and backward-compatible.

## Gates

Run and pass:

```text
npm ci
npm test
npm run desktop:check
npm run desktop:prepare
cargo test --manifest-path src-tauri/Cargo.toml
npm run desktop:build
```

Then let the existing GitHub CI and macOS Desktop Verification workflows finish successfully.

## Release and report contract

- Bump the app/package/Tauri version consistently to 3.3.0 only after the redesigned app and evidence are complete.
- Commit and push to `codex/macos-3-wip`; keep PR #12 as draft; do not merge.
- Provide the final commit SHA, exact changed files, exact commands and results, CI run URLs, artifact name, known limitations, and paths to the actual-app screenshots/video.
- Do not say “done” if the visible composition is still substantially the 3.2 layout.
