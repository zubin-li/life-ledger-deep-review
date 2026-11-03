# Overnight progress

## Batch 11 · Round 4 — done

- **REVIEW.md：** 无新复审；Round 1–3 已关闭 HIGH/MED/LOW（#4 CSS 合并仍 **2.2**）。
- **fakecloud：** `fakecloud-preview-ledger.browser.test.mjs` 在 Today/周/复盘断言后打开 **记账**，校验交易行、月支出摘要、分类 viz。
- **离线 PWA：** 新增 `ledger-offline-pwa.browser.test.mjs`（Chromium 5295）— 预缓存 `ledger-core`/`ledger-ui` 后断网刷新，Money 页仍可渲染 demo 交易。
- **Goal 2：** 快速录入成功时提交钮 `ledgerQuickSubmitPop` 微反馈（`v210.css`，含 reduced-motion）。
- **QA：** `npm test` **393** pass / 0 fail；`npm run test:browser` **41** pass / 0 fail（+1 套件）。
- **截图：** `node .overnight/capture-batch11-round4.mjs`（**5294**）→ `b11r4-ledger-charts-zh-light-1440-chromium.png`、`b11r4-ledger-quick-success-de-dark-390-webkit.png`；目视 donut/热力/趋势与 de 深色新交易行无回归。

## Half-done

- （无）

## Next

- Batch 11 若继续：`v210.css` reduced-motion 物理合并（2.2）；Mac shell 注入 fakecloud 记账 smoke；复盘 scatter 空态再抛光。
- Owner 验收：DevTools Offline + 已访问过的 PWA → **记账** 应可用（对照 Round 4 离线测试）。

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
393 pass, 0 fail (batch 11 round 4, unit gate)
41 pass, 0 fail (npm run test:browser, full suite)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 11 · Round 3 — done

- **REVIEW.md：** 无新复审；Round 1–2 项已关闭。
- **Demo 洞察：** `DEMO_INSIGHT_ALIGN_VERSION` + `needsDemoInsightAlign` / `realignDemoInsights`（`demo-workspace.js`）；`bootApplication` / 预览重置后 `maybeRealignDemoInsights()`，旧 demo 缓存无需 `demo-reset=1` 即可恢复 Today 心情×支出 / 习惯×支出 hint。
- **Goal 2：** Today 洞察 hint 软 chip 背景 + 深色主题边框；`today-mood-spend-hint` 补 `llEmptyReveal` 与 reduced-motion 关闭。
- **QA：** `tests/demo-workspace.test.mjs` 新增 `realignDemoInsights` 回归；`npm test` **393** pass / 0 fail；`npm run test:browser` **40** pass / 0 fail。
- **截图：** `node .overnight/capture-batch11-round3.mjs`（**5293**）→ `b11r3-today-mood-hint-stale-realigned-zh-light-1440-chromium.png`、`b11r3-today-habit-hint-chip-de-dark-390-webkit.png`；目视 chip 与 demo Today 洞察无回归。

## Driver gate after round 1
ℹ tests 391 ℹ pass 391 ℹ fail 0 

## Driver gate after round 2
ℹ tests 392 ℹ pass 392 ℹ fail 0 

## Driver gate after round 3
ℹ tests 393 ℹ pass 393 ℹ fail 0 

## Driver gate after round 4
ℹ tests 393 ℹ pass 393 ℹ fail 0 
