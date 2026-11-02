# Life Ledger 夜间构建报告（Round 11）

## 本轮新增与改进

### 记账 · 引导更聪明

- 成功记**第一笔**（快速录入、德国 CSV 导入、或固定项「记一笔」）后，记账页首访横幅会 **淡出并写入 localStorage**，不必再点「知道了」。
- 手动点「知道了」与自动收起共用同一套逻辑，避免状态不一致。

### 体验（Goal 2）

- **本周目标为空：** hairline 插图带轻微 **入场动画**；下方 inline 添加框有一次 **accent 描边 pulse**，提示从输入框写第一件重要的事。
- **长期目标为空：** `pages-art` 为纯文案空状态补上 hairline 网格布局（与周目标同一套插画语言）。
- **时间轴 / 日记空状态：** `memory-empty`  polished 块同样入场动画；尊重 `motion-reduced` / `prefers-reduced-motion`。

### 文档

- README **英 / 中 / 德** 在 Finanzen/记账 bullet 中说明首访示例与首笔后引导行为。
- CHANGELOG `[Unreleased]` 记录 `v214-goals-journal.css` 与 onboarding 自动 dismiss。

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`
2. **自动 dismiss：** 清空 `state.ledger.transactions` → 侧栏 **记账** → 输入 `12,50 测试` 提交 → 横幅应消失。
3. **空周目标：** 侧栏 **本周** → 若列表为空，见插图 + 底部输入框 pulse（演示数据需先清空 `weeklyGoals` 或新 profile）。

## 截图（Round 11）

| 场景 | 路径 |
|------|------|
| 本周 · 空目标（中文） | `.overnight/shots/week-goals-empty-zh-light-1440.png` |

（Round 10 截图仍有效：记账 onboarding、复盘 sparkline 等。）

## 设计对照（REQUIREMENTS）

- **友好录入 / 示例语法：** 首笔后自动收起引导，减少重复打扰，仍保留 Today 卡片内示例行（待下一轮可考虑联动隐藏）。
- **更 crafted 的空状态：** 周目标 / 日记 / 长期目标与既有 hairline 体系一致，动效仅用 opacity/transform。

## 已知问题

- fakecloud 仍缺 `functions/`。
- Today `tw-spend-hint` 在已有支出后本就不显示；无支出时即使已记过账（非今日）仍会显示 — 符合「今日无支出」语义。
- 极矮视口 dock vs 键盘：CSS 已加，未真机复测。

## 测试

`npm test`：**268/268 通过**（Playwright 全量 capture + 新 week-empty 截图）。

## 下一轮建议

复盘/习惯 insights 动效；Today 支出 hint 与 ledger 状态更细粒度联动；Mac shell 补空状态截图。
