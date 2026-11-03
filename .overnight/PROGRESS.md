# Overnight progress

## Batch 10 · Round 4 — done

- **REVIEW.md：** 仍无新 HIGH/MED；Round 1–3 已处理 LOW #1 / #3；**LOW #2** reduced-motion 大合并仍 **2.2**。
- **Goal 2 抛光 — 时间轴日记 feed：** `journalFeedEmptyMarkup` / `wireJournalFeedEmptyActions` — 无月份筛选时用 `feed-empty ll-polished` + 主 CTA（日度 **去写今日复盘** → Today 日记；周度/月度 **打开本周/月度复盘**）；有月份但无行时用横向 `journal-feed-filter-quiet` + `search-empty.svg`；`journal-feed-pane--empty` 柔化描述行。
- **Goal 2 抛光 — Today 卡片网格：** `tc-grid` 间距 `clamp(14px, 1.65vw, 22px)`；入场时 `.tc-card` 在 hero 后错开；桌面 fine pointer 轻 hover 抬升（`prefers-reduced-motion` 关闭）。
- **文档：** README **EN/ZH/DE** 时间轴空态一句；`CHANGELOG [Unreleased]` 日记 feed + Today rhythm。
- **回归：** `tests/journal-feed-empty.browser.test.mjs`（Chromium + WebKit）；`habit-library-polish.test.mjs` +2 AST。
- **截图：** `node .overnight/capture-batch10-round4.mjs`（**5296**）→ `b10r4-journal-empty-*`、`b10r4-today-grid-*`。
- **测试：** `npm test` **386**；`npm run test:browser` **31**（+2 journal-feed-empty，串行 ~94s）。

## Half-done

- （无）

## Next

- Batch 10 Round 5：复盘/周目标空态 CTA 对齐，或 Today 卡片库 onboarding 微提示；capture **5296** 与 browser 套件勿并行。
- **2.2** `v210.css` reduced-motion 物理合并（仍低优先级）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500%）仍用 **+N%** 文案（ intentional）。
- 旧 demo 缓存未 re-seed 时，Today **心情×支出** hint 可能不显示（需清除 preview 存储或 `demo-reset=1`）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。

## npm test

```
386 pass, 0 fail (batch 10 round 4, unit gate)
31 pass, 0 fail (test:browser serial, batch 10 round 4)
```

## Gate result

_pending (driver appends after commit)_

## Batch 10 · Round 3 — done

- **REVIEW.md：** Batch 9/10 无新 HIGH/MED；Round 1–2 已处理 LOW #1 / #3；**LOW #2** reduced-motion 大合并仍 **2.2**。
- **Goal 2 抛光 — 习惯库：** 零习惯时用 `habit-library-empty ll-polished`（hairline + **添加第一个 habit** CTA，打开 `#habitDialog`）；`habits-view--empty` 隐藏提醒/概览/筛选/表头，空态居中可见；筛选无结果用 `search-empty` 横向 quiet 卡。
- **Goal 2 抛光 — Today hero：** 浏览「今天」时 hero 引文/日期/进度环短 stagger（`heroCopyIn`，尊重 reduced-motion）。
- **QA 稳定性：** `review-scatter` → **5287**、`habits-empty` → **5288**（消除与 5295/5296 并行争用）；`npm run test:browser` 改为 **`--test-concurrency=1`**（fakecloud + 静态服不再互抢）。
- **回归：** `tests/habits-empty.browser.test.mjs`（Chromium + WebKit，空态 CTA + 筛选空插画）。
- **截图：** `node .overnight/capture-batch10-round3.mjs`（**5295**）→ `b10r3-habits-empty-*`、`b10r3-today-hero-*`。
- **测试：** `npm test` **384**；`npm run test:browser` **29**（+2 habits-empty，串行 ~93s）。

## Half-done

- （无）

## Next

- Batch 10 Round 4：Today 卡片网格 rhythm / 日记空态，或 README 三语补习惯空态一句；fakecloud 5298 与 capture 脚本并行时仍勿同时跑。
- **2.2** `v210.css` reduced-motion 物理合并（仍低优先级）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500%）仍用 **+N%** 文案（ intentional）。
- 旧 demo 缓存未 re-seed 时，Today **心情×支出** hint 可能不显示（需清除 preview 存储或 `demo-reset=1`）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。

## npm test

```
384 pass, 0 fail (batch 10 round 3, unit gate)
29 pass, 0 fail (test:browser serial, batch 10 round 3)
```

## Gate result

_pending (driver appends after commit)_

## Batch 10 · Round 2 — done

- **REVIEW.md：** Round 1 已清 LOW #1 / #3；**LOW #2** reduced-motion 大合并仍 **2.2**（未动）。
- **Goal 2 抛光：** **长期（Horizon）** 无阶段/无计划空态接入 hairline 插画（`horizon-phase-empty.svg`、`horizon-plans-quiet.svg`）、`llEmptyReveal`、主 CTA **开始第一个阶段**；计划/长期事项区横向 quiet 空态。侧栏在 **时间轴**、**记账** 前增加轻分隔线（`v210.css`）。
- **文档：** README **EN/ZH/DE** 补充极大增幅（>500%）显示 **金额差**；`CHANGELOG [Unreleased]` 长期空态 + 侧栏条目。
- **回归：** `tests/longrange-empty.browser.test.mjs`（Chromium + WebKit，CTA 打开 `#horizonDialog`）。
- **截图：** `node .overnight/capture-batch10-round2.mjs`（**5293**）→ `b10r2-longrange-empty-*`（zh/de × light/dark × 1440/390）。
- **测试：** `npm test` **384**；`npm run test:browser` **27**（+2 longrange）。

## Batch 10 · Round 1 — done

- **REVIEW.md（Batch 9 终审）：** 无 HIGH/MED。**LOW #1** 已修：`syncBackupPreferencesToRuntime` 去掉冗余 `explicitLang === "true"` 分支。**LOW #2** `v210.css` reduced-motion 大合并仍 **2.2**。**LOW #3** 已修：`preferSpendCompareAmountCaption` 在对比期 **≥ €15** 且增幅 **> 500%** 时改显示金额差；`SPEND_COMPARE_EXTREME_PERCENT = 500`。
- **回归：** `ledger-core.test.mjs` +1 用例；`today-spending.browser.test.mjs` +1（极端 surge 不出现 **999%**）。
- **截图：** `node .overnight/capture-batch10-round1.mjs`（**5292**）→ `b10r1-today-spend-amount-delta-zh-*`（较昨日多 **€480.00**）。
- **文档：** `CHANGELOG [Unreleased]` 两条 Changed。
- **测试：** `npm test` **384**；`npm run test:browser` **25**。

## Driver gate after round 1
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 2
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 3
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 4
ℹ tests 386 ℹ pass 386 ℹ fail 0 
