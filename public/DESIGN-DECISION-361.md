# Life Ledger 3.6.1 design study — decisions

Throwaway UI prototype: `prototype-361.html` (+ CSS/JS modules). No production storage, service worker, or API.

## Run

```bash
npm run prototype:361
```

Open **Variant C (chosen direction):** `http://127.0.0.1:<port>/prototype-361.html?variant=c`  
Variants A/B: `?variant=a` · `?variant=b` (unchanged in this iteration).

## User choice

**Variant C — Living Canvas** is the selected direction. This pass replaces free grid spans with a **fixed S/M/L widget system** (Apple-widget-like), not production integration yet.

## Design DNA / tokens

Unchanged from 3.6.0-aligned prototype tokens (`--proto-sage`, `--proto-paper`, `--proto-accent`, 120–260ms motion). Variant C adds grid units: `--proto-c-unit-h` (132px), 12-column desktop canvas, page-level scroll only.

## S/M/L semantics

| Size | Grid (≥1180px) | Height | Intent |
| --- | --- | --- | --- |
| **S** 小 | 4 / 12 cols | 1 unit | Glance + one primary action |
| **M** 中 | 8 / 12 cols | 1 unit | Summary + 2–3 details/actions |
| **L** 大 | 8 / 12 cols | 2 units | Full interaction / detail layout |

At ≤1180px: S → 6 cols; M and L → full width (L stays 2 rows tall).

## Widget registry contract (`prototype-361-widgets.js`)

Each widget defines:

- `id`, `title`
- `allowedSizes` — unsupported sizes disabled in picker (not broken)
- `defaultSize`
- `render(state, size)` — **distinct composition per size** (no inner scroll)

Layout state (`cWidgetLayout` in memory): `order[]`, `sizes{id}`, `offCanvas[]`, `editMode`, palette/picker UI flags.

**Extensibility demo:** `insights` ships off-canvas; add/remove via palette without canvas special-casing.

## Why fixed sizes (not free resize)

Reference screenshot and user feedback showed **nested scrollbars** and arbitrary heights when modules used `overflow: auto` and free grid spans. Fixed semantic sizes force intentional hierarchy, predictable reflow, and a path to register new widgets without layout math in every feature.

## Before / After / Why (Variant C)

| | Before | After | Why |
| --- | --- | --- | --- |
| Sizing | Per-module rows/heights + scroll | S/M/L only | Readable at a glance; one canvas scroll |
| Layout edit | Always-visible drag | **编辑布局** mode + chrome | Calm default; edit when needed |
| Code | Inline render in `prototype-361.js` | Registry + canvas controller | Future widgets = one registration |
| Data | `canvasPositions` x/y/w/h | `order` + semantic `size` | Matches widget platforms |

## A / B / C (unchanged for A/B)

A and B were not redesigned in this delta. C is now the widget canvas described above.

## Recommendation

Proceed to production planning by **porting the registry contract** into a real module system on desktop Today/Week, starting with habits + focus + week strip at M/S sizes. Keep edit-layout as a gated mode. Still a prototype — no user sign-off on engineering schedule.
