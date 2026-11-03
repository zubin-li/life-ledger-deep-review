# Overnight progress

## Batch 7 · Round 4 — done

- **复盘习惯评分明细：** `#inspectorReviewTable` 在统一月度复盘页重新可见（`v210.css` 覆盖 Round 12 的 `display:none`；workspace **trend** 与 desk 布局均适用）。≥960px 默认展开 `<details>`，窄屏可折叠；`toggle` / `resize` 时重绘，避免折叠态白算 DOM。
- **`setInsightView`：** 不再把 `insightView` 写死为已废弃的 `month`；desk 用 `data-insight-view="trend"` 与现有 CSS 对齐。
- **记账快捷键：** 桌面 **N** 聚焦 `#ledgerQuickInput`（与 **/**、**← / →** 一致；三语 tooltip + README）。
- **测试：** 单元 **353 pass**；浏览器 **11 pass**（+2 `review-habit-scores.browser.test.mjs`；`review-scatter` 换月断言改为等数值变化，避免并行负载下 roll 动画偶发已结束）；browser 端口 **5290** 与 `ledger-edit-amount` 去冲突。
- **验收截图：** `node .overnight/capture-batch7-round4.mjs`（**5289**）→ `b7r4-review-habit-scores-*`、`b7r4-ledger-quick-focus-*`（目视 OK：宽屏习惯卡片 + 移动 zh 深色折叠展开 + N 聚焦 Schnellerfassung）。

## Half-done

- `v210.css` 其余 50+ 处分散的 `@media (prefers-reduced-motion)` 仍未收成单表（REVIEW LOW #4 大合并未做）。
- 习惯评分胶囊内英文 streak 文案在 zh 界面仍混排（产品 i18n 细抛，非本轮）。

## Next

- 可选：习惯评分区 streak 标签走 `tr()`；CSS reduced-motion 表收尾。
- stable 发版时将 `[Unreleased]` 并入 `[2.1.0]`。
- 并行跑 browser 前确保各套件端口唯一（5289 仅 capture 用）。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时个别 browser 用例仍可能超时（清进程后 **11 pass**）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- Demo banner 在部分截图中仍可见（未 dismiss demo）。

## npm test

```
353 pass, 0 fail (batch 7 round 4, unit gate)
11 pass, 0 fail (test:browser, round 4)
```

## Gate result

_pending (driver appends after commit)_

## Batch 7 · Round 3 — done

- **CSV 导入确认：** 去掉 `window.confirm`，改用与编辑弹层同级的 **不透明** `ledger-import-popover`（Esc / 点遮罩取消、主按钮导入、`modalSheetEnter` 动效 + reduced-motion 关闭）。
- **CSS（REVIEW LOW #4 续）：** `ledger-shimmer` 合并进 `ll-shimmer`；`.ledger-skeleton` 与 `.ll-skeleton` 共用一条 `prefers-reduced-motion: reduce` 规则。
- **测试：** 单元 **353 pass**（无新增）；浏览器 **9 pass**（+1 `ledger-csv-import-confirm.browser.test.mjs`）。
- **验收截图：** `node .overnight/capture-batch7-round3.mjs`（**5291**）→ `b7r3-ledger-import-confirm-zh-light-1440-chromium.png`、`b7r3-ledger-import-confirm-de-dark-390-webkit.png`（目视 OK：白/暗主题、中德文案、遮罩不透明）。

## Driver gate after round 1
ℹ tests 352 ℹ pass 352 ℹ fail 0 

## Driver gate after round 2
ℹ tests 353 ℹ pass 353 ℹ fail 0 

## Driver gate after round 3
ℹ tests 353 ℹ pass 353 ℹ fail 0 

## Driver gate after round 4
ℹ tests 353 ℹ pass 353 ℹ fail 0 
