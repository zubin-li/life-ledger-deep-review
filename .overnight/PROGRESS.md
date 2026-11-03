# Overnight progress

## Batch 8 · Round 6 — done

- **REVIEW.md：** 无 HIGH/MED；LOW #1/#2 已在先前轮次处理或留 2.2。
- **Goal 2 — 复盘支出对比：** `ledger-core.js` 新增 `alignedMonthSpendCompare`（当月 1 日至今天/月末 vs 上月同日历日区间）；**本月支出摘要** 支出数字下 **较上月同期** caption；三语 `review.spending*Month`；样式 `v210.css` `.review-ledger-spend-hint`。
- **文档：** CHANGELOG `[Unreleased]`、`README` EN/ZH/DE 各补一行；截图 `node .overnight/capture-batch8-round6.mjs`（**5296**）→ `b8r6-*`。
- **测试：** `ledger-core.test.mjs` +1、`review-spending-compare.test.mjs` 新增；`npm test` **369**；`npm run test:browser` **17**（首轮 fakecloud flake，清 529x 后全绿）。

## Half-done

- （无）

## Next

- Batch 8 Round 7：`v210.css` reduced-motion 单表（2.2 候选）或习惯/复盘其它小抛光；demo 习惯名本地化（低优）。
- 并行 browser 套件时若 fakecloud 失败，先 `pkill -f 'http.server 529'` / 5298 wrangler 再跑。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- Today 截图需滚到 `.tw-spending` 才看见胶囊（capture 脚本已 scroll）。
- Week 截图需滚到 `#weekInsightsGrid`；Review 需滚到 `#reviewLedgerSummary` 才看见支出对比。
- Week/Review demo 上对比百分比可能很大（上月/上周基数小）。

## npm test

```
369 pass, 0 fail (batch 8 round 6, unit gate)
17 pass, 0 fail (test:browser, batch 8 round 6, after port cleanup)
```

## Gate result

_pending (driver appends after commit)_

## Batch 8 · Round 5 — done

- **REVIEW.md：** 无 HIGH/MED；LOW #1/#2 已在先前轮次处理或留 2.2。
- **Goal 2 — 本周支出对比：** `ledger-core.js` 新增 `alignedWeekSpendCompare`（当前周一至「今天/周日」区间 vs 整段前移 7 天）；洞察第五格下方 **较上周同期** caption（+/−% 或「相近」/「有新增支出」）；三语 `week.spending*Period`；样式 `v210.css`。
- **文档：** CHANGELOG `[Unreleased]`、`README` EN/ZH/DE 各补一行；截图 `node .overnight/capture-batch8-round5.mjs`（**5295**）→ `b8r5-*`。
- **测试：** `ledger-core.test.mjs` +1、`week-insights-spending.test.mjs` 断言 hint；`npm test` **367**；`npm run test:browser` **17**。

## Half-done

- （无）

## Next

- Batch 8 Round 6：`v210.css` reduced-motion 单表（2.2 候选）或复盘/习惯洞察小抛光；demo 习惯名本地化（低优）。
- 并行 browser 套件时若 fakecloud 失败，先 `pkill -f 'http.server 529'` / 5298 wrangler 再跑。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- Today 截图需滚到 `.tw-spending` 才看见胶囊（capture 脚本已 scroll）。
- Week 截图需滚到 `#weekInsightsGrid` 才看见第五格支出；demo 上对比百分比可能很大（上周同期基数小）。

## npm test

```
367 pass, 0 fail (batch 8 round 5, unit gate)
17 pass, 0 fail (test:browser, batch 8 round 5)
```

## Gate result

_pending (driver appends after commit)_

## Batch 8 · Round 4 — done

