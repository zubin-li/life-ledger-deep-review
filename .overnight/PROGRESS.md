# Overnight progress

## Batch 10 · Round 2 — done

- **REVIEW.md：** Round 1 已清 LOW #1 / #3；**LOW #2** reduced-motion 大合并仍 **2.2**（未动）。
- **Goal 2 抛光：** **长期（Horizon）** 无阶段/无计划空态接入 hairline 插画（`horizon-phase-empty.svg`、`horizon-plans-quiet.svg`）、`llEmptyReveal`、主 CTA **开始第一个阶段**；计划/长期事项区横向 quiet 空态。侧栏在 **时间轴**、**记账** 前增加轻分隔线（`v210.css`）。
- **文档：** README **EN/ZH/DE** 补充极大增幅（>500%）显示 **金额差**；`CHANGELOG [Unreleased]` 长期空态 + 侧栏条目。
- **回归：** `tests/longrange-empty.browser.test.mjs`（Chromium + WebKit，CTA 打开 `#horizonDialog`）。
- **截图：** `node .overnight/capture-batch10-round2.mjs`（**5293**）→ `b10r2-longrange-empty-*`（zh/de × light/dark × 1440/390）。
- **测试：** `npm test` **384**；`npm run test:browser` **27**（+2 longrange）。

## Half-done

- （无）

## Next

- Batch 10 Round 3：Goal 2 其它页（习惯库空态 / Today hero 节奏）或 fakecloud 并行稳定性（5298 争用）。
- **2.2** `v210.css` reduced-motion 物理合并（仍低优先级）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500%）仍用 **+N%** 文案（ intentional）。
- 旧 demo 缓存未 re-seed 时，Today **心情×支出** hint 可能不显示（需清除 preview 存储或 `demo-reset=1`）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- `npm run test:browser` 与 fakecloud / 多静态服并行时偶发失败 — 重跑通常绿（Round 2 曾见 fakecloud-online / review-scatter 各 1 次）。

## npm test

```
384 pass, 0 fail (batch 10 round 2, unit gate)
27 pass, 0 fail (test:browser, batch 10 round 2)
```

## Gate result

_pending (driver appends after commit)_

## Batch 10 · Round 1 — done

- **REVIEW.md（Batch 9 终审）：** 无 HIGH/MED。**LOW #1** 已修：`syncBackupPreferencesToRuntime` 去掉冗余 `explicitLang === "true"` 分支（与冷启动一致）。**LOW #2** `v210.css` reduced-motion 大合并仍 **2.2**。**LOW #3** 已修：`preferSpendCompareAmountCaption` 在对比期 **≥ €15** 且增幅 **> 500%** 时改显示金额差（Today / 本周 / 复盘共用）；`SPEND_COMPARE_EXTREME_PERCENT = 500`。
- **回归：** `ledger-core.test.mjs` +1 用例；`today-spending.browser.test.mjs` +1（极端 surge 不出现 **999%**）。
- **截图：** `node .overnight/capture-batch10-round1.mjs`（**5292**）→ `b10r1-today-spend-amount-delta-zh-*`（较昨日多 **€480.00**）。
- **文档：** `CHANGELOG [Unreleased]` 两条 Changed。
- **测试：** `npm test` **384**；`npm run test:browser` **25**。

## Batch 9 · Round 10 — done (终稿)

- **REVIEW.md：** MED #1 已在 `temporalSpendChangePercent` 修复（Round 7+）；LOW #2 reduced-motion 合并仍 **2.2**；LOW #3 语言三元已无冗余 `=== "true"` 分支。
- **发布整理：** `CHANGELOG` 将 Batch 9 的 `[Unreleased]` 条目并入 **`[2.1.0]`**；`.github/releases/v2.1.0.md` 补充 spend 对比 / Today 洞察 / 时间轴 UX / QA 计数。
- **截图：** `node .overnight/capture-batch9-round10.mjs`（**5291**）→ `b9r10-release-*`（Today 洞察/支出、复盘 Money、DE 移动记账）。
- **清单：** `.overnight/ROUND10-CHECKLIST.md`（Batch 9）全部勾选。
- **测试：** `npm test` **384**；`npm run test:browser` **24**。
- **Batch 9 状态：** **10/10 完成**；`v210.css` reduced-motion 物理合并留 **2.2**。

## Driver gate after round 1
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 2
ℹ tests 384 ℹ pass 384 ℹ fail 0 
