# Overnight progress

## Batch 4 · Round 1 — done

- **REVIEW.md（Antigravity）：** 修复全部可复现 **HIGH/MED**：
  - **#1 HIGH** — CloudBase `fetchCloudRemoteOutcome` 改用 `mergeRemoteCloudPayload`，旧远端无 `ledger` 时保留本地记账。
  - **#2 MED** — `categoryBreakdown` 仅统计 `txInReportingCurrency`（donut/treemap 不再把 CNY 与 EUR 1:1 相加）。
  - **#3 MED** — `mergeLedgerForBackup` 预算按 `month:categoryId` 去重（`mergeBudgetsByMonthCategory`）。
  - **#4/#5 LOW** — CSS 合并、browser 测试拆分：本轮未做（留后续 batch）。
- **测试：** `ledger-core.test.mjs` +2、`ledger-cloud-merge.test.mjs` +1 → **313/313**。
- **文档：** `CHANGELOG [Unreleased] Fixed` 三条 review 修复。
- **截图：** `capture-batch4-round1.mjs`（5294）→ `b4r1-ledger-donut-de-light-1440-*`、`b4r1-review-ledger-zh-dark-1440-*`、`b4r1-today-spending-en-light-390-*`（WebKit + Chromium）。

## Half-done

- （无）

## Next（Round 2+）

- Goal 2：Today/记账页微交互或空状态再抛光（可选 v232）；REVIEW LOW #4 CSS 合并若要做需整批改 `index.html`/`sw.js`。
- 可选：`test:browser` 与 `npm test` 分离（REVIEW #5）。
- fakecloud 浏览器完整同步/409 UI 仍可选 owner 本机 smoke。

## Known bugs / gaps

- 极矮视口 dock/键盘：已加 padding，真机若仍重叠可再调 `v213`。
- Journal streak 在 demo 全量日志上数字会很大（74 天），属样例数据而非 bug。
- score-grid 在折叠的「详细指标」内，用户需点开 summary 才见。
- 复盘 scatter 与 v216 初次渲染仍有一次 dot 动画（v231 在 `is-retargeting` 下覆盖）；可接受。
- fakecloud 未测浏览器完整同步/冲突 UI。

## npm test

```
313 pass, 0 fail (batch 4 round 1)
```

## Gate result

_pending (driver appends after commit)_

## Batch 3 · Round 10 — done（收官）

- **REVIEW.md：** 无待办 HIGH/MED（#1–#6 已在早期 batch 修复；本 round 未复现）。
- **QA — fakecloud 端到端：** 修复 `fakecloud.sh`——scratch 改到 `/tmp/life-ledger-overnight-fakecloud`，避免继承 repo `wrangler.jsonc` 的 D1 绑定；手测 GET 404 → PUT `baseRevision:0`（含 ledger）→ GET 200 revision 1。
- **文档：** `CHANGELOG [Unreleased]` 记录 fakecloud 目录修复。
- **测试：** `fakecloud-stub.test.mjs` +1 → **310/310**。
- **截图：** `capture-batch3-round10.mjs`（5296）→ `b3r10-ledger-donut-zh-light-1440-*`、`b3r10-today-spending-en-dark-390-*`。
- **收官：** `REPORT.md` 总报告已更新；版本 2.1.0 / Mac 3.1.0 与 README/CHANGELOG 已核对。

## Driver gate after round 6
ℹ tests 302 ℹ pass 302 ℹ fail 0 

## Driver gate after round 7
ℹ tests 303 ℹ pass 303 ℹ fail 0 

## Driver gate after round 8
ℹ tests 305 ℹ pass 305 ℹ fail 0 

## Driver gate after round 9
ℹ tests 309 ℹ pass 309 ℹ fail 0 

## Driver gate after round 10
ℹ tests 310 ℹ pass 310 ℹ fail 0 

## Driver gate after round 1
ℹ tests 313 ℹ pass 313 ℹ fail 0 
