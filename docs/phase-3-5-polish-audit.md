# Life Ledger 3.5 polish audit

Audited the running desktop frontend at `e3c38d6` (product version **3.4.0**, baseline `f82b133`) on 11 October 2026. Chrome loaded `http://127.0.0.1:8765/index.html?desktop=tauri-local` and `launcher.html` from the same `public/` plus launcher files the desktop bundle serves. Fictional starter habits only. Linux cannot launch the macOS `.app`; these shots are the webview document.

Shots live in `docs/phase-3-5/audit/`. Dark, zh, de, and 980 shots were taken while a focus session started earlier in the same browser profile was still running, so the mini-player is visible. That persistence is real. `today-all-done-1440.png`, `settings-data-1440.png`, and `settings-cloud-1440.png` were recaptured in a clean profile.

## Surfaces

| Surface | Shot | What the build actually shows |
| --- | --- | --- |
| Today, open + scheduled | `today-1440-en-light.png`, `today-1440-zh-light.png`, `today-1180-de-light.png`, `today-1440-en-dark.png`, `today-980-en-light.png` | One list. Sleep sits on a 23:30 gutter. Header is the weekday and “0 of 7 done”. No time-of-day copy and no header illustration. The lower half of the pane is empty paper. |
| Today, all done | `today-all-done-1440.png` | “7 of 7 done”, a stacked-card drawing, the sentence “All of today's habits are done”, then a white check disc and a dark pill (“Every goal counted for today is complete.”) that covers the help line. A “One promise kept / Undo” toast sits on the completed list. |
| Week | `week-1440-en-light.png`, `empty-week-1440.png` | Vertical days. Sunday opens its habits in place. Coach line stays: “Select a day, or press Enter…”. With zero habits the isometric bar slab repeats “Weekly goals · 0 of 0” under the same sentence. |
| Journal timeline | `journal-timeline-1440.png`, `empty-journal-1440.png` | Composer on the left, notebook drawing, “No memories here yet”. The right column says “Select a day to view details” and stays empty. |
| Journal photos | `journal-photos-1440.png` | Same notebook drawing, titled “Photos”. |
| Journal calendar | `journal-calendar-1440.png` | Month grid with the 11th marked, composer under it, and the same empty right column. |
| Insights | `insights-trend-1440.png`, `insights-calendar-1440.png`, `insights-habits-1440.png`, `insights-table-1440.png`, `empty-insights-1440.png` | Range, “0 per day”, three zeros, and a flat 0% line that looks like a result. With no habits, an isometric chart says the window has no completions, and the zeros remain above it. |
| Habits list + editor | `habits-list-1440.png`, `habits-editor-1440.png`, `empty-habits-1440.png` | List selects a row; the editor is the secondary column. Empty state still shows the full editor beside an isometric checklist whose plus card floats away from the list. |
| Settings | `settings-1440.png`, `settings-data-1440.png`, `settings-cloud-1440.png` | General, Data, Cloud & Sync, Calendar, Habits. Appearance, Language, and Motion are selects with the value on the right and no confirmation. Data shows Import & export, then unlabeled year and month selects. |
| Focus chip, panel, mini-player | `focus-panel-1440.png`, `focus-running-panel-1440.png`, `focus-mini-1440.png` | Idle chip until a session starts. Panel shows an hourglass on a floating slab, 25:00, Start, and a stepper. Closing the panel reveals the bottom mini-player. |
| Search | `search-expanded-1440.png`, `search-no-results-1440.png` | Search expands in the toolbar. “zzzz-no-match” clears the list and says “No habits scheduled for today”. |
| ⌘K | `command-palette-1440.png` | Palette lists jumps. Labels say “Go to Timeline” and “Go to Review” while the sidebar says Journal and Insights. |
| “+” | `create-popover-1440.png` | New habit, Journal entry, Add weekly goal, Start focus. The menu covers the mood control. |
| Context menu | `context-menu-1440.png` | Mark complete, Edit, Inactive, Delete habit. |
| Toast / Undo | `toast-undo-1440.png`, `day-detail-1440.png` | Undo is present. The toast covers the mini-player so “Pause” reads as “ause”. |
| Reflect sheet | `day-detail-1440.png` | Note, autosave, photo slot. Toast still overlaps the mini-player behind the sheet. |
| Launcher | `launcher-1440.png` | Local and Cloud cards. Version reads 3.4.0. The two hairline drawings are a faint dot, not a readable local-versus-cloud pair. |
| Empty Today | `empty-today-1440.png` | “No habits scheduled for today”. No first-run illustration. |

