# Overnight progress

## Batch 13 · Round 4 — done

- **REVIEW.md：** 仍无 HIGH/MED；#1 reduced-motion 物理合并仍留 **2.2**。
- **Goal 2：** Today 习惯 `applyHabitCardPulse`（**just-checked / just-unchecked**）；完成时 `pulseProgressOrbit`（**is-progress-bump**）；**Week** 周目标 `pulseWeeklyGoalRow`（**just-toggled** + 延迟重绘）。
- **QA：** `view-enter-selectors` Batch 13 r4；`habit-toggle-pulse.browser`（WebKit 习惯 + Chromium 周目标）。
- **文档：** CHANGELOG `[Unreleased]` r4。
- **截图：** `node .overnight/capture-batch13-round4.mjs`（**5297**）→ `b13r4-habit-check-zh-light-1440-webkit.png`、`b13r4-week-goal-de-dark-390-chromium.png`。
- **QA：** `npm test` **412** pass / 0 fail；`npm run test:browser` **61** pass / 0 fail。

## Half-done

- （无）

## Next

- Batch 13 Round 5+：`v210.css` reduced-motion 物理合并（2.2）；复盘页其它 micro-interaction；习惯「全部完成」celebration 与 orbit 联动等。
- 主人验收：**今日** 点习惯（`b13r4-habit-check-*`）；**本周** 勾选目标（`b13r4-week-goal-*`）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问仍不自动 seed 虚构流水（ intentional；现用 **示例一笔** 降低冷启动摩擦）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500% 且差额 **< €100**）仍用 **+N%** 文案（ intentional）。
- 旧 demo 若 `persona` 仍低于 `DEMO_PERSONA_VERSION` 仍会全量 re-seed（非 insightAlign 路径）；极低概率需 `?demo-reset=1`。
- 旧 demo 缓存未 re-seed 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。
- 日历模式下侧栏筛选条默认 CSS 隐藏；筛选无匹配 quiet 条主要在 **照片** 等布局侧栏可见时出现（逻辑已就绪）。
- 本地 seed 仅有支出时，**复盘** 与 **记账** 会同时出现散点空态（相同 copy；测试须 scoped 选择器）。

## npm test

```
412 pass, 0 fail (batch 13 round 4, unit gate)
61 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 13 · Round 3 — done

- **REVIEW.md：** 仍无 HIGH/MED；#1 reduced-motion 物理合并仍留 **2.2**。
- **Goal 1 / 记账 CSV UX：** `previewGermanBankCsv` 返回 **samples**（最多 5 笔）；确认层 **预览表**（日期/备注/金额）；**拖放 `.csv`** 到 `#ledgerView`（`ledgerCsvDropHint`）；导入成功后 **`.ledger-list-wrap.is-import-pulse`** + `retarget`。
- **QA：** `view-enter-selectors` Batch 13 r3；`ledger-core` preview samples；`ledger-csv-import-confirm.browser` 断言预览行。
- **文档：** README EN/ZH/DE + CHANGELOG `[Unreleased]` r3。
- **截图：** `node .overnight/capture-batch13-round3.mjs`（**5295**）→ `b13r3-csv-preview-de-light-1440-chromium.png`、`b13r3-csv-import-zh-dark-390-webkit.png`。
- **QA：** `npm test` **411** pass / 0 fail；`npm run test:browser` **59** pass / 0 fail。

## Half-done

- （无）

## Next

- Batch 13 Round 4+：`v210.css` reduced-motion 物理合并（2.2）；复盘/Week 其它 micro-interaction；习惯完成反馈等。
- 主人验收：**记账** → **导入 CSV** 或拖放银行 `.csv` → 确认层见预览表（`b13r3-csv-preview-*`）；确认后列表短暂描边（`b13r3-csv-import-*`）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问仍不自动 seed 虚构流水（ intentional；现用 **示例一笔** 降低冷启动摩擦）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500% 且差额 **< €100**）仍用 **+N%** 文案（ intentional）。
- 旧 demo 若 `persona` 仍低于 `DEMO_PERSONA_VERSION` 仍会全量 re-seed（非 insightAlign 路径）；极低概率需 `?demo-reset=1`。
- 旧 demo 缓存未 re-seed 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。
- 日历模式下侧栏筛选条默认 CSS 隐藏；筛选无匹配 quiet 条主要在 **照片** 等布局侧栏可见时出现（逻辑已就绪）。
- 本地 seed 仅有支出时，**复盘** 与 **记账** 会同时出现散点空态（相同 copy；测试须 scoped 选择器）。

