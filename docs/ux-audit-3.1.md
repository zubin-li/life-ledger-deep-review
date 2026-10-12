# Life Ledger 3.1 — interaction audit

Desktop shell (`html[data-desktop]`). Keyboard shortcuts in the installed app arrive through the native menu bridge. The browser preview of `tauri-local` does not register the web shortcut listener.

| Control | Input | States | Feedback | Empty / error | Keyboard | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- |
| Sidebar nav | Click, menu 1–5 | default, hover, current | Background and 2px sage bar | — | Arrow within nav, Enter activates | Color only |
| Sidebar divider | Drag | default, dragging | Width follows pointer, persisted | Min 156 / max 240 | Collapse via toolbar and menu | No width animation |
| Inspector divider | Drag | default, dragging | Width follows pointer, persisted | Min 280 / max 440 | Toolbar toggle, menu | No width animation |
| Inspector toggle | Click, menu | expanded, collapsed | Pane hides, button stays | — | Button is focusable | Instant |
| Date label | Click | closed, open | Popover with a date field and Today | Invalid dates are ignored by the input | Focus moves into the field, Escape closes | Opacity only |
| Search | Type | empty, query | Today list filters immediately | No matches leave the list empty | Focus from menu Find | None |
| Habit row | Click row or check | idle, hover, done, selected | Check fills in 140ms, toast with Undo | Future days do not toggle | Row is a button, Space/Enter toggles | Fill is instant |
| Mood | Click | idle, pressed | Selected segment fills | — | Buttons in a group | Color only |
| Reflection | Type | idle, focus, saved | Autosave caption | Future day stays locked | Textarea in tab order | None |
| Photo add | File or drop | idle, busy, saved, error | Status line and toast | Unsupported type shows the format error | Add button opens the file input | No enter animation |
| Photo remove | Click | idle, removed | Toast with Undo | — | Action button | Instant |
| Focus start | Click 25/50/Start | idle, running | Time and button label change | — | Buttons wrap, never clip | Color only |
| Language | Select | system, en, zh, de | Copy and dates update immediately and persist | — | Native select | None |
| Analytics window | Click 7/30/90 | one pressed | KPI, trend, and bars recompute from local logs | Fewer than one eligible slot shows the empty line; fewer than four points uses compact values | `aria-pressed` on the buttons | No chart animation |
| Review details | Disclosure | closed, open | Focus and habit detail | Hidden when there is no focus history | Summary is a button | Instant |
| Settings | Menu or sidebar | closed, open | Separate window in Tauri; dialog on the web | — | Cmd+, | Panel opacity |
