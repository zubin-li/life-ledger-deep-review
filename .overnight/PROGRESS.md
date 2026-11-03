# Overnight progress

## Batch 7 · Round 6 — done

- **REVIEW.md：** MED #1（CSV `;;`）、LOW #2（导出本地化分类）、LOW #3（inspector 短路）已在先前批次落地；本轮未改代码，仅确认 `splitGermanCsvLine` + 单测仍绿。
- **Today · 心情胶囊 → 复盘：** `tw-spend-mood-pill` 改为 `<button>`，点击 `switchToView("review")` 并滚到 `#review-scatter-mood`（无散点时 `#reviewLedgerSummary`）；三语 `spendingMoodReview` aria-label；`v210.css` hover/focus + reduced-motion。
- **QA：** +1 单元（`today-spending-hint` 导航断言）；扩展 `today-spending-mood.browser.test.mjs` 点击验收；截图 `node .overnight/capture-batch7-round6.mjs`（**5287**）→ `b7r6-today-mood-to-review-*`（目视 OK：zh 宽屏散点 + de 移动「Stimmung」chip 高亮）。
- **文档：** CHANGELOG / README EN·ZH·DE 一句说明。
- **测试：** 单元 **355 pass**；浏览器 **14 pass**。

## Half-done

- `v210.css` 其余分散的 `@media (prefers-reduced-motion)` 仍未收成单表（REVIEW LOW #4 大合并未做）。
- Demo 习惯名仍为英文（产品数据，非 streak 标签问题）。

## Next

- 可选：CSS reduced-motion 表收尾；stable 发版时将 `[Unreleased]` 并入 `[2.1.0]`（CHANGELOG 已有 `[2.1.0]` 历史段，合并时需整理重复）。
- 并行 browser 端口：**5290** habit-scores、**5291** today-spending empty、**5292** mood pill、**5293** ledger shortcuts、**5287** round6 capture、**5288** r5 capture。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时个别 browser 用例仍可能超时（清进程后 **14 pass**）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- 未记录心情或空账本时支出卡不显示心情胶囊（ intentional）。

## npm test

```
355 pass, 0 fail (batch 7 round 6, unit gate)
14 pass, 0 fail (test:browser, round 6)
```

## Gate result

_pending (driver appends after commit)_

## Batch 7 · Round 5 — done

- **Today · 今日支出 × 心情：** 当天已选心情且账本有流水（或今日有支出）时，金额旁显示本地化心情胶囊（`tw-spend-mood-pill`；三语 label + tooltip；`v210.css` 动效 + reduced-motion）。
- **QA：** +1 单元（`today-spending-hint`）；+3 浏览器 — `today-spending-mood`（5289 未用，**5292**）、`ledger-shortcuts`（**5293**）、`review-habit-scores` zh「当前连续」断言。
- **文档：** CHANGELOG / README EN·ZH·DE 一句说明；截图 `node .overnight/capture-batch7-round5.mjs`（**5288**）→ `b7r5-today-spend-mood-*`（目视 OK：zh 移动「平静」、de 深色「Ruhig」）。
- **测试：** 单元 **354 pass**；浏览器 **14 pass**。

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
