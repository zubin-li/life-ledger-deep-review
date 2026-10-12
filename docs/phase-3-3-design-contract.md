# Phase 3.3 design contract

This contract is the information-architecture reset for Life Ledger 3.3. It replaces the 3.2 first frame. Restyling `today-primary`, `today-context`, `today-journal`, or `today-photos-zone`, or keeping a permanent right Focus rail, is a rejection.

## Why 3.2 is not the baseline to preserve

Phase 3.2 added a sliding nav pill, `Cmd+K`, rolling counts, and a 7/5 card grid. The first frame stayed a sidebar, a crowded canvas, and a permanent inspector. Prototype PNGs were not the built app. The accepted 3.3 composition is a different first frame: one job on screen, secondary work behind an explicit action.

## Reference matrix

| Source | Adopt | Adapt | Reject |
| --- | --- | --- | --- |
| Apple HIG Sidebars | One source list, one selection, collapsible from the toolbar. At most five destinations. | Labels become Today, Week, Journal, Insights, Habits. Internal view ids stay `today`, `week`, `timeline`, `review`, `habits`. | A second sidebar of today's habits. A dock or top tab bar beside the sidebar. |
| Apple HIG Toolbars | Toolbar holds view controls: sidebar toggle, date, search, commands, Focus. | Focus is a compact control in the toolbar. Expanding it opens a panel anchored to that control. | Using the toolbar as a second navigation system. A permanent inspector toggle that reveals a third column. |
| Apple HIG Motion | Motion explains relationship and stays interruptible. Reduce Motion keeps the resulting state. | Habit rows move into Completed. Day content slides by temporal direction. Sheets and Focus open from their trigger and close along the same path. | Perpetual chart motion, decorative page choreography, animating layout properties. |
| Things | Today is a list. Detail appears from a selection or an explicit action. Focus is a mode, not a column. | Completed habits collapse into one group. Habit editing stays on Habits until requested. | Copying Things' brand, icons, or task model. |
| Day One journal views | Journal is a list/detail split. Timeline, photos, and calendar are modes of one journal. | Wide windows use a stable list and a stable detail pane. Selection glides; detail retargets in place. | Promoting Timeline, Photos, or Calendar to top-level destinations. |
| Day One Today | Today prompts one act. Writing and photos are a step you open, not a dashboard tile. | "Reflect on today" opens the note and photos. Mood is a compact check-in beside the date. | A Today wall of equal cards for mood, journal, and photos. |
| Linear redesign | Fewer simultaneous controls. Hierarchy comes from type and space, not from boxes. | Insights is one reading column: three numbers, one trend, one heatmap, sorted bars, then the monthly note. | A redesign that only changes color and radius. |
| Linear calmer UI | Chrome stays quiet. Secondary data is disclosed. | Habit scores and detailed metrics stay closed until opened. The score table is not a rail. | Cramped permanent score tables. Radar, gauges, and decorative gradients. |
| Raycast | One command surface. Controls match the host platform. | `Cmd/Ctrl+K` and the toolbar command button open the same palette. System font stack only. | A second visual language, Google Fonts, or a yellow-on-black command row. |
| Reference video (188.7s) and contact sheets | Sliding selection, one-open disclosure, stable containers, command palette, short directional view changes. | The nav pill and palette stay. Page changes are a short directional slide of content, with chrome mounted. | Yellow/black brand, neon live accent, floating dock, mega-panel chrome, six menus, status dots that breathe. |

## Skill rules that constrain the build

**taste-skill / redesign-existing-projects.** Stay in the existing vanilla CSS and JS. Do not migrate frameworks. Remove equal card columns, one-accent-on-everything, and a border-plus-shadow on every section. Use tabular numbers, sentence case, visible empty states, and focus rings. Do not animate layout properties. The skill's "small targeted fixes, not a rewrite" rule is rejected here: the brief requires an information-architecture reset, and keeping the 3.2 composition would fail acceptance.

**emilkowalski / apple-design.** Press feedback starts on pointer-down and is visible within 100ms. Motion is interruptible and runs from the live presentation value. Enter and exit share a path. Overlays anchor to their trigger. Only transform and opacity move. Floating layers are one surface, not stacked glass. Reduced motion removes travel and keeps state.

**impeccable / animate.** This product is Operate and Read, so motion is feedback, state, and continuity. Feedback is 80–150ms. State changes are 150–300ms. Overlays may run up to 320ms, and exits are faster. Easing is `cubic-bezier(0.22, 1, 0.36, 1)`. The focal moment is a completed habit row moving into the Completed group, not a page-load sequence. No new motion library. Reduced motion keeps color and opacity changes and drops travel.

**frontend-design.** Avoid a templated KPI grid with a gradient accent. The memorable structure is one habit list whose reflection unfolds from "Reflect on today". Motion serves that structure only.

## Decisions locked before code

1. Delete the Today four-zone grid. The first frame is the date, one progress line, a compact mood check-in, an optional event strip, and the habit list.
2. Remove the permanent right rail. `.content-split` is one column. Focus, day detail, weekly note, habit scores, and habit editing are progressive disclosures.
3. Journal and Insights are renames of Timeline and Review in zh, en, and de. View ids do not change.
4. Week is a vertical agenda plus one selected-day detail. Goals stay; the weekly note is disclosed.
5. Insights stacks the trend, heatmap, and bars. At most three summary metrics. No yellow selection color.
6. Storage schema, Tauri shell, widgets, and permissions stay. No migration.
