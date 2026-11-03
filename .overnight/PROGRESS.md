# Overnight progress

## Batch 12 · Round 3 — done

- **REVIEW.md：** 仍无 HIGH/MED；#1 CSS reduced-motion 合并留 **2.2**；#2 已在 Batch 11 实现；#3 浏览器套件本轮全绿。
- **Goal 2：** **记账 · 本月关联洞察** — 当月有支出但散点数据不足时，显示与 **复盘 Money** 相同的三步 pill（心情 / 习惯 / 支出）+ **去 Today 记录** CTA（`#ledgerWellnessEmptyHint`）；`switchView` / `hairlineEmpty` 经 `renderLedger` 注入。
- **QA：** `view-enter-selectors` Batch 12 r3 AST；`ledger-wellness-empty.browser`（WebKit 390，scoped 点击避免与复盘空态冲突）。
- **文档：** README EN/ZH/DE + CHANGELOG `[Unreleased]` r3。
- **截图：** `node .overnight/capture-batch12-round3.mjs`（**5295**）→ `b12r3-ledger-wellness-empty-*`。
- **QA：** `npm test` **397** pass / 0 fail；`npm run test:browser` **49** pass / 0 fail。

## Half-done

- （无）

## Next

- Batch 12 Round 4+：`v210.css` reduced-motion 物理合并（2.2）；或 Goal 2 其它页空态 / 动效。
- Owner 验收：本地仅一笔支出、无心情/习惯 → **记账** 滚到 **本月关联洞察** 见三步清单；Demo 仍见 mini 散点。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500%）仍用 **+N%** 文案（ intentional）。
- 旧 demo 若 `persona` 仍低于 `DEMO_PERSONA_VERSION` 仍会全量 re-seed（非 insightAlign 路径）；极低概率需 `?demo-reset=1`。
- 旧 demo 缓存未 re-seed 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。
- 日历模式下侧栏筛选条默认 CSS 隐藏；筛选无匹配 quiet 条主要在 **照片** 等布局侧栏可见时出现（逻辑已就绪）。
- 本地 seed 仅有支出时，**复盘** 与 **记账** 会同时出现散点空态（相同 copy；测试须 scoped 选择器）。

## npm test

```
397 pass, 0 fail (batch 12 round 3, unit gate)
49 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 12 · Round 2 — done

- **Goal 2：** 记账 **每日支出** 热力格改为可点 `button`（`aria-label` / `aria-pressed`），点选筛选当日交易并显示可清除的日期 chip；**本月关联洞察** mini 散点复用复盘 **tooltip + 方向键**（`bindReviewScatterDotTips` 支持 `.ledger-wellness-grid`；修正 wellness SVG `pointer-events`）。
- **Bugfix：** 热力点击监听误挂在 `bindRecurring` 末尾 → 已移回 `bindInteractions`。
- **QA：** `ledger-core` day filter 单测；`ledger-wellness-insights.browser`（focus 显示 tooltip）；`ledger-heatmap-day-filter.browser`（WebKit 390）。
- **文档：** README EN/ZH/DE + CHANGELOG `[Unreleased]` r2。
- **截图：** `node .overnight/capture-batch12-round2.mjs`（**5296**）→ `b12r2-ledger-heat-filter-*`。
- **QA：** `npm test` **396** pass / 0 fail；`npm run test:browser` **48** pass / 0 fail。

## Driver gate after round 1
ℹ tests 395 ℹ pass 395 ℹ fail 0 

## Driver gate after round 2
ℹ tests 396 ℹ pass 396 ℹ fail 0 

## Driver gate after round 3
ℹ tests 397 ℹ pass 397 ℹ fail 0 
