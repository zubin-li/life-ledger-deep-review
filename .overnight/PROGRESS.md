# Overnight progress

## Batch 3 · Round 3 — done

- **Goal 2 — 数字 roll-up：**
  - `renderInsightDashboard` 三块指标用 `.insight-metric-roll` + `rollInsightMetricValues`（换月时 roll）。
  - `renderReviewInsights` 连续 streak / 最佳 streak 与完成率一并 roll。
  - Today hero `#progressNumber` 完成数在变化时 roll（保留 number-pop）。
- **Goal 2 — 习惯 / 记账视觉：**
  - `v225-roll-habit-ledger.css`：习惯卡片 `:active` 缩放、完成态轻阴影；donut 外环对比 + `is-ready` 入场（尊重 reduced-motion）。
  - `index.html` + `sw.js` 注册 v225；`CSS-LAYERS.md` 更新。
- **文档：** README EN/ZH/DE 各补一句 timeline **reflection streak**；CHANGELOG Unreleased 记 roll + v225。
- **截图：** `capture-batch3-round3.mjs`（5297）→ scroll + `is-ready` 等待；`b3r3-ledger-donut-*`、`b3r3-review-metrics-zh-*`（Chromium + WebKit）。
- **测试：** **299/299**（无新增用例；行为为 UI 层）。

## Half-done

- （无）

## Next

- WebKit 记账 donut 截图仍偏淡/空心（与 r2 同类）；可试 element screenshot 或 treemap 模式对照。
- Goal 2：复盘 score-grid、习惯 spark 条动画；空状态再统一一轮。
- fakecloud 仍缺 repo-root `functions/`。

## Known bugs / gaps

- fakecloud script expects repo-root `functions/` + `schema.sql` (missing in overnight clone).
- 极矮视口 dock/键盘：已加 padding，真机若仍重叠可再调 `v213` 数值。
- Journal streak 在 demo 全量日志上数字会很大（74 天），属样例数据而非 bug。
- WebKit `conic-gradient` donut 在 headless 截图里对比度低（运行时一般可见）。

## npm test

```
299 pass, 0 fail (batch 3 round 3)
```

## Gate result

_pending (driver appends after commit)_

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

## Batch 3 · Round 1 — done

- **REVIEW.md（Antigravity）：** 已处理全部 HIGH + MED；LOW #8（CSS 合并）、#9（scratch 镜像）留到下轮。
- **#1–#7：** 备份/恢复/快录/CSV/货币/Today -0/时区 — 见 CHANGELOG Unreleased Fixed。
- **测试：** +8 → **297/297**。

## Prior batch (Batch 2 rounds 1–10)

终稿：289 pass；Today TDZ、预算 UI、复盘散点/spy、语言 boot 等 — 见 git 历史与 `CHANGELOG [Unreleased]`。

## Driver gate after round 10 (batch 2)
ℹ tests 289 ℹ pass 289 ℹ fail 0 

## Driver gate after round 1
ℹ tests 297 ℹ pass 297 ℹ fail 0 

## Driver gate after round 2
ℹ tests 299 ℹ pass 299 ℹ fail 0 

## Driver gate after round 3
ℹ tests 299 ℹ pass 299 ℹ fail 0 
