# Overnight progress

## Batch 7 · Round 9 — done

- **REVIEW.md（Antigravity）：** MED #1（CSV `;;` 空列）、LOW #2（导出分类本地化）、LOW #3（复盘 inspector 短路）已在早期批次落地；本轮复核代码与单测仍绿，未再改逻辑。LOW #4（`v210.css` reduced-motion 大合并）仍未做。
- **Review · 固定待记条：** 浏览**当前复盘月**且 `recurringPendingForMonth` 非空时，「本月支出摘要」统计下显示 `review-ledger-recurring-due`（三语）；**去记账 / Open Money** 切到记账并滚到 `ledger-recurring-due`；切到上一个月时条消失。
- **样式：** `v210.css` Batch 7 r9 — 与记账横幅同系 accent 条、`prefers-reduced-motion` 关闭 enter。
- **QA：** `review-recurring-due.browser.test.mjs`（**5275**）；截图 `node .overnight/capture-batch7-round9.mjs`（**5289**）→ `b7r9-review-recurring-due-*`（目视 OK：zh 见「还有 1 项固定收支…」+ de 移动深色 Vorlage 条）。
- **文档：** CHANGELOG / README EN·ZH·DE 一句说明。

## Half-done

- `v210.css` 其余分散的 `@media (prefers-reduced-motion)` 仍未收成单表（REVIEW LOW #4）。
- Demo 习惯名仍为英文（产品数据，非 streak 标签问题）。
- **Round 10：** 将 `[Unreleased]` 与 `[2.1.0]` 去重整理（不重复粘贴已有稳定段）。

## Next

- Round 10：CHANGELOG 发版整理、可选 CSS reduced-motion 表收尾；全量 browser + 截图回归。
- 并行 browser 端口：**5290** habit-scores、**5291** today-spending empty、**5292** mood pill、**5293** ledger shortcuts、**5294** review-scatter、**5295** recurring-due、**5271–5275** onboarding/edit/csv/recurring-today/review-recurring、**5296–5299** fakecloud、**5286–5289** capture r7–r9。

## Known bugs / gaps

- 未清 wrangler / 僵尸 `http.server` 时个别 browser 仍可能超时（清进程后 **17 pass**）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- 未记录心情或空账本时支出卡不显示心情胶囊（ intentional）。
- 固定项「已记」判定：优先 `recurringId`，否则同月同分类同金额（手动录入也会消掉待记）。

## npm test

```
358 pass, 0 fail (batch 7 round 9, unit gate)
17 pass, 0 fail (test:browser, round 9)
```

## Gate result

_pending (driver appends after commit)_

## Batch 7 · Round 8 — done

- **Today · 固定待记胶囊：** 当月仍有 `recurringPendingForMonth` 时在「今日支出」金额行显示 `tw-spend-recurring-pill`（三语）；点击进 **记账** 并滚到 `ledger-recurring-due` 横幅。
- **联动：** `renderLedger` 的 `changed` 回调改为 `LifeLedgerTodayWidgets.render()`，记账保存/全部记入账后 Today 卡片（含胶囊）即时更新。
- **样式：** `v210.css` 胶囊配色对齐记账横幅；`prefers-reduced-motion` 与 mood 胶囊共用 enter keyframes。
- **QA：** +1 单元（recurring pill 断言）；`today-spending-recurring.browser.test.mjs`（**5274**）；修正多套件共用 **5292/5293/5295/5299** 导致的并行 flake（onboarding **5271**、edit **5272**、CSV **5273**）；截图 `node .overnight/capture-batch7-round8.mjs`（**5286**）→ `b7r8-today-recurring-pill-*`（目视 OK：zh 见「1 项固定待记」+ 心情胶囊）。
- **文档：** CHANGELOG / README EN·ZH·DE 一句说明。

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