## npm test

```
411 pass, 0 fail (batch 13 round 3, unit gate)
59 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 13 · Round 2 — done

- **REVIEW.md：** 仍无 HIGH/MED；#1 reduced-motion 物理合并仍留 **2.2**；#3/#4 Round 1 已部分采纳。
- **Goal 2：** **Today** 每日复盘 `#homeJournalSave` 防抖后 **is-saved** 脉冲；**心情** Today/抽屉 `just-picked` + `retarget`；**今日支出** 环比行 `rollText`（`dataset.spendCompare`）。
- **QA：** `view-enter-selectors` Batch 13 r2；`journal-home-autosave-pulse.browser`（WebKit + Chromium）；`day-plan.test` 绑定新 `setMood(..., b)` 签名。
- **文档：** CHANGELOG `[Unreleased]` r2。
- **截图：** `node .overnight/capture-batch13-round2.mjs`（**5294**）→ `b13r2-journal-autosave-en-light-1440-webkit.png`、`b13r2-mood-pick-zh-light-390-chromium.png`。
- **QA：** `npm test` **409** pass / 0 fail；`npm run test:browser` **59** pass / 0 fail。

## Half-done

- （无）

## Next

- Batch 13 Round 3+：`v210.css` reduced-motion 物理合并（2.2）；复盘/Week 其它 micro-interaction；或记账 CSV 导入 UX 小步。
- 主人验收：Today **每日复盘** 输入 → `#homeJournalSave` 短暂高亮（`b13r2-journal-autosave-*`）；点 **心情** → 按钮缩放反馈（`b13r2-mood-pick-*`）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问仍不自动 seed 虚构流水（ intentional；现用 **示例一笔** 降低冷启动摩擦）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500% 且差额 **< €100**）仍用 **+N%** 文案（ intentional）。
- 旧 demo 若 `persona` 仍低于 `DEMO_PERSONA_VERSION` 仍会全量 re-seed（非 insightAlign 路径）；极低概率需 `?demo-reset=1`。
- 旧 demo 缓存未 re-seed 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。
- 日历模式下侧栏筛选条默认 CSS 隐藏；筛选无匹配 quiet 条主要在 **照片** 等布局侧栏可见时出现（逻辑已就绪）。
- 本地 seed 仅有支出时，**复盘** 与 **记账** 会同时出现散点空态（相同 copy；测试须 scoped 选择器）。

## npm test

```
409 pass, 0 fail (batch 13 round 2, unit gate)
59 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 13 · Round 1 — done

- **REVIEW.md：** 无 HIGH/MED；#1 浏览器套件本机 **57** pass；#2 reduced-motion 合并仍留 **2.2**；#3 部分采纳（绝对差额 **≥ €100** 也显示金额）；#4 部分采纳（空账本 onboarding **记一笔示例** + 撤销，说明默认分类已就绪）。
- **Goal 1 / 记账：** `preferSpendCompareAmountCaption` 增加 `SPEND_COMPARE_AMOUNT_DELTA_MINOR`（10000）；onboarding 文案 + `postSampleEntry` / `data-ledger-sample-entry`（toast 撤销）。
- **Goal 2：** `v210.css` Batch 13 r1（`.ledger-onboarding-actions`）。
- **QA：** `view-enter-selectors` Batch 13 r1；`ledger-core` €100 差额用例；`ledger-sample-entry.browser`（Chromium 1440）。
- **文档：** README EN/ZH/DE + CHANGELOG `[Unreleased]` r1。
- **截图：** `node .overnight/capture-batch13-round1.mjs`（**5292**）→ `b13r1-ledger-onboarding-zh-light-1440-chromium.png`、`b13r1-ledger-sample-de-dark-390-webkit.png`。
- **QA：** `npm test` **408** pass / 0 fail；`npm run test:browser` **57** pass / 0 fail。

## Half-done

- （无）

## Next

- Batch 13 Round 2+：`v210.css` reduced-motion 物理合并（2.2）；习惯/日记其它 micro-interaction；或 Today 环比文案也统一 **≥ €100** 金额规则（若产品要一致）。
- 主人验收：清 `life-ledger-v1` 或空 `ledger` → **记账** → 见 onboarding **记一笔示例**（`b13r1-ledger-onboarding-zh-light-1440-chromium.png`）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问仍不自动 seed 虚构流水（ intentional；现用 **示例一笔** 降低冷启动摩擦）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500% 且差额 **< €100**）仍用 **+N%** 文案（ intentional）。
- 旧 demo 若 `persona` 仍低于 `DEMO_PERSONA_VERSION` 仍会全量 re-seed（非 insightAlign 路径）；极低概率需 `?demo-reset=1`。
- 旧 demo 缓存未 re-seed 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。
- 日历模式下侧栏筛选条默认 CSS 隐藏；筛选无匹配 quiet 条主要在 **照片** 等布局侧栏可见时出现（逻辑已就绪）。
- 本地 seed 仅有支出时，**复盘** 与 **记账** 会同时出现散点空态（相同 copy；测试须 scoped 选择器）。

## npm test

```
408 pass, 0 fail (batch 13 round 1, unit gate)
57 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 12 · Round 10 — done (final)

