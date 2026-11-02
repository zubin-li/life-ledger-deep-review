# Life Ledger 夜间构建报告（Batch 2 · Round 2）

在 Round 1（云 ledger 边界、心情散点）之上，本 round 补全 **习惯×支出可视化** 与 **同步冲突时的记账预览**，并做 WebKit 手机 keypad 回归截图。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **复盘 · 习惯散点** | Review → Money 卡片内「习惯完成度与当日支出」SVG 散点（高完成 sage / 低完成 coral 分区），配套 `v217-habit-scatter.css`。 |
| **冲突 · 记账预览** | 设置 → 导入与导出 → 同步冲突保留卡片：对比「保留副本」与「当前云端」的交易笔数、分类数，差异时提示下载恢复。`ledgerConflictCompare` + `v217-conflict-ledger.css`。 |
| **测试** | 274 项全绿（+2）。 |
| **CHANGELOG** | Unreleased 已记上述两项。 |

REQUIREMENTS：延续「mood vs habits vs spending 相关洞察」与「少打扰、可复盘」——在 Round 1 心情散点旁增加习惯维度，冲突场景给出可读的账本差异摘要。

---

## 明早怎么验（约 2 分钟）

1. **习惯散点：** `public` + `5291`，`?mode=local`，加载**演示工作区** → **Review** → 滚到 **Monthly spending** → 应同时看到 **Mood vs daily spending** 与 **Habit completion vs daily spending** 两张小图。对照 `.overnight/shots/review-habit-scatter-light-1440.png`。
2. **冲突预览：** 需已有云冲突保留记录（或从 Round 1 说明的 409 流程得到）→ 打开 **导入与导出** → 冲突卡片内应出现「Money merge preview / 记账合并预览」两列数字。无冲突时该区域隐藏属正常。
3. **手机 keypad：** 侧栏 **Finanzen** → 点快速录入框 → 数字键盘应露出且不与底栏严重重叠。对照 `.overnight/shots/ledger-mobile-keypad-webkit-dark-de-390.png`（德文深色 WebKit 390）。

---

## 截图

| 场景 | 文件 |
|------|------|
| 复盘 · 习惯散点（新） | `review-habit-scatter-light-1440.png` |
| 记账 · WebKit keypad（新） | `ledger-mobile-keypad-webkit-dark-de-390.png` |
| Round 1 心情散点 | `review-mood-scatter-light-1440.png` |
| 首版索引 | Batch 1 Round 14（`ledger-*`, `today-spending-*`, …） |

---

## 试过 / 未做

- **未改** `v213` padding：WebKit 390 截图中间距可接受。
- **未做** focus-vs-spend 第三张散点（留给 round 3）。
- **未截** 冲突对话框实图（overnight clone 无真 409，需注入 localStorage 或真云）。

---

## 已知问题

- fakecloud 无 `functions/`，不能代表真 CAS。
- 冲突预览仅在 `conflictRecoveryRow` 可见且有 ledger 统计时出现。

---

## npm test

**274 pass, 0 fail**（Batch 2 Round 2，实测）。
