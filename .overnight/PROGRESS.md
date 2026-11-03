# Overnight progress

## Batch 7 · Round 7 — done

- **Money · 固定收支待记：** `recurringPendingForMonth` / `applyAllRecurringPending`（`ledger-core.js`）；`applyRecurringTemplate` 写入可选 `recurringId`；当月横幅 + **全部记入账**（`ledger-ui.js`）；修复 `bindRecurring` 未传入 `ym` 导致批量记账无效应。
- **Today · 本月累计：** `tw-spend-month` 在支出变化时用 `LifeLedgerInteraction.rollText` 滚动更新。
- **QA：** +2 单元（pending / legacy 匹配 / bulk）；+1 浏览器 `ledger-recurring-due.browser.test.mjs`（**5295**）；截图 `node .overnight/capture-batch7-round7.mjs`（**5286**）→ `b7r7-ledger-recurring-due-*`（目视 OK：zh 横幅「订阅」+ de 移动深色）。
- **文档：** CHANGELOG / README EN·ZH·DE 一句说明。
- **测试：** 单元 **357 pass**；浏览器 **15 pass**。

## Half-done

- `v210.css` 其余分散的 `@media (prefers-reduced-motion)` 仍未收成单表（REVIEW LOW #4 大合并未做）。
- Demo 习惯名仍为英文（产品数据，非 streak 标签问题）。

## Next

- 可选：CSS reduced-motion 表收尾；stable 发版时将 `[Unreleased]` 并入 `[2.1.0]`（CHANGELOG 已有 `[2.1.0]` 历史段，合并时需整理重复）。
- 并行 browser 端口：**5290** habit-scores、**5291** today-spending empty、**5292** mood pill、**5293** ledger shortcuts、**5294** review-scatter、**5295** recurring-due、**5286** r7 capture、**5287** r6 capture。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时个别 browser 用例仍可能超时（清进程后 **15 pass**）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- 未记录心情或空账本时支出卡不显示心情胶囊（ intentional）。
- 固定项「已记」判定：优先 `recurringId`，否则同月同分类同金额（手动录入也会消掉待记）。

## npm test

```
357 pass, 0 fail (batch 7 round 7, unit gate)
15 pass, 0 fail (test:browser, round 7)
```

## Gate result

_pending (driver appends after commit)_

## Batch 7 · Round 6 — done

- **REVIEW.md：** MED #1（CSV `;;`）、LOW #2（导出本地化分类）、LOW #3（inspector 短路）已在先前批次落地；本轮未改代码，仅确认 `splitGermanCsvLine` + 单测仍绿。
- **Today · 心情胶囊 → 复盘：** `tw-spend-mood-pill` 改为 `<button>`，点击 `switchToView("review")` 并滚到 `#review-scatter-mood`（无散点时 `#reviewLedgerSummary`）；三语 `spendingMoodReview` aria-label；`v210.css` hover/focus + reduced-motion。
- **QA：** +1 单元（`today-spending-hint` 导航断言）；扩展 `today-spending-mood.browser.test.mjs` 点击验收；截图 `node .overnight/capture-batch7-round6.mjs`（**5287**）→ `b7r6-today-mood-to-review-*`（目视 OK：zh 宽屏散点 + de 移动「Stimmung」chip 高亮）。
- **文档：** CHANGELOG / README EN·ZH·DE 一句说明。
- **测试：** 单元 **355 pass**；浏览器 **14 pass**。

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