- **REVIEW.md：** 仍无 HIGH/MED；#1 CSS reduced-motion 合并留 **2.2**；#2 intentional；#3 浏览器套件已在本仓库实测全绿（**56**）。
- **收尾：** `.overnight/REPORT.md` 顶部 **全夜总览**（Goal 1/2、验收路径、Batch 12 表、已知限制、测试数）；`CHANGELOG` Batch 12 r10 final；发布截图 `capture-batch12-round10.mjs`（**5296**）→ `b12r10-release-*`（Today 日筛选 / Review 月跳转 / 日+分类合计 / de390 / Mac shell）。
- **QA：** `npm test` **407** pass / 0 fail；`npm run test:browser` **56** pass / 0 fail。

## Half-done

- （无）

## Next

- 主人本地验收（见 REPORT 全夜总览 **5 分钟**清单）。
- **2.2：** `v210.css` reduced-motion 物理合并（REVIEW #1）；可选中等环比文案优化（REVIEW #2）。

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
407 pass, 0 fail (batch 12 round 10, unit gate)
56 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 12 · Round 9 — done

- **REVIEW.md：** 仍无 HIGH/MED；#1 CSS reduced-motion 合并留 **2.2**；#2 intentional；#3 浏览器套件本轮全绿（56）。
- **Goal 2 / 复盘 ↔ 记账：** **Review** 月度 **Money** 摘要三项 **支出 / 收入 / 结余** 与 **打开记账** → `openLedgerForReviewMonth` + `LifeLedgerLedgerUI.openToMonth`（清除日/分类筛选；月份 summary retarget；固定待记仍 `openToMonth` 后滚横幅）。
- **实现：** `ledger-ui.js` `openToMonth`；`app.js` `openLedgerForReviewMonth`、`.review-ledger-stat-btn`；`v210.css` Batch 12 r9；`review-scatter.browser` 选择器更新。
- **QA：** `view-enter-selectors` Batch 12 r9；`review-spending-ledger-month.browser`（WebKit 1440）。
- **文档：** README EN/ZH/DE + CHANGELOG `[Unreleased]` r9。
- **截图：** `node .overnight/capture-batch12-round9.mjs`（**5295**）→ `b12r9-review-spend-ledger-month-*`。
- **QA：** `npm test` **407** pass / 0 fail；`npm run test:browser` **56** pass / 0 fail。

## Driver gate after round 1
ℹ tests 395 ℹ pass 395 ℹ fail 0 

## Driver gate after round 2
ℹ tests 396 ℹ pass 396 ℹ fail 0 

## Driver gate after round 3
ℹ tests 397 ℹ pass 397 ℹ fail 0 

## Driver gate after round 4
ℹ tests 398 ℹ pass 398 ℹ fail 0 

## Driver gate after round 5
ℹ tests 400 ℹ pass 400 ℹ fail 0 

## Driver gate after round 6
ℹ tests 402 ℹ pass 402 ℹ fail 0 

## Driver gate after round 7
ℹ tests 404 ℹ pass 404 ℹ fail 0 

## Driver gate after round 8
ℹ tests 406 ℹ pass 406 ℹ fail 0 

## Driver gate after round 9
ℹ tests 407 ℹ pass 407 ℹ fail 0 

## Driver gate after round 10
ℹ tests 407 ℹ pass 407 ℹ fail 0 

## Driver gate after round 1
ℹ tests 408 ℹ pass 408 ℹ fail 0 

## Driver gate after round 2
ℹ tests 409 ℹ pass 409 ℹ fail 0 

## Driver gate after round 3
ℹ tests 411 ℹ pass 411 ℹ fail 0 

## Driver gate after round 4
ℹ tests 412 ℹ pass 412 ℹ fail 0 
