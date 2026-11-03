# Overnight progress

## Batch 7 · Round 5 — done

- **Today · 今日支出 × 心情：** 当天已选心情且账本有流水（或今日有支出）时，金额旁显示本地化心情胶囊（`tw-spend-mood-pill`；三语 label + tooltip；`v210.css` 动效 + reduced-motion）。
- **QA：** +1 单元（`today-spending-hint`）；+3 浏览器 — `today-spending-mood`（5289 未用，**5292**）、`ledger-shortcuts`（**5293**）、`review-habit-scores` zh「当前连续」断言。
- **文档：** CHANGELOG / README EN·ZH·DE 一句说明；截图 `node .overnight/capture-batch7-round5.mjs`（**5288**）→ `b7r5-today-spend-mood-*`（目视 OK：zh 移动「平静」、de 深色「Ruhig」）。
- **测试：** 单元 **354 pass**；浏览器 **14 pass**。

## Half-done

- `v210.css` 其余分散的 `@media (prefers-reduced-motion)` 仍未收成单表（REVIEW LOW #4 大合并未做）。
- Demo 习惯名仍为英文（产品数据，非 streak 标签问题；zh inspector 文案已测为「当前连续」）。

## Next

- 可选：CSS reduced-motion 表收尾；stable 发版时将 `[Unreleased]` 并入 `[2.1.0]`。
- 并行 browser 端口：**5290** habit-scores、**5291** today-spending empty、**5292** mood pill、**5293** ledger shortcuts、**5288** 仅 capture。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时个别 browser 用例仍可能超时（清进程后 **14 pass**）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- 未记录心情或空账本时支出卡不显示心情胶囊（ intentional）。

## npm test

```
354 pass, 0 fail (batch 7 round 5, unit gate)
14 pass, 0 fail (test:browser, round 5)
```

## Gate result

_pending (driver appends after commit)_

## Batch 7 · Round 4 — done

- **复盘习惯评分明细：** `#inspectorReviewTable` 在统一月度复盘页重新可见（`v210.css` 覆盖 Round 12 的 `display:none`；workspace **trend** 与 desk 布局均适用）。≥960px 默认展开 `<details>`，窄屏可折叠；`toggle` / `resize` 时重绘，避免折叠态白算 DOM。
- **`setInsightView`：** 不再把 `insightView` 写死为已废弃的 `month`；desk 用 `data-insight-view="trend"` 与现有 CSS 对齐。
- **记账快捷键：** 桌面 **N** 聚焦 `#ledgerQuickInput`（与 **/**、**← / →** 一致；三语 tooltip + README）。
- **测试：** 单元 **353 pass**；浏览器 **11 pass**（+2 `review-habit-scores.browser.test.mjs`；`review-scatter` 换月断言改为等数值变化，避免并行负载下 roll 动画偶发已结束）；browser 端口 **5290** 与 `ledger-edit-amount` 去冲突。
- **验收截图：** `node .overnight/capture-batch7-round4.mjs`（**5289**）→ `b7r4-review-habit-scores-*`、`b7r4-ledger-quick-focus-*`（目视 OK：宽屏习惯卡片 + 移动 zh 深色折叠展开 + N 聚焦 Schnellerfassung）。

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
