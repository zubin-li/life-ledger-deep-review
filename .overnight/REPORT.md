# Life Ledger 夜间构建报告（Round 4）

## 本轮新增与改进

### 记账（Goal 1）

- **Demo 数据修复**：月初（如 11 月 2 日）不再只有工资、支出为 0；自动补齐当月超市/交通/咖啡/房租，并写入两条 **固定支出** 模板（房租、订阅）。
- **编辑交易**：列表 ✎ 打开不透明浮层，可改金额、日期、备注；保存走 `updateTransaction`。
- **固定支出**：新区块列出模板，**记一笔 / Post now** 按当天日期入账。
- **移动端**：交易行左滑触发删除（与 × 相同，可撤销）。

### Today 与复盘（Goal 2）

- **今日支出** 卡片「本月累计」改为显示支出绝对值（不再出现正负号混乱）。
- **Today 卡片** 进入页时有错落 `pageCardIn` 动画（尊重 reduced-motion）。
- **复盘** 习惯完成率进度条宽度有过渡动画。
- **记账空状态** 虚线框样式更明确。

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`（加载 demo 样本后）
2. **记账 / Money** — 看 11 月圆环、热力图、固定支出、编辑/复制/删除。
3. **今日** — 「今日支出」应显示非零金额与本月累计。
4. **复盘** — 习惯表格进度条在切换月份重绘时有动画。

## 截图（Round 4，覆盖 Round 3 同名文件）

| 场景 | 路径 |
|------|------|
| 记账桌面浅色 + demo（有圆环与 -€995 支出） | `.overnight/shots/ledger-chromium-light-1440.png` |
| 记账手机深色德语 | `.overnight/shots/ledger-webkit-dark-de-390.png` |
| Today 今日支出 中文 390 | `.overnight/shots/today-spending-zh-390.png` |
| 复盘支出摘要 1440 | `.overnight/shots/review-ledger-light-1440.png` |

## 设计对照（REQUIREMENTS）

- 用户要的 **记账一级能力**：快速录入、分类图、热力图、预算、CSV、Today 卡片、复盘摘要 — 本轮 mainly 补齐 **demo 与编辑/固定支出 UX**，与「德国 EUR + 快速录入」一致。

## 已知问题

- 底部悬浮导航仍会部分遮挡记账数字键盘（旧壳层，未改）。
- Demo 若把房租记在「今天」，Today 卡片当日数字会偏大 — 属演示数据选择，非逻辑错误。

## 测试

`npm test`：**256/256 通过**。

## 下一轮建议

Mac 窗口壳截图、复盘心情 vs 支出 demo 种子、ledger 图表 skeleton、可选 treemap。
