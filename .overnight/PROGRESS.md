# Overnight progress

## Batch 4 · Round 3 — done

- **REVIEW #4（LOW）：** 将 `v211`–`v232` 共 23 个样式文件合并进 `public/v210.css`（保留 `merged from …` 注释）；`index.html` 仅保留一条 `v210.css`；`sw.js` 的 `APP_SHELL` 与 `NETWORK_FIRST_SUFFIXES` 同步精简。
- **测试：** 新增 `tests/css-consolidation.test.mjs`；`review-scatter-grid` / `ledger-chart-retarget` / `review-ledger-retarget` 改为断言 `v210.css`；`npm test` **312 pass, 0 fail**；`npm run test:browser` **4 pass, 0 fail**。
- **Goal 2：** 侧栏 active 竖条淡入；Today 习惯卡 `just-checked` 短暂 accent 环（`v210.css` round 3 段）。
- **文档：** `CHANGELOG [Unreleased] Changed`；`.overnight/CSS-LAYERS.md` 重写为单文件策略。
- **截图：** `capture-batch4-round3.mjs`（5297）→ `b4r3-today-hero-zh-light-1440-*`、`b4r3-ledger-summary-de-dark-390-*`（WebKit + Chromium）。

## Half-done

- （无）

## Next（Round 4+）

- Goal 2：本周/习惯库页再抛光，或复盘页空状态文案。
- 可选：GitHub Actions 增加 `npm run test:browser` job。
- fakecloud 浏览器完整同步/409 UI 仍可选 owner 本机 smoke。

## Known bugs / gaps

- 极矮视口 dock/键盘：合并后规则仍在 `v210` 的 v213 段，真机若仍重叠可再调。
- Journal streak 在 demo 全量日志上数字会很大（74 天），属样例数据而非 bug。
- score-grid 在折叠的「详细指标」内，用户需点开 summary 才见。
- 复盘 scatter 与 v216 初次渲染仍有一次 dot 动画（v231 在 `is-retargeting` 下覆盖）；可接受。
- fakecloud 未测浏览器完整同步/冲突 UI。

## npm test

```
312 pass, 0 fail (batch 4 round 3, unit gate)
4 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 4 · Round 2 — done

- **REVIEW #5（LOW）：** `npm test` 排除 `*.browser.test.mjs`；新增 `npm run test:browser`（4 个 Playwright 套件）；`tests/npm-scripts.test.mjs` 锁定脚本约定；README EN/ZH/DE 补充说明。
- **Goal 2：** `v232-ledger-entry-feedback.css` — 快速录入表单 `is-success-flash`（接 v213）、新交易行 `is-enter`、提交按钮按压；`ledger-ui.js` 跟踪 `lastHighlightTxId`（添加/复制）。
- **测试：** `npm test` **310 pass, 0 fail**；`npm run test:browser` **4 pass, 0 fail**（合计 314 用例，与拆分前 313+1 新脚本测试一致）。
- **截图：** `capture-batch4-round2.mjs`（5295）→ `b4r2-ledger-entry-zh-light-1440-*`、`b4r2-ledger-quick-de-dark-390-*`（WebKit + Chromium）。

## Batch 4 · Round 1 — done

- **REVIEW.md（Antigravity）：** 修复全部可复现 **HIGH/MED**：
  - **#1 HIGH** — CloudBase `fetchCloudRemoteOutcome` 改用 `mergeRemoteCloudPayload`，旧远端无 `ledger` 时保留本地记账。
  - **#2 MED** — `categoryBreakdown` 仅统计 `txInReportingCurrency`（donut/treemap 不再把 CNY 与 EUR 1:1 相加）。
  - **#3 MED** — `mergeLedgerForBackup` 预算按 `month:categoryId` 去重（`mergeBudgetsByMonthCategory`）。
  - **#4/#5 LOW** — CSS 合并、browser 测试拆分：#5 已在 Round 2 完成；#4 留后续 batch。
- **测试：** `ledger-core.test.mjs` +2、`ledger-cloud-merge.test.mjs` +1 → **313/313**（拆分前）。
- **文档：** `CHANGELOG [Unreleased] Fixed` 三条 review 修复。
- **截图：** `capture-batch4-round1.mjs`（5294）→ `b4r1-ledger-donut-de-light-1440-*`、`b4r1-review-ledger-zh-dark-1440-*`、`b4r1-today-spending-en-light-390-*`（WebKit + Chromium）。

## Driver gate after round 1
ℹ tests 313 ℹ pass 313 ℹ fail 0 

## Driver gate after round 2
ℹ tests 310 ℹ pass 310 ℹ fail 0 

## Driver gate after round 3
ℹ tests 312 ℹ pass 312 ℹ fail 0 
