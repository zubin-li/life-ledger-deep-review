# Overnight progress

## Round 12 — done

- **Today 支出 hint：** `ledger.transactions.length > 0` 时隐藏「试试：12,50 咖啡」类语法提示（与记账页 onboarding 一致：首笔或 CSV 导入后即不再打扰）；仍保留「今天还没有支出」文案当今日为零。
- **Goal 2 · 复盘动效：** `v215-review-trend.css` — 习惯完成率折线 **stroke 绘制** + 数据点 stagger；`#reviewInsights` 三块指标 **入场 stagger**；`renderInsightTrend` 内 dashoffset 动画，尊重 `motion-reduced` / `prefers-reduced-motion`。
- **测试：** 新增 `tests/today-spending-hint.test.mjs`（源码契约）。
- **文档：** README EN/ZH/DE 记账 bullet 补「导入后 Today 示例亦隐藏」；CHANGELOG Unreleased 一行。
- **PWA：** `v215-review-trend.css` → `index.html` + `sw.js` APP_SHELL。
- **截图：** Mac shell 空周目标、日记时间轴空状态（Daily timeline 模式）、复盘页（review-trend-draw）；修正 capture 脚本 `emptyJournalMonth` 需点 `[data-journal-mode="timeline"]`。

## Half-done

- fakecloud Pages dev smoke — still no `functions/` in overnight clone.
- 极矮视口 dock vs 键盘仍可能轻微重叠（已加 padding，未在真机验证）。

## Next round priorities (round 13–14)

1. 最后一轮：全量 capture 回归、REPORT 截图表对齐、任何 MED 视觉毛刺。
2. 可选：Today 卡片在「有历史无今日支出」时是否改 copy（当前语义正确，仅 hint 已藏）。
3. fakecloud 仍低优先级（缺 functions）。

## Known bugs / gaps

- `mergeRemoteCloudPayload` conflict adopt edge case (local ledger) — unchanged.
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing here).

## npm test

```
269 pass, 0 fail (round 12)
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
