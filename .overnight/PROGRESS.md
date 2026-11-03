# Overnight progress

## Batch 9 · Round 5 — done

- **REVIEW.md：** 无新 HIGH/MED（Round 1–4 修复保持）。
- **Goal 2 polish：** `#journalFeed` 增加 **`ll-paint-host`**（时间轴异步读照片时 skeleton）；feed / 日历列表 / 复盘 inspector 空状态补 **`ll-empty`** + `v210.css` 间距；`fakecloud-online` 烟测 **`localStorage.clear()` + 等 cloud** 消除并行 flake。
- **fakecloud 烟测：** `fakecloud-preview-ledger.browser.test.mjs` 扩展 **复盘** `#reviewLedgerSpendHint`（无四位数 +%、含较上月同期类文案）。
- **浏览器回归：** 新 `journal-feed-paint.browser.test.mjs`（paint host ready、无残留 skeleton）。
- **截图：** `node .overnight/capture-batch9-round5.mjs`（**5295**）→ `b9r5-journal-feed-*`、`b9r5-review-inspector-empty-*`。
- **文档：** CHANGELOG `[Unreleased]` Changed + QA 三条。
- **测试：** `npm test` **379**；`npm run test:browser` **21**（+1 journal paint；fakecloud-online 稳定化）。
- **未做：** `v210.css` reduced-motion 单表合并仍 **2.2**。

## Half-done

- （无）

## Next

- Batch 9 Round 6：习惯页空状态 / 复盘 habit compare 空态动效；或 journal 筛选切换 skeleton 闪一下；reduced-motion 合并仍 2.2。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 对比基线 ≥ €15 且增幅极大时仍显示 **+999%**（封顶，非金额句）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- `npm run test:browser` 与 fakecloud 并行时偶发超时 — 先清 529x / wrangler（Round 5 已加固 fakecloud-online 等待 cloud）。

## npm test

```
379 pass, 0 fail (batch 9 round 5, unit gate)
21 pass, 0 fail (test:browser, batch 9 round 5)
```

## Gate result

_pending (driver appends after commit)_

## Batch 9 · Round 4 — done

- **REVIEW.md：** 无新 HIGH/MED（Round 1–3 修复保持）。
- **Goal 2 polish：** `rollWeekInsightValues()` — 切换工作区周时 **完成率 / 支出 / 连续 / 专注** 数字 roll（`#weekView .week-insight-value.roll-host`）。
- **fakecloud 烟测：** `fakecloud-preview-ledger.browser.test.mjs` 同步 demo 后进入 **本周**，断言 `#weekSpendingHint` 无四位数 +%、含「较上周同期」类文案。
- **浏览器回归：** `spend-compare-mac-shell.browser.test.mjs` +1（Week 切换触发 roll-host）。
- **截图：** `node .overnight/capture-batch9-round4.mjs`（**5294**）→ `b9r4-week-insights-roll-*`（insights 区需向下滚动可见）。
- **文档：** CHANGELOG `[Unreleased]` Changed + QA 两条。
- **测试：** `npm test` **379**；`npm run test:browser` **20**（+1）。
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