- **REVIEW.md：** 无 HIGH/MED；LOW #2 已在 Round 1 修复；LOW #1 reduced-motion 合并仍留 2.2。
- **Goal 1 + Week 洞察：** `ledger-core.js` 新增 `rangeSummary`（含起止 ISO 日期的收支汇总）；**本周**「数据洞察」第五格 **本周支出**（周一至 min(周日, 今天) 的默认货币支出）；点击打开 **记账** 并 `setViewMonth` 到该周所在月；无账本时按钮禁用。
- **测试：** `ledger-core.test.mjs` +1、`week-insights-spending.test.mjs` +2；`npm test` **366**；`npm run test:browser` **17**。
- **文档：** CHANGELOG `[Unreleased]` Changed 一条；截图 `node .overnight/capture-batch8-round4.mjs`（**5294**，需滚到 `#weekInsightsGrid`）→ `b8r4-*`；capture 脚本补 `webkit.close()` 避免挂起。

## Half-done

- （无）

## Next

- Batch 8 Round 5：`v210.css` reduced-motion 单表（2.2 候选）或复盘/习惯洞察小抛光；README 三语若需补「本周支出」一行可写。
- 并行 browser 套件时若 fakecloud 失败，先 `pkill -f 'http.server 529'` / 5298 wrangler 再跑。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- Today 截图需滚到 `.tw-spending` 才看见胶囊（capture 脚本已 scroll）。
- Week 截图需滚到 `#weekInsightsGrid` 才看见第五格支出。

## npm test

```
366 pass, 0 fail (batch 8 round 4, unit gate)
17 pass, 0 fail (test:browser, batch 8 round 4)
```

## Gate result

_pending (driver appends after commit)_

## Batch 8 · Round 3 — done

- **REVIEW.md：** 无 HIGH/MED；LOW #2 已在 Round 1 修复；LOW #1 reduced-motion 合并仍留 2.2。
- **Goal 2 — Today 支出卡：** `spendingTodayDetail`（`ledger-core.js`）汇总当日笔数 + 最大支出分类；卡片展示分类 chip、caption 笔数；无账本时不显示「本月累计 · €0.00」；S 号卡标题/金额叠字修复；德语固定待记改为 **offene Posten**。
- **测试：** `ledger-core.test.mjs` +1、`today-spending-hint.test.mjs` +1；`npm test` **363**；`npm run test:browser` **17**。
- **文档：** CHANGELOG `[Unreleased]` Changed 一条；截图 `node .overnight/capture-batch8-round3.mjs`（**5293**）→ `b8r3-*`。

## Half-done

- （无）

## Next

- Batch 8 Round 4：`v210.css` reduced-motion 单表（2.2 候选）或复盘/习惯洞察小抛光；demo 习惯名本地化（仍低优）。
- 并行 browser 套件时若 fakecloud 失败，先 `pkill -f 'http.server 529'` / 5298 wrangler 再跑。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- Today 截图需滚到 `.tw-spending` 才看见胶囊（capture 脚本已 scroll）。

## npm test

```
363 pass, 0 fail (batch 8 round 3, unit gate)
17 pass, 0 fail (test:browser, batch 8 round 3)
```

## Gate result

_pending (driver appends after commit)_

## Batch 8 · Round 2 — done

- **固定待记计数：** `recurringPendingOccurrenceCount` / `recurringUnpostedOccurrenceCount`（`ledger-core.js`）；Today 胶囊、Money 横幅、复盘条按**当月未记笔数**（周固定 = 剩余周一数）而非模板条数。
- **Goal 2 小修：** 语音上下文习惯词用 `displayHabitName`；中文 Today 胶囊 copy 改为「笔固定待记」。
- **测试：** `ledger-core.test.mjs` +1；`npm test` **361**；`npm run test:browser` **17**（首轮 fakecloud 超时，清 529x 后全绿）。
- **文档：** CHANGELOG `[Unreleased]` 两条 Fixed；截图 `node .overnight/capture-batch8-round2.mjs`（**5292**）→ `b8r2-*`（横幅「5 笔固定待记」+ 周固定 partial seed）。

## Half-done

- （无）

## Next

- Batch 8 Round 3：2.2 候选 reduced-motion 单表；或 Today 支出卡布局/空状态抛光；demo 习惯名若仍有裸 `habit.name` 再扫一遍。
- 并行 browser 套件时若 fakecloud 失败，先 `pkill -f 'http.server 529'` / 5298 wrangler 再跑。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- Today 截图需滚到 `.tw-spending` 才看见胶囊（capture 脚本已 scroll）。

