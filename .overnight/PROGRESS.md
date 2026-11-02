# Overnight progress

## Batch 2 · Round 6 — done

- **REVIEW.md：** 仍为空（`status: failed`），无 HIGH/MED。
- **复盘移动跳转：** 统计行下方增加 `review-scatter-jump` 药丸按钮（心情 / 习惯 / 专注 / 洞察，三语），`scrollIntoView` + `scroll-margin-top`；宽屏 ≥960px 隐藏（`v221-review-scatter-jump.css`）。
- **复盘金额动画：** 切换复盘月份时，支出/收入/结余复用 `LifeLedgerInteraction.rollText`（与 Today 支出卡一致）。
- **锚点：** `#review-scatter-mood|habit|focus`、`#review-ledger-insights`（`tabindex="-1"` 便于 focus）。
- **截图：** `review-scatter-jump-zh-light-390.png`、`review-scatter-jump-webkit-zh-light-390.png`、`review-scatter-fullpage-de-dark-390.png`（整页）、`review-scatter-jump-light-1440.png`（无跳转条）；`capture-round6.mjs`，端口 5293。
- **npm test：** **277/277** 通过（契约扩展 jump nav + v221）。

## Half-done

- （无）

## Next (round 7+)

- fakecloud 仍缺 repo-root `functions/`（overnight clone 限制）。
- 可选：点击跳转 chip 后的 active 态；复盘月份 roll 的 Playwright 断言。

## Known bugs / gaps

- 极矮视口 dock vs 键盘可能轻微重叠（未改 `v213`）。
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).

## npm test

```
277 pass, 0 fail (batch 2 round 6)
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
