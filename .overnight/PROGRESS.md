# Overnight progress

## Batch 8 · Round 1 — done

- **REVIEW.md（Antigravity Batch 7）：** 无 HIGH/MED；**LOW #2** 已修 — 周固定项按 ISO 周判定是否已记，`recurringPendingForMonth` 不再因一笔同分类同金额就整月消待记；**Alle buchen / 全部记入账** 对 weekly 会补记当月所有已过去的发生日。**LOW #1** CSS reduced-motion 合并仍留 2.2。
- **逻辑：** `ledger-core.js` — `weeklyOccurrenceDatesInMonth`、`transactionFulfillsRecurringOccurrence`、`isoWeekKeyFromIso`；`applyAllRecurringPending` 周 cadence 逐周补账。
- **测试：** `ledger-core.test.mjs` +2（weekly 待记 / legacy 仅清一周）；`npm test` **360**；`npm run test:browser` **17**（首轮 fakecloud 并行偶发 flake，单跑与全量第二轮均绿）。
- **文档：** CHANGELOG `[Unreleased]` 一条 Fixed；截图 `node .overnight/capture-batch8-round1.mjs`（**5291**）→ `b8r1-ledger-recurring-*`。

## Half-done

- （无）

## Next

- Batch 8 Round 2：2.2 候选 reduced-motion 单表；或 Goal 2 小抛光（空状态 / Today 节奏）；demo 习惯名英文化（已知 gap）。
- 并行 browser 套件时若 fakecloud 失败，先 `pkill -f 'http.server 529'` / 5298 wrangler 再跑。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- 周固定项 UI 仍按「模板条数」计数（1 条 weekly = 1 项待记），非「剩余周数」。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并。

## npm test

```
360 pass, 0 fail (batch 8 round 1, unit gate)
17 pass, 0 fail (test:browser, batch 8 round 1)
```

## Gate result

_pending (driver appends after commit)_

## Batch 7 · Round 10 — done (final)

- **CHANGELOG：** `[Unreleased]` 清空为 “Nothing yet”；`[2.1.0]` 合并 Goal 1/2 与 Batch 7 要点（固定待记三处联动、CSV/同步修复、Goal 2 动效摘要），去掉与稳定段重复的 120+ 行 `[Unreleased]` 堆叠；保留 2.0.5 及以下历史版本条目。
- **文档：** `.overnight/CSS-LAYERS.md` 注明 REVIEW #4 reduced-motion 大表合并延至 2.2。
- **QA：** `npm test` **358**；`npm run test:browser` **17**（全套件回归）；截图 `node .overnight/capture-batch7-round10.mjs`（**5290**）→ `b7r10-ship-*`（Today 支出卡 / 记账月视图 / 复盘 Money / de 移动待记横幅）。
- **未做（已知）：** `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（风险/收益比）；demo 习惯名仍为英文。

## Driver gate after round 1
ℹ tests 352 ℹ pass 352 ℹ fail 0 

## Driver gate after round 2
ℹ tests 353 ℹ pass 353 ℹ fail 0 

## Driver gate after round 3
ℹ tests 353 ℹ pass 353 ℹ fail 0 

## Driver gate after round 4
ℹ tests 353 ℹ pass 353 ℹ fail 0 

## Driver gate after round 5
ℹ tests 354 ℹ pass 354 ℹ fail 0 

## Driver gate after round 6
ℹ tests 355 ℹ pass 355 ℹ fail 0 

## Driver gate after round 7
ℹ tests 357 ℹ pass 357 ℹ fail 0 

## Driver gate after round 8
ℹ tests 358 ℹ pass 358 ℹ fail 0 

## Driver gate after round 9
ℹ tests 358 ℹ pass 358 ℹ fail 0 

## Driver gate after round 10
ℹ tests 358 ℹ pass 358 ℹ fail 0 

## Driver gate after round 10
ℹ tests 358 ℹ pass 358 ℹ fail 0 

## Driver gate after round 1
ℹ tests 360 ℹ pass 360 ℹ fail 0 
