# Overnight progress

## Batch 9 · Round 6 — done

- **REVIEW.md：** 无新 HIGH/MED（Round 1–5 修复保持）。
- **Goal 2 polish：** `renderJournalFeed` — 周/月同步筛选不再摘掉 **`ll-paint-host--ready`**（消除空白闪一下）；日度筛选改 **`ll-paint-host--stale`** 保留旧 feed 直至照片拉完。复盘 **`#reviewHabitCompare`** hairline 空态 **`hydrateHairlineMounts` + `ll-empty`**；习惯筛选无匹配 **`ll-empty-enter`**；`v210.css` Batch 9 r6 样式。
- **回归：** `journal-mode-switch.test.mjs` 更新 async ready 语义；`habit-library-polish.test.mjs` +3；新 **`journal-feed-filter.browser.test.mjs`**。
- **截图：** `node .overnight/capture-batch9-round6.mjs`（**5296**）→ `b9r6-habit-filter-empty-*`、`b9r6-review-habit-empty-*`。
- **文档：** CHANGELOG `[Unreleased]` Changed + QA 一条。
- **测试：** `npm test` **381**；`npm run test:browser` **22**（+1 journal filter）。
- **未做：** `v210.css` reduced-motion 单表合并仍 **2.2**。

## Half-done

- （无）

## Next

- Batch 9 Round 7：日度 feed 筛选 stale 叠层可选 skeleton；Today/习惯更多关联洞察；或 reduced-motion 合并仍 2.2。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 对比基线 ≥ €15 且增幅极大时仍显示 **+999%**（封顶，非金额句）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- `npm run test:browser` 与 fakecloud 并行时偶发超时 — 先清 529x / wrangler（Round 5 已加固 fakecloud-online 等待 cloud）。

## npm test

```
381 pass, 0 fail (batch 9 round 6, unit gate)
22 pass, 0 fail (test:browser, batch 9 round 6)
```

## Gate result

_pending (driver appends after commit)_

## Batch 9 · Round 5 — done

- **REVIEW.md：** 无新 HIGH/MED（Round 1–4 修复保持）。
- **Goal 2 polish：** `#journalFeed` 增加 **`ll-paint-host`**（时间轴异步读照片时 skeleton）；feed / 日历列表 / 复盘 inspector 空状态补 **`ll-empty`** + `v210.css` 间距；`fakecloud-online` 烟测 **`localStorage.clear()` + 等 cloud** 消除并行 flake。
- **fakecloud 烟测：** `fakecloud-preview-ledger.browser.test.mjs` 扩展 **复盘** `#reviewLedgerSpendHint`（无四位数 +%、含较上月同期类文案）。
- **浏览器回归：** 新 `journal-feed-paint.browser.test.mjs`（paint host ready、无残留 skeleton）。
- **截图：** `node .overnight/capture-batch9-round5.mjs`（**5295**）→ `b9r5-journal-feed-*`、`b9r5-review-inspector-empty-*`。
- **文档：** CHANGELOG `[Unreleased]` Changed + QA 三条。
- **测试：** `npm test` **379**；`npm run test:browser` **21**（+1 journal paint；fakecloud-online 稳定化）。
- **未做：** `v210.css` reduced-motion 单表合并仍 **2.2**。

## Driver gate after round 1
ℹ tests 376 ℹ pass 376 ℹ fail 0 

## Driver gate after round 2
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 3
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 4
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 5
ℹ tests 379 ℹ pass 379 ℹ fail 0 

## Driver gate after round 6
ℹ tests 381 ℹ pass 381 ℹ fail 0 
