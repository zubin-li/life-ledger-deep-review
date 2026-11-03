# Overnight progress

## Batch 9 · Round 1 — done

- **REVIEW.md MED #1：** `alignedDay/Week/MonthSpendCompare` 改用 `temporalSpendChangePercent`（分母为**对比期**支出）；支出下降不再出现 −900% 类 inflated caption；`spendInsightDeltaPercent` 仍仅用于复盘散点「两组均值 lift」。
- **REVIEW.md LOW #3：** 去掉 `app.js` 冗余的 `explicitLanguagePreference === "true"` 分支。
- **REVIEW.md LOW #1/#2：** CSS reduced-motion 合并仍留 **2.2**（未做物理合并）。
- **文档：** CHANGELOG `[Unreleased]` Fixed 一条。
- **测试：** `ledger-core.test.mjs` +2；`npm test` **376**；`npm run test:browser` **17**。
- **截图：** `node .overnight/capture-batch9-round1.mjs`（**5292**）→ `b9r1-spend-decrease-baseline-*`（人工注入 €100→€10 场景，caption **−90%**）。

## Half-done

- （无）

## Next

- Batch 9 Round 2：demo 习惯名/对比文案 polish，或 Week/Review 同类 caption 视觉回归；2.2 候选 `v210.css` reduced-motion 单表。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- Demo **支出上升**时对比 % 仍可能因基数很小而显得夸张（行为正确；仅下降侧已修）。
- `npm run test:browser` 与 fakecloud 并行时偶发超时 — 先清 529x / wrangler。

## npm test

```
376 pass, 0 fail (batch 9 round 1, unit gate)
17 pass, 0 fail (test:browser, batch 9 round 1)
```

## Gate result

_pending (driver appends after commit)_

## Batch 8 · Round 10 — done（最后一轮）

- **REVIEW.md：** 无 HIGH/MED；LOW #2 已在 Round 9 前修复；LOW #1 CSS 合并留 **2.2**。
- **发布整理：** `[Unreleased]` 并入 **CHANGELOG [2.1.0] - 2026-11-03**；`.github/releases/v2.1.0.md` 补 Batch 8 亮点；`ROUND10-CHECKLIST.md` 全勾选。
- **QA：** `review-scatter.browser.test.mjs` 修复 roll 动画时序 flake；`npm test` **374**；`npm run test:browser` **17**。
- **截图：** `node .overnight/capture-batch8-round10.mjs`（**5291**）→ `b8r10-release-*`。

## Batch 8 总结

- **Goal 1 收尾：** 周固定待记按 ISO 周；Today / Review / Week 支出与习惯/日记 **对齐期对比** caption。
- **Goal 2：** Today 支出卡 chip + 较昨日；Week 第五格支出 + 三格 hint；Review 较上月同期。
- **版本：** Web **2.1.0** / Mac **3.1.0**（无二次 bump）；见 CHANGELOG `[2.1.0]`。

## Half-done

- （无）

## Next

- Owner 本地验收 demo；**2.2：** `v210.css` reduced-motion 单表；demo 习惯名本地化（低优）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- Today / Week / Review 截图需 scroll 到对应区块。
- Demo 对比百分比/百分点可能因基数小而夸张。
- `npm run test:browser` 与 fakecloud 并行时偶发超时 — 先清 529x / wrangler。

## npm test

```
374 pass, 0 fail (batch 8 round 10, unit gate)
17 pass, 0 fail (test:browser, batch 8 round 10)
```

## Gate result

_pending (driver appends after commit)_

## Batch 8 · Round 9 — done

