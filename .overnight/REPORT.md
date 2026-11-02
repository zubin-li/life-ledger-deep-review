# Life Ledger 夜间构建报告（Round 9）

## 本轮新增与改进

### 记账与复盘（Goal 1）

- **演示数据「看到 mid-month」**：新装/刷新演示时，seed 锚点至少到当月 **18 日**（`demoSeedAnchor`），并 **`alignDemoHabitCompletionWithSpend`** 把「低支出日 = 高习惯完成度、高支出日 = 低完成度」对齐，方便 **`habitCompletionSpendInsight`** 在复盘里出现。
- **仅演示模式**：`effectiveDemoTodayIso()` 让复盘/分析在当月月初仍统计到锚点日（不影响真实用户数据）。
- **树图**：浅色分类块自动加 `ledger-treemap-label--dim`，避免浅底黑字发虚。

### 体验（Goal 2）

- **时间轴 · 日历模式**：切换月份加载照片时，月历卡片先显示 **`ll-skeleton--calendar`**；照片到位后再重绘格子（修正先前先画格、后加载导致无照片标记的问题）。
- 演示 persona **v11**（旧演示会自动按规则升级 seed）。

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`（或清除演示后重新进入以拿到 persona 11）
2. **复盘 → 本月支出摘要**：应见 18/18 天统计（演示下），支出三行洞察（心情、专注；习惯×支出在数据方差足够时出现）。
3. **时间轴 → Calendar**：换月时月历短暂 skeleton，随后出现心情/照片标记。
4. **记账 → 树图**：浅色块标签为浅色字+描边。

## 截图（Round 9）

| 场景 | 路径 |
|------|------|
| 复盘 · 支出摘要（18 天） | `.overnight/shots/review-ledger-light-1440.png` |
| 时间轴 · 日历模式 | `.overnight/shots/timeline-calendar-light-1440.png` |
| 德文树图 | `.overnight/shots/ledger-treemap-de-light-1440.png` |

## 设计对照（REQUIREMENTS）

- **跨维度洞察**（习惯/心情/专注 vs 支出）：演示月不再只有 2 天，符合「复盘要有可读样本」。
- **骨架代替跳动**：日历月历与既有 feed/复盘面板一致。

## 已知问题

- fakecloud 仍缺 `functions/`。
- 极矮视口 dock vs 记账键盘重叠（未改）。
- 习惯×支出第三句若平均支出相等仍不显示（算法设计，非崩溃）。

## 测试

`npm test`：**268/268 通过**。

## 下一轮建议

Today/ledger 空状态与微交互；habit 复盘 sparkline 动效；mobile keypad 与 dock 间距。
