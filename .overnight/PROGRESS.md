# Overnight progress

## Batch 10 · Round 9 — done

- **REVIEW.md：** 仍无 HIGH/MED；LOW #1（`syncBackupPreferencesToRuntime` 冗余分支）已在先前 round 修复；LOW #2 reduced-motion 大合并仍 **2.2**；LOW #3 大额增幅金额文案已在 Unreleased/2.1.0 记录。
- **发布整理：** `CHANGELOG [Unreleased]` → 并入 **[2.1.0]**；`.github/releases/v2.1.0.md` 更新 Batch 10 抛光与 QA 计数；`.overnight/ROUND10-CHECKLIST.md` 终轮项全部勾选。
- **终轮截图：** `node .overnight/capture-batch10-round10.mjs`（**5291**）→ `b10r10-release-*`（6 张：Today 洞察/支出、ledger zh、review Money、ledger de-dark-390 webkit、Mac shell ledger en webkit）。
- **视觉抽检：** Today 洞察区、Mac 壳 Money 页截图正常（组件库 onboarding 在 demo 预览仍可见属预期，capture 未强制 dismiss 以便展示抛光）。

## Half-done

- （无）

## Next

- **Round 10（缓冲）：** 可选 `v210.css` reduced-motion 物理合并；或 owner 验收反馈后再开 2.2。
- capture **5291** 与 browser 套件勿并行。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500%）仍用 **+N%** 文案（ intentional）。
- 旧 demo 缓存未 re-seed 时，Today **心情×支出** hint 可能不显示（需清除 preview 存储或 `demo-reset=1`）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。
- 日历模式下侧栏筛选条默认 CSS 隐藏；筛选无匹配 quiet 条主要在 **照片** 等布局侧栏可见时出现（逻辑已就绪）。

## npm test

```
389 pass, 0 fail (batch 10 round 9, unit gate)
39 pass, 0 fail (test:browser serial, batch 10 round 9, ~115s)
```

## Gate result

_pending (driver appends after commit)_

## Batch 10 · Round 8 — done

- **REVIEW.md：** 仍无新 HIGH/MED；Round 1–3 已处理 LOW #1 / #3；**LOW #2** reduced-motion 大合并仍 **2.2**。
- **Goal 2 抛光 — 时间轴日历 / 侧栏空态：** `timelineMonthEntryBasis` 区分「空月」与「仅选中占位日」；**日历** 空月 `#journalCalendarEmptyArt` 用 `ll-polished` + **`#timelineCalendarEmptyWriteToday`**（修复与隐藏侧栏按钮重复 `id` 导致 CTA 无效）；侧栏 `#timelineEntryList` 空月 / 筛选无匹配分别 **写今日复盘** / **search-empty** quiet 条；`wireJournalFeedEmptyActions` 一次绑定三个 CTA id。
- **回归：** `tests/timeline-calendar-empty.browser.test.mjs`（Chromium + WebKit，**5284**）；`habit-library-polish.test.mjs` 更新 AST（含 `timelineMonthEntryBasis`）。
- **截图：** `node .overnight/capture-batch10-round8.mjs`（**5296**）→ `b10r8-timeline-calendar-empty-*`（4 张）、`b10r8-ledger-mac-shell-zh-light-1440-chromium.png`。
- **文档：** README **EN/ZH/DE** 时间轴日历空月 CTA；`CHANGELOG [Unreleased]` 同上。

## Batch 10 · Round 7 — done

- **REVIEW.md：** 仍无新 HIGH/MED；Round 1–3 已处理 LOW #1 / #3；**LOW #2** reduced-motion 大合并仍 **2.2**。
- **Bugfix — 复盘散点空态：** `renderReviewLedgerSummary` 误用 `summary.expenseMinor > 0`（支出为负 minor）；改为 **`expenseMinor < 0`**，空态与 CTA 才会出现。
- **Goal 2 抛光 — Today 编辑完成动效：** `today-cards.js` — `pulseEditSaved` 使用 CSS 已有的 **`is-saved`**（原 `tc-saved` 从未匹配）；退出编辑时 **720ms** 内保持工具栏可见以播放 bar 动画；**`tc-edit-saved-flash`** 在右下角 **编辑卡片** 按钮上。
- **回归：** `tests/review-scatter-empty.browser.test.mjs`（Chromium + WebKit，**5286**）；`tests/today-cards-edit-saved.browser.test.mjs`（**5285**）；`habit-library-polish.test.mjs` +AST。
- **截图：** `node .overnight/capture-batch10-round7.mjs`（**5296**）→ `b10r7-review-scatter-empty-*`（4 张）、`b10r7-today-edit-saved-*`（1 张）。
- **文档：** README **EN/ZH/DE** Today **Done** 成功动效；`CHANGELOG [Unreleased]` 散点空态 gate + 动效修复。
- **测试：** `npm test` **389**；`npm run test:browser` **37**（+2，串行 ~109s）。

## Driver gate after round 1
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 2
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 3
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 4
ℹ tests 386 ℹ pass 386 ℹ fail 0 

## Driver gate after round 5
ℹ tests 388 ℹ pass 388 ℹ fail 0 

## Driver gate after round 6
ℹ tests 389 ℹ pass 389 ℹ fail 0 

## Driver gate after round 7
ℹ tests 389 ℹ pass 389 ℹ fail 0 

## Driver gate after round 8
ℹ tests 389 ℹ pass 389 ℹ fail 0 

## Driver gate after round 9
ℹ tests 389 ℹ pass 389 ℹ fail 0 
