# Overnight progress

## Batch 4 · Round 4 — done

- **Goal 2 — 习惯库页：** `v210.css` round 4 — 进入页时概览三卡/筛选/列表区 stagger；筛选 pill 按压与 active 描边；workspace 选中行 accent 光晕；无匹配结果 `ll-hint-card`；`rollHabitLibraryOverview()` 概览数字 roll（与复盘 score grid 同 `LifeLedgerInteraction.rollText`）；空列表 hairline 加 `ll-empty-enter`。
- **CI / QA：** `playwright` 写入 `devDependencies`；`tests/playwright-resolve.mjs` 统一解析路径（仓库 `node_modules` 优先，保留 ll-web-cards 回退）；`.github/workflows/ci.yml` 新增 `browser` job（`playwright install` + `npm run test:browser`）；`tests/habit-library-polish.test.mjs`、`tests/playwright-resolve.test.mjs`；`cloudflare-release.test.mjs` 断言 CI 含 `test:browser`。
- **测试：** `npm test` **315 pass, 0 fail**；`npm run test:browser` **4 pass, 0 fail**。
- **文档：** `CHANGELOG [Unreleased] Changed` 习惯库抛光 + CI browser job。
- **截图：** `capture-batch4-round4.mjs`（5298）→ `b4r4-habits-overview-*`（WebKit + Chromium，概览三卡）。

## Half-done

- （无）

## Next（Round 5+）

- Goal 2：复盘页「详细指标」折叠内 score-grid 默认可发现性，或 week 页 module 空状态再抛光。
- fakecloud 浏览器完整同步/409 UI 仍可选 owner 本机 smoke。
- 可选：修正 `v210` 内 ledger/today 等 `.view.is-entering #ledgerView` 选择器（与 habits 相同，应为 `#ledgerView.view.is-entering` 或 descendant 无重复 id）— 低优先级，现有动画可能依赖 pages-858 规则。

## Known bugs / gaps

- 极矮视口 dock/键盘：规则仍在 `v210` 的 v213 段。
- Journal streak 在 demo 全量日志上数字会很大（74 天），属样例数据。
- score-grid 在折叠的「详细指标」内，用户需点开 summary 才见。
- fakecloud 未测浏览器完整同步/冲突 UI。

## npm test

```
315 pass, 0 fail (batch 4 round 4, unit gate)
4 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 4 · Round 3 — done

- **REVIEW #4（LOW）：** 将 `v211`–`v232` 共 23 个样式文件合并进 `public/v210.css`（保留 `merged from …` 注释）；`index.html` 仅保留一条 `v210.css`；`sw.js` 的 `APP_SHELL` 与 `NETWORK_FIRST_SUFFIXES` 同步精简。
- **测试：** 新增 `tests/css-consolidation.test.mjs`；`review-scatter-grid` / `ledger-chart-retarget` / `review-ledger-retarget` 改为断言 `v210.css`；`npm test` **312 pass, 0 fail**；`npm run test:browser` **4 pass, 0 fail**。
- **Goal 2：** 侧栏 active 竖条淡入；Today 习惯卡 `just-checked` 短暂 accent 环（`v210.css` round 3 段）。
- **文档：** `CHANGELOG [Unreleased] Changed`；`.overnight/CSS-LAYERS.md` 重写为单文件策略。
- **截图：** `capture-batch4-round3.mjs`（5297）→ `b4r3-today-hero-zh-light-1440-*`、`b4r3-ledger-summary-de-dark-390-*`（WebKit + Chromium）。

## Batch 4 · Round 2 — done

- **REVIEW #5（LOW）：** `npm test` 排除 `*.browser.test.mjs`；新增 `npm run test:browser`（4 个 Playwright 套件）；`tests/npm-scripts.test.mjs` 锁定脚本约定；README EN/ZH/DE 补充说明。
- **Goal 2：** `v232-ledger-entry-feedback.css` — 快速录入表单 `is-success-flash`（接 v213）、新交易行 `is-enter`、提交按钮按压；`ledger-ui.js` 跟踪 `lastHighlightTxId`（添加/复制）。
- **测试：** `npm test` **310 pass, 0 fail**；`npm run test:browser` **4 pass, 0 fail**。
- **截图：** `capture-batch4-round2.mjs`（5295）→ `b4r2-ledger-entry-zh-light-1440-*`、`b4r2-ledger-quick-de-dark-390-*`（WebKit + Chromium）。

## Batch 4 · Round 1 — done

- **REVIEW.md（Antigravity）：** 修复全部可复现 **HIGH/MED**（CloudBase ledger、多币种分类、预算去重）。
- **测试：** **313/313**（拆分前）。

## Driver gate after round 1
ℹ tests 313 ℹ pass 313 ℹ fail 0 

## Driver gate after round 2
ℹ tests 310 ℹ pass 310 ℹ fail 0 

## Driver gate after round 3
ℹ tests 312 ℹ pass 312 ℹ fail 0 

## Driver gate after round 4
ℹ tests 315 ℹ pass 315 ℹ fail 0 
