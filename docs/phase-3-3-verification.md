# Phase 3.3 verification

Evidence comes from the desktop frontend the Tauri webview loads: `public/index.html?desktop=tauri-local`. This Linux cloud environment cannot launch the macOS `.app`. The screenshots and demo are not the HTML prototype in `docs/prototypes/`.

## Window sizes

- 1180×760: `docs/phase-3-3/today-1180.png`, `journal-1180.png`, `insights-1180.png`, `today-1180-zh.png`
- 1440×900: `docs/phase-3-3/today-1440.png`, `journal-1440.png`, `insights-1440.png`, `today-1440-de.png`, `today-1440-dark.png`, `week-1440.png`

## What the first frame shows

Today is one column. The permanent Focus rail is gone. The classes `today-primary`, `today-context`, `today-journal`, and `today-photos-zone` are gone. Mood is a compact check-in. Photos and the note open from “Reflect on today”. Focus is the `25:00` toolbar control.

## Languages, theme, motion, keyboard

- English, Simplified Chinese, and German were loaded with the saved language preference. Chinese uses 今日 / 日志 / 洞察 / 回顾今天. German uses Heute / Journal / Einblicke / Heute reflektieren. Labels fit at 1180 and 1440.
- Dark theme: `today-1440-dark.png`.
- `prefers-reduced-motion: reduce` sets the active view animation name to `none`. `html.motion-off .view.active` keeps opacity and clears travel.
- Tab order follows the sidebar, toolbar, then the habit list. Enter and Space complete the focused habit. Arrow keys move between rows. Escape closes the day detail and the Focus panel. ⌘/Ctrl+K still opens the command palette.

## Interaction demo

`docs/phase-3-3/interaction-demo.mp4` is 21.6 seconds at 1440×900. It shows two habit completions moving into Completed, day navigation to the next day and back, the day-detail sheet, an Insights range change from 7 days to 90 days, Journal selection, and Focus expanding from the toolbar.

## Contact sheet

`docs/phase-3-3/contact-sheet.png` places the 3.2 Today and Review screens beside the 3.3 Today and Insights screens.

## Known limit

The macOS bundle is produced by GitHub’s macOS Desktop Verification workflow. This environment records the same frontend that bundle embeds, then runs `npm run desktop:build` locally and reports that command’s result separately.