## Problems

1. **High.** Search with no matches uses the empty-day sentence. `search-no-results-1440.png`. The habits are still scheduled; the query excluded them.
2. **High.** The toast and the focus mini-player share the bottom center and overlap. `toast-undo-1440.png`, `day-detail-1440.png`.
3. **High.** All-done stacks three success signals at once: the empty-state sentence, a full-screen check (CSS `celebrateFade` is 1.9s), and the undo toast. The pill covers the help text. The drawing is three stacked cards, not a state that can grow. `today-all-done-1440.png`. The Today header does not change for morning, evening, or done. `today-1440-en-light.png`.
4. **High.** Journal’s right column stays “Select a day to view details” while the calendar has already marked a day and the composer is already on screen. `journal-calendar-1440.png`, `empty-journal-1440.png`. Two primaries, one of them empty.
5. **High.** The eight hairline SVGs share one isometric slab. Focus hourglass is oversized for the panel (`focus-panel-1440.png`). Insights draws the trend stroke twice in the SVG and again as a live 0% chart (`empty-insights-1440.png`, `insights-trend-1440.png`). The habits plus-card floats in empty space (`empty-habits-1440.png`). Photos reuse the journal notebook (`journal-photos-1440.png`). Launcher local and cloud are not readable (`launcher-1440.png`). Week’s bar slab repeats a line the header already states (`empty-week-1440.png`).
6. **Medium.** Insights with habits but no completions still draws a full trend at 0% and “0 per day”, so an empty window looks like a result. `insights-trend-1440.png`.
7. **Medium.** Command names do not match the sidebar. `command-palette-1440.png`.
8. **Medium.** Settings changes do not confirm in place. `settings-1440.png`. Motion Full / Reduced / Off does not name every animation: `html.motion-off` skips `barGrow`, `fillGrow`, `celebrateFade`, `celebrateRing`, `celebrateText`, `dateShiftForward`, `dateShiftBack`, `popoverIn`, `datePopoverIn`, `dashboardLineIn`, `dashboardPointIn`, `focusMiniPulse`, `voiceBreathe`, `analyticsBarIn`, `focusReviewBarIn`, `mobileToolsIn`, `photoIn`, `badgeShrink`, `rollOut`, `rollIn`, `sheetIn`, `trendDraw`, `createItemIn`, `habitCheckPop`, `habitCheckDraw`, `hairlineSettle`, `hairlineLayer`, `flipRevealIn`, `syncDot`, `languageRefresh`, `numberPop`, and `focusComplete`. `focusComplete` also animates `filter`, outside transform / opacity / clip-path. Reduced motion is a global travel kill, but the required per-selector test does not exist yet.
9. **Medium.** Settings → Data shows year and month selects. The markup sets `hidden`, and `.date-jump { display: flex }` overrides it. They retarget the global cursor with no label. `settings-data-1440.png`.
10. **Medium.** At 980px the toolbar date is clipped (`Sun, 11 Oct 202`) and the mood labels collapse to icons with no text. `today-980-en-light.png`.
11. **Low.** The week coach sentence remains after a day is already open. `week-1440-en-light.png`.
12. **Low.** The “+” menu covers Good / Calm / Low. `create-popover-1440.png`. Acceptable for a popover; do not add a second create entry point.
13. **Low.** Future-day habit checks disable without a reason the user can read. The control is `disabled` and has no `title`.

## References

Patterns only. No code or assets were copied for this audit.

| Source | What was studied | License stance |
| --- | --- | --- |
| Apple HIG (feedback, reduce motion, one primary) | Immediate response, disabled explanation, short system feedback, motion that can be turned off | Platform guidance, no asset copy |
| Things-style today list | Open items, scheduled time gutter, completed items leave the open list, undo instead of a second confirm | Reference only |
| Day One-style journal | Timeline, photo library, and calendar as modes; an empty photo library is not an empty notebook | Reference only |
| Zed, Raycast command palette | Names in the palette match the sidebar; the palette is a panel, not a full-screen menu | Reference only |
| Obsidian, Logseq | Local-first settings, quiet chrome, no decorative illustration on a working list | Reference only |
| AFFiNE, Excalidraw | Canvas products; useful only as a warning against extra drawing tools | Reference only |
| Actual `8e165c0e`, Memos `0d989707`, Kairos `fb1f18d2`, Super Productivity `0bb6d44d` | Already recorded in `THIRD_PARTY_NOTICES.md` | MIT, already noticed; no new copy |
| AppFlowy `5cf3a365`, Loop Habit Tracker `7e993e17` | Visual reference only | AGPL / GPL, do not copy |

