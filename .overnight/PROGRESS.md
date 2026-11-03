# Overnight progress

## Batch 11 · Round 2 — done

- **REVIEW.md：** Round 1 已消化全部 HIGH/MED/LOW（#4 CSS 合并仍 **2.2**）；本轮无新复审项。
- **QA：** `tests/service-worker.test.mjs` 新增 `NETWORK_FIRST_SUFFIXES` 含 ledger 脚本断言；`tests/ledger-quick-entry.browser.test.mjs`（WebKit 390）覆盖空账本快速录入 → `is-enter` 行。
- **Goal 2 / a11y：** 快速录入解析失败时 `#ledgerQuickInput` 设置 `aria-invalid`（配合既有 `is-error`）。
- **全量浏览器：** `npm run test:browser` **40** pass / 0 fail（~114s，含新套件）。
- **截图：** `node .overnight/capture-batch11-round2.mjs`（**5292**）→ `b11r2-ledger-quick-entry-zh-light-390-webkit.png`、`b11r2-ledger-demo-de-dark-1440-chromium.png`；目视录入行与 de 深色 demo 无回归。
- **文档：** `CHANGELOG [Unreleased]` 补充 QA + aria-invalid。

## Half-done

- （无）

## Next

- Batch 11 若继续：`v210.css` reduced-motion 物理合并（2.2 候选）；或 Goal 2 其它页微抛光。
- Owner 验收：离线 PWA 记账页（Round 1 SW 修复）+ 全量 `npm test` / `npm run test:browser`。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500%）仍用 **+N%** 文案（ intentional）。
- 旧 demo 缓存未 re-seed 时，Today **心情×支出** hint 可能不显示（需清除 preview 存储或 `demo-reset=1`）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。
- 日历模式下侧栏筛选条默认 CSS 隐藏；筛选无匹配 quiet 条主要在 **照片** 等布局侧栏可见时出现（逻辑已就绪）。

## npm test

```
392 pass, 0 fail (batch 11 round 2, unit gate)
40 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 11 · Round 1 — done

- **REVIEW.md（Batch 10 终稿复审）：** **HIGH #1** 已修复 — `public/sw.js` 的 `NETWORK_FIRST_SUFFIXES` 追加 `"/ledger-core.js"`、`"/ledger-ui.js"`；`tests/service-worker.test.mjs` 断言离线 PWA 会 intercept 这两份脚本。**MED #2** 已修复 — `parseGermanAmount` 与 `parseAmountToken` 一致，仅在有 `,` 与 `.` 并存时去掉千分位 `.`；`tests/ledger-core.test.mjs` 覆盖 `12.50-` 行。**LOW #3** 已修复 — `formatMoney` 归一化 `-0`。**LOW #4** CSS 物理合并仍 **2.2**（未动）。**INFO #5** 浏览器套件在本环境可跑（本轮 `ledger-csv-import-confirm.browser.test.mjs` 通过）。
- **文档：** `CHANGELOG [Unreleased]` 三条 Fixed。
- **测试：** `npm test` **391** pass / 0 fail；单跑 CSV 确认 browser test 1 pass。

## Driver gate after round 1
ℹ tests 391 ℹ pass 391 ℹ fail 0 

## Driver gate after round 2
ℹ tests 392 ℹ pass 392 ℹ fail 0 
