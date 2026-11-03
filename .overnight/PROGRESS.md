# Overnight progress

## Batch 9 · Round 2 — done

- **REVIEW.md：** Round 1 已修 MED #1；本轮无新 HIGH/MED。
- **支出对比文案：** `displaySpendDeltaPercent`（增幅封顶 **999%**）、`preferSpendCompareAmountCaption`（对比基线 **< €15** 时改显示金额差）；`temporalSpendCompareHint` 统一 Today / Week / Review；三语 `*More*Amount` 字符串。
- **Demo 习惯名：** `demo-workspace.js` 在生成/重定位示例时把 starter 习惯 `name` 写入当前语言（用户自定义名保留）。
- **文档：** CHANGELOG `[Unreleased]` Changed 两条。
- **测试：** `ledger-core.test.mjs` +2、`demo-workspace.test.mjs` +1、契约测试更新；`npm test` **379**；`npm run test:browser` **17**。
- **截图：** `node .overnight/capture-batch9-round2.mjs`（**5293**）→ `b9r2-week-spend-hint-*`（+999% 封顶）、`b9r2-habits-zh-*`（「运动」）、`b9r2-review-spend-hint-*`（+26%）。

## Half-done

- （无）

## Next

- Batch 9 Round 3：`v210.css` reduced-motion 单表（2.2 候选）；或 Today demo「较昨日」金额 caption 截图；Mac 壳 Week/Review hint 回归。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 对比基线 ≥ €15 且增幅极大时仍显示 **+999%**（封顶，非金额句）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- `npm run test:browser` 与 fakecloud 并行时偶发超时 — 先清 529x / wrangler。

## npm test

```
379 pass, 0 fail (batch 9 round 2, unit gate)
17 pass, 0 fail (test:browser, batch 9 round 2)
```

## Gate result

_pending (driver appends after commit)_

## Batch 9 · Round 1 — done

- **REVIEW.md MED #1：** `alignedDay/Week/MonthSpendCompare` 改用 `temporalSpendChangePercent`（分母为**对比期**支出）；支出下降不再出现 −900% 类 inflated caption；`spendInsightDeltaPercent` 仍仅用于复盘散点「两组均值 lift」。
- **REVIEW.md LOW #3：** 去掉 `app.js` 冗余的 `explicitLanguagePreference === "true"` 分支。
- **REVIEW.md LOW #1/#2：** CSS reduced-motion 合并仍留 **2.2**（未做物理合并）。
- **文档：** CHANGELOG `[Unreleased]` Fixed 一条。
- **测试：** `ledger-core.test.mjs` +2；`npm test` **376**；`npm run test:browser` **17**。
- **截图：** `node .overnight/capture-batch9-round1.mjs`（**5292**）→ `b9r1-spend-decrease-baseline-*`（人工注入 €100→€10 场景，caption **−90%**）。

## Driver gate after round 1
ℹ tests 376 ℹ pass 376 ℹ fail 0 

## Driver gate after round 2
ℹ tests 379 ℹ pass 379 ℹ fail 0 
