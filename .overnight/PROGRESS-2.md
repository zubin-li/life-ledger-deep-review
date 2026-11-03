# Owner feedback pass 2.1.0 — progress

Web **2.1.0** / Mac **3.1.0** · repo `/Users/ashan/Documents/Codex/ll-overnight` (isolated)

## Round 5 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **D3 View Transitions** | `NAV_VIEW_ORDER` + `withViewTransition` / `navViewDirection` in `interaction.js`; `switchToView` wraps DOM swap; CSS `html.ll-view-transition` + directional keyframes; `prefers-reduced-motion` disables VT name |
| **D4 区头配图** | `review-section-quiet.svg`, `journal-section-quiet.svg`; habits 使用 `habits-library-quiet.svg`；PWA 缓存 |
| **Deep link** | `pendingReviewScatterFocus` after `renderReview`（修复 wellness browser 与 VT 竞态） |
| **Capture** | `capture.mjs` 切页后 **450ms** settle（避免 VT/enter 半帧） |
| **测试** | `interaction-flip.test.mjs` + VT 断言 |
| **截图** | `fb-r5-*`（5296/5297） |
| **文档** | CHANGELOG Unreleased r5 + README EN/ZH/DE |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | **6421** 行（+VT 块）；仍远高于 ~3250 目标；合并 reduced-motion 块 |
| **D3 动效** | 性能 trace 长任务/CLS 数值未在本轮记录 |
| **C6** | 未重跑 `compare-v2010.mjs` |

### Known bugs / limits

- Headless 天气仍无温度（r1 环境结论不变）。
- 复盘区头插画在 **390px** 隐藏（省横向空间）。

### Evidence (六个已知问题 · r5)

1. **C1** — r4b sheet/onboard 仍有效；未重拍
2. **C2** — `fb-r5-ledger-zh-light-1440-chromium.png`
3. **C3** — `fb-r5-today-zh-light-1440-chromium.png` 侧栏顺序
4. **C4** — 未重跑；r1 有效
5. **C5** — **6421** 行；单 `capture.mjs` + `capture-mac.mjs`
6. **C6** — 目视 `fb-r5-week/habits` 正常（初拍 week 空白 = VT 半帧，已修 `ll-view-transition` + 450ms）

### Self-review (Round 5)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | VT 仅 transform/opacity；`ll-view-transition` 限定 VT name | **Fixed** 常驻 `view-transition-name` 导致截图半态 |
| ui-ux-pro-max | 区头 art `aria-hidden`；touch 目标未改 | OK |
| design-dna | week/habits/review 与既有 panel 一致（fb-r5 目视） | OK |
| Rauno / Linear | 侧栏方向切换有前/后语义 | OK |
| Screenshots | WebKit/Chromium 矩阵 fb-r5 | OK |
| Tests | **433** unit + **72** browser + desktop:check **0** | OK |

### Detail polish (running)

- Review scatter spotlight 与 `renderReview` 同步
- Journal / Review / Habits 区头 hairline

### `npm test` (round 5 gate · final)

```
433 pass, 0 fail (unit)
72 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. v210.css 结构性瘦身（不含功能回归）
2. `compare-v2010.mjs` 回归矩阵 + 性能 trace
3. onboarding 真机不透明抽检

---

## Round 4 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **B 按压动效** | `LifeLedgerInteraction.pressBump`；CSS 合并为 `:is(.ll-press-bump, .is-*-press)` |
| **B FLIP** | `captureFlip` + 记账 **日分组** 展开 FLIP；`ledgerDayRowsReveal` |
| **C1 onboarding** | `.tc-onboard-hint` 实色 `--card`；`#todayLedgerSheet` 打开时 `:has` 隐藏引导 |
| **D4 配图** | `ledger-subscriptions-empty.svg`；`habits-library-quiet.svg` + PWA |
| **Mac 壳** | `fb-r4-mac-today-sheet-zh-light-1440-webkit.png` |
| **回归** | `today-widgets.js` `root` → `window` |
| **C5 CSS** | 删 dead enter 选择器 + `ledger-month-nav`；**6278** 行（仍待大幅瘦身） |
| **文档** | CHANGELOG / README EN·ZH·DE（FLIP + 引导卡） |
| **测试** | `tests/interaction-flip.test.mjs` |
| **截图** | `fb-r4-*` + **`fb-r4b-*`**（5296/5297） |
| **清理** | 移除 `.overnight/base` worktree |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | **6278** 行 vs ~3250 目标；合并 `@media (prefers-reduced-motion)` / legacy 块 |
| **D4 配图** | journal/week/review 区头装饰 |
| **View Transitions** | 全页切换试点 |

### Known bugs / limits

- Headless 天气仍无温度（r1 环境结论不变）。
- onboarding **单独**显示时需在真机再确认不透明（sheet 场景已修）。

### Evidence (六个已知问题 · r4 final)

1. **C1** — `fb-r4b-today-sheet-zh-light-390-webkit.png`；实色引导 + sheet 时隐藏
2. **C2** — `fb-r4b-ledger-zh-light-1440-chromium.png`
3. **C3** — `fb-r4b-today-zh-light-1440-chromium.png`
4. **C4** — 未重跑；r1 有效
5. **C5** — **6278** 行；单 `capture.mjs` + `capture-mac.mjs`
6. **C6** — `diff-v2010.json` + `fb-r4b-*` 矩阵

### Self-review (Round 4)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | FLIP transform-only；rows reveal 有 reduced off | OK |
| ui-ux-pro-max | Sheet 12050；引导 sheet 打开隐藏 | **Fixed C1 叠层** |
| design-dna | 记账与 week panel 一致（fb-r4b-ledger） | OK |
| Screenshots | r4b 矩阵 WebKit/Chromium | OK |
| Rauno / Linear | 无 layout 动画 | OK |
| Tests | **429** unit + **72** browser + desktop:check **0** | OK |

### Detail polish (running)

- 订阅空态 + pressBump + 日分组 FLIP
- Today sheet panel 实色底

### `npm test` (round 4 gate · final)

```
429 pass, 0 fail (unit)
72 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. v210.css 结构性瘦身
2. View Transitions / nav 切换
3. 区头 hairline + onboarding 真机抽检

---

## Round 3 (2026-11-03)

（见 git 历史）

## Round 2 / Round 1

（见 git 历史 / REPORT）

## Driver gate after sprint 4
ℹ tests 429 ℹ pass 429 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 5
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 5
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 
