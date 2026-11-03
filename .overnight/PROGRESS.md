# Overnight progress

## Batch 12 · Round 1 — done

- **REVIEW.md：** 无 HIGH/MED；#1 CSS 合并仍 **2.2**；#2 极端涨幅金额差已在 Batch 11 / `preferSpendCompareAmountCaption`（>500%）实现，复审描述过时；#3 本轮本地跑通 `npm run test:browser`（**46** pass）。
- **Goal 2：** 记账页 **本月关联洞察** — 并排 mini **心情×支出** / **习惯×支出** 散点（复用 `ledger-core` SVG），**在复盘中查看 →** 同步复盘月份并 spotlight；复盘 Money 与记账共用 `buildLedgerMonthDailyRows` / `ledgerViewMonthDates`。
- **QA：** `view-enter-selectors` Batch 12 r1 AST；`ledger-wellness-insights.browser.test.mjs`（记账 → 复盘 habit 散点）。
- **文档：** README EN/ZH/DE 记账段；CHANGELOG `[Unreleased]` r1。
- **截图：** `node .overnight/capture-batch12-round1.mjs`（**5297**）→ `b12r1-ledger-wellness-zh-light-1440-chromium.png`、`b12r1-ledger-wellness-de-dark-390-webkit.png`。
- **QA：** `npm test` **395** pass / 0 fail；`npm run test:browser` **46** pass / 0 fail。

## Half-done

- （无）

## Next

- Batch 12 Round 2+：`v210.css` reduced-motion 物理合并（2.2）；记账页散点 tooltip/键盘（若要做）或更多跨页洞察。
- Owner 验收：Demo → **记账** → 图表下方 **本月关联洞察** → 点链接应到复盘对应散点并高亮。

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
395 pass, 0 fail (batch 12 round 1, unit gate)
46 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 11 · Round 10 — done (final)

- **REVIEW.md：** #1–#3 已在 Round 1 关闭并仍有效；#4 `v210.css` reduced-motion 物理合并仍 **2.2**（终轮未做）。
- **终轮：** `node .overnight/capture-batch11-round10.mjs`（**5292**）→ 7 张 `b11r10-release-*` 截图；`REPORT.md` 终夜收束章节；CHANGELOG r10 QA 行。
- **Batch 11：** **已完成**（Round 1–10）。
- **QA：** `npm test` **394** pass / 0 fail；`npm run test:browser` **45** pass / 0 fail。

## Half-done

- （无）

## Next

- Owner 明早验收：见 `.overnight/REPORT.md`「一键路线」与 `b11r10-release-*` 截图。
- **2.2：** 合并 `v210.css` 内分散 `prefers-reduced-motion`（REVIEW #4）。

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
394 pass, 0 fail (batch 11 round 10, unit gate)
45 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

ℹ tests 394 ℹ pass 394 ℹ fail 0 

---

## Batch 11 · Round 9 — done

- **REVIEW.md：** 仍无新复审；#1–#3 已在 Round 1 关闭；#4 CSS 合并仍 **2.2**。
- **Goal 2：** **本周**（仅当前周）页头增加 **近 30 天习惯×支出** 软提示 chip，点 **复盘里看支出关联 →** 进入复盘 habit 散点并 spotlight；Today 习惯洞察链接同步 spotlight 行为。
- **QA：** `week-habit-spend-insight.test.mjs` + `week-habit-spend-insight.browser.test.mjs`；修复 week chip 与时间轴测试的 CSS 类名冲突（`week-page-spend-insight` 独立类）。
- **文档：** README EN/ZH/DE 本周页习惯洞察；CHANGELOG `[Unreleased]` r9。
- **QA：** `npm test` **394** pass / 0 fail；`npm run test:browser` **45** pass / 0 fail。
- **截图：** `node .overnight/capture-batch11-round9.mjs`（**5293**）→ `b11r9-week-habit-spend-insight-zh-light-1440-chromium.png`、`b11r9-week-habit-spend-insight-de-dark-390-webkit.png`。

## Driver gate after round 1
ℹ tests 391 ℹ pass 391 ℹ fail 0 

## Driver gate after round 2
ℹ tests 392 ℹ pass 392 ℹ fail 0 

## Driver gate after round 3
ℹ tests 393 ℹ pass 393 ℹ fail 0 

## Driver gate after round 4
ℹ tests 393 ℹ pass 393 ℹ fail 0 

## Driver gate after round 5
ℹ tests 393 ℹ pass 393 ℹ fail 0 

## Driver gate after round 6
ℹ tests 393 ℹ pass 393 ℹ fail 0 

## Driver gate after round 7
ℹ tests 393 ℹ pass 393 ℹ fail 0 

## Driver gate after round 8
ℹ tests 393 ℹ pass 393 ℹ fail 0 

## Driver gate after round 9
ℹ tests 394 ℹ pass 394 ℹ fail 0 

## Driver gate after round 10
ℹ tests 394 ℹ pass 394 ℹ fail 0 

## Driver gate after round 1
ℹ tests 395 ℹ pass 395 ℹ fail 0 
