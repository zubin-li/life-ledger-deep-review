
## Round 12 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **D3 perf** | Review Money scatter SVG **deferred** (double `requestAnimationFrame`); summary shell + jump chips first; `tryFocusPendingReviewScatter` retries after hydrate |
| **C1 浮层** | `dialog.tc-dialog` opaque in **v210.css**; browser test **tcLibrary** alpha ≥ 0.99 |
| **CSS** | Scatter pending skeleton; fix **`html[data-theme="dark"] html[data-theme="dark"]`** on ledger chip press → **6042** lines |
| **验证** | `fb-r12-*`（5297）WebKit + Chromium；`perf-nav-trace.json` **maxLongTaskMs 0**, **CLS 0** |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | **6042** 行，仍远高于 ~3250；需 v2.2 拆文件或更大 legacy 批删 |
| **D3** | 其它页 KPI roll-up / chart lazy 可选 |

### Known bugs / limits

- Headless 天气无 Open-Meteo 时空白（`.overnight/weather-headless-compare.json`，非回归）。
- v2.0.10 像素 diff 仍为 2.1 功能面（r11 `diff-v2010.json` 仍有效）。

### Evidence (六个已知问题 · r12)

1. **C1** — `fb-r12-today-onboard-zh-light-390-webkit.png` + library dialog browser 测试
2. **C2** — `fb-r12-ledger-zh-light-1440-chromium.png` 顶栏单标题
3. **C3** — `fb-r12-today-zh-light-1440-chromium.png` 侧栏：时间轴 → 记账 → 复盘
4. **C4** — r7 `weather-headless-compare.json`；天气区空（无网）
5. **C5** — **6042** 行；单 `capture.mjs` + 维护脚本族
6. **C6** — `fb-r12-week/ledger/review/habits/timeline` 目视无破版

### Self-review (Round 12)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | Scatter defer transform/opacity retarget only; reduced-motion skeleton static | **OK** |
| ui-ux-pro-max | tc-dialog 实色；scatter `aria-busy` pending | **Fixed** C1 dialog |
| design-dna | fb-r12 ledger/week/review panel 族一致 | OK |
| Rauno / Linear | 复盘切换 long task **0**（was 67ms） | **Fixed** defer scatter |
| Screenshots | ledger/review/today 1440+390 目视 | OK |
| Tests | **433** unit + **76** browser + desktop:check **0** | OK |

### Detail polish (running)

- `tc-dialog` 内 input 仍用 `--card` 底（字段非浮层，可保留）
- v210.css 下一刀：结构性拆文件（2.2）

### `npm test` (round 12 gate · final)

```
433 pass, 0 fail (unit)
76 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. v210.css 2.2 分文件或大批量 legacy 删
2. `compare-v2010.mjs` 轻量回归
3. Mac 壳 `fb-r12-mac-*` 补拍

---

## Round 11 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **C5 CSS** | 修复 **v230** 合并损坏（stray `}`、broken `html.motion-reduced` 选择器）；删 inline **ledger-budget** 死规则 → **6018** 行（−25）；`.overnight/fix-v230-css-corruption.mjs` |
| **C1 浮层** | `today-cards.css`：**tc-edit-toggle** / **tc-bar** / 编辑 pill → **`--ll-surface-float`**；browser 测试「edit toggle opaque」 |
| **C6** | `compare-v2010.mjs` + 临时 worktree → `diff-v2010.json`（64–81% = 2.1 功能面） |
| **验证** | `fb-r11-*`（5297）WebKit + Chromium + Mac sheet；`perf-nav-trace.json` **maxLongTaskMs 67**（review scatter），**CLS 0** |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | **6018** 行，仍远高于 ~3250；需 v2.2 拆文件或删更多 legacy batch |
| **D3** | 复盘切换 67ms long task 可 lazy scatter（非阻塞） |

### Known bugs / limits

- Headless 天气无 Open-Meteo 时空白（`.overnight/weather-headless-compare.json`，非回归）。
- v2.0.10 像素 diff 仍为 2.1 功能面（r11 重跑 confirm）。

### Evidence (六个已知问题 · r11)

1. **C1** — `fb-r11-today-onboard-zh-light-390-webkit.png` + onboard/edit-toggle browser 测试
2. **C2** — `fb-r11-ledger-zh-light-1440-chromium.png` 顶栏单标题
3. **C3** — `fb-r11-today-zh-light-1440-chromium.png` 侧栏：时间轴 → 记账 → 复盘
4. **C4** — r7 `weather-headless-compare.json`；`fb-r11-today-zh-light-1440` 天气区空（无网）
5. **C5** — **6018** 行；`capture.mjs` + fix/prune 脚本族
6. **C6** — `diff-v2010.json` + `fb-r11-week/ledger/review/habits/timeline` 目视无破版

### Self-review (Round 11)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | v230 修复恢复 reduced-motion 下 donut/heat 静态；无 layout 动画新增 | **Fixed** 损坏 merge |
| ui-ux-pro-max | tc-bar/edit 实色 ≥44px touch；ledger/week panel 一致（fb-r11） | **Fixed** C1 编辑浮层 |
| design-dna | 侧栏顺序、单标题、donut+日条符合 spec | OK |
| Rauno / Linear | perf 67ms 仅 review scatter；VT/FLIP 未动 | OK（可后续 lazy） |
| Screenshots | ledger/today/week/review 1440+390 目视 | OK（天气空=环境） |
| Tests | **433** unit + **75** browser + desktop:check **0** | OK |

### Detail polish (running)

- `tc-dialog` / 组件库面板仍可能用 `--card` 玻璃（非阻塞）
- v210.css 下一刀：合并重复 enter/stagger 或 2.2 分文件

### `npm test` (round 11 gate · final)

```
433 pass, 0 fail (unit)
75 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. v210.css 结构性瘦身或 2.2 分文件
2. tc-dialog / settings 实色 audit 收尾
3. Review scatter lazy init 降 long task

