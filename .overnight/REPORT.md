# Life Ledger 夜间构建报告（Batch 3 · Round 8）

本 round 为 **记账页分类圆环 / 树图 / 每日支出热力图** 补上与预算条同类的 **换月 stagger 动效**。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **`v230-ledger-chart-retarget.css`** | 热力图格子 scale-in（按 `--heat-i` 错开）；donut 扇区与 treemap 格子 scale + fade-in（`--seg-i` / `--cell-i`）。 |
| **`ledger-ui.js`** | 渲染时给上述容器加 `is-retargeting`；在 `requestAnimationFrame` 里对预算条、热力图、donut、treemap 调用 `LifeLedgerInteraction.retarget` 以重播动画。 |
| **测试** | `tests/ledger-chart-retarget.test.mjs` → **305 pass, 0 fail**。 |

---

## 明早怎么验（约 1 分钟）

1. 本地 demo：`?mode=local&local-preview=demo-showcase-v1` → **记账**。
2. 点月份 **‹** 或 **›**：分类圆环扇区应依次弹出；向下滚到 **每日支出**，小格应波浪式出现（系统开启「减少动态效果」时应无动画）。
3. 分类区可切 **树图**，换月时色块同样 stagger。
4. `npm test` → **305 pass, 0 fail**。

---

## 截图（Batch 3 Round 8）

| 场景 | 文件 |
|------|------|
| 中文 · 分类圆环 · 1440 light（换月后） | `b3r8-ledger-donut-zh-light-1440-chromium.png` / `-webkit.png` |
| 德文 · 每日支出热力 · 390 dark | `b3r8-ledger-heat-de-dark-390-chromium.png` / `-webkit.png` |

重拍：`.overnight/capture-batch3-round8.mjs`（端口 **5295**）。

---

## 已知问题

- fakecloud 仍缺 `functions/`，在线版本地替身未跑通。
- REVIEW.md 中的 HIGH 项（备份、收入解析、CSV 引号）已在更早 batch 修复；本 round 未改相关逻辑。

---

## 试过但未做

- 在线版 fakecloud 最小 `functions/` 拷贝（受「不碰 server migrations」约束，需只读 stub 设计）。
- uPlot 支出趋势换月过渡（destroy/recreate 已足够快，未加第二层动画）。

---

## npm test

**305 pass, 0 fail**（Batch 3 Round 8，实测）。

---

## 下次可做（Round 9–10）

- fakecloud 只读 Pages 替身（若可从 sibling 只读参考，不写入 `functions/` migrations）。
- 复盘页其它 panel 的统一 retarget 策略文档化。
- 空账本 + 真实 LOCAL_EDITION 截图补一组（避免 demo 注入干扰）。
