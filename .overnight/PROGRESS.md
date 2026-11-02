# Overnight progress

## Batch 6 · Round 7 — done

- **REVIEW.md：** 无新 HIGH/MED；Round 1–2 审查项仍有效。
- **分类误识别：** `ledger-core` 默认分类匹配改为 `defaultSlug` + 图标/颜色一致（或 canonical 英文名）；仅 `nameZh` 碰撞的自定义分类不再被改回 Groceries（+1 单元测试）。
- **复盘 · 周/月习惯：** `#reviewPeriodHabits` 可见区卡片化 + `--enter` 交错（`v210.css`）；不再只抛光隐藏的 inspector DOM。
- **Today hero：** 切换日历时 quote/date chip 轻量 `is-day-retarget`（跳过首次加载）。
- **README：** 英/中/德 mobile 行增加第四张 `08-ledger-v21`（22% 四列）。
- **测试：** 单元 **349 pass**（+1）；浏览器 **8 pass**（首轮 fakecloud 冲突用例超时，清 wrangler 后通过）。
- **验收截图：** `node .overnight/capture-batch6-round7.mjs`（**5299**）→ `b6r7-review-period-*`、`b6r7-today-hero-roll-*`、`b6r7-ledger-de-dark-390-*`。

## Half-done

- （无）

## Next（Round 8+）

- 复盘 scatter 点 hover 读数 / 习惯 spark 再抛光（可选）。
- `#inspectorReviewTable` 仍被 `pages-858` 隐藏；若需合并到主面板可单独开任务。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时 browser 套件可能超时（清进程后 8 pass）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- showcase 演示数据经 demo align 函数塑造洞察；真实用户数据不受影响。
- 旧版曾在中文界面 seed 且 `name` 被写成中文的分类，仍依赖 `repairDefaultCategoryNames`（icon/color 与默认一致时）。

## npm test

```
349 pass, 0 fail (batch 6 round 7, unit gate)
8 pass, 0 fail (test:browser, after wrangler cleanup)
```

## Gate result

_pending (driver appends after commit)_

## Batch 6 · Round 6 — done

- **REVIEW.md：** 无新 HIGH/MED；Round 1–2 已修项未复现。
- **Demo · 预算心情第二句：** 新增 `alignDemoMoodWithBudgetOverspend`（在 `alignDemoMoodWithSpend` 之后），showcase 种子数据在超支分类支出日偏向「很好/平静」，复盘 **Budget** 行可出现「很好/平静」follow-up（`.review-ledger-insight-delta`）。
- **Inspector 有数据：** `#inspectorReviewTable` 习惯分行卡片化 + `--enter` 交错（`v210.css`）；注：当前复盘页 CSS 隐藏 `.review-score-table`（`pages-858` / `#reviewView`），线上 UI 以 **Monthly review** 主面板为准，details 块为遗留 DOM。
- **README hero：** 英/中/德顶图换为 `08-ledger-v21`（2.1 记账）。
- **测试：** 单元 **348 pass**（+1）；浏览器 **8 pass**。
- **验收截图：** `node .overnight/capture-batch6-round6.mjs`（**5298**）→ `b6r6-review-budget-positive-*`（含 delta 断言）。

## Driver gate after round 1
ℹ tests 340 ℹ pass 340 ℹ fail 0

## Driver gate after round 2
ℹ tests 343 ℹ pass 343 ℹ fail 0

## Driver gate after round 3
ℹ tests 344 ℹ pass 344 ℹ fail 0

## Driver gate after round 4
ℹ tests 346 ℹ pass 346 ℹ fail 0 

## Driver gate after round 5
ℹ tests 347 ℹ pass 347 ℹ fail 0 

## Driver gate after round 6
ℹ tests 348 ℹ pass 348 ℹ fail 0 

## Driver gate after round 7
ℹ tests 349 ℹ pass 349 ℹ fail 0 
