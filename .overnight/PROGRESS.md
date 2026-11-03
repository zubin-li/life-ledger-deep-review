# Overnight progress

## Batch 9 · Round 10 — done (终稿)

- **REVIEW.md：** MED #1 已在 `temporalSpendChangePercent` 修复（Round 7+）；LOW #2 reduced-motion 合并仍 **2.2**；LOW #3 语言三元已无冗余 `=== "true"` 分支。
- **发布整理：** `CHANGELOG` 将 Batch 9 的 `[Unreleased]` 条目并入 **`[2.1.0]`**；`.github/releases/v2.1.0.md` 补充 spend 对比 / Today 洞察 / 时间轴 UX / QA 计数。
- **截图：** `node .overnight/capture-batch9-round10.mjs`（**5291**）→ `b9r10-release-*`（Today 洞察/支出、复盘 Money、DE 移动记账）。
- **清单：** `.overnight/ROUND10-CHECKLIST.md`（Batch 9）全部勾选。
- **测试：** `npm test` **384**；`npm run test:browser` **24**。
- **Batch 9 状态：** **10/10 完成**；`v210.css` reduced-motion 物理合并留 **2.2**。

## Half-done

- （无）

## Next

- 明早 owner 本地验收；后续可选 **2.2**：`v210.css` reduced-motion 单块合并。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 对比基线 ≥ €15 且增幅极大时仍显示 **+999%**（封顶，非金额句）。
- 旧 demo 缓存未 re-seed 时，Today **心情×支出** hint 可能不显示（需清除 preview 存储或 `demo-reset=1`）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- `npm run test:browser` 与 fakecloud 并行时偶发超时 — 先清 529x / wrangler（Round 5 已加固 fakecloud-online 等待 cloud）。

## npm test

```
384 pass, 0 fail (batch 9 round 10, unit gate)
24 pass, 0 fail (test:browser, batch 9 round 10)
```

## Gate result

_pending (driver appends after commit)_

## Batch 9 · Round 9 — done

- **REVIEW.md：** MED #1 / LOW #3 仍已在先前轮次修复；LOW #2 reduced-motion 合并仍 **2.2**（未动）。
- **文档：** README **EN / ZH / DE** 各增一条 **Today 习惯×支出 / 心情×支出** 近 30 天洞察（demo showcase）说明。
- **Mac 壳：** `spend-compare-mac-shell.browser.test.mjs` 在 Week/Review 之后断言 **Today** `#todayHabitSpendHint` / `#todayMoodSpendHint`；截图 `node .overnight/capture-batch9-round9.mjs`（**5298**）→ `b9r9-mac-today-*`（zh/de × light/dark）。
- **文档：** CHANGELOG `[Unreleased]` QA 行更新 Mac Today 断言说明。
- **测试：** `npm test` **384**；`npm run test:browser` **24**（Mac 用例扩展，总数不变）。

## Batch 9 · Round 8 — done

- **REVIEW.md：** MED #1 仍已在 `temporalSpendChangePercent` 修复；LOW #2 reduced-motion 合并仍 **2.2**；LOW #3 语言三元已不含冗余 `=== "true"` 分支（当前代码已简化，未再改）。
- **Goal 2 polish：** Today **心情 × 支出** 近 30 天一句 + 跳转复盘散点（`#todayMoodSpendHint`）；习惯/心情 hint 共用 **`today-insight-hint`** 样式；demo **`alignDemoMoodWithSpend`** 改为 **45 天**窗口并为有支出日补 log，保证滚动 30 天洞察可算。
- **回归：** `today-habit-spend-hint.browser.test.mjs`（Chromium+WebKit）；`today-habit-spend-hint.test.mjs` / `ledger-core.test.mjs` / `habit-library-polish` 更新。
- **截图：** `node .overnight/capture-batch9-round8.mjs`（**5297**）→ `b9r8-today-mood-spend-hint-*`、`b9r8-today-habit-spend-hints-*`。
- **文档：** CHANGELOG `[Unreleased]` Changed + QA 一条。
- **测试：** `npm test` **384**；`npm run test:browser` **24**（+1 Today hints）。
- **未做：** `v210.css` reduced-motion 单表合并仍 **2.2**。

## Driver gate after round 1
ℹ tests 376 ℹ pass 376 ℹ fail 0 

## Driver gate after round 2
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 3
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 4
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 5
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 6
ℹ tests 381 ℹ pass 381 ℹ fail 0 

## Driver gate after round 7
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 8
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 9
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 10
ℹ tests 384 ℹ pass 384 ℹ fail 0 
