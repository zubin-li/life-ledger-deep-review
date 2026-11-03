# Overnight progress

## Batch 12 · Round 6 — done

- **REVIEW.md：** 仍无 HIGH/MED；#1 CSS reduced-motion 合并留 **2.2**；#2 intentional；#3 浏览器套件本轮全绿。
- **Goal 2 / 记账 UX：** 交易列表在 **搜索 / 日期 / 分类** 任一筛选且有结果时显示 **笔数 · 合计** 条；**两个及以上** 筛选时出现 **清除全部筛选**；日+分类无匹配时专用空态 + 清除按钮；合计金额支持 `rollText`。
- **逻辑：** `summarizeTransactions`（`ledger-core.js`）；`renderListFilterSummary` / `clearAllListFilters`（`ledger-ui.js`）。
- **QA：** `view-enter-selectors` Batch 12 r6；`ledger-filter-summary.browser`（Chromium，热力日 + 圆环分类 → 小计或 combo 空态 → 清除全部）。
- **文档：** README EN/ZH/DE + CHANGELOG `[Unreleased]` r6。
- **截图：** `node .overnight/capture-batch12-round6.mjs`（**5292**）→ `b12r6-ledger-filter-sum-*`（深色合计对比度已微调）。
- **QA：** `npm test` **402** pass / 0 fail；`npm run test:browser` **53** pass / 0 fail。

## Half-done

- （无）

## Next

- Batch 12 Round 7+：`v210.css` reduced-motion 物理合并（2.2）；或其它 Goal 2（习惯/复盘图表动效、Today 其它 micro-interaction 等）。
- Owner 验收：Demo → **记账** → 点热力格 **再** 点圆环扇区 → 应见「N 笔 · 合计」与 **清除全部筛选**（见 `b12r6-ledger-filter-sum-zh-light-1440-chromium.png`）。

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
402 pass, 0 fail (batch 12 round 6, unit gate)
53 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 12 · Round 5 — done

- **REVIEW.md：** 仍无 HIGH/MED；#1 CSS reduced-motion 合并留 **2.2**；#2 intentional；#3 浏览器套件本轮全绿。
- **Goal 2 / 记账 UX：** **分类** 圆环/树图扇区可点选，筛选下方 **交易** 列表；可清除的 **分类 chip**（与日期 chip 并列）；空分类筛选显示 **清除分类筛选**；换月清除日/分类筛选。
- **逻辑：** `filterTransactions(..., categoryId)`；`ledger-ui` 中 `listCategoryFilter` / `bindCategoryVizFilter` / SVG `ledger-cat-seg`（键盘 Enter/Space）。
- **QA：** `view-enter-selectors` Batch 12 r5；`ledger-category-filter.browser`（Chromium，SVG `dispatchEvent` 点击）；`ledger-core` 分类 scope 单测。
- **文档：** README EN/ZH/DE + CHANGELOG `[Unreleased]` r5。
- **截图：** `node .overnight/capture-batch12-round5.mjs`（**5291**）→ `b12r5-ledger-category-filter-*`。
- **QA：** `npm test` **400** pass / 0 fail；`npm run test:browser` **52** pass / 0 fail。

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
