# Life Ledger 夜间构建报告（Batch 2 · Round 7）

在 Round 6（移动跳转药丸 + 复盘月份金额 roll）之上，本 round 让 **跳转 chip 会随滚动高亮**，并在 **点击跳转** 时短暂锁定选中态，避免被 scroll 监听抢掉。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **Scroll-spy** | 复盘 Money 面板：`IntersectionObserver` + 窗口 `scroll`，按视口约 36% 锚线判断当前散点/洞察区块，对应 chip 加 `is-active`。 |
| **点击 hold** | 点 chip 后 ~650ms 内优先保持该 chip 高亮（配合 `scrollIntoView`）。 |
| **样式** | `public/v222-review-jump-spy.css`（浅色/深色 active 药丸）；已挂 `index.html` / `sw.js`。 |
| **浏览器测试** | `tests/review-scatter.browser.test.mjs`：spy、点击、换月 `roll-host`（本地 5294 + Playwright Chromium）。 |
| **契约** | `review-scatter-grid.test.mjs` 断言 spy 函数与 v222。 |
| **CHANGELOG** | Unreleased 已记 v222 scroll-spy。 |

REQUIREMENTS：延续 owner 对 **心情 / 习惯 / 专注 vs 支出** 相关洞察的可读性——长页滚动时 chip 高亮告诉用户「当前在看哪张图」（对应 requirements 表里复盘相关性打磨）。

---

## 明早怎么验（约 2 分钟）

1. **高亮随滚动：** `cd public && python3 -m http.server 5291 --bind 127.0.0.1` → 390 宽、演示工作区、**复盘** → 慢慢滚过三张散点，观察药丸高亮是否切换。对照 `.overnight/shots/review-jump-spy-zh-light-390.png`（习惯 chip 高亮）。
2. **点击锁定：** 点 **专注**，滚动画过程中 chip 应保持「专注」高亮约半秒。
3. **德/深色：** `review-jump-spy-de-dark-390.png`（Fokus 高亮）。
4. **宽屏：** `review-jump-spy-light-1440.png`（无药丸条，回归）。
5. **自动化：** `npm test` → **278 pass, 0 fail**。

---

## 截图

| 场景 | 文件 |
|------|------|
| 中文浅色 390 · 习惯 chip 高亮（新） | `review-jump-spy-zh-light-390.png` |
| 德文深色 390 · Fokus 高亮（新） | `review-jump-spy-de-dark-390.png` |
| WebKit 390（新） | `review-jump-spy-webkit-zh-light-390.png` |
| 英文宽屏 1440（新） | `review-jump-spy-light-1440.png` |
| Round 6 | `review-scatter-jump-*.png` 等 |

---

## 试过 / 未做

- **锚线算法：** 先用「最大 intersectionRatio」→ 在 390 高三张图叠放时易误判；改为 **锚线命中** + 最近中心 fallback。
- **未做：** 记账预算设置 UI（数据模型与 demo 预算已有，空态仍提示「后续版本」）；fakecloud CAS。

---

## 已知问题

- fakecloud 不能代表真 Cloudflare 409。
- scroll-spy 在极短视口或多段 insight 同时穿过锚线时，可能短暂停在相邻 chip（可接受，点击 hold 可纠正）。

---

## npm test

**278 pass, 0 fail**（Batch 2 Round 7，实测）。
