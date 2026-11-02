# Overnight progress

## Batch 3 · Round 1 — done

- **REVIEW.md（Antigravity）：** 已处理全部 HIGH + MED；LOW #8（CSS 合并）、#9（scratch 镜像）留到下轮。
- **#1 HIGH — 备份导出丢 ledger：** `scopedState` 经 `LifeLedgerLedger.scopeLedgerForBackup` 写入 `result.ledger`（按导出范围过滤交易）。
- **#2 HIGH — 收入被记成餐饮：** `parseQuickEntry` 在匹配到收入分类名（如「工资」）时保留正数；编辑弹层改用 `parseAmountToken` + 分类 kind，不再经快录字符串回环。
- **#3 HIGH — 德 CSV 引号金额：** `parseGermanAmount` 剥离 `"`/`'`。
- **#4 MED — EUR/CNY 混加：** `monthSummary` / `dailySpendHeatmap` / `spendingTodayMinor` 只统计 `defaultCurrency`。
- **#5 MED — 部分恢复丢 ledger：** `mergeBackupData` → `mergeLedgerForBackup`（按 id 合并交易/分类/账户/预算/固定项）。
- **#6 MED — Today `-0,00`：** 零支出日用 `formatMoney(0, …)`，避免 `-0`。
- **#7 LOW — 快录 UTC 日期：** 默认日用 `isoDateFromDate`（本地）。
- **测试：** +8（ledger-core 6 + backup-ledger 3）→ **297/297**。
- **截图：** `capture-batch3-round1.mjs`（5295）→ `b3r1-spending-zero-de-390-*`、`b3r1-ledger-overview-zh-light-1440-*`（Chromium + WebKit）。

## Half-done

- （无）

## Next

- REVIEW LOW：合并 `v211`–`v223` CSS（或文档化为何分文件）；`.overnight/scratch/` 进 `.gitignore` 并清理已提交副本。
- 记账页 demo 截图可改为 `waitForSelector` 等图表挂载后再拍。
- Goal 2：journal / Today hero 再打磨一轮。

## Known bugs / gaps

- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).
- 极矮视口 dock/键盘：已加 padding，真机若仍重叠可再调 `v213` 数值。

## npm test

```
297 pass, 0 fail (batch 3 round 1)
```

## Gate result

_pending (driver appends after commit)_

## Prior batch (Batch 2 rounds 1–10)

终稿：289 pass；Today TDZ、预算 UI、复盘散点/spy、语言 boot 等 — 见 git 历史与 `CHANGELOG [Unreleased]`。

## Driver gate after round 10 (batch 2)
ℹ tests 289 ℹ pass 289 ℹ fail 0 

## Driver gate after round 1
ℹ tests 297 ℹ pass 297 ℹ fail 0 
