# Overnight progress

## Batch 2 · Round 7 — done

- **REVIEW.md：** 仍为空（`status: failed`），无 HIGH/MED。
- **复盘跳转 scroll-spy：** `bindReviewScatterJumpSpy`（视口锚线 + `IntersectionObserver` + `scroll` 同步）；点击 chip 时 650ms hold，避免滚动监听立刻盖掉选中态；`aria-current="location"` + `is-active`（`v222-review-jump-spy.css`）。
- **测试：** `tests/review-scatter.browser.test.mjs`（Playwright：spy、点击 hold、复盘月份 roll）；契约扩展 `review-scatter-grid.test.mjs`。
- **截图：** `review-jump-spy-zh-light-390.png`、`review-jump-spy-de-dark-390.png`、`review-jump-spy-webkit-zh-light-390.png`、`review-jump-spy-light-1440.png`（`capture-round7.mjs`，5295）。
- **npm test：** **278/278** 通过。

## Half-done

- （无）

## Next (round 8+)

- 记账页「设置分类预算」UI（core 已有 `budgets` + demo，空态文案仍写「后续版本」）。
- fakecloud 仍缺 repo-root `functions/`。
- 可选：Mac shell 注入截图、复盘 roll 数值断言更严。

## Known bugs / gaps

- 极矮视口 dock vs 键盘可能轻微重叠（未改 `v213`）。
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).

## npm test

```
278 pass, 0 fail (batch 2 round 7)
```

## Gate result

_pending (driver appends after commit)_

## Prior batch (rounds 1–14)

终稿见 git 历史：`CHANGELOG [2.1.0]`、记账与 Goal 2 打磨、270 项测试、21 张回归截图。Last prior gate: round 14 — 270 pass, 0 fail.

## Batch 2 Round 1 summary

云 GET pending merge ledger、心情散点、README Mac 3.1.0 — gate 272 pass.

## Batch 2 Round 2 summary

习惯散点、冲突记账预览 UI — gate 274 pass.

## Batch 2 Round 3 summary

专注散点、冲突预览 light 1440 截图 — gate 276 pass.

## Batch 2 Round 4 summary

复盘散点宽屏三列 + insight 栈 — gate 277 pass.

## Batch 2 Round 5 summary

移动 insight kicker + v220 冲突预览字号 — gate 277 pass.

## Batch 2 Round 6 summary

移动跳转药丸 + 月份金额 roll — gate 277 pass.

## Driver gate after round 1
ℹ tests 272 ℹ pass 272 ℹ fail 0 

## Driver gate after round 2
ℹ tests 274 ℹ pass 274 ℹ fail 0 

## Driver gate after round 3
ℹ tests 276 ℹ pass 276 ℹ fail 0 

## Driver gate after round 4
ℹ tests 277 ℹ pass 277 ℹ fail 0 

## Driver gate after round 5
ℹ tests 277 ℹ pass 277 ℹ fail 0 

## Driver gate after round 6
ℹ tests 277 ℹ pass 277 ℹ fail 0 

## Driver gate after round 7
ℹ tests 278 ℹ pass 278 ℹ fail 0 
