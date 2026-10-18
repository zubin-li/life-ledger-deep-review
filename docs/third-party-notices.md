# Third-Party Notices and Architecture Decision Records

## Offline UI primitives — 2026-10-15

The weather chart now reuses [uPlot 1.6.32](https://github.com/leeoniya/uPlot) (MIT). Widget-entry opacity feedback uses the mini JavaScript entry of [Motion 14.2.0](https://github.com/motiondivision/motion) (MIT), without React or Motion+ services. Exact direct versions are pinned in package.json/package-lock.json. `npm run build:widget-vendor` builds `public/vendor/widget-ui.js` and `.css` from `src/widget-vendor.js`; the combined source notices (including motion-dom/motion-utils transitive packages) are in `public/vendor/widget-ui.LICENSE.txt`. The built JS/CSS total about 63 KB raw and are included in the service-worker shell. No CDN request is needed. This is actual code reuse, unlike the design-only app references below.

## Today weather service (2026-10-15)

The optional weather card calls the public [Open-Meteo forecast API](https://open-meteo.com/en/docs) and [geocoding API](https://open-meteo.com/en/docs/geocoding-api). Weather data attribution is displayed in the card: Open-Meteo, CC BY 4.0. No Open-Meteo server source is imported. The hosted free API is for non-commercial use; review the service plan before commercial distribution. The MIT [weather-now](https://github.com/gunjit-web/weather-now) project was evaluated as an integration reference, not copied: its React/TypeScript stack would add unnecessary dependencies to this vanilla-JavaScript app. Existing layout/registry, icon catalog and IndexedDB helper are reused instead; no new runtime package is added.

## ADR-0001: GridStack Evaluation for Life Ledger 2.0 Desktop Today Board

**Status:** Evaluated and Rejected (NO-GO for GridStack; project-owned `LayoutEngine` adopted)
**Date:** 2026-10-12
**Component:** Today Vertical Slice Layout Engine
**Evaluator:** AntiGravity Agent (`agy-implement`)

---

### 1. Evaluated Package Details

| Metric | Value |
|---|---|
| Package Name | `gridstack` |
| Pinned Version | `14.0.0` |
| Upstream Repository | `https://github.com/gridstack/gridstack.js` |
| Author / Maintainer | Alain Dumesny (`https://github.com/adumesny`) |
| License | MIT License |
| Pinned Dependencies | `0` (zero runtime dependencies) |

#### License Text Verification

```text
/*!
 * GridStack 14.0.0
 * https://gridstackjs.com/
 *
 * Copyright (c) 2021-2025 Alain Dumesny
 * Licensed under the MIT License
 */
```
The MIT license is permissive and commercially compatible with Life Ledger.

---

### 2. Bundle Size and Dependency Footprint

The package was packed from npm registry and analyzed:

| Asset | Raw Size (Bytes) | Raw Size (KB) | Gzip Size (Bytes) | Gzip Size (KB) |
|---|---|---|---|---|
| `dist/gridstack-all.js` | 93,333 | 91.1 KB | 25,393 | 24.8 KB |
| `dist/gridstack.min.css` | 6,138 | 6.0 KB | 1,432 | 1.4 KB |
| **Total Production Delta** | **99,471** | **97.1 KB** | **26,825** | **26.2 KB** |
| Unpacked npm package | 1,468,220 | 1.43 MB | — | — |

*Note: The unpacked package includes Angular, React, and Vue wrappers and source maps which are not needed for Life Ledger's vanilla ES-module architecture.*

---

### 3. Proof Spike in Tauri / WKWebView

An isolated proof spike was run inside headless Playwright WebKit & Chromium testing GridStack 14.0.0 against the Life Ledger 2.0 Desktop interaction contract:

#### Findings:

1. **Continuous Layout Recalculation & Motion Violation:**
   During drag and settle, GridStack applies inline styles:
   ```css
   transition: left 0.3s, right 0.3s, top 0.3s, height 0.3s, width 0.3s;
   ```
   This directly violates Contract Section 9:
   - *"No continuous width/height animation and avoid forced-layout loops during pointer movement."*
   - *"Animate transform and opacity wherever possible; repeated layout thrashing is a release blocker."*
   - *"Direct drag has zero easing; settle/reflow uses transform/opacity and roughly 220–280ms."*

2. **Absolute Pixel Positioning Conflicts:**
   GridStack uses absolute pixel positioning (`position: absolute; top: ...px; left: ...px`) on each widget. This breaks fluid container auto-sizing, clips text across font scaling, and requires heavy recalibration across window resize events.

3. **Missing Discrete S/M/L Aspect States:**
   GridStack is designed for continuous integer cell resizing (e.g. 1–12 columns, 1–N rows). It has no concept of discrete semantic aspect states (`small`, `medium`, `large`) that trigger distinct information hierarchies.

4. **Missing Keyboard Movement and Transactional Undo:**
   GridStack provides no out-of-the-box keyboard arrow moving or transactional layout undo. These would have to be implemented entirely from scratch in project code on top of GridStack.

5. **Event Interception Risks in WKWebView:**
   GridStack's default drag listeners capture pointer events across `.grid-stack-item-content` unless meticulously overridden, introducing regression risks for interactive controls like `#openDayDetail`, calendar month navigation, and photo upload inputs.

---

### 4. Gate Decision

| Gate Criterion | Result | Note |
|---|---|---|
| 1. License compatibility | **PASS** | MIT license verified |
| 2. Exact version pinned | **PASS** | Pinned to `14.0.0` |
| 3. Tauri/WKWebView proof spike | **FAIL** | Inline transition and layout loop violations |
| 4. CSP & capabilities checks | **PASS** | Valid under Tauri default capability |
| 5. Keyboard, pointer, reduced-motion | **FAIL** | Lacks discrete S/M/L, keyboard movement, and motion-off handling |
| 6. Bundle size delta | **MARGINAL** | +97.1 KB uncompressed for mostly redundant wrapper features |
| 7. Zero content data mutation | **PASS** | Layout is decoupled from user data |
| 8. Documented fallback path | **PASS** | Small project-owned `LayoutEngine` adapter |

**Final Decision: NO-GO on GridStack adoption.**

---

### 5. Adopted Solution: Project-Owned `LayoutEngine`

In accordance with Contract Section 4 ("If GridStack fails this gate, implement the smallest project-owned grid adapter with the same `LayoutEngine` interface"):

1. **Lightweight & Dependency-Free:** 0 KB external npm dependencies; zero vulnerability or upstream maintenance risk.
2. **Native 12-Column CSS Grid:** Uses CSS grid template columns and CSS custom properties (`--grid-x`, `--grid-y`, `--grid-w`, `--grid-h`) with hardware-accelerated transforms (`transform: translate3d`).
3. **Strict Motion Compliance:**
   - Zero easing during direct pointer drag.
   - Settle/reflow uses `transform`/`opacity` with 220–280ms duration.
   - `motion-off` and `motion-reduced` are strictly respected with zero layout loops.
4. **First-Class S/M/L Support:** Every widget supports exactly `small`, `medium`, `large` with discrete content hierarchies.
5. **Full Keyboard Movement:** Arrow keys move widgets in 4-column and 1-row increments.
6. **Transactional Undo:** Supports layout undo and Escape cancellation.

---

### 6. Rollback and Replacement Path

All feature code (`app.js`, `today-widgets.js`) interfaces strictly with `LifeLedgerLayoutEngine` and `LifeLedgerWidgetRegistry`. No feature code calls grid manipulation directly.

If GridStack or any future layout library is ever revisited:
1. Implement the adapter functions (`init(container)`, `setEditMode(enabled)`, `getLayout()`, `setLayout(layout)`, `onLayoutChange(callback)`, `destroy()`).
2. Swap the underlying engine inside `layout-engine.js` without touching any widget renderers or product controllers.
