# Life Ledger — Reference-video interaction architecture pass

## Goal

The current 3.1 build has improved colors and features, but it still feels structurally old, visually stiff, and inconsistent in proportion. This pass must change the *interaction architecture and composition*, not merely add more transitions to the same layout.

The attached 3:08 reference video demonstrates six dashboard navigation patterns. Analyze the video directly, use the supplied contact sheets for frame comparison, and translate its principles to Life Ledger. Do not copy the demo's brand, yellow/orange palette, content, or all six menu types.

## What the video actually teaches

1. **Sliding active highlight** — a single rounded active shape moves between navigation rows, adapts to label width, and settles with a tiny overshoot. The user's eye follows the same object instead of seeing old/new states blink.
2. **Inline submenu** — chevron rotates, children unfold in place with a thin continuity rail, and only one group stays open. Parent and child hierarchy remain visible.
3. **Hover/mega panel** — a persistent surface swaps content as the pointer moves across top-level items. The container stays anchored; only internal content changes. Useful principle: stable geometry, changing content.
4. **Floating dock** — current item has a dot; hovered icon magnifies while neighbours react slightly; a label appears above. Useful principle: proximity response and unmistakable current state. Do not add a dock if the sidebar remains the primary nav.
5. **Command palette** — shortcut opens a centered search surface over a dimmed/blurred background; results filter live, matched characters highlight, arrows select, Enter navigates. This is highly applicable to Life Ledger.
6. **Status dots/badges** — new/actionable state is visible beside the nav item; new counts roll vertically; a new badge breathes briefly; entering the destination clears or shrinks the signal. Use only for meaningful local states.

## Product-level decisions

- Keep one primary navigation system. For Life Ledger, prefer the macOS sidebar with a shared sliding active highlight plus a command palette. Do not simultaneously ship sidebar + top mega menu + bottom dock.
- The current rigid three-column Today page is not sacred. Recompose it into an adaptive 12-column task dashboard: the current task should occupy 60–70% visual weight; context and insight 30–40%. At narrower widths, context stacks below before primary content gets squeezed.
- Use a small number of purposeful modules rather than many identical cards. Vary spans to express importance. No card soup and no empty desert.
- Dynamic means causal continuity: selection glides, disclosures emerge from their trigger, counters roll, charts crossfade/retarget, and the UI immediately acknowledges input. It does not mean ambient looping animation.

## Required Life Ledger mapping

### Global navigation
- Implement one shared selection/highlight element in the sidebar that translates between Today, Week, Timeline, Review and Habits. It must resize to the destination label/row and remain interruptible during rapid navigation.
- Current view content must transition with spatial continuity (short 6–12px directional offset + opacity, 180–240ms), not a hard cut and not a full-page slide.
- Add a real command palette (`Cmd+K`) for views, dates, habits and common actions. Live filtering, match highlighting, arrow keys, Enter, Escape, empty state and reduced-motion behavior are required.
- Inline expand only where hierarchy exists (for example a compact habit group or saved review range). One expanded group maximum; no fake nested menu.

### Today
- Replace the cramped equal-weight columns with a primary work canvas and contextual rail. Recommended starting composition: date/progress header across 12 columns; habits 7 columns; Focus + mood 5 columns; reflection 7 columns; photos/context 5 columns. Validate alternatives visually.
- Habit completion: full-row target, immediate check state, shared progress/counter update, undo, and subtle numeric roll. The completion motion must connect the row to the summary rather than firing unrelated effects.
- Reflection should feel like a focused editor, not a narrow textarea. Autosave status transitions in place. Photos use a stable reserved frame and clear add/empty/hover states.

### Week / Timeline
- Keep the selected date visually connected across toolbar, content and inspector. Moving between dates retargets the same highlight/indicator instead of rebuilding the screen.
- Timeline selection should preserve list position and animate the detail surface from the selected row's direction.

### Review
- Recompose as an analytics dashboard with a clear reading order: summary strip → primary trend/heatmap → habit comparison → expandable details. No giant empty canvas, no squeezed right table.
- Period changes (7/30/90) retarget existing charts; do not tear down/recreate the layout. Numbers may roll vertically; chart data may crossfade/translate, respecting reduced motion.
- Status/badges may indicate “review ready”, incomplete days or new reflection data, but never fabricate alerts.

### Habits and Settings
- Habit rows reveal secondary actions on hover/focus without moving primary labels. Selecting a row opens a stable detail surface; edits preserve list context.
- Language/theme/settings changes update in place with no decorative global animation.

## Proportion and visual rules

- Use the attached `design-dna-dashboard-motion.json` as the measurable contract.
- 12-column adaptive grid, 12–16px gutters, 16–20px card interiors, 24–32px section rhythm.
- Primary work region 60–70% of available width. Context rail 30–40%. Collapse/stack the rail before allowing text or controls to clip.
- Titles 26–32px maximum in normal desktop view; body 14px; secondary 12–13px; no tiny decorative uppercase labels.
- Continue the warm neutral + sage identity. The reference's neon yellow/orange is behavioral inspiration, not the new brand palette. One rare high-attention accent is allowed for selection/live state only.
- Floating surfaces get depth; inline content uses borders/tonal shifts, not shadows on every card.

## Motion contract

- Button/row press: 100–140ms; selection geometry: 180–240ms; panel/disclosure: 200–280ms; command palette: 180–240ms.
- Enter/move curves: `cubic-bezier(0.22,1,0.36,1)` / `cubic-bezier(0.25,1,0.5,1)`. Exit 60–70% of enter time.
- Transform and opacity only for movement; no `transition: all`; no width/height/top/left animation. Use FLIP/shared geometry when a highlight must resize.
- High-frequency hover: instant appearance, 100–150ms soft exit. Keyboard actions stay immediate.
- Every animation must be interruptible. Rapidly switch views and reopen panels during transition as a test.
- `prefers-reduced-motion` removes travel/overshoot while preserving state clarity.

## Cloud workflow and acceptance

1. Work on `codex/macos-3-wip` from the latest remote commit. Cloud/GitHub Actions only; do not use the user's Mac or My Machines.
2. Before editing, create `docs/reference-video-interaction-audit.md` mapping each of the six reference mechanisms to: adopt, adapt, or reject, with a Life Ledger rationale.
3. Create static layout prototypes or deterministic screenshots for Today and Review at 1180×760 and 1440×900 before finalizing implementation. Compare proportions, not just colors.
4. Implement the coherent system across all five main views. Do not stop after the sidebar demo.
5. Provide a short 60fps interaction demo covering rapid nav switching, inline disclosure, `Cmd+K`, keyboard selection, habit completion + undo, period change, and reduced motion.
6. Test 980/1180/1440/1600, English/Chinese/German, light/dark, 125%/150% text scale. No clipping, empty deserts, nested-scroll traps or dead controls.
7. Add deterministic tests for command-palette filtering/keyboard behavior, one-open-group rule, selection continuity state, reduced motion, rapid-interruption behavior, focus restoration and analytics transitions.
8. Run existing tests and macOS artifact CI. Keep data/import/export/photos/focus/privacy intact. Do not merge or create a stable release.

## Delivery threshold

Do not call this finished because colors changed or transitions exist in CSS. The result must visibly demonstrate improved proportions, hierarchy and causal interaction in the screenshots and demo. The final report must include the commit, PR, diff summary, audit/spec paths, before/after contact sheet, demo link, test totals, CI links and artifact name.