- **REVIEW.md：** 无 HIGH/MED；LOW #2 周度 recurring 已在 `ledger-core.js` 按 ISO 周实现（`transactionFulfillsRecurringOccurrence` + 单测）；LOW #1 CSS 合并仍留 2.2。
- **Goal 2 — 本周习惯完成率：** `habitCompletionStatsInRange` / `alignedWeekCompletionCompare`（Mon–today 窗口 vs 平移 7 天）；**完成率** 格下 caption（±N 个百分点 / 相同）；三语 `week.completion*`；`#weekCompletionHint`；重构 `renderWeekInsights` 共用区间统计。
- **文档：** CHANGELOG `[Unreleased]`、`README` EN/ZH/DE；`.overnight/ROUND10-CHECKLIST.md`；截图 `node .overnight/capture-batch8-round9.mjs`（**5299**）→ `b8r9-*`。
- **测试：** `week-insights-completion.test.mjs`；`npm test` **374**；`npm run test:browser` **17**（首轮 fakecloud 超时，清端口后通过）。

## Batch 8 · Round 8 — done

- **REVIEW.md：** 无 HIGH/MED；LOW #1/#2 已在先前轮次处理或留 2.2。
- **Goal 2 — 本周日记洞察：** `journalEntryDaysInRange` / `alignedWeekJournalCompare`（与时间轴一致：有 `note` 或 `moodReason` 的日）；**专注时长** 格下 caption（天数 + 较上周同期 ±N 天 / 相同）；三语 `week.journal*`；样式 `v210.css` 通用 `.week-insight-hint`；空状态把日记天计入 `hasData`。
- **文档：** CHANGELOG `[Unreleased]`、`README` EN/ZH/DE 各补一行；截图 `node .overnight/capture-batch8-round8.mjs`（**5298**）→ `b8r8-*`。
- **测试：** `week-insights-journal.test.mjs` 新增；`npm test` **373**；`npm run test:browser` **17**。

## Half-done

- （无）

## Next

- Batch 8 Round 9：`v210.css` reduced-motion 单表（2.2 候选）或 Round 10 发布整理（若 Batch 8 结束）；demo 习惯名本地化（低优）。
- 并行 browser 套件时若 fakecloud 失败，先 `pkill -f 'http.server 529'` / 5298 wrangler 再跑。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- Today 截图需滚到 `.tw-spending` 才看见胶囊与较昨日行（capture 脚本已 scroll）。
- Week 截图需滚到 `#weekInsightsGrid`；Review 需滚到 `#reviewLedgerSummary` 才看见支出对比。
- Week/Review/Today demo 上对比百分比可能很大（昨日/上周/上月基数小）。

## npm test

```
373 pass, 0 fail (batch 8 round 8, unit gate)
17 pass, 0 fail (test:browser, batch 8 round 8)
```

## Gate result

_pending (driver appends after commit)_

## Batch 8 · Round 7 — done

- **REVIEW.md：** 无 HIGH/MED；LOW #1/#2 已在先前轮次处理或留 2.2。
- **Goal 2 — Today 支出 vs 昨日：** `ledger-core.js` 新增 `alignedDaySpendCompare`（默认货币当日 vs 前一日）；Today **今日支出** 卡片 caption 下 **较昨日** 行（+/−% / 相近 / 有新增 / 无新支出）；三语 `spending*Day`；样式 `v210.css` `.tw-spend-compare`。
- **文档：** CHANGELOG `[Unreleased]`、`README` EN/ZH/DE 各补一行；截图 `node .overnight/capture-batch8-round7.mjs`（**5297**）→ `b8r7-*`。
- **测试：** `ledger-core.test.mjs` +1、`today-spending-hint.test.mjs` +1；`npm test` **371**；`npm run test:browser` **17**。

## Gate result

_pending (driver appends after commit)_

## Driver gate after round 7
ℹ tests 371 ℹ pass 371 ℹ fail 0 

## Driver gate after round 8
ℹ tests 373 ℹ pass 373 ℹ fail 0 

## Driver gate after round 9
ℹ tests 374 ℹ pass 374 ℹ fail 0 

## Driver gate after round 10
ℹ tests 374 ℹ pass 374 ℹ fail 0 

## Driver gate after round 1
ℹ tests 376 ℹ pass 376 ℹ fail 0 
