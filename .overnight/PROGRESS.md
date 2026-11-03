# Overnight progress

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
