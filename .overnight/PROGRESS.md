# Overnight progress

## Batch 9 · Round 8 — done

- **REVIEW.md：** MED #1 仍已在 `temporalSpendChangePercent` 修复；LOW #2 reduced-motion 合并仍 **2.2**；LOW #3 语言三元已不含冗余 `=== "true"` 分支（当前代码已简化，未再改）。
- **Goal 2 polish：** Today **心情 × 支出** 近 30 天一句 + 跳转复盘散点（`#todayMoodSpendHint`）；习惯/心情 hint 共用 **`today-insight-hint`** 样式；demo **`alignDemoMoodWithSpend`** 改为 **45 天**窗口并为有支出日补 log，保证滚动 30 天洞察可算。
- **回归：** `today-habit-spend-hint.browser.test.mjs`（Chromium+WebKit）；`today-habit-spend-hint.test.mjs` / `ledger-core.test.mjs` / `habit-library-polish` 更新。
- **截图：** `node .overnight/capture-batch9-round8.mjs`（**5297**）→ `b9r8-today-mood-spend-hint-*`、`b9r8-today-habit-spend-hints-*`。
- **文档：** CHANGELOG `[Unreleased]` Changed + QA 一条。
- **测试：** `npm test` **384**；`npm run test:browser` **24**（+1 Today hints）。
- **未做：** `v210.css` reduced-motion 单表合并仍 **2.2**。

## Half-done

- （无）

## Next

- Batch 9 Round 9（最后一轮前）：README 三语记账/Today 洞察补一句；或 reduced-motion 合并；Mac 壳 Today 截图。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 对比基线 ≥ €15 且增幅极大时仍显示 **+999%**（封顶，非金额句）。
- 旧 demo 缓存未 re-seed 时，Today **心情×支出** hint 可能不显示（需清除 preview 存储或 `demo-reset=1`）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- `npm run test:browser` 与 fakecloud 并行时偶发超时 — 先清 529x / wrangler（Round 5 已加固 fakecloud-online 等待 cloud）。

## npm test

```
384 pass, 0 fail (batch 9 round 8, unit gate)
24 pass, 0 fail (test:browser, batch 9 round 8)
```

## Gate result

_pending (driver appends after commit)_

## Batch 9 · Round 7 — done

- **REVIEW.md：** MED #1 已在先前轮次用 `temporalSpendChangePercent` 修复（本轮未改逻辑）；LOW #2 reduced-motion 合并仍 **2.2**。
- **Goal 2 polish：** 日度时间轴换月 **`ll-stale-veil`** 叠层 shimmer；加载完成后 **`ll-paint-host--stale` + veil 清除**（修复 Round 6 完成后仍 dim 的问题）。Today **习惯 × 支出** 近 30 天一句 + 跳转复盘（`#todayHabitSpendHint`）。
- **回归：** `today-habit-spend-hint.test.mjs` +3；`journal-feed-filter.browser.test.mjs` +1 daily stale；`habit-library-polish` 断言更新。
- **截图：** `node .overnight/capture-batch9-round7.mjs`（**5297**）→ `b9r7-today-habit-spend-hint-*`、`b9r7-journal-stale-veil-*`。
- **文档：** CHANGELOG `[Unreleased]` Changed + QA 两条。
- **测试：** `npm test` **384**；`npm run test:browser` **23**（+1 journal stale）。
- **未做：** `v210.css` reduced-motion 单表合并仍 **2.2**；Today 习惯 hint 尚无独立 browser 用例（demo showcase 已覆盖截图）。

## Half-done

- （无）

## Next

- Batch 9 Round 8：Today hint 可选 browser 断言；习惯/心情更多 Today 关联；或 reduced-motion 合并。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 对比基线 ≥ €15 且增幅极大时仍显示 **+999%**（封顶，非金额句）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- `npm run test:browser` 与 fakecloud 并行时偶发超时 — 先清 529x / wrangler（Round 5 已加固 fakecloud-online 等待 cloud）。

## npm test

```
384 pass, 0 fail (batch 9 round 7, unit gate)
23 pass, 0 fail (test:browser, batch 9 round 7)
```

## Gate result

_pending (driver appends after commit)_

## Batch 9 · Round 6 — done

- **REVIEW.md：** 无新 HIGH/MED（Round 1–5 修复保持）。
- **Goal 2 polish：** `renderJournalFeed` — 周/月同步筛选不再摘掉 **`ll-paint-host--ready`**（消除空白闪一下）；日度筛选改 **`ll-paint-host--stale`** 保留旧 feed 直至照片拉完。复盘 **`#reviewHabitCompare`** hairline 空态 **`hydrateHairlineMounts` + `ll-empty`**；习惯筛选无匹配 **`ll-empty-enter`**；`v210.css` Batch 9 r6 样式。
- **回归：** `journal-mode-switch.test.mjs` 更新 async ready 语义；`habit-library-polish.test.mjs` +3；新 **`journal-feed-filter.browser.test.mjs`**。
- **截图：** `node .overnight/capture-batch9-round6.mjs`（**5296**）→ `b9r6-habit-filter-empty-*`、`b9r6-review-habit-empty-*`。
- **文档：** CHANGELOG `[Unreleased]` Changed + QA 一条。
- **测试：** `npm test` **381**；`npm run test:browser` **22**（+1 journal filter）。
- **未做：** `v210.css` reduced-motion 单表合并仍 **2.2**。

## Driver gate after round 1
ℹ tests 376 ℹ pass 376 ℹ fail 0 

## Driver gate after round 2
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 3
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 4
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 5
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 6
ℹ tests 381 ℹ pass 381 ℹ fail 0 

## Driver gate after round 7
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 8
ℹ tests 384 ℹ pass 384 ℹ fail 0 
