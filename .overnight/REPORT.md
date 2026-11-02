# Life Ledger 夜间构建报告（Batch 2 · Round 1）

在 **2.1.0 / Mac 3.1.0** 首版交付基础上的第二轮迭代。本 round 聚焦：**云同步 ledger 边界**、**复盘相关图加深**、文档与 PWA 缓存对齐。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **云同步修复** | 待处理冲突在下次 GET 采纳 remote 时，若 payload 无 `ledger`，保留冲突备份中的本地账本（此前会丢 ledger）。 |
| **复盘 · 心情散点** | Review → Money 月度摘要内新增「心情与当日支出」散点（绿/蓝/橙 = 很好/平静/低落），与原有平均支出文案并存。 |
| **样式** | `public/v216-mood-scatter.css`（入场 dot 动画，`prefers-reduced-motion` 关闭）。 |
| **README** | Mac 下载说明由 3.0.0 更正为 **3.1.0**（EN/ZH/DE）。 |
| **测试** | 272 项全绿（+2）。 |

REQUIREMENTS 呼应：「crafted 洞察 / mood vs spending 相关」——在 Round 10–12 文案洞察之上增加可扫一眼的散点分布（`.hermes/requirements/REQUIREMENTS.md` 中「少打扰、可复盘」方向）。

---

## 明早怎么验（新增 1 分钟）

1. 照旧：`public` 起 5291，`?mode=local`，加载**演示工作区**（或自有含 ledger + 心情的数据）。
2. **侧栏 → Review（复盘）**，滚到 **Money / 本月支出** 卡片。
3. 应看到散点图 + 图例（Good / Calm / Low）及原有「great-mood vs low-mood 平均支出」句子。
4. 截图对照：`.overnight/shots/review-mood-scatter-light-1440.png`。

记账、Today 支出、CSV 等首版能力不变；全量回归仍可用 `node .overnight/capture-regression.mjs`（需先起 5291）。

---

## 截图

| 场景 | 文件 |
|------|------|
| 复盘 · 心情散点（新） | `review-mood-scatter-light-1440.png` |
| 首版 21 张索引 | 见 Batch 1 Round 14 报告（`ledger-*`, `today-spending-*`, …） |

---

## REVIEW.md

Antigravity 输出为空，未产生 HIGH/MED 待办。

---

## 已知问题（未改）

- fakecloud 在本 clone 无 `functions/`，不能代表真 Cloudflare CAS。
- 极矮视口下记账数字键盘与底部 dock 可能轻微重叠。

---

## 下一 round 建议

- 习惯完成度 vs 支出散点或双轴条。
- ledger 云冲突合并预览 UI（只读 diff，仍不写 server）。
- keypad 390 宽 WebKit 截图 + padding 微调。

---

## npm test

**272 pass, 0 fail**（Batch 2 Round 1，实测）。
