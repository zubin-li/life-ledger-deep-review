# Overnight progress

## Batch 12 · Round 7 — done

- **REVIEW.md：** 仍无 HIGH/MED；#1 CSS reduced-motion 合并留 **2.2**；#2 intentional；#3 浏览器套件本轮全绿（54）。
- **Goal 2 / 记账 UX：** 筛选结果同时含 **收入与支出** 时，合计条显示 **收入 · 支出 · 净** 分列（单色筛选仍只显示笔数 · 合计）；**Escape** 清除当前列表筛选（搜索/日期/分类；弹层打开时仍先关弹层；快速录入框内不触发）。
- **逻辑：** `renderListFilterSummary` 扩展；`bindLedgerShortcuts` 增加 Escape → `clearAllListFilters`。
- **QA：** `view-enter-selectors` Batch 12 r7；`ledger-core` 混合日 `summarizeTransactions`；`ledger-escape-filters.browser`（WebKit 390，混合日 split + Escape）。
- **文档：** README EN/ZH/DE + CHANGELOG `[Unreleased]` r7。
- **截图：** `node .overnight/capture-batch12-round7.mjs`（**5297**）→ `b12r7-ledger-split-sum-*`。
- **QA：** `npm test` **404** pass / 0 fail；`npm run test:browser` **54** pass / 0 fail。

## Half-done

- （无）

## Next

- Batch 12 Round 8+：`v210.css` reduced-motion 物理合并（2.2）；习惯/复盘/Today 其它 micro-interaction；或 `.overnight/REPORT.md` 总览收尾。
- Owner 验收：Demo → **记账** → 点有 **工资+支出** 同一天的热力格 → 应见 **收入/支出/净** 分列（见 `b12r7-ledger-split-sum-zh-light-1440-chromium.png`）；再按 **Esc** → 日期 chip 与合计条消失。

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
404 pass, 0 fail (batch 12 round 7, unit gate)
54 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 12 · Round 6 — done

- **REVIEW.md：** 仍无 HIGH/MED；#1 CSS reduced-motion 合并留 **2.2**；#2 intentional；#3 浏览器套件本轮全绿。
- **Goal 2 / 记账 UX：** 交易列表在 **搜索 / 日期 / 分类** 任一筛选且有结果时显示 **笔数 · 合计** 条；**两个及以上** 筛选时出现 **清除全部筛选**；日+分类无匹配时专用空态 + 清除按钮；合计金额支持 `rollText`。
- **逻辑：** `summarizeTransactions`（`ledger-core.js`）；`renderListFilterSummary` / `clearAllListFilters`（`ledger-ui.js`）。
- **QA：** `view-enter-selectors` Batch 12 r6；`ledger-filter-summary.browser`（Chromium，热力日 + 圆环分类 → 小计或 combo 空态 → 清除全部）。
- **文档：** README EN/ZH/DE + CHANGELOG `[Unreleased]` r6。
- **截图：** `node .overnight/capture-batch12-round6.mjs`（**5292**）→ `b12r6-ledger-filter-sum-*`（深色合计对比度已微调）。
- **QA：** `npm test` **402** pass / 0 fail；`npm run test:browser` **53** pass / 0 fail。

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
