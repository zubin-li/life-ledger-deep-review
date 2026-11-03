# Overnight progress

## Batch 7 · Round 8 — done

- **Today · 固定待记胶囊：** 当月仍有 `recurringPendingForMonth` 时在「今日支出」金额行显示 `tw-spend-recurring-pill`（三语）；点击进 **记账** 并滚到 `ledger-recurring-due` 横幅。
- **联动：** `renderLedger` 的 `changed` 回调改为 `LifeLedgerTodayWidgets.render()`，记账保存/全部记入账后 Today 卡片（含胶囊）即时更新。
- **样式：** `v210.css` 胶囊配色对齐记账横幅；`prefers-reduced-motion` 与 mood 胶囊共用 enter keyframes。
- **QA：** +1 单元（recurring pill 断言）；`today-spending-recurring.browser.test.mjs`（**5274**）；修正多套件共用 **5292/5293/5295/5299** 导致的并行 flake（onboarding **5271**、edit **5272**、CSV **5273**）；截图 `node .overnight/capture-batch7-round8.mjs`（**5286**）→ `b7r8-today-recurring-pill-*`（目视 OK：zh 见「1 项固定待记」+ 心情胶囊）。
- **文档：** CHANGELOG / README EN·ZH·DE 一句说明。

## Half-done

- `v210.css` 其余分散的 `@media (prefers-reduced-motion)` 仍未收成单表（REVIEW LOW #4 大合并未做）。
- Demo 习惯名仍为英文（产品数据，非 streak 标签问题）。
- Round 9/10：将 `[Unreleased]` 整理进稳定版条目（CHANGELOG 已有 `[2.1.0]` 历史段，避免重复）。

## Next

- 可选：CSS reduced-motion 表收尾；复盘/习惯更多 polish；发版前 CHANGELOG 合并。
- 并行 browser 端口：**5290** habit-scores、**5291** today-spending empty、**5292** mood pill、**5293** ledger shortcuts、**5294** review-scatter、**5295** recurring-due、**5271–5274** onboarding/edit/csv/recurring-today、**5296–5299** fakecloud、**5286–5287** capture r8/r7。

## Known bugs / gaps

- 未清 wrangler / 僵尸 `http.server` 时个别 browser 仍可能超时（清进程后 **16 pass**）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- 未记录心情或空账本时支出卡不显示心情胶囊（ intentional）。
- 固定项「已记」判定：优先 `recurringId`，否则同月同分类同金额（手动录入也会消掉待记）。

## npm test

```
358 pass, 0 fail (batch 7 round 8, unit gate)
16 pass, 0 fail (test:browser, round 8)
```

## Gate result

_pending (driver appends after commit)_

## Batch 7 · Round 7 — done

- **Money · 固定收支待记：** `recurringPendingForMonth` / `applyAllRecurringPending`（`ledger-core.js`）；`applyRecurringTemplate` 写入可选 `recurringId`；当月横幅 + **全部记入账**（`ledger-ui.js`）；修复 `bindRecurring` 未传入 `ym` 导致批量记账无效应。
- **Today · 本月累计：** `tw-spend-month` 在支出变化时用 `LifeLedgerInteraction.rollText` 滚动更新。
- **QA：** +2 单元（pending / legacy 匹配 / bulk）；+1 浏览器 `ledger-recurring-due.browser.test.mjs`（**5295**）；截图 `node .overnight/capture-batch7-round7.mjs`（**5286**）→ `b7r7-ledger-recurring-due-*`（目视 OK：zh 横幅「订阅」+ de 移动深色）。
- **文档：** CHANGELOG / README EN·ZH·DE 一句说明。
- **测试：** 单元 **357 pass**；浏览器 **15 pass**。

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
