# Overnight progress

## Round 14 — done (final)

- **终稿：** `CHANGELOG.md` 将 Round 5–13 的 Unreleased 条目并入 `[2.1.0]`，`Unreleased` 留空占位。
- **验收：** 全量 Playwright 截图回归 21 场景重跑通过（`capture-regression.mjs`）；目视 `today-spending-quiet-zh-390.png` — 安静日文案、无语法 hint、`-€0.00` 正常。
- **npm test：** 270/270 通过（本 round 未改产品代码）。
- **REPORT.md** 更新为 Round 14 终稿（14 轮摘要、明日点击路径、已知 gap）。

## Round 13 — done

- **Today 支出 · 安静日 copy：** 账本已有流水但当日为零时，副文案改为 `spendingEmptyQuiet`（中/英/德），不再与「从未记账」共用 `spendingEmpty`；语法 hint 逻辑不变。
- **测试：** `tests/today-spending-hint.test.mjs` +1 用例（quiet copy 契约）。
- **文档：** README EN/ZH/DE、CHANGELOG Unreleased 一行。
- **截图回归：** `capture-regression.mjs` 包装 `capture-ledger.mjs`；全量 21 张重拍通过；新增 `today-spending-quiet-zh-390.png`。
- **npm test：** 270/270 通过。

## Half-done

- （无 — 夜间 scope 在此 clone 内已收束。）

## Known bugs / gaps

- `mergeRemoteCloudPayload` conflict adopt edge case (local ledger) — unchanged.
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).
- 极矮视口 dock vs 键盘仍可能轻微重叠（CSS padding 已加，未真机验证）。

## npm test

```
270 pass, 0 fail (round 14)
```

## Gate result

_pending (driver appends after commit)_

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
