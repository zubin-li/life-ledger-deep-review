# Horizon / Habits checkpoint

2026-10-15. Real app routes with fictional records; user visual confirmation pending. No commit, push, package, native installation, deploy or personal-data access.

## Product and data contract

- A new sidebar/command-palette Horizon view; the Week long-term entrance leads here. Existing Cmd/Ctrl+1…5 mappings and native menus are unchanged.
- Exactly one current phase can be pinned. Its compact summary stays at the top of the Horizon page scroller, including when browsing another phase. It is not a floating overlay on every page.
- Phase start/end, focus, adjustments and review history live in additive `state.planning`. Starting/pinning a phase does not implicitly close others. Upcoming, active, due-for-review and archived presentation are distinguished.
- Plan cards reuse `state.longTermGoals`; optional area, phaseId, steps, events and date metadata extend existing records. Unassigned legacy goals remain ongoing items. Editing them does not automatically bind a phase or fill a previously unset review date.
- Review/close archives a copy of phase plans and steps. Archived cards cannot edit those snapshots. Explicit carry-forward creates new linked records, copies only unfinished steps, resets their completion, and sets review dates to the new phase end. It does not delete or rewrite the previous phase. Carry-forward is a bulk opt-in, not an individual selection wizard.
- Long-term notes survive phase changes. Monthly writing uses the existing `state.reviews[YYYY-MM]`, shared with Insights and Timeline; no duplicate monthly store or generated fake reviews.
- Additive planning data is included in this edition's JSON exports (like long-term goals, across export scopes), validated on import, and merged for partial restores. Existing generic cloud payload storage carries the new field, but a real external cloud account roundtrip was not performed.
- Phase/note merging uses updatedAt and phase IDs; it is not a collaborative CRDT. Existing server payload size and local storage limits remain. Older app versions do not understand the new planning field, so this edition's backup should be used to preserve it.
- Plan due dates are user-entered. Due hints are in-page, not macOS notifications, automatic scheduling, or tax/legal advice. No automatic progression or extension.
- The new structural cards are content-sized, not a second free-drag Today widget canvas. Further layout customization is not claimed implemented.

## Habits

- Original icons, colors, settings, effective versions, enable/pause, keyboard and pointer ordering are reused. Search and status filters are in-memory view preferences.
- Ordering a filtered list changes only visible slots; hidden habits remain intact. Real pointer drag and Alt+Arrow key tests confirm both the order change and preservation of every ID.
- Frequency/target/note versions apply from an effective date. Name/icon/color/enabled state remain global, matching the existing data model; the UI explains this distinction.
- Search/filter preserves the selected editor rather than silently discarding its draft. A selected habit may remain in the editor while filtered out of the list. Empty libraries hide the editor.
- Narrow layouts have one page scroller; clicking a habit scrolls to its editor. Settings dialogs may scroll naturally as dialogs. New page actions have explicit labels; the old toolbar's irrelevant date/edit-layout controls respect `hidden`.

## Checks

- `node --check public/long-range.js` and `npm run check`: passed.
- `npm run desktop:check`: 80 passed.
- `node --test tests/long-range.test.mjs tests/habit-order.test.mjs tests/review-canvas.test.mjs tests/responsive-layout.test.mjs`: 15 passed.
- `node scripts/evidence/horizon-habits.mjs`: 22 layout scenarios plus interaction assertions, current names/results in `results.json`. EN/ZH/DE light/dark desktop; 1180/900px German and 390px all three languages in reduced motion. No page runtime errors.
- Functional assertions cover step persistence through reload, note persistence, monthly Timeline parity, invalid range rejection, extension, archiving, snapshot immutability, future phase presentation, carry-forward, new standalone plan creation/completion, complete backup roundtrip, legacy partial restore, legacy unassigned goal editing, pause/resume, search, actual filtered keyboard/pointer reorder, and effective-version note saving.
- The first run exposed an evidence assumption: Playwright `check()` tried to wait on a checkbox that correctly disappeared from the Paused filter after enabling. The script now clicks and verifies the stored active state. A subsequent assertion incorrectly expected a habit note at the root instead of its effective version; it now verifies `versionFor(...).note`. Completion checks were not removed, and actual reorder-change assertions were strengthened.
- The habit-order source-contract test was updated from unconditional splice to visible-slot-preserving ordering. No feature gate was disabled to pass.
- This is not an all-repository-green or native WebKit claim. The previously reported unrelated Day Plan static CSS test conflict was not retested or changed here. No full app build, real cloud sync, system notification or native package verification was performed.

## References and reuse

- [Bullet Journal migration](https://bulletjournal.com/pages/migration): periodically decide what still deserves to move forward; reference for explicit review/continuation, not copied material.
- [AppFlowy roadmap](https://docs.appflowy.io/docs/appflowy/roadmap): status, milestones and horizon views; conceptual reference only. No AGPL code, assets or framework were imported.
- Existing app storage, monthly review, long-term goal records, habit form, icon catalog and screenshot server were reused. No new dependency or delegated writer was used.