## Adopt / reject

Adopt:

- Things: completing a habit leaves Open and can be undone. Already true; keep it, and stop the toast covering the player.
- Day One: photos, writing, and “not enough data” each get their own small drawing.
- HIG: Motion Off stops every animation; Reduced keeps opacity and drops travel; the all-done moment is one shot under 600ms.
- Raycast: palette labels use Journal and Insights.
- A plant on the done state may grow a little with the streak. Filled week bars may match days completed. No padded counts.

Reject:

- More isometric slabs, confetti, 3D, mouse tilt, and full-screen menus.
- A second Today layout. The open / scheduled list stays.
- Any GPL or AGPL asset, and any new runtime dependency.
- Removing Undo, the focus mini-player gate, or the local-first backup path.

## Control matrix

Repeated rows (each habit check, each calendar day, each week row) are one control. Decision is keep, fix, or remove.

| Surface | Control | Purpose | Immediate | Disabled | Loading | Success | Failure | Undo | Keyboard | Focus | Motion | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sidebar | Today, Week, Journal, Insights, Habits | Switch the primary view | Selected nav item | — | — | View swaps | — | — | Click; palette duplicates | Visible on buttons | Indicator should honor Off | keep |
| Sidebar | Settings | Open settings | Native window on macOS; in this browser `?settings=1` shows the pane | — | — | Pane or window | Invoke missing in the browser preview | — | Button | Visible | Dialog animation must honor Off | keep |
| Sidebar | Collapse | Hide or show the sidebar | Icon morph | — | — | Sidebar width changes | — | — | Button | Visible | Morph must honor Off | keep |
| Sidebar | Sync dot | Show local save | Dot | — | — | Quiet status | — | — | Not a control | — | `syncDot` must honor Off | keep |
| Sidebar | Per-habit shortcuts | Jump to a habit | Hidden on desktop (`display: none`) | — | — | — | — | — | Not in the desktop tab order | — | — | keep |
| Toolbar | Previous / next date | Move the selected day | Label and list update | — | — | New day | — | — | Buttons | Visible | Date shift must honor Off | keep |
| Toolbar | Date label | Open the date popover | Popover | — | — | Date applies | — | — | Button, Escape closes | Visible | Popover must honor Off | keep |
| Toolbar | ⌘K | Open the command palette | Palette | — | — | Command runs | Empty query state exists | — | ⌘K, arrows, Enter, Escape | Visible | Panel must honor Off | fix |
| Toolbar | Search | Filter the current list | Field expands | — | — | Matches stay | No-match copy is the empty-day sentence | Clear the field | Button, then the field | Visible | Expand must honor Off | fix |
| Toolbar | “+” | Create a habit, a journal entry, a weekly goal, or start focus | Menu opens | — | — | Destination opens | — | — | Button, arrows, Escape | Visible | Item stagger must honor Off | keep |
| Toolbar | Focus chip | Open the focus panel | Panel | — | — | Panel | — | — | Button, Escape | Visible | Panel must honor Off | keep |
| Today | Mood Good / Calm / Low | Set the day’s mood | Pressed state, toast | — | — | Toast | — | — | Buttons | Visible | — | keep |
| Today | Reflect on today | Open the note and photo sheet | Sheet | — | — | Autosave line | — | — | Button, Escape | Visible | Sheet must honor Off | keep |
| Today | Habit check | Complete or reopen a habit | Row leaves Open; check draws | Future dates disable with no reason | — | Toast | — | Undo toast | Button, context menu | Visible | Check pop must honor Off | fix |
| Today | Completed / Not in today’s score | Disclose finished or unscored habits | Disclosure opens | — | — | List | — | — | Summary | Visible | — | keep |
| Today | Header | Say what kind of day it is | Static weekday and count | — | — | — | — | — | Not a control | — | — | fix |
| Today | All-done moment | Mark the day complete once | 1.9s disc plus pill plus toast | — | — | Overlaps the help text | — | Undo still on the toast | — | — | Must be ≤600ms and honor Off | fix |
| Week | Day row | Open that day’s habits in place | Row expands | — | — | Habits | — | — | Enter | Visible | Expand must honor Off | keep |
| Week | In-day check | Same as Today’s check | Same toast | Future: silent disable | — | Toast | — | Undo | Button | Visible | Same as Today | fix |
| Week | This week / Longer term | Switch the goals scope | Segment | — | — | Scope | — | — | Buttons | Visible | — | keep |
| Week | Generate weekly review | Draft a review | Button | — | Needs a busy state if generation waits | Toast exists in code | No inline failure seen | — | Button | Visible | — | fix |
| Journal | Timeline / Photos / Calendar | Switch journal mode | Selected tab | — | — | Mode | — | — | Tabs | Visible | FLIP must honor Off | keep |
| Journal | Save note | Write the day’s note | “Saved” | — | — | Saved | — | — | Button | Visible | — | keep |
| Journal | All / Photos / Notes | Filter the timeline | Segment | — | — | Filter | — | — | Buttons | Visible | — | keep |
| Journal | Month previous / next | Change the visible month | Grid updates | — | — | Month | — | — | Buttons | Visible | — | keep |
| Journal | Calendar day | Choose a day | Day marks | — | — | Composer updates; right column often stays empty | — | — | Buttons | Visible | — | fix |
| Journal | Mood / Heatmap | Switch the calendar encoding | Segment | — | — | Grid | — | — | Buttons | Visible | — | keep |
| Insights | Trend / Calendar / Habits / Table | Switch the report | Selected tab | — | — | View | — | — | Tabs | Visible | Draw must honor Off | keep |
| Insights | 7 / 30 / 90 days | Set the window | Selected chip | — | — | Numbers | A zero window still looks like a chart | — | Buttons | Visible | — | fix |
| Insights | Generate monthly review | Draft the month note | Button | — | Busy state unclear | Text appears | No inline failure seen | — | Button | Visible | — | fix |
| Insights | Detailed metrics disclosure | Show the extra table | Disclosure | — | — | Table | — | — | Summary | Visible | — | keep |
| Habits | Add habit | Start a new habit | Editor clears | — | — | Editor | — | — | Button | Visible | — | keep |
| Habits | Row | Edit that habit | Row selects; editor fills | — | — | Fields | — | — | Row button | Visible | — | keep |
| Habits | Drag handle | Reorder | Grip | — | — | New order | — | Reorder toast exists; confirm it stays | Keyboard order if present | Visible | Travel must honor Off | keep |
| Habits | Active toggle | Pause a habit | Switch | — | — | Row state | — | — | Switch | Visible | — | fix |
| Habits | Icon, color, mode, target, schedule, score, active | Define the habit | Control updates | — | — | Save toast | Validation not inline | — | Fields | Visible | — | fix |
| Habits | Save | Commit the editor | Button | — | — | Toast | — | — | Button | Visible | Submit glyph must honor Off | fix |
| Habits | Delete | Remove the habit | Menu or button | — | — | Toast | — | Context-menu path has Undo; the editor path must too | Menu item | Visible | — | fix |
| Focus | Start | Begin a session | Clock runs | — | — | Running panel, then mini-player | — | Finish or skip | Button | Visible | Pulse must honor Off | keep |
| Focus | Stepper − / + | Change minutes before start | Number | At a sensible floor | — | Time label | — | — | Buttons | Visible | — | keep |
| Focus | Pause / Finish / Skip | Control a live session | Label flips | Hidden until a session exists | — | Toast on finish | — | — | Buttons | Visible | Complete flash must honor Off and drop `filter` | fix |
| Focus | Mini-player | Continue a session while the panel is closed | Player | Hidden when idle or when the panel is open | — | Same actions | — | — | Buttons | Visible | Must not sit under the toast | fix |
| Search | No-match state | Explain the empty filter | Wrong sentence | — | — | — | Reads as “no habits today” | Clear search | — | — | — | fix |
| Palette | Command rows | Run the named command | Highlight | — | — | Action | Names disagree with the sidebar | — | Arrows, Enter | Visible | — | fix |
| Context menu | Mark, Edit, Inactive, Delete | Act on one habit | Menu | — | — | Toast or navigation | — | Delete needs Undo on every path | Menu, Escape | Visible | — | fix |
| Toast | Undo | Reverse the last state change | Toast | Hidden when there is no action | — | State returns | — | This is the undo | Button | Visible | Must clear the mini-player | fix |
| Reflect | Note | Record the day | Autosave | Future day disables the field | — | “autosaved” | — | — | Textarea | Visible | — | keep |
| Reflect | Add photo | Attach up to three private photos | Button | Disabled at three or with no date; reason is the count line | Busy while reading | Thumbnail | Toast on failure in the photo module | Photo undo exists in that module | Button | Visible | — | keep |
| Reflect | Close | Dismiss the sheet | Sheet closes | — | — | — | — | — | Escape | Visible | — | keep |
| Settings | General / Data / Cloud / Calendar / Habits | Switch settings section | Selected tab | — | — | Panel | — | — | Tabs | Visible | — | keep |
| Settings | Reminder card | Open the reminder dialog | Dialog | — | — | Save reminder toast | — | — | Button | Visible | Dialog must honor Off | keep |
| Settings | Appearance, Language, Motion | Set theme, language, motion | Select changes the UI | — | — | No in-place confirmation | — | Change the select again | Select | Visible | The choice must actually stop every animation | fix |
| Settings | Import & export | Open the backup dialog | Dialog | — | Busy on read | Export toast; restore undo exists | Error toast in code | Restore undo | Button | Visible | — | keep |
| Settings | Year / month selects | Jump the global cursor | They are visible with no label | HTML says `hidden` | — | Whole app retargets | — | — | Accidentally tabbable | — | — | fix |
| Settings | Switch workspace | Return to the launcher choice | Button | — | — | Launcher when the bridge exists | Browser preview has no bridge | — | Button | Visible | — | keep |
| Settings | Close | Dismiss settings | Pane closes | — | — | — | — | — | Button, Escape | Visible | — | keep |
| Backup dialog | Export / Import tabs, Export, Done | Write or read a backup | Tab and buttons | Photo option disables outside month scope | Busy on file read | Toast | Invalid file message in code | Restore undo | Dialog keys | Visible | — | keep |
| Launcher | Language | Set launcher language | Select | — | — | Copy swaps | — | — | Select | Visible | — | keep |
| Launcher | Open local app | Enter the local desk | Button | — | — | Navigation | Error line if launch fails | — | Button | Visible | — | keep |
| Launcher | Open connected app | Open the typed deployment | Submit | — | — | Navigation | Inline URL error | — | Submit | Visible | — | keep |
| Launcher | Forget saved URL | Clear the stored cloud URL | Button | — | — | Field clears | — | — | Button | Visible | — | fix |
| Dialogs | Close on reminder, mood reason, voice, review canvas, CloudBase, photo lightbox, focus timer | Dismiss that dialog | Dialog closes | Some actions disable until valid | Voice and sign-in have busy states | Save toasts where the action writes | Inline errors on sign-in | — | Escape / close | Visible | Dialog motion must honor Off | keep |

