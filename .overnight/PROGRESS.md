# Overnight progress

## Batch 7 · Round 1 — done

- **REVIEW.md（Antigravity）：** 修复 **MED #1** 德式 CSV `;;` 空列导致 Betrag 列错位；**LOW #2** 导出分类名随 UI 语言；**LOW #3** `#inspectorReviewTable` 不可见时跳过习惯统计 DOM；**LOW #4** CSS 合并留待专门 refactor；**INFO #5** 本轮本地 `npm run test:browser` **8 pass**。
- **CSV 导入：** `splitGermanCsvLine` 改为引号感知分词；表头识别增加 `Buchungstag` / `buchung*`。
- **测试：** 单元 **352 pass**（+2：空列导入、本地化导出）；浏览器 **8 pass**。
- **验收截图：** `node .overnight/capture-batch7-round1.mjs`（**5295**）→ `b7r1-ledger-import-de-light-1440-chromium.png`、`b7r1-ledger-import-zh-dark-390-webkit.png`（目视 OK：CSV 导入/导出按钮与三卡图表）。

## Half-done

- （无）

## Next

- 真实 Cloudflare 环境用副本验证 ledger CAS 同步一次。
- 若希望复盘页展示 inspector 习惯明细表，需解除隐藏并设计宽屏布局。
- `v210.css` 重复 `@keyframes` / reduced-motion 块合并（REVIEW LOW #4）。
- `[Unreleased]` 条目可在 stable 发版时并入 `[2.1.0]` 或下一版本。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时 browser 套件可能超时（清进程后 8 pass）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- showcase 演示数据经 demo align 函数塑造洞察；真实用户数据不受影响。
- Demo 下 Journal reflection streak 数字偏大（历史已知）。

## npm test

```
352 pass, 0 fail (batch 7 round 1, unit gate)
8 pass, 0 fail (test:browser, round 1)
```

## Gate result

_pending (driver appends after commit)_

## Batch 6 · Round 10 — done（十轮收束）

- **文档：** `REPORT.md` 重写顶部「明早验收清单」与 Batch 6 交付摘要；`CHANGELOG` [Unreleased] 补充散点键盘 roving 说明。
- **验收截图：** `node .overnight/capture-batch6-round10.mjs`（**5296**）→ `b6r10-ledger-zh-light-1440-chromium.png`、`b6r10-today-spend-de-dark-390-webkit.png`、`b6r10-review-budget-en-light-1440-webkit.png`、`b6r10-ledger-mac-de-light-1440-webkit.png`（目视 OK：记账三卡+图表、复盘 Budget 行、Mac 壳 Finanzen）。
- **测试：** 单元 **350 pass**；浏览器 **8 pass**（本轮重跑）。
- **REVIEW.md：** 历史 MED/LOW 已在 Batch 6 R1 等轮修复；本轮无新增待修项。
- **未做（刻意）：** `#inspectorReviewTable` 仍被 `pages-858` 隐藏，合并进主复盘面板需单独任务。

## Half-done

- （无）

## Next（发版 / 主人自选）

- 真实 Cloudflare 环境用副本验证 ledger CAS 同步一次。
- 若希望复盘页展示 inspector 习惯明细表，需解除隐藏并设计宽屏布局。
- `[Unreleased]` 条目可在 stable 发版时并入 `[2.1.0]` 或下一版本。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时 browser 套件可能超时（清进程后 8 pass）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- showcase 演示数据经 demo align 函数塑造洞察；真实用户数据不受影响。
- Demo 下 Journal reflection streak 数字偏大（历史已知）。

## npm test

```
350 pass, 0 fail (batch 6 round 10, unit gate)
8 pass, 0 fail (test:browser, round 10)
```

## Gate result

_pending (driver appends after commit)_

## Batch 6 · Round 9 — done

- **Scatter 键盘：** 每张散点图 roving `tabindex`（首点 `0`、其余 `-1`）；`focusin` 显示 tip + `aria-live`；方向键/Home/End 在同图内换点；`:focus-visible` 与 hover 共用描边/放大（`v210.css`）。
- **测试：** 单元 **350 pass**（+1 selector）；浏览器 **8 pass**（散点 focus + ArrowRight 断言并入既有 review scatter 用例）。
- **验收截图：** `node .overnight/capture-batch6-round9.mjs`（**5297**）→ `b6r9-scatter-focus-*`。

## Batch 6 · Round 8 — done

- **REVIEW.md：** Round 1–2 的 MED/LOW 项此前已修（分类 `name`、CSV 引号/尾减号、滑动删除 vertical 阈值、Esc/背景、Mac ledger 步进、CNY 汇总提示）；本轮无新增 HIGH/MED 待修。
- **复盘 scatter：** mood/habit/focus 散点加大透明 hit 区 + 浮动 `.review-scatter-tip`（日期 + 支出 + 语境）；`aria-live` 同步读数；`ledger-core` 导出 `*ScatterTipLines`。
- **习惯 spark：** 复盘表格迷你条每格 `<title>`（日期 · 完成/未完成/未计划）+ hover 填色微调。
- **测试：** 单元 **349 pass**（scatter tip 断言）；浏览器 **8 pass**。
- **验收截图：** `node .overnight/capture-batch6-round8.mjs`（**5298**）→ `b6r8-scatter-tip-*`、`b6r8-habit-spark-*`。

## Batch 6 · Round 7 — done

- **REVIEW.md：** 无新 HIGH/MED；Round 1–2 审查项仍有效。
- **分类误识别：** `ledger-core` 默认分类匹配改为 `defaultSlug` + 图标/颜色一致（或 canonical 英文名）；仅 `nameZh` 碰撞的自定义分类不再被改回 Groceries（+1 单元测试）。
- **复盘 · 周/月习惯：** `#reviewPeriodHabits` 可见区卡片化 + `--enter` 交错（`v210.css`）；不再只抛光隐藏的 inspector DOM。
- **Today hero：** 切换日历时 quote/date chip 轻量 `is-day-retarget`（跳过首次加载）。
- **README：** 英/中/德 mobile 行增加第四张 `08-ledger-v21`（22% 四列）。
- **测试：** 单元 **349 pass**（+1）；浏览器 **8 pass**（首轮 fakecloud 冲突用例超时，清 wrangler 后通过）。
- **验收截图：** `node .overnight/capture-batch6-round7.mjs`（**5299**）→ `b6r7-review-period-*`、`b6r7-today-hero-roll-*`、`b6r7-ledger-de-dark-390-*`。

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

## Driver gate after round 8
ℹ tests 349 ℹ pass 349 ℹ fail 0 

## Driver gate after round 9
ℹ tests 350 ℹ pass 350 ℹ fail 0 

## Driver gate after round 10
ℹ tests 350 ℹ pass 350 ℹ fail 0 

## Driver gate after round 1
ℹ tests 352 ℹ pass 352 ℹ fail 0 
