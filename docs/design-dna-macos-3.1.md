# Life Ledger 3.1 — design DNA

The 4.0 three-pane desk stays. This file replaces the brown/terracotta chrome with the calm palette from `3c9c7a8` and a tighter type scale. Every token below is a custom property or a rule in `public/styles.css`.

## Palette map

| Role | `3c9c7a8` start | 3.1 token | Light | Dark |
| --- | --- | --- | --- | --- |
| Label | `#242522` | `--ink` / `--label` | `#242522` | `#e9e9e6` |
| Secondary | `#6f716b` | `--muted` / `--secondaryLabel` | `#6f716b` | `#b7b9b2` |
| Canvas | `#f4f2ed` | `--paper` | `#f4f2ed` | `#1b1c19` |
| Sunken | `#e9e6de` | `--paper-deep` / `--sidebar-ink` | `#e9e6de` | `#242522` |
| Sheet | `#faf9f6` | `--card` / `--sheet` | `#faf9f6` | `#22241f` |
| Accent | `#5d7d68` | `--sage` / `--controlAccent` | `#5d7d68` | `#9bc2ab` |
| Accent press | `#46614f` | `--sage-dark` | `#46614f` | `#7eaa94` |
| Selection | `#e3e9e0` | `--sage-light` / `--selectedContentBackground` | `#e3e9e0` | mix 22% sage |
| Info | `#6e8c98` | `--blue` | `#6e8c98` | `#9bb0b8` |
| Warm well | `#ece7da` | `--warm` | `#ece7da` | `#2a2823` |

Coral and amber stay on habit identity dots only. They are not sidebar, buttons, charts, or selection. Increased contrast (`prefers-contrast: more`) darkens `--ink` to `#121411` and strengthens `--line`.

## Type

System stack already in `--font-body` / `--font-display`. Tabular figures on `body`.

| Role | Size | Leading | Weight |
| --- | --- | --- | --- |
| Caption | 11px / 0.6875rem | 1.35 | 500 |
| Secondary | 12px / 0.75rem | 1.45 | 400–500 |
| Body | 13px / 0.8125rem | 1.5 | 400–600 |
| Section | 15px / 0.9375rem | 1.4 | 600 |
| View title | 22px / 1.375rem | 1.25 | 600 |
| Page title | 28px / 1.75rem | 1.2 | 600 |

Today’s date, the review month, and the habits summary use the page title, not 44–46px. Timeline empty state uses the view title. Body copy targets 1.5–1.6. No all-caps kickers on the desktop desk.

## Panes

| Pane | Default | Min | Max |
| --- | --- | --- | --- |
| Sidebar | 168px | 156px | 240px |
| Today habit rail | ~0.82fr | 220px | — |
| Today sheet | ~1.18fr | 360px | — |
| Inspector | 320px | 280px | 440px |

Below 1180px the inspector starts collapsed so the sheet is not squeezed. Dividers follow the pointer with no easing. Widths persist under `lifeLedgerSidebarWidth31` and `lifeLedgerInspectorWidth31`. The sidebar habit list is hidden on the desktop shell because Today already lists the same habits.

## Motion

Button 140ms, popover 160ms, panel 240ms. Enter `cubic-bezier(0.22, 1, 0.36, 1)`. Movement `cubic-bezier(0.25, 1, 0.5, 1)`. Habit check 140ms, color and stroke only. `prefers-reduced-motion` and `html.motion-off` drop nonessential motion. No `transition: all`. No gradient or glass chrome.
