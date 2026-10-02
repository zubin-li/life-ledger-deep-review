# Life Ledger macOS v4 design DNA

v3 proved the split-view shell. v4 changes the information architecture: Today is the daily workspace, Timeline is a journal, Review is an essay, and photos live on the device.

## 1. Tokens

- Surfaces: `--surface-0` window, `--surface-1` content, `--surface-2` inset fields, hairline `--separator`. No glass, no decorative gradients.
- Type: system UI font. 11 caption, 12 secondary, 13 body, 15 section. No display headlines in the work area.
- Space: 4px grid. Radius 6 for controls, 8 for rows and photos. Elevation only on the lightbox, menus, and toasts.
- Icons: existing 24px stroke set, `currentColor`.
- Motion: `--motion-button` 140ms, `--motion-popover` 160ms, `--motion-panel` 240ms. Entry `cubic-bezier(0.22, 1, 0.36, 1)`, movement `cubic-bezier(0.25, 1, 0.5, 1)`. Opacity and color only for routine motion. Keyboard actions do not add the enter animation. `prefers-reduced-motion` removes it.

## 2. Qualitative style

Calm, precise, editorial, dense. A Mac window with a sidebar, a toolbar, one scrolling pane, and an optional inspector. Not a dashboard, not a marketing page.

Reference principles, not layouts: Things 3 for direct completion and hierarchy; Day One for date, prose, and a large photo; Habitify and Streaks for a check that leaves a streak you can see.

## 3. Shell and views

- Shell: sidebar (five views plus today’s habits), toolbar (title, date, search, inspector), main pane scrolls inside the window height, inspector is optional.
- Today: habits first, then mood, the day’s writing, and photos in the same scroll. Focus and the event count stay in the inspector.
- Week: one sentence of progress, a seven-day agenda, then goals. Enter opens that day in Today.
- Timeline: month calendar, All / Photos / Notes filter, entry list, and a detail column whose first photo is large. Add, drop, caption, replace, reorder, and remove happen on that day.
- Review: status line, reflection, then the completion trend. Scores and focus stay behind Detailed metrics and in the inspector.
- Habits: the table remains the manager. The inspector adds a 28-day streak grid next to edit, archive (active switch and context menu), reorder, and delete.

## 4. Behavior

- Habit check is immediate and offers Undo.
- Photo add uses the file picker or a drop. JPEG, PNG, WebP, HEIC, and HEIF are prepared locally. Anything else, an empty iCloud placeholder, a failed decode, or a fourth photo shows an error in the editor. There is no fake permission prompt.
- Removing a local photo toasts Undo and restores the same record.
- Preview opens a sheet-style dialog. Arrow keys move the selection; Enter previews; Delete removes.
- Search filters the Today list. Timeline filters do not invent entries.
- Settings, menus, and backup stay where they are. Photo backup is a month `.llmedia` bundle and works without Cloudflare.

## 5. Removed or rebuilt

- Photos are no longer a Cloudflare-only control hidden inside the mood dialog. Local IndexedDB (`life-ledger-photos`) is the default. The cloud API remains only for a deployed Cloudflare workspace.
- Mood and the daily note moved out of the Today inspector into the main journal.
- Timeline habit chips stay a list. The detail column now owns the photo editor instead of a read-only strip.
- The week view leads with a planning sentence instead of another card.
- Review stays a document; the score-card wall is not restored.
