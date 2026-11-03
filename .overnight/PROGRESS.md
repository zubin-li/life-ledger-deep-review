# Overnight progress

## Batch 7 · Round 2 — done

- **REVIEW.md：** Round 1 已修 MED/LOW #1–#3；本轮 **LOW #4 部分**：删除重复的 `rvSparkGrow` 块，保留统一 `rv-spark-grow` + `prefers-reduced-motion: no-preference` 规则。
- **记账 UX：** `previewGermanBankCsv` + 导入前 `confirm`（可导入/跳过行数）；toast 含跳过行；桌面 **←/→** 换月、**/** 聚焦 `#ledgerFilter`（popover 打开时不抢键）。
- **文档：** README EN/ZH/DE 记账 bullet 补充快捷键与 CSV 预览；`CHANGELOG` [Unreleased]。
- **测试：** 单元 **353 pass**（+1 preview）；浏览器 **8 pass**。
- **验收截图：** `node .overnight/capture-batch7-round2.mjs`（**5294**）→ `b7r2-ledger-filter-en-light-1440-chromium.png`（REWE 筛选）、`b7r2-ledger-month-de-dark-390-webkit.png`（← 切到 Oktober 2026）。

## Half-done

- （无）

## Next

- `v210.css` 其余重复 `@media (prefers-reduced-motion)` 合并（REVIEW LOW #4 剩余）。
- 真实 Cloudflare 环境用副本验证 ledger CAS 同步一次（fakecloud 浏览器套件已覆盖 merge preview + seed）。
- 若希望复盘页展示 inspector 习惯明细表，需解除隐藏并设计宽屏布局。
- `[Unreleased]` 条目可在 stable 发版时并入 `[2.1.0]` 或下一版本。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时 browser 套件可能超时（清进程后 8 pass）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- showcase 演示数据经 demo align 函数塑造洞察；真实用户数据不受影响。
- Demo 下 Journal reflection streak 数字偏大（历史已知）。
- CSV 导入确认使用 `window.confirm`（原生对话框，无自定义 UI）。

## npm test

```
353 pass, 0 fail (batch 7 round 2, unit gate)
8 pass, 0 fail (test:browser, round 2)
```

## Gate result

_pending (driver appends after commit)_

## Batch 7 · Round 1 — done

- **REVIEW.md（Antigravity）：** 修复 **MED #1** 德式 CSV `;;` 空列导致 Betrag 列错位；**LOW #2** 导出分类名随 UI 语言；**LOW #3** `#inspectorReviewTable` 不可见时跳过习惯统计 DOM；**LOW #4** CSS 合并留待专门 refactor；**INFO #5** 本轮本地 `npm run test:browser` **8 pass**。
- **CSV 导入：** `splitGermanCsvLine` 改为引号感知分词；表头识别增加 `Buchungstag` / `buchung*`。
- **测试：** 单元 **352 pass**（+2：空列导入、本地化导出）；浏览器 **8 pass**。
- **验收截图：** `node .overnight/capture-batch7-round1.mjs`（**5295**）→ `b7r1-ledger-import-de-light-1440-chromium.png`、`b7r1-ledger-import-zh-dark-390-webkit.png`（目视 OK：CSV 导入/导出按钮与三卡图表）。

## Driver gate after round 1
ℹ tests 352 ℹ pass 352 ℹ fail 0 

## Driver gate after round 2
ℹ tests 353 ℹ pass 353 ℹ fail 0 
