# Overnight progress

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

## Half-done

- （无）

## Next（Round 8）

- Goal 2：侧栏切换全局一致性抽查（ledger / week / longrange 与 review 同级 polish）。
- 文档：SHOWCASE / README 虚构截图是否含记账侧栏（发版前核对）。
- 可选：复盘 scatter jump chip 切换时的 section 高亮过渡。

## Known bugs / gaps

- 并行跑多个 fakecloud / 未清理 wrangler 时 browser 套件仍可能超时（清进程后 **8 pass**）。
- 非 preview URL 的纯 Cloudflare 首次访问不会自动 seed 记账（ intentional）。
- demo 工作区有多张 `tw-wall` 卡片，截图脚本取第一张非空墙。

## npm test

```
333 pass, 0 fail (batch 5 round 7, unit gate)
8 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 5 · Round 6 — done

- **REVIEW.md：** 无新 HIGH/MED；历史项已在 Round 1 修复，本轮未改。
- **Goal 2 — 时间轴 calendar / feed / 列表：**
  - 切到 **日历** 模式：`#timelineView.is-calendar-entering`，月格 stagger（`llCalDayIn`）。
  - **定位月份** 下拉变更：`#journalFeedPane.is-filter-entering`，标题区 + select 微反馈；列表行仍走既有 `llFeedRowIn`。
  - **继续向前翻**：仅新增行带 `journal-feed-entry--append`，`data-feed-motion=append` 避免旧行重播动画。
  - **日历侧栏筛选**（全部 / 照片 / 笔记）：`timeline-entry-list--entering` 行 stagger（`llTimelineRowIn`）。
  - **Composer：** 非 workspace 也应用 focus-within 外框；`data-pending` 保存态轻 pulse。
- **测试：** 扩展 `journal-mode-switch` / `view-enter-selectors` 契约；单元 **332 pass**；浏览器 **8 pass**。
- **截图：** `capture-batch5-round6.mjs`（5294）→ `b5r6-calendar-*`、`b5r6-feed-filter-*`（WebKit + Chromium）。

## Half-done

- （无）

## Next（Round 7）

- Goal 2：Month 复盘页 filter / 指标切换微动效；习惯洞察 chart 动画（若仍有跳变）。
- Goal 2：Today 卡片 reorder 成功反馈、空状态 hairline 统一抽查。
- 发版前：SHOWCASE / README 虚构截图是否含记账侧栏（可选核对）。

## Known bugs / gaps

- 并行跑多个 fakecloud / 未清理 wrangler 时 browser 套件仍可能超时（清进程后 **8 pass**）。
- 非 preview URL 的纯 Cloudflare 首次访问不会自动 seed 记账（ intentional）。
- demo 工作区有多张 `tw-wall` 卡片，截图脚本取第一张非空墙。

## npm test

```
332 pass, 0 fail (batch 5 round 6, unit gate)
8 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 5 · Round 5 — done

- **REVIEW.md：** 无新项；历史 MED/LOW 已在 Batch 5 Round 1 修完。
- **Goal 2 — 时间轴 feed / Photos：**
  - 日度 ↔ 周度 ↔ 月度切换时 `#journalFeed` 每次渲染前先 `ll-paint-host--ready` 移除，行入场可重播；`#journalFeedPane.is-mode-entering` 让页头在模式切换时 `pageCardIn`。
  - **Photos** 模式：`#journalPhotoLibrary.journal-library--ready` + 月份区块 / 缩略图 stagger（`llPhotoTileIn`）；与既有 FLIP 并存；空状态同样标记 ready。
  - **Today 照片墙：** 非空卡片 stage 底部内阴影 vignette，圆点/导航 z-index 抬高。
- **测试：** 新增 `journal-mode-switch.test.mjs`（2）；`view-enter-selectors` 断言 round 5 CSS；单元 **332 pass**；浏览器 **8 pass**。
- **截图：** `capture-batch5-round5.mjs`（5297）→ `b5r5-photos-zh-light-1440-*`、`b5r5-photos-de-dark-390-*`、`b5r5-feed-weeks-en-light-1440-*`、`b5r5-today-wall-zh-light-1440-*`（WebKit + Chromium）。

## Driver gate after round 5
ℹ tests 332 ℹ pass 332 ℹ fail 0 

## Driver gate after round 6
ℹ tests 332 ℹ pass 332 ℹ fail 0 

## Driver gate after round 7
ℹ tests 333 ℹ pass 333 ℹ fail 0 
