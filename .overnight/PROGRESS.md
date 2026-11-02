# Overnight progress

## Batch 2 · Round 1 — done

- **REVIEW.md：** Antigravity 审查为空（`status: failed`，无 HIGH/MED 条目），无可修复项。
- **云同步：** `resolvePendingConflictOnRemoteGet` 在 remote 无 `ledger` 时传入冲突备份里的 `pending.backup.data.ledger`，与 409 adopt 行为一致。
- **复盘洞察：** 月度 Money 面板增加 **心情 vs 当日支出** 散点图（`moodSpendScatter` / `renderMoodSpendScatterSvg`，`v216-mood-scatter.css`）；PWA `APP_SHELL` 已登记。
- **文档：** README 三语 Mac 下载段落改为 **3.1.0**；`CHANGELOG` Unreleased 记录上述改动。
- **截图：** `.overnight/shots/review-mood-scatter-light-1440.png`（Chromium 1440，演示数据）。
- **npm test：** **272/272** 通过（+2：scatter 契约、pending GET merge 结构断言）。

## Half-done

- （无）

## Next (round 2+)

- 复盘：习惯完成度 vs 支出的迷你相关图（与散点同一视觉语言）。
- 云冲突 UI：ledger 专用合并预览（仍仅 state JSON，不改 `functions/`）。
- 手机记账 keypad vs 底部 dock：真机/更矮视口截图验证，必要时再调 `v213` padding。
- fakecloud 仍缺 repo-root `functions/`（overnight clone 限制不变）。

## Known bugs / gaps

- 极矮视口 dock vs 键盘可能轻微重叠（未在本 round 改 CSS）。
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).

## npm test

```
272 pass, 0 fail (batch 2 round 1)
```

## Gate result

_pending (driver appends after commit)_

## Prior batch (rounds 1–14)

终稿见 git 历史：`CHANGELOG [2.1.0]`、记账与 Goal 2 打磨、270 项测试、21 张回归截图。Last prior gate: round 14 — 270 pass, 0 fail.

## Driver gate after round 1
ℹ tests 248 ℹ pass 248 ℹ fail 0 

## Driver gate after round 2
ℹ tests 251 ℹ pass 251 ℹ fail 0 

## Driver gate after round 3
ℹ tests 253 ℹ pass 253 ℹ fail 0 

## Driver gate after round 4
ℹ tests 256 ℹ pass 256 ℹ fail 0 

## Driver gate after round 5
ℹ tests 257 ℹ pass 257 ℹ fail 0 

## Driver gate after round 6
ℹ tests 258 ℹ pass 258 ℹ fail 0 

## Driver gate after round 7
ℹ tests 263 ℹ pass 263 ℹ fail 0 

## Driver gate after round 8
ℹ tests 265 ℹ pass 265 ℹ fail 0 

## Driver gate after round 9
ℹ tests 268 ℹ pass 268 ℹ fail 0 

## Driver gate after round 10
ℹ tests 268 ℹ pass 268 ℹ fail 0 

## Driver gate after round 11
ℹ tests 268 ℹ pass 268 ℹ fail 0 

## Driver gate after round 12
ℹ tests 269 ℹ pass 269 ℹ fail 0 

## Driver gate after round 13
ℹ tests 270 ℹ pass 270 ℹ fail 0 

## Driver gate after round 14
ℹ tests 270 ℹ pass 270 ℹ fail 0 

## Driver gate after round 1
ℹ tests 272 ℹ pass 272 ℹ fail 0 
