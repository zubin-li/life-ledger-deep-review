# Overnight progress

## Batch 2 · Round 10 — done (final)

- **REVIEW.md：** 仍为空（`status: failed`），无 HIGH/MED。
- **Bugfix：** `public/today-widgets.js` — `ledgerHasEntries` 提前声明，修复今日支出卡在「今日无支出」路径上的 TDZ 运行时错误。
- **极矮视口：** `v213-onboarding.css` 增加 `max-height: 560px` 下更大 `padding-bottom` / keypad `scroll-margin`。
- **测试：** +1 静态（声明顺序）、+2 Playwright（今日支出 hint、记账 onboarding 德文 dismiss 持久化）→ **289/289**。
- **截图：** `capture-round10.mjs`（5294）→ `round10-spending-hint-zh-390-*`、`round10-ledger-onboarding-de-light-390-*`、`round10-ledger-onboarding-zh-dark-1440-*`（Chromium + WebKit）。
- **CHANGELOG：** Unreleased 补充 Today TDZ 修复与 mobile padding。

## Half-done

- （无）

## Next

- 夜间批次结束。明早可验 fakecloud（仍缺 repo-root `functions/`）与真机极矮视口。

## Known bugs / gaps

- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).
- 极矮视口 dock/键盘：已加 padding，真机若仍重叠可再调 `v213` 数值。

## npm test

```
289 pass, 0 fail (batch 2 round 10)
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

## Batch 2 Round 7 summary

复盘 scroll-spy + 浏览器测试 — gate 278 pass.

## Batch 2 Round 8 summary

分类预算 UI + 281 测试 — gate 281 pass.

## Batch 2 Round 9 summary

语言 boot 对齐 + 286 测试 — gate 286 pass.

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

## Driver gate after round 8
ℹ tests 281 ℹ pass 281 ℹ fail 0 

## Driver gate after round 9
ℹ tests 286 ℹ pass 286 ℹ fail 0 

## Driver gate after round 10
ℹ tests 289 ℹ pass 289 ℹ fail 0 
