# Life Ledger 2.0 Desktop Product and Implementation Contract

**Status:** Proposed — phase 2 only; implementation has not started  
**Base:** Current 3.6.x desktop prototype on `codex/macos-3.6.1-blank-screen-fix`  
**Target:** Life Ledger 2.0 — the first formal desktop-application release  
**Decision owner:** User  

## 1. Version identity

Life Ledger uses product-generation numbering, not the temporary prototype sequence:

- **1.0:** the first formal web product.
- **2.0:** the first formal macOS desktop product.
- Existing **3.6.x** builds are internal redesign/prototype iterations and are not the product-generation predecessor of 2.0.

The repository currently has no Tauri updater plugin or automatic SemVer update path. Therefore the release may safely use `2.0.0` in `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, the PWA cache, changelog, release notes, and evidence labels at the final release step.

Keep the current bundle identifier `app.zubinli.lifeledger` and existing data locations so current user data is not orphaned. Product display name becomes **Life Ledger**; internal prototype names such as “Deep Review” and “3.6” must not appear in the primary UI.

## 2. Product promise

Life Ledger 2.0 is a calm, local-first Mac application for daily habits, reflection, focus, memories, and review. It should feel like a coherent desktop instrument rather than a webpage inside a window.

The core interaction model is a personal board of reusable widgets:

- widgets can be moved in two dimensions while layout edit mode is active;
- every widget has exactly three supported sizes: **small, medium, large**;
- each size is a separately composed information design, not stretched content;
- widgets snap, avoid overlap, persist across restarts, and remain keyboard accessible;
- adding a future feature should normally mean registering a new widget, not redesigning the whole page.

## 3. Non-goals for 2.0

- No frontend framework migration; retain the current HTML/CSS/ES-module architecture.
- No wholesale copy of another application or its visual identity.
- No new cloud backend, account requirement, or data-model rewrite.
- No open-ended animation showcase; motion must communicate state or causality.
- No arbitrary freeform widget dimensions.
- No dependency is adopted merely because its demo looks suitable.

## 4. Reference and reuse decisions

| Source | Use | Decision |
|---|---|---|
| Apple Widget HIG | Three discrete sizes, glanceable hierarchy, density rules | Product standard; reinterpret for in-app widgets |
| GridStack | Drag, collision, grid placement, persistence hooks, constrained min/max sizes | Preferred implementation candidate, subject to proof spike |
| Aurora Dashboard | Registry boundaries, layout validation, collision concepts | Selective architectural reference only |
| Daymark | Calendar and day-planning information hierarchy | Visual/interaction reference only |
| Life OS | Modular life-dashboard taxonomy | Feature-organization reference only |
| Frappe Charts | Lightweight SVG habit and review charts | Optional candidate, subject to proof spike |

### Third-party adoption gate

Before any external code enters the main implementation, the implementer must produce a compact dependency note proving all of the following:

1. license is compatible and recorded in third-party notices;
2. exact version or commit is pinned;
3. a disposable proof spike works inside the existing Tauri WebView/WKWebView;
4. CSP and Tauri capability checks remain valid;
5. pointer, keyboard, touchpad, reduced-motion, light, and dark behavior are verified;
6. bundle-size delta is measured and justified;
7. no current data is mutated or lost by the spike;
8. removal/fallback path is documented.

If GridStack fails this gate, implement the smallest project-owned grid adapter with the same `LayoutEngine` interface. Do not add interact.js or Muuri at the same time. If Frappe Charts fails, retain the existing SVG/chart implementation and improve it locally.

## 5. Information architecture

Primary destinations are separate application views, not long webpage sections bleeding into one another:

1. **Today** — act, record, and reflect.
2. **Week** — plan and understand the current week.
3. **Journal** — memories and written history.
4. **Insights** — trends, habit statistics, and reviews.
5. **Habits** — configure habit definitions and schedules.
6. **Settings** — appearance, language, data, integrations, and accessibility.

The sidebar is navigation, not a second dashboard. Global search and a single explicit layout-edit action live in the toolbar.

## 6. Widget platform contract

### 6.1 Registry

Each widget is registered through one project-owned boundary resembling:

```js
{
  id,
  type,
  allowedSizes: ["small", "medium", "large"],
  defaultSize,
  defaultPlacement,
  render({ size, data, locale, motion }),
  getA11ySummary(data),
  settingsSchema,
  migrateSettings(previous)
}
```

Feature code must not talk directly to the chosen grid library. A `LayoutEngine` adapter owns initialization, drag/resize events, collision handling, keyboard movement, serialization, and teardown.

### 6.2 Persisted layout schema

Introduce a versioned layout contract separate from habit/content data:

```json
{
  "schemaVersion": 2,
  "view": "today",
  "widgets": [
    {
      "id": "today-habits",
      "type": "habits",
      "size": "medium",
      "x": 0,
      "y": 0,
      "hidden": false,
      "settings": {}
    }
  ]
}
```

Rules:

- `size` is an enum, never an arbitrary width/height.
- Grid coordinates are normalized and validated before use.
- Unknown widget types are ignored safely and preserved for forward compatibility.
- Invalid or overlapping layouts fall back to a deterministic default without deleting the saved value.
- Existing v1 order/collapsed/hidden preferences migrate once into schema v2.
- Content data and layout data remain independently exportable/restorable.

### 6.3 Size geometry

Use a 12-column board. Initial implementation targets are:

- **Small:** 4 columns × one compact row group.
- **Medium:** 8 columns × one compact row group.
- **Large:** 8 columns × two row groups.

Exact row height is calibrated during the Today proof slice for the supported Mac window sizes. The invariant is three discrete aspect/density states. Pointer resize previews the nearest allowed state and snaps only on release.

### 6.4 Edit mode

- Normal mode optimizes use: widget controls work and no accidental dragging occurs.
- Edit mode exposes drag handles, size choices, hide/show, and reset layout.
- Dragged content follows the pointer directly with no easing.
- On release, the widget settles into the valid slot and size.
- Arrow-key movement and explicit S/M/L controls provide a full non-pointer alternative.
- Escape cancels the active edit; undo restores the previous layout transaction.

## 7. Widget content matrix

| Widget | Small | Medium | Large |
|---|---|---|---|
| Day summary | date + completion | adds mood and next item | adds context, greeting, and review prompt |
| Habits | completion + next habit | priority habits and quick completion | full scheduled list, groups, and detail actions |
| Calendar | today/date + streak | month heatmap | month, selected-day detail, and navigation |
| Focus | timer + start/pause | presets and current session | session history and day context |
| Photos | latest thumbnail + count | up to three thumbnails | memory strip, captions, and add/import action |
| Reflection | status + quick prompt | excerpt and write action | full editor with relevant day context |
| Insights | one meaningful KPI | seven-day trend | charts, habit breakdown, comparison, and explanation |

Empty states use concise project-owned line illustrations only where they improve understanding. Illustrations must not replace primary controls or appear as repeated decoration on every card.

## 8. Design DNA

### 8.1 Design system

- Typography: macOS system font stack; tabular numerals for dates, streaks, rates, and timers.
- Palette: black, white, near-black, cool gray, and one restrained sage/teal accent. Remove the dominant beige/yellow cast.
- Surfaces: app background, card, elevated/active card, and overlay are distinct tokens.
- Shape: carefully varied radii; cards must not all become identical rounded rectangles.
- Depth: subtle border, tonal separation, and restrained shadow create the requested floating “island/bubble” quality.
- Spacing: an explicit 4/8-based scale; no ad-hoc one-off gaps.
- Targets: interactive controls are at least 44 × 44 logical pixels where practical.

### 8.2 Style

The character is **quiet, precise, personal, and lightly playful**. It is not corporate dashboard chrome, yellow-black retro UI, or generic glassmorphism. Dense data views remain legible; daily views preserve breathing room. Light and dark modes share hierarchy rather than being independent themes.

### 8.3 Illustration language

- monochrome or accent-tinted line work;
- consistent stroke weight and optical scale;
- used for empty, success, first-use, and occasional contextual states;
- original assets or license-cleared assets recorded in notices;
- no generated raster image should be shipped without size, contrast, dark-mode, and licensing review.

## 9. Motion and interaction contract

Motion is designed per interaction, not applied globally.

- No `transition: all`.
- Routine feedback completes within roughly 120–220 ms.
- Widget settle/reflow may use 220–280 ms with a move-oriented easing or spring-like response.
- Direct drag has zero easing; other widgets may preview displacement using transform-only motion.
- Size changes preserve identity: container relocation uses transform; content variants crossfade/translate. Do not animate layout width/height continuously.
- Completion feedback combines immediate state change, restrained color, and optional micro-scale response.
- View changes preserve spatial continuity without theatrical page transitions.
- Keyboard-triggered operations do not introduce motion merely for decoration.
- `prefers-reduced-motion` and the app’s Reduced/Off settings remove reflow, scale, parallax, and decorative motion while preserving state clarity.
- Animate transform and opacity wherever possible; repeated layout thrashing is a release blocker.

## 10. Localization, accessibility, and Mac behavior

- English, Simplified Chinese, and German must have equivalent functionality and intentional copy.
- Evidence must actually switch locale; relabeled English screenshots are not acceptable.
- Font size, truncation, wrapping, and numeric columns are checked in all three languages.
- Full keyboard traversal, visible focus, semantic names, contrast, and screen-reader summaries are required.
- Retain current Tauri capability boundaries and local-first storage.
- Use native file dialogs for import/export and macOS menu/shortcut conventions where applicable.
- Do not add a Tauri plugin unless the capability cannot be delivered safely with the current stack.

## 11. Delivery sequence

### Phase 0 — dependency proof

Create an isolated, disposable spike for GridStack and, separately, Frappe Charts. Record licenses, pinned versions, Tauri/WKWebView behavior, bundle delta, and go/no-go decision. Do not mix the spike into production code.

### Phase 1 — Today vertical slice

Implement the registry, layout schema v2, migration, edit mode, three-size behavior, and finished variants for Day summary, Habits, Calendar, Focus, Photos, and Reflection on Today only. This is the quality checkpoint. Do not scale to other views until it passes the full acceptance contract.

### Phase 2 — Week

Apply the proven platform to weekly goals, completion, planning, and weekly reflection. Resolve the previous fixed-panel/nested-scroll problems.

### Phase 3 — Journal, Insights, and Habits

Finish memories, statistics, reviews, configuration, and meaningful charts. Each view receives only widgets that support its user goal.

### Phase 4 — release integration

Update version-bearing files to 2.0.0, multilingual documentation, fictional screenshots/showcase pages, changelog, release note, third-party notices, CI evidence, and macOS packages from one verified commit.

## 12. Acceptance contract

### Functional

- Existing data, habits, photos, reflection, focus, import/export, and settings survive migration.
- Existing project checks and control suite pass with no regression.
- New tests cover layout schema validation, v1 migration, collision fallback, persistence, reset, and unknown widget handling.
- Every visible button has a defined outcome, disabled state, error path, and keyboard path.

### Layout

- Only S/M/L are persisted and selectable.
- Widgets drag in two dimensions only in edit mode.
- Snap, collision, resize, undo, reset, and restart persistence work.
- Supported window widths have no overlap, clipped primary action, inaccessible nested scrollbar, or blank principal module.

### Visual

- Today and Week are evidenced at representative compact and wide Mac window sizes.
- Light/dark and English/Chinese/German screenshots are captured from the actual build.
- Each widget’s S/M/L state has a deliberate content hierarchy.
- Beige/yellow is not the dominant system palette; illustrations and charts follow the approved DNA.

### Motion

- Short recordings show drag, snap, resize, completion, view navigation, and reduced-motion behavior.
- Direct manipulation tracks the pointer; release settles cleanly; no visible jank or layout flash.

### Release integrity

- Source, tests, visual evidence, and macOS artifact come from the same commit.
- `npm run check` and `npm run desktop:check` pass, plus the relevant Rust/widget/build gates.
- “Build succeeded” alone is not completion. Today/Week content, controls, sizes, persistence, and screenshots must be visibly verified before publishing or replacing an installed app.

## 13. Execution ownership and stop-loss

When the user authorizes phase 3 implementation:

1. Codex prepares one bounded brief for the **Today vertical slice only**.
2. AntiGravity (`agy-implement`) is the sole writer in one working tree.
3. Codex inspects the actual diff and runs only the essential gates.
4. Cursor (`cursor-review`) performs one independent read-only review against this contract and the captured diff evidence.
5. AntiGravity receives at most one repair pass for concrete findings.
6. Codex performs the final evidence gate and reports the checkpoint before any wider rollout.

Stop after two attempts without material progress, any disproportionate token/tool use, or a dependency failing its adoption gate. No local GUI control, installation, release, or deployment occurs without the user’s explicit authorization.

## 14. Recommended decision

Approve this contract and begin with **Phase 0 + the Today vertical slice**, not the full application. This produces an honest, inspectable proof of the 2.0 system before spending tokens replicating it across every view.
