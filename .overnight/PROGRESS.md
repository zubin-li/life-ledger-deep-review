# Overnight progress

## Batch 12 · Round 2 — done

- **Goal 2：** 记账 **每日支出** 热力格改为可点 `button`（`aria-label` / `aria-pressed`），点选筛选当日交易并显示可清除的日期 chip；**本月关联洞察** mini 散点复用复盘 **tooltip + 方向键**（`bindReviewScatterDotTips` 支持 `.ledger-wellness-grid`；修正 wellness SVG `pointer-events`）。
- **Bugfix：** 热力点击监听误挂在 `bindRecurring` 末尾 → 已移回 `bindInteractions`。
- **QA：** `ledger-core` day filter 单测；`ledger-wellness-insights.browser`（focus 显示 tooltip）；`ledger-heatmap-day-filter.browser`（WebKit 390）。
- **文档：** README EN/ZH/DE + CHANGELOG `[Unreleased]` r2。
- **截图：** `node .overnight/capture-batch12-round2.mjs`（**5296**）→ `b12r2-ledger-heat-filter-*`。
- **QA：** `npm test` **396** pass / 0 fail；`npm run test:browser` **48** pass / 0 fail。

## Half-done

- （无）

## Next

- Batch 12 Round 3+：`v210.css` reduced-motion 物理合并（2.2）；或更多 Goal 2 跨页洞察 / 空态。
- Owner 验收：Demo → **记账** → 点热力格 → 交易列表上方日期 chip → 点 × 恢复；洞察散点 Tab/方向键读 tooltip。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500%）仍用 **+N%** 文案（ intentional）。
- 旧 demo 若 `persona` 仍低于 `DEMO_PERSONA_VERSION` 仍会全量 re-seed（非 insightAlign 路径）；极低概率需 `?demo-reset=1`。
- 旧 demo 缓存未 re-seed 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。
- 日历模式下侧栏筛选条默认 CSS 隐藏；筛选无匹配 quiet 条主要在 **照片** 等布局侧栏可见时出现（逻辑已就绪）。

## npm test

```
396 pass, 0 fail (batch 12 round 2, unit gate)
48 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 12 · Round 1 — done

- **REVIEW.md：** 无 HIGH/MED；#1 CSS 合并仍 **2.2**；#2 极端涨幅金额差已在 Batch 11 / `preferSpendCompareAmountCaption`（>500%）实现，复审描述过时；#3 本轮本地跑通 `npm run test:browser`（**46** pass）。
- **Goal 2：** 记账页 **本月关联洞察** — 并排 mini **心情×支出** / **习惯×支出** 散点（复用 `ledger-core` SVG），**在复盘中查看 →** 同步复盘月份并 spotlight；复盘 Money 与记账共用 `buildLedgerMonthDailyRows` / `ledgerViewMonthDates`。
- **QA：** `view-enter-selectors` Batch 12 r1 AST；`ledger-wellness-insights.browser.test.mjs`（记账 → 复盘 habit 散点）。
- **文档：** README EN/ZH/DE 记账段；CHANGELOG `[Unreleased]` r1。
- **截图：** `node .overnight/capture-batch12-round1.mjs`（**5297**）→ `b12r1-ledger-wellness-zh-light-1440-chromium.png`、`b12r1-ledger-wellness-de-dark-390-webkit.png`。
- **QA：** `npm test` **395** pass / 0 fail；`npm run test:browser` **46** pass / 0 fail。

## Driver gate after round 1
ℹ tests 395 ℹ pass 395 ℹ fail 0 

## Driver gate after round 2
ℹ tests 396 ℹ pass 396 ℹ fail 0 
