# Overnight progress

## Batch 2 · Round 9 — done

- **REVIEW.md：** 仍为空（`status: failed`），无 HIGH/MED。
- **语言初始化：** `public/app.js` 与 `syncBackupPreferencesToRuntime` 对齐——仅设置 `life-ledger-language`、未设 `language-preference-set` 时也会用存储语言（修复 Playwright / 深链下 UI 英文、分类中文的错位）；`tests/language-init.test.mjs`（4 项）。
- **复盘 roll 断言：** `review-scatter.browser.test.mjs` 增加 `.roll-old`/`.roll-new` 与 `data-roll-value` 校验。
- **记账预算浏览器测试：** `ledger-budget.browser.test.mjs` 验证无 preference 标志时中文弹层标题与页眉。
- **Mac shell 截图：** `capture-round9.mjs` → `ledger-budget-popover-zh-mac-1440-*`、`ledger-budget-progress-mac-de-dark-1440-*`（5297，注入 `desktop/mac/shell.*`）。
- **文档：** CHANGELOG Unreleased「Language」修复一行。
- **npm test：** **286/286** 通过。

## Half-done

- （无）

## Next (round 10)

- fakecloud 仍缺 repo-root `functions/`（overnight 克隆限制）。
- 可选：极矮视口 dock/键盘（`v213`）、更多 Goal 2 空态/动效。

## Known bugs / gaps

- 极矮视口 dock vs 键盘可能轻微重叠（未改 `v213`）。
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).

## npm test

```
286 pass, 0 fail (batch 2 round 9)
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
