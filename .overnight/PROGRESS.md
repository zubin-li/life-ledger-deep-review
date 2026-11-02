# Overnight progress

## Batch 6 · Round 2 — done

- **分类名回填：** `repairDefaultCategoryNames` + `defaultDefForCategory` 在 `normalize` 时把旧版误写成 zh/de 的默认分类 `name` 恢复为 English canonical，并补全 `nameZh`/`nameDe`（+3 单元测试）。
- **Today 支出卡：** 近 7 日支出迷你折线（`dailyExpenseSeries` / `renderMiniSpendSparklineSvg`）；修复「今日为 0 但本周有数据」时被 `is-empty` CSS 误藏 sparkline 的问题。
- **测试：** 单元 **343 pass**（+3）；浏览器 **8 pass**。
- **验收截图：** `node .overnight/capture-batch6-round2.mjs`（**5294**）→ `b6r2-today-spend-*`、`b6r2-ledger-de-dark-390-*`。

## Half-done

- （无）

## Next（Round 3+）

- Goal 2：README 顶图 / Today v6 侧栏缩略图仍无记账高亮（可选换 hero 或补拍侧栏）。
- 继续抛光：复盘/Today 关联洞察文案、全局空状态、习惯图表等。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时 browser 套件可能超时（清进程后 8 pass）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- 用户自定义分类若 `nameZh` 与某默认分类相同，可能被误识别为默认并改回 English `name`（极罕见）。

## npm test

```
343 pass, 0 fail (batch 6 round 2, unit gate)
8 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 6 · Round 1 — done

- **REVIEW.md（Antigravity Batch 5 收束审查）：** 已修复全部 **HIGH/MED** 与可落地的 **LOW**（分类名 seed、CSV 引号、滑动删除 ΔY、外币 hint、popover Esc、尾缀 `-` 金额、Mac ledger 换月、browser 8 pass）。
- **测试：** 单元 **340 pass**；浏览器 **8 pass**。
- **截图：** `b6r1-ledger-*`（5293）。

## Driver gate after round 1
ℹ tests 340 ℹ pass 340 ℹ fail 0

## Driver gate after round 2
ℹ tests 343 ℹ pass 343 ℹ fail 0 
