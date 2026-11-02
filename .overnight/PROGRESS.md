# Overnight progress

## Batch 2 · Round 5 — done

- **REVIEW.md：** 仍为空（`status: failed`），无 HIGH/MED。
- **复盘洞察小标题：** 三句 mood/habit/focus 对比文案增加 `review-ledger-insight-kicker`（心情 / Habits / Fokus 三语），正文在 `review-ledger-insight-body`。
- **移动端复盘：** `v220-review-mobile.css` — 散点全宽、更紧分隔与 legend；洞察卡片间距；冲突合并预览在 ≤480px 略放大字号。
- **截图：** `review-scatter-grid-zh-light-390.png`、`review-scatter-grid-webkit-zh-light-390.png`、`import-conflict-ledger-preview-light-390.png`（`capture-round5.mjs`，`language-preference-set` + 从 `public/` 起服）。
- **npm test：** **277/277** 通过（契约测试扩展 kicker + v220）。

## Half-done

- （无）

## Next (round 6+)

- fakecloud 仍缺 repo-root `functions/`（overnight clone 限制）。
- 可选：复盘 mobile 首屏同时露出第一张散点（当前 WebKit 截图为摘要 + 散点顶部）；Chromium 390 中文整页 scroll 截图。

## Known bugs / gaps

- 极矮视口 dock vs 键盘可能轻微重叠（未改 `v213`）。
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).

## npm test

```
277 pass, 0 fail (batch 2 round 5)
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