“Fix” rows to implement, and nothing else from this matrix:

- Palette labels match Journal and Insights.
- Search no-match copy, plus a small no-results drawing.
- Habit checks on a future day say why they are disabled.
- All-done celebration is one shot, ≤600ms, does not cover the help line, and follows Motion.
- Today header copy and drawing follow morning / evening and done / not done.
- Journal’s empty right column shows the selected day or gets out of the way.
- Insights with no completions uses the insufficient-data drawing instead of a fake 0% chart.
- Weekly and monthly generate buttons show busy, then success or failure.
- Habit active toggle and Save confirm in place; every delete offers Undo.
- Focus finish animation drops `filter`; the mini-player and the toast no longer overlap.
- Settings selects confirm in place; Motion Off / Reduced cover every animated selector, with a test.
- Settings year and month honor `hidden`.
- 980px toolbar date stays fully visible.
- Hairline drawings are rebuilt as one system (next section). Launcher forget confirms.

## Hairline decision

Rebuild the existing eight drawings on the 160×120 grid before adding new ones. New drawings only where they change a decision: first run, all done (plant, streak-aware), empty photos, empty journal, insights with no data, focus idle and focus complete, backup success, search with no matches, offline or sync trouble. Document the rules in `docs/hairline-system.md` during implementation.
