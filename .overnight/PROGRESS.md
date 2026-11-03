# Overnight progress

## Batch 11 · Round 8 — done

- **REVIEW.md：** 仍无新复审；#1–#3 已在 Round 1 关闭；#4 CSS 合并仍 **2.2**。
- **Goal 2：** 时间轴 **日/周/月** feed 标题区增加 **近 30 天心情×支出** 软提示（与 Today 同源），可跳转复盘 mood 散点并 spotlight；streak 仍仅 **日度** 模式。
- **QA：** `mac-shell-date-review-week.browser.test.mjs`（Review `#reviewTitle` + Week `#weekPageTitle` 菜单换期）；`journal-feed-spend-insight.browser.test.mjs`。
- **文档：** README EN/ZH/DE 时间轴 mood×spend 说明；CHANGELOG `[Unreleased]`。
- **QA：** `npm test` **393** pass / 0 fail；`npm run test:browser` **44** pass / 0 fail。
- **截图：** `node .overnight/capture-batch11-round8.mjs`（**5294**）→ `b11r8-journal-spend-insight-zh-light-1440-chromium.png`、`b11r8-review-header-de-dark-390-webkit.png`。

## Half-done

- （无）

## Next

- Batch 11 若继续（Round 9–10）：`v210.css` reduced-motion 物理合并（2.2）；终轮截图与 REPORT 收束。
- Owner 验收：侧栏 **时间轴**（默认周度即可见洞察 chip）→ **复盘里看心情与支出** → mood 散点；Mac 菜单换月于 **复盘/本周**（Round 8 QA）。

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
393 pass, 0 fail (batch 11 round 8, unit gate)
44 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 11 · Round 7 — done

- **REVIEW.md：** 仍无新复审；#1–#3 已在 Round 1 关闭；#4 CSS 合并仍 **2.2**。
- **Goal 2：** Today **习惯×支出** 洞察链接与心情一致，进入复盘并滚到 **`#review-scatter-habit`**；习惯检视器 **28 日连续** 网格已完成格短 stagger 弹入（`v210.css`，`--cell-i`，尊重 reduced-motion）。
- **QA：** `fakecloud-ledger-mac-shell.browser.test.mjs` 增加 **`LifeLedgerMac.handle("date:prev")`** 换月；`today-habit-spend-hint.browser.test.mjs` 断言跳转 habit 散点区。
- **文档：** README EN/ZH/DE 习惯洞察链接改为 habit-vs-spend scatter；CHANGELOG `[Unreleased]`。
- **QA：** `npm test` **393** pass / 0 fail；`npm run test:browser` **42** pass / 0 fail。
- **截图：** `node .overnight/capture-batch11-round7.mjs`（**5295**）→ `b11r7-today-habit-hint-chip-zh-light-1440-chromium.png`、`b11r7-review-habit-scatter-zh-light-1440-chromium.png`、`b11r7-habit-streak-grid-de-dark-390-webkit.png`。

## Half-done

- （无）

## Next

- Batch 11 若继续：`v210.css` reduced-motion 物理合并（2.2）；日记/习惯页更多关联洞察动效；Mac **date:prev** 在复盘/周视图 smoke。
- Owner 验收：Demo **Today** → **复盘里看支出关联** → 应看到 **习惯完成度与当日支出** 散点（Round 7 截图）；习惯页选中有连续记录的习惯 → 网格格子弹入。

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
393 pass, 0 fail (batch 11 round 7, unit gate)
42 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 11 · Round 6 — done

- **REVIEW.md：** 仍无新复审；#1–#3 已在 Round 1 关闭；#4 CSS 合并仍 **2.2**。
- **Goal 2：** 复盘散点空态三步 pill 改为可点击按钮（心情→Today、习惯→习惯页、支出→记账），hover/focus/active 微交互（`v210.css`，尊重 reduced-motion）。
- **QA：** 扩展 `fakecloud-ledger-mac-shell.browser.test.mjs`：**← / N** 与 `LifeLedgerMac.handle("date:next")`；`review-scatter-empty.browser.test.mjs` 断言 pill 跳转 **Money**。
- **文档：** README EN/ZH/DE 补散点空态三 pill 说明；CHANGELOG `[Unreleased]`。
- **QA：** `npm test` **393** pass / 0 fail；`npm run test:browser` **42** pass / 0 fail。
- **截图：** `node .overnight/capture-batch11-round6.mjs`（**5296**）→ `b11r6-review-scatter-steps-zh-light-1440-chromium.png`、`b11r6-ledger-month-arrow-de-dark-390-webkit.png`。

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