---

## Round 10 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **C5 CSS** | `prune-ledger-view-dead-css.mjs` 删 **#ledgerView** wellness 空态 / budget-empty 死规则 → **6042** 行（−99）；保留 Batch 12 r3 注释供测试 |
| **D3 动效** | Today 记一笔 sheet 今日合计 **`rollText`**（与支出卡片一致） |
| **验证** | `fb-r10-*`（5297）WebKit + Chromium + Mac sheet；`perf-nav-trace.json` **maxLongTaskMs 0**, **CLS 0** |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | **6042** 行，仍远高于 ~3250；需 v2.2 拆文件或删更多 legacy batch |
| **D3** | 全站数字 roll-up 已覆盖 ledger + Today 卡/sheet；其它页 KPI 可选 |

### Known bugs / limits

- Headless 天气无 Open-Meteo 时空白（`.overnight/weather-headless-compare.json`，非回归）。
- v2.0.10 像素 diff 仍为 2.1 功能面（未重跑 compare）。

### Evidence (六个已知问题 · r10)

1. **C1** — `fb-r10-today-onboard-zh-light-390-webkit.png` + `today-cards-onboard.browser.test.mjs`（实色 `--ll-surface-float`）
2. **C2** — `fb-r10-ledger-zh-light-1440-chromium.png` 顶栏单标题
3. **C3** — `fb-r10-today-zh-light-1440-chromium.png` 侧栏：时间轴 → 记账 → 复盘
4. **C4** — r7 `weather-headless-compare.json`；`fb-r10-today-zh-light-1440` 天气区空（无网）
5. **C5** — **6042** 行；单 `capture.mjs` + prune 脚本族
6. **C6** — `fb-r10-week/ledger/review/habits/timeline` 目视无破版

### Self-review (Round 10)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | sheet 合计 roll 200ms transform/opacity；无 layout 动画新增 | OK |
| ui-ux-pro-max | 记账页 panel 族与 week 一致（fb-r10）；touch 目标未改 | OK |
| design-dna | 侧栏顺序、单标题、donut+日条符合 spec | OK |
| Rauno / Linear | 导航 perf 无 long task；VT 未动 | OK |
| Screenshots | ledger/today/week/review 1440+390 目视 | OK（天气空=环境） |
| Tests | **433** unit + **74** browser + desktop:check **0** | OK |

### Detail polish (running)

- `tc-bar` / `tc-edit-toggle` 仍半透玻璃（非 C1 浮层类；可改 `--ll-surface-float`）
- v210.css 下一刀：合并重复 enter/stagger 或拆文件

### `npm test` (round 10 gate · final)

