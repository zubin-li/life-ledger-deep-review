# Overnight progress

## Batch 5 · Round 8 — done

- **REVIEW.md：** MED（CSV 币种）与 LOW（编辑 popover 校验）已在代码中修复；本轮未改。LOW（CSS 顺序）当前 `index.html` 已是 `pages-polish` → `v210` 末位，无需调整。
- **Goal 2 — 侧栏 / 页面切换一致性：**
  - `switchToView`：`pulseShellNav` — 顶栏 `#viewTitle.is-view-switch`、当前 `.nav-item.is-landing` 微动效（跳过首次加载）。
  - **本周** 周切换：`pulseWeekWorkspaceMotion` — 页头 + 三个 module 卡 retarget；入场 stagger 含 `#weekView.view.is-entering .module-card`。
  - **记账** 换月：`pulseLedgerMonthMotion` — 标题 h2 + 三张汇总卡 retarget（与复盘换月同级）。
  - **复盘** scatter jump chip：点击目标区块 `is-scatter-spotlight` 外框过渡。
- **文档：** `docs/SHOWCASE*` 三语增加「记账 / Money / Geld」说明（v6 虚构图尚未含记账页，发版前可补专用截图）。
- **测试：** `view-enter-selectors` +1 契约；单元 **334 pass**；浏览器 **8 pass**（并行 fakecloud 争 5296 时需先 `pkill wrangler`）。
- **截图：** `capture-batch5-round8.mjs`（5293，勿与 fakecloud 5296 并行）→ `b5r8-nav-ledger-*`、`b5r8-ledger-month-*`、`b5r8-week-nav-*`。

## Half-done

- （无）

## Next（Round 9）

- Goal 2：settings / backup 对话框开关微动效；Today hero 与 card grid 间距 rhythm 抽查。
- SHOWCASE：可选生成含侧栏「记账」的虚构 desktop/mobile PNG（2.1 发版前）。
- 可选：复盘 scatter scroll-spy 与 spotlight 在 reduced-motion 下的 aria 反馈。

## Known bugs / gaps

- 并行跑多个 fakecloud / 未清理 wrangler 时 browser 套件仍可能超时（清进程后 **8 pass**）。
- 非 preview URL 的纯 Cloudflare 首次访问不会自动 seed 记账（ intentional）。
- demo 工作区有多张 `tw-wall` 卡片，截图脚本取第一张非空墙。
- SHOWCASE 桌面图仍为 2.0 v6 集，正文已说明记账入口。

## npm test

```
334 pass, 0 fail (batch 5 round 8, unit gate)
8 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 5 · Round 7 — done

- **REVIEW.md：** 无新 HIGH/MED；历史项已在前几轮修复。
- **Goal 2 — 复盘页 filter / 指标：**
  - 切换复盘月份（‹ ›）：`pulseReviewInsightMotion` — 标题、四张指标卡 `retarget`；习惯对比表 `rv-bar` /  spark 行 /  weekday 柱与 `LifeLedgerReviewBars` 联动。
  - 周期习惯图表（指标 chip / 柱线切换）：`pulsePeriodicAnalyticsChart` + `#weeklyResistance .analytics-chart.is-retargeting` 动画。
  - 周期习惯空状态：`period-dashboard-empty` 统一 `ll-empty ll-empty-enter`。
- **Goal 2 — Today 卡片编辑：**
  - 拖拽排序 / 左右移动：`tc-drop-success` 轮廓反馈；点 **Done**：`.tc-bar.is-saved` + 完成钮 pulse。
- **测试：** `view-enter-selectors` +1 契约；单元 **333 pass**；浏览器 **8 pass**。
- **截图：** `capture-batch5-round7.mjs`（5295）→ `b5r7-review-metrics-*`、`b5r7-today-edit-*`（WebKit + Chromium）。

## Driver gate after round 5
ℹ tests 332 ℹ pass 332 ℹ fail 0 

## Driver gate after round 6
ℹ tests 332 ℹ pass 332 ℹ fail 0 

## Driver gate after round 7
ℹ tests 333 ℹ pass 333 ℹ fail 0 

## Driver gate after round 8
ℹ tests 334 ℹ pass 334 ℹ fail 0 
