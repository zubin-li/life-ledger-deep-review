# Life Ledger 夜间构建报告（Batch 3 · Round 4）

本 round 解决 **WebKit headless 记账圆环空白**，并打磨 **复盘 score-grid** 与习惯 spark 动画。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **SVG 分类圆环** | 不再用 `conic-gradient` div；`ledger-core` 导出 `breakdownDonutSlices` + `annularSectorPath`，`ledger-ui` 渲染 `<svg class="ledger-donut-svg">`。WebKit 截图与真机一致。 |
| **复盘 score-grid** | 每个习惯卡片带 `score-rate` / `score-count`，换月 `rollText`；`score-card--enter` 交错入场；无习惯时 hairline 空状态（三语）。 |
| **Spark 动画** | `v226`：`rv-spark-grow`（与 v213 延迟变量 `--spark-i` 配合）。 |
| **测试** | `ledger-core.test.mjs` +1 → **300 pass, 0 fail**。 |

---

## 明早怎么验（约 3 分钟）

1. `cd public && python3 -m http.server 5291 --bind 127.0.0.1`
2. **记账** — 打开「Finanzen/记账」，分类 **Ring** 应看到彩色圆环（非空环）。
3. **复盘** — 展开底部 **「详细指标 / Detailed metrics」**，看 score 卡片；用标题栏 ‹ › 换月，观察百分比与完成数是否 roll。
4. `npm test` → **300 pass, 0 fail**

---

## 截图（Batch 3 Round 4）

| 场景 | 文件 |
|------|------|
| 德文 · 记账 SVG 圆环 · 1440 light | `b3r4-ledger-donut-de-light-1440-chromium.png` / `-webkit.png` |
| 中文 · score-grid（展开详细指标）· 1440 light | `b3r4-review-score-zh-light-1440-chromium.png` / `-webkit.png` |

重拍：`.overnight/capture-batch3-round4.mjs`（端口 **5298**）。

**对比：** Round 3 WebKit donut 几乎空心；Round 4 同一引擎已填色（见上表 webkit 文件）。

---

## 已知问题

- fakecloud 仍缺 `functions/`。
- score-grid 仍在折叠的 `#reviewDetailedMetrics` 内 — 需点「详细指标」才见（历史布局，未改默认展开）。
- Demo streak / 样例数据数字偏大属预期。

---

## 试过但未做

- 默认展开「详细指标」details（避免打扰习惯用户，留待产品决定）。
- treemap 模式单独截图（SVG 圆环已足够验证 WebKit）。

---

## npm test

**300 pass, 0 fail**（Batch 3 Round 4，实测）。

---

## 下次可做

- 复盘 bar-chart / weekday 柱动画；空状态 `ll-empty-enter` 再统一。
- fakecloud 或 stub `functions/` 供在线版本地验收。