```
433 pass, 0 fail (unit)
74 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. v210.css 结构性瘦身或 2.2 分文件
2. `compare-v2010.mjs` 轻量回归
3. 组件库 dialog / tc-bar 实色 audit

---

## Round 9 (2026-11-03) — summary

Removed **ledger-legacy-viz** DOM; opaque float audit (settings, popovers); **6140** lines CSS; **433+74** tests green. Details: `.overnight/REPORT.md` Round 9 block.

---

## Round 8 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **C1 引导卡** | 根因：`--card` 为 76% 透明玻璃；新增 **`--ll-surface-float`**，`.tc-onboard-hint` / Today sheet 面板实色；`tests/today-cards-onboard.browser.test.mjs` 断言 alpha ≥ 0.99 |
| **C5 CSS** | `.overnight/merge-no-preference-motion.mjs` 合并 **29** 个 `no-preference` 媒体块 → **6285** 行（−51 行 / −1.6 KB） |
| **C6** | 重跑 `compare-v2010.mjs` → `.overnight/diff-v2010.json`（59–79% diff = 2.1 功能面，同 r6） |
| **截图** | `fb-r8-*`（5297）+ `fb-r8-mac-today-sheet-*`（5295）；capture 增加 **today-onboard** 390 |
| **文档** | `CSS-LAYERS.md` 端口表 + r8 merge 说明；CHANGELOG Unreleased r8 |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | **6285** 行，仍远高于 ~3250；需删 legacy hidden DOM 样式或 2.2 拆文件 |
| **D3 动效** | 全站 FLIP/VT 已铺；数字 roll-up 可继续统一 |

### Known bugs / limits

- Headless 天气无 Open-Meteo 时空白（与 v2.0.10 一致）。
- v2.0.10 像素 diff 大面积为 Today 支出 / 记账 nav / 动效，非 layout 破图。

### Evidence (六个已知问题 · r8)

1. **C1** — `fb-r8-today-onboard-zh-light-390-webkit.png` + browser alpha 测试；`rgb(255,255,255)` computed
2. **C2** — `fb-r8-ledger-zh-light-1440-chromium.png` 顶栏单标题
3. **C3** — `fb-r8-today-zh-light-1440-chromium.png` 侧栏顺序
4. **C4** — r7 `weather-headless-compare.json` 仍有效
5. **C5** — **6285** 行；`capture.mjs` + merge/consolidate/prune 脚本
6. **C6** — `diff-v2010.json` + `fb-r8-*` 目视 week/ledger/review/habits OK

### Self-review (Round 8)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | merge 仅搬动 `no-preference` 块，规则顺序不变 | OK |
| ui-ux-pro-max | C1 实色浮层；touch 目标未改 | **Fixed** `--ll-surface-float` |
| design-dna | fb-r8 ledger/week 与 panel 族一致 | OK |
| Rauno / Linear | 浮层不透明、z-index 12000 | **Fixed C1** |
| Screenshots | onboard 390 实色（Playwright elementFromPoint + rgb 255） | OK |
| Tests | **433** unit + **73** browser + desktop:check **0** | OK |

### Detail polish (running)

- 其它 popover/sheet 仍用 `--card` 的可逐个改为 `--ll-surface-float`
- v210.css 下一刀：legacy `.ledger-legacy-viz` 样式归档

### `npm test` (round 8 gate · final)

```
433 pass, 0 fail (unit)
73 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. v210.css 更大瘦身（legacy hidden + 重复 press 块）
2. 浮层实色 audit（settings dialog 等）
3. 动效 perf trace 复跑

---

## Round 7 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **C4 天气** | 重写 `.overnight/weather-headless-compare.mjs`（preview 存储后缀、双 context、端口 **5299**）；`.overnight/weather-headless-compare.json`：**HEAD** 与 **v2.0.10** 冷启动均无网络 → 空详情；离线 cache → **11°**（行为一致，**非回归**） |
| **C5 CSS** | `--ll-anim-enter-*` token（`.overnight/consolidate-v210-css.mjs`）；**6336** 行、−428 B（仍远高于 ~3250 目标） |
| **文档** | CHANGELOG Unreleased r7 + **2.1.0** Money views **donut-only** 说明 |
| **截图** | `fb-r7-*`（5297）WebKit + Chromium |
| **QA** | 释放 **5298** 僵尸 python 后 browser 全绿 |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | 需合并 `@media (prefers-reduced-motion)` / 删除 legacy 隐藏块 CSS |
| **C6** | 未重跑 `compare-v2010.mjs`（r6 矩阵仍有效） |

### Known bugs / limits

- Headless **无 Open-Meteo** 时天气卡片空白（与 v2.0.10 相同；有合法 offline cache 可渲染）。
- fakecloud 测试占 **5298**；天气脚本改用 **5299**，避免 python 僵尸占端口导致 browser flake。

### Evidence (六个已知问题 · r7)

1. **C1** — `fb-r7-today-zh-light-1440-chromium.png` 引导卡实色底（`.tc-onboard-hint` `--card`）；sheet 场景见 r6 `fb-r6-today-sheet`
2. **C2** — `fb-r7-ledger-zh-light-1440-chromium.png` 顶栏单标题「记账」
3. **C3** — `fb-r7-today-zh-light-1440-chromium.png` 侧栏：时间轴 → 记账 → 复盘
4. **C4** — `.overnight/weather-headless-compare.json`（HEAD ≡ v2.0.10）
5. **C5** — **6336** 行；`capture.mjs` + consolidate/weather/prune 脚本
6. **C6** — `fb-r7-week/ledger/review/habits` 目视无破版（未像素 diff）

