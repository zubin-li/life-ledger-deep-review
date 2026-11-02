# Overnight progress

## Batch 5 · Round 5 — done

- **REVIEW.md：** 无新项；历史 MED/LOW 已在 Batch 5 Round 1 修完。
- **Goal 2 — 时间轴 feed / Photos：**
  - 日度 ↔ 周度 ↔ 月度切换时 `#journalFeed` 每次渲染前先 `ll-paint-host--ready` 移除，行入场可重播；`#journalFeedPane.is-mode-entering` 让页头在模式切换时 `pageCardIn`。
  - **Photos** 模式：`#journalPhotoLibrary.journal-library--ready` + 月份区块 / 缩略图 stagger（`llPhotoTileIn`）；与既有 FLIP 并存；空状态同样标记 ready。
  - **Today 照片墙：** 非空卡片 stage 底部内阴影 vignette，圆点/导航 z-index 抬高。
- **测试：** 新增 `journal-mode-switch.test.mjs`（2）；`view-enter-selectors` 断言 round 5 CSS；单元 **332 pass**；浏览器 **8 pass**。
- **截图：** `capture-batch5-round5.mjs`（5297）→ `b5r5-photos-zh-light-1440-*`、`b5r5-photos-de-dark-390-*`、`b5r5-feed-weeks-en-light-1440-*`、`b5r5-today-wall-zh-light-1440-*`（WebKit + Chromium）。

## Half-done

- （无）

## Next（Round 6）

- Goal 2：日记 **calendar** 模式入场或 `#journalFeed` 加载更多时的 stagger；Month 视图切换 filter 时的微动效。
- Goal 2：Journal composer / timeline entry list polish。
- 可选：SHOWCASE 虚构截图是否含记账侧栏（发版前核对）。

## Known bugs / gaps

- 并行跑多个 fakecloud / 未清理 wrangler 时 browser 套件仍可能超时（清进程后 **8 pass**）。
- 非 preview URL 的纯 Cloudflare 首次访问不会自动 seed 记账（ intentional）。
- demo 工作区有多张 `tw-wall` 卡片，截图脚本取第一张非空墙。

## npm test

```
332 pass, 0 fail (batch 5 round 5, unit gate)
8 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 5 · Round 4 — done

- **REVIEW.md：** 无新项；Round 1–3 已消化 Antigravity 列表。
- **Goal 2 — pages-858 审计：** `.view.is-entering #weekView …` 类规则在 `is-entering` 加在 `#weekView` 自身时仍有效（后代选择器）；`#weekView .module-card` 已由 v210 更高特异性覆盖。复盘指标由 `#reviewView.view.is-entering` 覆盖 pages-858 的 `#reviewView .insight-metrics` 规则。
- **Goal 2 — 习惯 / 本周入场：** `#habitsView.view.is-entering` 分段（标题区 → 提醒卡 → 三统计卡 → 筛选 → 列表）；`#weekView.view.is-entering` 增加页头 + `#weekCalendar` 七列日历 stagger（200–410ms，接在 module-card 之后）。移除旧的 `.view.is-entering #habitLibraryOverview` 块，避免与新区重复。
- **测试：** `view-enter-selectors.test.mjs` 断言 habits/week 选择器；单元 **330 pass**；浏览器 **8 pass**（清 wrangler/5296 竞态后）。
- **截图：** `capture-batch5-round4.mjs`（5296）→ `b5r4-habits-zh-light-1440-*`、`b5r4-habits-de-dark-390-*`、`b5r4-week-en-light-1440-*`、`b5r4-week-zh-dark-390-*`（WebKit + Chromium）。

## Driver gate after round 4
ℹ tests 330 ℹ pass 330 ℹ fail 0 

## Driver gate after round 5
ℹ tests 332 ℹ pass 332 ℹ fail 0 
