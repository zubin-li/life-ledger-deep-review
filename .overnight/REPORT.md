# Life Ledger 夜间构建报告（Round 10）

## 本轮新增与改进

### 体验（Goal 2 + 记账引导）

- **记账页 · 首访横幅：** 没有任何交易时，在快速录入区下方出现引导卡片（示例：`12,50 咖啡`、`-45 Miete gestern`），点「知道了」后写入 localStorage，不再打扰。
- **Today · 今日支出卡片：** 当天无支出时，除原有说明外增加一行 **快捷录入示例**（中/英/德）。
- **复盘 · 习惯 sparkline：** 「每个习惯」表格里每日小柱在打开复盘时有 **自下而上 stagger 动画**；减少动效时自动关闭。
- **移动端记账：** 加高页面底部留白与键盘 `scroll-margin`，减轻与底部导航 dock 的遮挡。

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`
2. **空账本引导：** 清除 localStorage 中的 ledger 交易（或新 profile），侧栏 **记账** → 见横幅与空图表占位。
3. **Today：** 今日无支出时看 **今日支出** 卡片内的灰色示例行。
4. **复盘：** 演示数据下打开 **Review**，滚动到「Habit by habit」表格，看 sparkline 列。

## 截图（Round 10）

| 场景 | 路径 |
|------|------|
| 记账 · 空账本引导（中文） | `.overnight/shots/ledger-onboarding-zh-light-1440.png` |
| 复盘 · 习惯 sparkline + 支出摘要 | `.overnight/shots/review-sparks-light-1440.png` |

## 设计对照（REQUIREMENTS）

- **更快上手记账 / 友好录入：** 空状态给出与快速录入语法一致的示例（对应 owner 对「12,50 咖啡」类输入的期望）。
- **更 crafted 的复盘：** sparkline 与既有 weekday 柱动画同一套 motion 纪律。

## 已知问题

- fakecloud 仍缺 `functions/`。
- 极矮视口 dock vs 键盘：已加 CSS，未在物理机复测。
- 首笔记账后横幅仍在，需手动点「知道了」（下一轮可自动 dismiss）。

## 测试

`npm test`：**268/268 通过**。

## 下一轮建议

Journal/goals 空状态 polish；首笔成功后自动关闭 onboarding；README 三语补 onboarding 一句。
