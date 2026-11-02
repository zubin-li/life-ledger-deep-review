# Overnight progress

## Batch 5 · Round 4 — done

- **REVIEW.md：** 无新项；Round 1–3 已消化 Antigravity 列表。
- **Goal 2 — pages-858 审计：** `.view.is-entering #weekView …` 类规则在 `is-entering` 加在 `#weekView` 自身时仍有效（后代选择器）；`#weekView .module-card` 已由 v210 更高特异性覆盖。复盘指标由 `#reviewView.view.is-entering` 覆盖 pages-858 的 `#reviewView .insight-metrics` 规则。
- **Goal 2 — 习惯 / 本周入场：** `#habitsView.view.is-entering` 分段（标题区 → 提醒卡 → 三统计卡 → 筛选 → 列表）；`#weekView.view.is-entering` 增加页头 + `#weekCalendar` 七列日历 stagger（200–410ms，接在 module-card 之后）。移除旧的 `.view.is-entering #habitLibraryOverview` 块，避免与新区重复。
- **测试：** `view-enter-selectors.test.mjs` 断言 habits/week 选择器；单元 **330 pass**；浏览器 **8 pass**（清 wrangler/5296 竞态后）。
- **截图：** `capture-batch5-round4.mjs`（5296）→ `b5r4-habits-zh-light-1440-*`、`b5r4-habits-de-dark-390-*`、`b5r4-week-en-light-1440-*`、`b5r4-week-zh-dark-390-*`（WebKit + Chromium）。

## Half-done

- （无）

## Next（Round 5）

- Goal 2：时间轴 Photos 模式切换时的 feed 入场；或 Today 照片墙卡片 polish。
- 可选：发版前核对 README/SHOWCASE 虚构截图是否含记账侧栏项。
- 若 browser 套件偶发超时：跑前 `pkill -f wrangler` / 释放 5296–5298。

## Known bugs / gaps

- 并行跑多个 fakecloud / 未清理 wrangler 时 browser 套件仍可能超时（清进程后 **8 pass**）。
- 非 preview URL 的纯 Cloudflare 首次访问不会自动 seed 记账（ intentional）。

## npm test

```
330 pass, 0 fail (batch 5 round 4, unit gate)
8 pass, 0 fail (test:browser, after clearing stale wrangler)
```

## Gate result

_pending (driver appends after commit)_

## Batch 5 · Round 3 — done

- **REVIEW.md：** 无新项；Round 1–2 已消化 Antigravity 列表。
- **Goal 2 — 复盘入场动效：** 与 Today/长期页同类 bug：`pages-858.css` 使用 `.view.is-entering #reviewView …`，但 `is-entering` 加在 `#reviewView` 自身，后代选择器永不匹配。已在 `v210.css` 增加 `#reviewView.view.is-entering` 分段 stagger（指标卡 → 趋势图 → 复盘 textarea）。
- **Goal 1 — 极矮视口 keypad：** `max-width: 640px` 且 `max-height: 480px` 时，快速录入 `:focus-within` 将 `.ledger-keypad` 固定于底栏上方（不透明背景、`z-index: 11500`），减轻与 Tab 栏重叠。
- **测试：** `view-enter-selectors.test.mjs` +1（review stagger + keypad dock CSS 契约）。
- **截图：** `capture-batch5-round3.mjs`（5297）→ `b5r3-review-zh-light-1440-*`、`b5r3-review-de-dark-390-*`、`b5r3-ledger-keypad-en-light-390-*`（WebKit + Chromium）。

## Driver gate after round 3
ℹ tests 330 ℹ pass 330 ℹ fail 0 

## Batch 5 · Round 2 — done

- **REVIEW.md：** Round 1 已处理全部 MED/LOW；本轮无新 Antigravity 项。
- **Goal 2 — 页面入场动效修复：** `#todayView` / `#timelineView` / `#longrangeView` 的 `is-entering` 选择器改为 `#…View.view.is-entering`（原先 `.view.is-entering #longrangeView` 等永不匹配）；Today 增加 hero / daily-tool / calendar 分段 stagger。
- **Goal 2 — Focus：** 修复 `setDailyToolPage` / `updateDailyToolControls` 误写死 `journal` 的回归（Focus 标签再次可切换）；`#focusInlineTimer` 增加 `is-running` / `is-break` / `is-paused` 类 + 运行中 ring breathe 动画（`prefers-reduced-motion` 关闭）。
- **Goal 1 — 测试：** `ledger-edit-amount.browser.test.mjs` 无效金额 `.is-error` 且不改动流水；`view-enter-selectors.test.mjs` 断言 CSS 选择器；`today-spending.browser.test.mjs` 端口改为 **5291**，避免与 fakecloud **5296** 并行竞态。
- **截图：** `capture-batch5-round2.mjs`（5295）→ `b5r2-today-zh-light-1440-mac-*`、`b5r2-focus-de-dark-390-*`、`b5r2-journal-en-light-1440-*`（WebKit + Chromium）。

## Driver gate after round 2
ℹ tests 329 ℹ pass 329 ℹ fail 0 

## Batch 5 · Round 1 — done

- **REVIEW.md（Antigravity Batch 4 复核）：**
  - **MED #1** — `exportTransactionsCsv` 增加 `amount;currency` 列，多币种导出不混为 `amount_eur`；单测 `exportTransactionsCsv includes amount and currency per row`。
  - **LOW #2** — `index.html` / `sw.js`：`pages-polish.css` 改回在 `v210.css` 之前；`css-consolidation.test.mjs` 断言 v210 为最后一张样式表。
  - **LOW #3** — 编辑 popover 金额解析失败时 `.is-error` + 早退，输入时清除错误态。
  - **LOW #4** — `cloudflare-release.test.mjs` deploy 用 `mkdtemp` 的 `manifestDir`，避免写 `.life-ledger-deployments/`。
- **Goal 2 — 长期页：** `#longrangeView` 进入时分段 stagger（pin / heading / phase board / sections）；`prefers-reduced-motion` 关闭动画。
- **Goal 2 — 截图：** `capture-batch5-round1.mjs`（5293）→ `b5r1-longrange-zh-light-1440-*`、`b5r1-longrange-de-dark-390-*`（WebKit + Chromium）。
- **文档：** CHANGELOG Unreleased、`CSS-LAYERS.md` 更新 cascade 说明。

## Driver gate after round 1
ℹ tests 327 ℹ pass 327 ℹ fail 0 

## Driver gate after round 4
ℹ tests 330 ℹ pass 330 ℹ fail 0 