### Self-review (Round 7)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | enter 动画改 token，keyframes 未增；VT/FLIP 未动 | OK |
| ui-ux-pro-max | 记账页 donut+日条符合 spec；5298 端口冲突已文档化 | **Done** 天气脚本 port 5299 + finally kill |
| design-dna | fb-r7 ledger/week 与 panel 族一致 | OK |
| Rauno / Linear | 无 layout 动画新增 | OK |
| Screenshots | fb-r7 矩阵目视（天气空=无网） | OK |
| Tests | **433** unit + **72** browser + desktop:check **0** | OK |

### Detail polish (running)

- v210.css 下一刀：`prefers-reduced-motion` 合并（勿删 Batch 注释）
- fakecloud 与 overnight 脚本端口表写入 `.overnight/CSS-LAYERS.md` 或 BRIEF 脚注

### `npm test` (round 7 gate · final)

```
433 pass, 0 fail (unit)
72 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. v210.css `prefers-reduced-motion` 结构性合并
2. `compare-v2010.mjs` 轻量回归 + Mac 壳 fb-r7-mac
3. 引导卡 390 真机不透明抽检

---

## Round 6 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **C5 CSS** | **6326** 行（was 6421）；`.overnight/prune-ledger-treemap-css.mjs` 删除 treemap/chart-toggle 死规则；合并 `.ledger-page` padding |
| **Dead UI** | `ledger-ui.js` 移除 treemap 渲染、chart 切换、legacy toggle HTML |
| **C6 compare** | `compare-v2010.mjs` → `.overnight/diff-v2010.json`；worktree 已移除 |
| **D3 perf** | `.overnight/perf-nav-trace.mjs` + `perf-nav-trace.json`（max long task **58ms**, **CLS 0**） |
| **截图** | `fb-r6-*`（5296）WebKit + Chromium |
| **文档** | CHANGELOG Unreleased r6 |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | 仍远高于 ~3250 目标；需结构性合并 enter/stagger 块（勿删 batch 注释——测试依赖） |
| **C4 天气** | headless 仍无温度；未重跑 v2.0.10 worktree（r1 环境结论） |

### Known bugs / limits

- Headless 天气卡片空白（环境/无 geo，非本轮回归）。
- v2.0.10 像素 diff 64–78% 为 2.1 功能面（Today 支出、记账 nav、动效）— 无单独 layout 破图。

### Evidence (六个已知问题 · r6)

1. **C1** — `.tc-onboard-hint` 实色 `var(--card)`；sheet 时 `display:none`（`fb-r6-today-sheet` 无引导叠层）
2. **C2** — `fb-r6-ledger-zh-light-1440-chromium.png` 仅顶栏「记账」
3. **C3** — `fb-r6-today-zh-light-1440-chromium.png` 侧栏：时间轴 → 记账 → 复盘
4. **C4** — 未重跑；r1 有效
5. **C5** — **6326** 行；`capture.mjs` + `capture-mac.mjs` + prune/perf 脚本
6. **C6** — `diff-v2010.json` + `fb-r6-*` 目视无破版（week/ledger/review/habits OK）

### Self-review (Round 6)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | treemap 动画已删；VT/FLIP 未动；review 切换 58ms long task | OK（可后续 lazy scatter） |
| ui-ux-pro-max | 记账页 donut-only 符合 spec；sheet 390 可点 | OK |
| design-dna | ledger 与 week panel 一致（fb-r6-ledger） | OK |
| Rauno / Linear | 去掉未使用 chart 切换噪音 | **Done** |
| Screenshots | fb-r6 矩阵目视 | OK |
| Tests | **433** unit + **72** browser + desktop:check **0** | OK |

### Detail polish (running)

- v210.css 下一刀：合并重复 `pageCardIn` stagger 选择器（勿 strip 测试用 Batch 注释）
- CHANGELOG 2.1.0 正文仍写 donut/treemap — 可改 donut-only

### `npm test` (round 6 gate · final)

```
433 pass, 0 fail (unit)
72 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. v210.css 结构性瘦身（selector 合并，保留 Batch 注释行）
2. C4 天气 headless vs v2.0.10 一次性对照
3. 2.1.0 CHANGELOG/README 与 donut-only 对齐

---

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

## Driver gate after sprint 6
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 7
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 72 ℹ pass 72 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 7
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 8
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 9
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 10
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 74 ℹ pass 74 ℹ fail 0 ℹ desktop:check 0 fail

## Driver gate after sprint 11
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 75 ℹ pass 75 ℹ fail 0 ℹ desktop:check 0 fail

## Driver gate after sprint 12
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 76 ℹ pass 76 ℹ fail 0 ℹ desktop:check 0 fail

## Driver gate after sprint 10
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 11
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 12
ℹ tests 433 ℹ pass 433 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 
