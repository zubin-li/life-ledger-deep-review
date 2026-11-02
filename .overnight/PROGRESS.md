# Overnight progress

## Batch 6 · Round 1 — done

- **REVIEW.md（Antigravity Batch 5 收束审查）：** 已修复全部 **HIGH/MED** 与可落地的 **LOW**：
  - **MED #1** — `seedDefaultCategories` 不再把 `c.name` 改成中文/德文；`localizedCategoryName` 在 zh→en 切换时仍显示 English 默认名。
  - **MED #2** — `splitGermanCsvLine` 引号内分号不再错列；**MED #3** — 滑动删除要求 `|ΔY| < 35`。
  - **LOW #4** — `monthSummary.otherCurrencyCount` + 月汇总下方 `.ledger-fx-hint`（三语）。
  - **LOW #5** — 编辑 popover 点击 backdrop + 全部 ledger popover **Escape** 关闭。
  - **LOW #6** — `parseGermanAmount` 支持尾缀 `-`（如 `12,50-`）。
  - **LOW #7** — Mac `shell.js` `step.ledger` 绑定 `[data-ledger-prev/next]`。
  - **INFO #8** — 本环境已跑通 `npm run test:browser`（8 pass）。
- **测试：** 单元 **340 pass**（+4：分类名、CSV 引号/尾减、otherCurrencyCount）；浏览器 **8 pass**。
- **样式：** `.ledger-fx-hint` 写入 `v210.css`（保持 `v210` 为末位 stylesheet 契约）。
- **验收截图：** `node .overnight/capture-batch6-round1.mjs`（5293）→ `b6r1-ledger-*`（WebKit + Chromium）。

## Half-done

- （无）

## Next（Round 2+）

- 可选：为已在 zh 下创建过的旧分类做 `name` 回填（当前仅新 seed 保持 English canonical）。
- Goal 2：README 顶图 / Today v6 侧栏缩略图仍无记账高亮（`08-ledger-v21` 已覆盖记账页）。
- 继续抛光：Today hero、空状态、关联洞察等（按价值挑选）。

## Known bugs / gaps

- 并行 fakecloud / 未清 wrangler 时 browser 套件可能超时（清进程后 8 pass）。
- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- 曾在 UI=zh 下初始化且 `name` 已被旧逻辑写成中文的分类，切回 en 仍显示中文 `name`（需一次性修复或用户重命名）。

## npm test

```
340 pass, 0 fail (batch 6 round 1, unit gate)
8 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 5 · Round 10 — done（最后一轮）

- **REVIEW.md：** 无未修复 HIGH/MED；CSV/编辑/CSS 已在 R1 落地。
- **SHOWCASE 发版素材：** 虚构 **记账 / Money / Geld** 桌面与手机 PNG；三语 SHOWCASE + readme-locales 契约。
- **测试：** 单元 **336 pass**；浏览器 **8 pass**。

## Driver gate after round 10 (batch 5)
ℹ tests 336 ℹ pass 336 ℹ fail 0

## Driver gate after round 1
ℹ tests 340 ℹ pass 340 ℹ fail 0 
