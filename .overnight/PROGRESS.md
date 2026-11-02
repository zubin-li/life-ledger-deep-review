# Overnight progress

## Batch 3 · Round 2 — done

- **REVIEW LOW #8：** 未合并 CSS；新增 `.overnight/CSS-LAYERS.md` 说明 v210–v224 分层与加载顺序。
- **REVIEW LOW #9：** `.gitignore` 加入 `.overnight/scratch/`，删除 scratch 镜像（约 6.6MB 副本）。
- **ledger-core：** 删除重复 `isoFromDate`，demo/日期路径统一 `isoDateFromDate`。
- **Goal 2 — Today / journal：**
  - `v224-today-journal-hero.css`：hero 时段光晕、`data-daypart`、进度环微光、日记 composer `focus-within`、时间轴条目入场/悬停。
  - `renderToday()` 为今日 hero 设置 `data-daypart` / `data-viewing-today`。
  - `LifeLedgerAnalytics.reflectionStreak` + 日度时间轴 ≥2 天时显示连续记录徽章（三语）。
- **测试：** +2（`reflection-streak.test.mjs`）→ **299/299**。
- **截图：** `capture-batch3-round2.mjs`（5296）→ 记账 donut 等待非空、journal 切 Daily 模式后拍 streak；`b3r2-*` Chromium + WebKit。

## Half-done

- （无）

## Next

- 记账页 donut/treemap 截图可再 `scrollIntoView` + 等 conic-gradient 绘制（本轮 WebKit 侧栏图偏淡）。
- Goal 2：习惯卡片 / 复盘 insight 数字 roll-up 再一轮；README 三语可补 reflection streak 一句。
- fakecloud 仍缺 repo-root `functions/`。

## Known bugs / gaps

- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).
- 极矮视口 dock/键盘：已加 padding，真机若仍重叠可再调 `v213` 数值。
- Journal streak 在 demo 全量日志上数字会很大（74 天），属样例数据而非 bug。

## npm test

```
299 pass, 0 fail (batch 3 round 2)
```

## Gate result

_pending (driver appends after commit)_

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

## Prior batch (Batch 2 rounds 1–10)

终稿：289 pass；Today TDZ、预算 UI、复盘散点/spy、语言 boot 等 — 见 git 历史与 `CHANGELOG [Unreleased]`。

## Driver gate after round 10 (batch 2)
ℹ tests 289 ℹ pass 289 ℹ fail 0 

## Driver gate after round 1
ℹ tests 297 ℹ pass 297 ℹ fail 0 

## Driver gate after round 2
ℹ tests 299 ℹ pass 299 ℹ fail 0 
