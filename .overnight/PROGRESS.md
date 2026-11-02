# Overnight progress

## Batch 6 · Round 4 — done

- **复盘 · 预算洞察：** `budgetOverspendList` / `moodOverspendCategoryInsight`；超支分类汇总 + 可选「超支分类支出日 vs 其它支出日」低落心情对比（`review-ledger-budget`）。
- **Demo 样本：** `alignDemoBudgetOverspendForReview` 让 showcase 当月必有 1–2 个超预算分类（仅 demo 构建）。
- **习惯对比空状态：** 「每个习惯」表格无数据时用 `hairlineEmptyMarkup` + 三语说明（非纯 `<p>`）。
- **样式：** 四条洞察时桌面 2×2 grid；习惯面板内 empty 间距（`v210.css`）。
- **测试：** 单元 **346 pass**（+2）；浏览器 **8 pass**。
- **验收截图：** `node .overnight/capture-batch6-round4.mjs`（**5296**）→ `b6r4-review-budget-*`。

## Half-done

- （无）

## Next（Round 5+）

- Goal 2：Today hero / 侧栏缩略图仍可选；习惯复盘趋势图空状态与 inspector 区 hairline 统一。
- 超支日心情句仅在「低落占比更高」时出现；可扩展「平静/很好」侧写。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时 browser 套件可能超时（清进程后 8 pass）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- 用户自定义分类若 `nameZh` 与某默认分类相同，可能被误识别为默认并改回 English `name`（极罕见）。
- showcase 演示数据经 `alignDemoBudgetOverspendForReview` 略收紧预算上限；真实用户数据不受影响。

## npm test

```
346 pass, 0 fail (batch 6 round 4, unit gate)
8 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 6 · Round 3 — done

- **复盘记账洞察：** `spendInsightDeltaPercent`；心情/习惯/专注对比句追加「约高出 N%」；月汇总下显示 **最大支出分类**（`.review-ledger-topcat`）。
- **空状态：** 共用 `hairlineEmptyMarkup` 默认带 `ll-empty-enter`（时间轴/feed/习惯等）。
- **README 导览：** 英/中/德 Product tour 增加桌面 `08-ledger-v21` 图与一句记账说明（顶图仍为 Today v6）。
- **测试：** 单元 **344 pass**（+1）；浏览器 **8 pass**。
- **验收截图：** `node .overnight/capture-batch6-round3.mjs`（**5295**）→ `b6r3-review-ledger-*`。

## Driver gate after round 1
ℹ tests 340 ℹ pass 340 ℹ fail 0

## Driver gate after round 2
ℹ tests 343 ℹ pass 343 ℹ fail 0

## Driver gate after round 3
ℹ tests 344 ℹ pass 344 ℹ fail 0

## Driver gate after round 4
ℹ tests 346 ℹ pass 346 ℹ fail 0 
