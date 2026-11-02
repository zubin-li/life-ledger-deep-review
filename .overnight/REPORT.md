# Life Ledger 夜间构建报告（Round 3）

## 本轮新增与改进

### 记账页

- **触摸数字键盘**：窄屏或粗指针设备上显示 0–9、逗号、退格和 ±，便于手机快速输金额。
- **复制交易**：列表每行新增 ⧉，复制为「今天」同金额/分类的一笔（可撤销删除仍可用）。
- **月度汇总数字滚动**：切换月份或录入后，收入/支出/结余用 `LifeLedgerInteraction.rollText` 过渡（尊重 reduced-motion）。
- **快速录入**：输入框不再包在 `<label>` 里（避免 WebKit 误触），「添加」按钮仍在表单内。

### 复盘与 Today

- 复盘 **本月支出摘要** 面板已能在有 demo 数据时出现（见截图）。
- 心情 vs 支出对比逻辑抽到 **`moodSpendComparison`**，便于单测。
- Today **今日支出** 卡片金额更新时有 roll-up 动效。

### 全站抛光（起步）

- 新样式 **`public/v211-polish.css`**（在 `v210.css` 之后加载）：记账页进入错落动画、底部 safe-area、支出卡片按压反馈。

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`
2. **记账 / Money / Finanzen** — 手机宽度可见数字键盘；列表行复制/删除。
3. **今日** — 「今日支出」卡片（demo 有数据时显示本月累计）。
4. **复盘** — 向下滚动到 **Monthly spending / 本月支出摘要**。

## 截图（Round 3）

| 场景 | 路径 |
|------|------|
| 记账桌面浅色 + demo | `.overnight/shots/ledger-chromium-light-1440.png` |
| 记账手机深色德语 + 键盘 | `.overnight/shots/ledger-webkit-dark-de-390.png` |
| Today 今日支出 中文 390 | `.overnight/shots/today-spending-zh-390.png` |
| 复盘支出摘要 1440 | `.overnight/shots/review-ledger-light-1440.png` |

## 版本与文档

- 发布元数据仍为 **Web 2.1.0 / Mac 3.1.0**（Round 2 已对齐）；README 三语记账说明已有。
- `CHANGELOG.md` 的 `[Unreleased]` 记录了本轮增量。

## 已知问题

- Demo 样本在 **2026-11** 以工资收入为主，当月支出为 0，但趋势/热力图含更早月份支出 — 下一轮会调整 sample 分布。
- 移动端悬浮导航仍会部分遮挡记账区（旧壳层问题）。

## 测试

`npm test`：**253/253 通过**（含 duplicate + moodSpendComparison）。

## 下一轮建议

优先让 demo 当月支出与 Today 卡片、圆环一致，再扩展 Goal 2 到习惯/复盘图表与空状态。
