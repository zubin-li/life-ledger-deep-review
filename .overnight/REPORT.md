# Life Ledger 夜间构建报告（Batch 3 · Round 7）

本 round **收敛复盘页双轨渲染**，并为 **记账预算进度条** 加上换月 stagger 动效。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **`reviewUsesInsightPanels`** | 有 `dailySummary` 时，`renderReviewTrendChart` 只更新热力图；`#reviewHabitCompare`  exclusively 由 `renderInsightDashboard` 填充（习惯表 + `.rv-weekdays`），避免先画 legacy `analytics-bars` 再被覆盖的浪费与节奏条 selector 混乱。 |
| **`v229-ledger-budget-bars.css`** | 预算 `--p` 条在 `.ledger-budget-list.is-retargeting` 下 stagger 展开；`animateLedgerBudgetFills` 在 `review-bars.js`。 |
| **测试** | +1 → **303 pass, 0 fail**。 |

---

## 明早怎么验（约 2 分钟）

1. `cd public && python3 -m http.server 5291 --bind 127.0.0.1`，打开 `?mode=local&local-preview=demo-showcase-v1`
2. **复盘** → 展开习惯对比区，应见 **星期柱**（`.rv-weekdays`），换月时柱高与百分比仍有 v227 脉冲（非 legacy 横条列表）。
3. **记账** → **预算进度**，点月份 ‹ ›，进度条应从 0 长到当前比例（减少 motion 时无动画）。
4. `npm test` → **303 pass, 0 fail**

---

## 截图（Batch 3 Round 7）

| 场景 | 文件 |
|------|------|
| 中文 · 复盘星期柱 · 1440 light | `b3r7-review-weekday-zh-light-1440-chromium.png` / `-webkit.png` |
| 德文 · 预算区 · 390 dark | `b3r7-ledger-budget-de-dark-390-chromium.png` / `-webkit.png` |

重拍：`.overnight/capture-batch3-round7.mjs`（端口 **5296**）。

---

## 已知问题

- fakecloud 仍缺 `functions/`。
- Round 5 截图脚本仍指向 `.analytics-bars` weekday 面板；当前 UI 以 `.rv-weekdays` 为准（Round 7 脚本已修正）。

---

## 试过但未做

- 删除未使用的 `renderHabitBars` / `renderWeekdayBars`（仍作为无 `dailySummary` 时的 fallback）。
- fakecloud stub 拷贝。

---

## npm test

**303 pass, 0 fail**（Batch 3 Round 7，实测）。

---

## 下次可做

- 记账分类 donut / 日支出热力图换月 stagger。
- 在线版 fakecloud 最小 `functions/` 替身（只读 state，不碰 migrations）。