## npm test

```
361 pass, 0 fail (batch 8 round 2, unit gate)
17 pass, 0 fail (test:browser, batch 8 round 2)
```

## Gate result

_pending (driver appends after commit)_

## Batch 8 · Round 1 — done

- **REVIEW.md（Antigravity Batch 7）：** 无 HIGH/MED；**LOW #2** 已修 — 周固定项按 ISO 周判定是否已记，`recurringPendingForMonth` 不再因一笔同分类同金额就整月消待记；**Alle buchen / 全部记入账** 对 weekly 会补记当月所有已过去的发生日。**LOW #1** CSS reduced-motion 合并仍留 2.2。
- **逻辑：** `ledger-core.js` — `weeklyOccurrenceDatesInMonth`、`transactionFulfillsRecurringOccurrence`、`isoWeekKeyFromIso`；`applyAllRecurringPending` 周 cadence 逐周补账。
- **测试：** `ledger-core.test.mjs` +2（weekly 待记 / legacy 仅清一周）；`npm test` **360**；`npm run test:browser` **17**（首轮 fakecloud 并行偶发 flake，单跑与全量第二轮均绿）。
- **文档：** CHANGELOG `[Unreleased]` 一条 Fixed；截图 `node .overnight/capture-batch8-round1.mjs`（**5291**）→ `b8r1-ledger-recurring-*`。

## Batch 7 · Round 10 — done (final)

- **CHANGELOG：** `[Unreleased]` 清空为 “Nothing yet”；`[2.1.0]` 合并 Goal 1/2 与 Batch 7 要点（固定待记三处联动、CSV/同步修复、Goal 2 动效摘要），去掉与稳定段重复的 120+ 行 `[Unreleased]` 堆叠；保留 2.0.5 及以下历史版本条目。
- **文档：** `.overnight/CSS-LAYERS.md` 注明 REVIEW #4 reduced-motion 大表合并延至 2.2。
- **QA：** `npm test` **358**；`npm run test:browser` **17**（全套件回归）；截图 `node .overnight/capture-batch7-round10.mjs`（**5290**）→ `b7r10-ship-*`（Today 支出卡 / 记账月视图 / 复盘 Money / de 移动待记横幅）。
- **未做（已知）：** `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（风险/收益比）；demo 习惯名仍为英文。

## Driver gate after round 1
ℹ tests 352 ℹ pass 352 ℹ fail 0 

## Driver gate after round 2
ℹ tests 353 ℹ pass 353 ℹ fail 0 

## Driver gate after round 3
ℹ tests 353 ℹ pass 353 ℹ fail 0 

## Driver gate after round 4
ℹ tests 353 ℹ pass 353 ℹ fail 0 

## Driver gate after round 5
ℹ tests 354 ℹ pass 354 ℹ fail 0 

## Driver gate after round 6
ℹ tests 355 ℹ pass 355 ℹ fail 0 

## Driver gate after round 7
ℹ tests 357 ℹ pass 357 ℹ fail 0 

## Driver gate after round 8
ℹ tests 358 ℹ pass 358 ℹ fail 0 

## Driver gate after round 9
ℹ tests 358 ℹ pass 358 ℹ fail 0 

## Driver gate after round 10
ℹ tests 358 ℹ pass 358 ℹ fail 0 

## Driver gate after round 10
ℹ tests 358 ℹ pass 358 ℹ fail 0 

## Driver gate after round 1
ℹ tests 360 ℹ pass 360 ℹ fail 0 

## Driver gate after round 2
ℹ tests 361 ℹ pass 361 ℹ fail 0 

## Driver gate after round 3
ℹ tests 363 ℹ pass 363 ℹ fail 0 

## Driver gate after round 4
ℹ tests 366 ℹ pass 366 ℹ fail 0 

## Driver gate after round 5
ℹ tests 367 ℹ pass 367 ℹ fail 0 

## Driver gate after round 6
ℹ tests 369 ℹ pass 369 ℹ fail 0 
