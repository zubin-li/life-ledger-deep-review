# Overnight progress

## Batch 3 · Round 8 — done

- **REVIEW.md：** HIGH/MED 项已在 Batch 2–3 早期 round 修复；本 round 未复现回归。
- **Goal 1 + 2 — 记账图表换月 stagger：** `ledger-heat-grid` / `ledger-donut-segments` / `ledger-treemap` 带 `is-retargeting` 与 `--heat-i` / `--seg-i` / `--cell-i`；`v230-ledger-chart-retarget.css`；换月后 `LifeLedgerInteraction.retarget` 重触发 CSS 动画（respect reduced motion）。
- **PWA：** `v230` 写入 `index.html` / `sw.js` APP_SHELL + network-first。
- **测试：** +2（`ledger-chart-retarget.test.mjs`）→ **305/305**。
- **截图：** `capture-batch3-round8.mjs`（5295，`demo-showcase-v1`）→ `b3r8-ledger-donut-zh-light-1440-*`、`b3r8-ledger-heat-de-dark-390-*`。

## Half-done

- （无）

## Next

- fakecloud 仍缺 repo-root `functions/`（在线版本地替身）。
- Round 9/10：可选 fakecloud 最小 stub；或 Today/复盘小幅动效；legacy analytics fallback 清理仍非必须。

## Known bugs / gaps

- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).
- 极矮视口 dock/键盘：已加 padding，真机若仍重叠可再调 `v213` 数值。
- Journal streak 在 demo 全量日志上数字会很大（74 天），属样例数据而非 bug。
- score-grid 在折叠的「详细指标」内，用户需点开 summary 才见。
- 空账本截图须 dismiss demo + 设置 `LOCAL_EDITION`，否则本地版会再次注入三个月样例。

## npm test

```
305 pass, 0 fail (batch 3 round 8)
```

## Gate result

_pending (driver appends after commit)_

## Batch 3 · Round 7 — done

- **Goal 2 — 复盘 DOM 收敛：** `reviewUsesInsightPanels()`；`paintReviewAnalyticsPanels` 在 insight 路径下只画热力图，不再向 `#reviewHabitCompare` 写入 legacy `analytics-bars`；`renderReviewTrendChart` 在 insight 路径下跳过趋势图重复渲染（由 `renderInsightDashboard` 负责 habit 表 + `rv-weekdays`）。
- **Goal 1 — 预算条动效：** `LifeLedgerReviewBars.animateLedgerBudgetFills` + `v229-ledger-budget-bars.css`；换月时预算进度条 stagger grow（`ledger-ui.js`）。
- **PWA：** `v229` 写入 `index.html` / `sw.js` APP_SHELL + network-first。
- **测试：** +1（`review-bars.test.mjs`）→ **303/303**。
- **截图：** `capture-batch3-round7.mjs`（5296，`local-preview=demo-showcase-v1`）→ `b3r7-review-weekday-*`、`b3r7-ledger-budget-de-dark-390-*`.

## Driver gate after round 6
ℹ tests 302 ℹ pass 302 ℹ fail 0 

## Driver gate after round 7
ℹ tests 303 ℹ pass 303 ℹ fail 0 

## Driver gate after round 8
ℹ tests 305 ℹ pass 305 ℹ fail 0 
