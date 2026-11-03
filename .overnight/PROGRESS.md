# Overnight progress

## Batch 11 · Round 3 — done

- **REVIEW.md：** 无新复审；Round 1–2 项已关闭。
- **Demo 洞察：** `DEMO_INSIGHT_ALIGN_VERSION` + `needsDemoInsightAlign` / `realignDemoInsights`（`demo-workspace.js`）；`bootApplication` / 预览重置后 `maybeRealignDemoInsights()`，旧 demo 缓存无需 `demo-reset=1` 即可恢复 Today 心情×支出 / 习惯×支出 hint。
- **Goal 2：** Today 洞察 hint 软 chip 背景 + 深色主题边框；`today-mood-spend-hint` 补 `llEmptyReveal` 与 reduced-motion 关闭。
- **QA：** `tests/demo-workspace.test.mjs` 新增 `realignDemoInsights` 回归；`npm test` **393** pass / 0 fail；`npm run test:browser` **40** pass / 0 fail。
- **截图：** `node .overnight/capture-batch11-round3.mjs`（**5293**）→ `b11r3-today-mood-hint-stale-realigned-zh-light-1440-chromium.png`、`b11r3-today-habit-hint-chip-de-dark-390-webkit.png`；目视 chip 与 demo Today 洞察无回归。

## Half-done

- （无）

## Next

- Batch 11 若继续：`v210.css` reduced-motion 物理合并（2.2）；或 fakecloud 离线记账 smoke。
- Owner 验收：带旧 `life-ledger-preview-demo-showcase-v1` 的浏览器 → 刷新后 Today 应出现心情×支出 hint（无需手动 reset）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500%）仍用 **+N%** 文案（ intentional）。
- 旧 demo 若 `persona` 仍低于 `DEMO_PERSONA_VERSION` 仍会全量 re-seed（非 insightAlign 路径）；极低概率需 `?demo-reset=1`。
- 旧 demo 缓存未 re-seed 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。
- 日历模式下侧栏筛选条默认 CSS 隐藏；筛选无匹配 quiet 条主要在 **照片** 等布局侧栏可见时出现（逻辑已就绪）。

## npm test

```
393 pass, 0 fail (batch 11 round 3, unit gate)
40 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 11 · Round 2 — done

- **REVIEW.md：** Round 1 已消化全部 HIGH/MED/LOW（#4 CSS 合并仍 **2.2**）；本轮无新复审项。
- **QA：** `tests/service-worker.test.mjs` 新增 `NETWORK_FIRST_SUFFIXES` 含 ledger 脚本断言；`tests/ledger-quick-entry.browser.test.mjs`（WebKit 390）覆盖空账本快速录入 → `is-enter` 行。
- **Goal 2 / a11y：** 快速录入解析失败时 `#ledgerQuickInput` 设置 `aria-invalid`（配合既有 `is-error`）。
- **全量浏览器：** `npm run test:browser` **40** pass / 0 fail（~114s，含新套件）。
- **截图：** `node .overnight/capture-batch11-round2.mjs`（**5292**）→ `b11r2-ledger-quick-entry-zh-light-390-webkit.png`、`b11r2-ledger-demo-de-dark-1440-chromium.png`；目视录入行与 de 深色 demo 无回归。
- **文档：** `CHANGELOG [Unreleased]` 补充 QA + aria-invalid。

## Driver gate after round 1
ℹ tests 391 ℹ pass 391 ℹ fail 0 

## Driver gate after round 2
ℹ tests 392 ℹ pass 392 ℹ fail 0 

## Driver gate after round 3
ℹ tests 393 ℹ pass 393 ℹ fail 0 
