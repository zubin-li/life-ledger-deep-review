# Overnight progress

## Batch 2 · Round 8 — done

- **REVIEW.md：** 仍为空（`status: failed`），无 HIGH/MED。
- **记账分类预算 UI：** `upsertCategoryBudget` / `removeCategoryBudget` / `restoreCategoryBudget`（`ledger-core.js`）；Money 页「设置预算」弹层、进度条行内编辑/删除（可撤销）、空态文案更新（`ledger-ui.js` + `v223-ledger-budget-ui.css`）；`index.html` / `sw.js`。
- **测试：** `ledger-core.test.mjs` 新增 3 项（upsert/progress、remove/restore、backup 预算 round-trip）。
- **文档：** CHANGELOG Unreleased、README EN/ZH/DE 一句说明。
- **截图：** `ledger-budget-popover-zh-light-390-{chromium,webkit}.png`、`ledger-budget-progress-de-dark-390-*`、`ledger-budget-progress-light-1440-*`（`capture-round8.mjs`，5296）。
- **npm test：** **281/281** 通过。

## Half-done

- （无）

## Next (round 9+)

- fakecloud 仍缺 repo-root `functions/`。
- 可选：Mac shell 注入预算截图、复盘 roll 数值断言更严、预算 popover 与界面语言完全同步（init 时序）。

## Known bugs / gaps

- 极矮视口 dock vs 键盘可能轻微重叠（未改 `v213`）。
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).

## npm test

```
281 pass, 0 fail (batch 2 round 8)
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
