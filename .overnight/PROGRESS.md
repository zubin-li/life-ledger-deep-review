# Overnight progress

## Batch 10 · Round 6 — done

- **REVIEW.md：** 仍无新 HIGH/MED；Round 1–3 已处理 LOW #1 / #3；**LOW #2** reduced-motion 大合并仍 **2.2**。
- **Goal 2 抛光 — Today 组件库 onboarding：** `today-cards.js` — 首次 Today（`life-ledger-today-cards-onboarding-dismissed`）显示 `#tcOnboardHint`（`layout-edit-hint` 插画 + **打开组件库** / **知道了**）；进入编辑、打开组件库或关闭后从 DOM 移除并持久化；抽屉打开时隐藏。
- **Goal 2 抛光 — 复盘散点空态：** `renderReviewLedgerSummary` — 本月有支出但三类散点均未生成时 `#reviewScatterEmptyHint` + **去 Today 记录**（`empty-insights.svg`）。
- **文档：** README **EN/ZH/DE** Today 引导 + Review 散点空态一句；`CHANGELOG [Unreleased]` 同上。
- **回归：** `tests/today-cards-onboard.browser.test.mjs`（Chromium + WebKit，端口 **5294**）；`habit-library-polish.test.mjs` +1 AST。
- **截图：** `node .overnight/capture-batch10-round6.mjs`（**5296**）→ `b10r6-today-onboard-*`（6 张；散点空态未单独 capture，demo 数据过满）。
- **测试：** `npm test` **389**；`npm run test:browser` **35**（+2 today-cards-onboard，串行 ~110s）。

## Half-done

- （无）

## Next

- Batch 10 Round 7：复盘散点空态专用 capture（需精简 local 档 logs/ledger）；或 Today 编辑成功动效再抛光；**2.2** reduced-motion 物理合并（低优先级）。
- capture **5296** 与 browser 套件勿并行（Round 6 fakecloud 曾因此 flake，单跑已通过）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500%）仍用 **+N%** 文案（ intentional）。
- 旧 demo 缓存未 re-seed 时，Today **心情×支出** hint 可能不显示（需清除 preview 存储或 `demo-reset=1`）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。

## npm test

```
389 pass, 0 fail (batch 10 round 6, unit gate)
35 pass, 0 fail (test:browser serial, batch 10 round 6)
```

## Gate result

_pending (driver appends after commit)_

## Batch 10 · Round 5 — done

- **REVIEW.md：** 仍无新 HIGH/MED；Round 1–3 已处理 LOW #1 / #3；**LOW #2** reduced-motion 大合并仍 **2.2**。
- **Goal 2 抛光 — 本周 / 复盘空态 CTA：** `wirePolishedEmptyCtas` + `syncWeekReviewEmptyHint` / `syncReviewReflectionEmptyHint` — **本周** 无目标 → `weekly-goals-empty ll-polished` + **添加第一个本周目标**（聚焦 `#weeklyGoalInput`）；空白本周复盘 → **开始写本周复盘**；长期目标 tab → hairline + **添加长期目标**；**复盘** 空白月度复盘 → **开始写复盘**；无习惯分数 / 指标 / 明细表 → **去习惯页添加** / **去 Today 打卡**。
- **文档：** README **EN/ZH/DE** 本周与复盘空态一句；`CHANGELOG [Unreleased]` Week & Review empty states。
- **回归：** `tests/week-review-empty.browser.test.mjs`（Chromium + WebKit，端口 **5297**）；`habit-library-polish.test.mjs` +2 AST。
- **截图：** `node .overnight/capture-batch10-round5.mjs`（**5296**，滚动至 CTA）→ `b10r5-week-empty-*`、`b10r5-review-empty-*`。
- **测试：** `npm test` **388**；`npm run test:browser` **33**（+2 week-review-empty，串行 ~99s）。

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
