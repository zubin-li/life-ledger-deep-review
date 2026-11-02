# Life Ledger 夜间构建报告（Round 6）

## 本轮新增与改进

### 记账（Goal 1）

- **固定支出完整 CRUD**：记账页「Recurring / 固定支出」区右上角 **Add recurring / 添加固定项**；每条模板可 **编辑**（名称、分类、金额、每月几号 1–28、备注）、**删除**（带撤销），保留 **Post now / 记一笔**。
- 浮层与交易编辑一致：不透明、挂 `body`、`z-index` 12000，表单字段用 `div.ledger-edit-field`（避免 `<label>` 内嵌按钮的 WebKit 陷阱）。
- 核心 API：`upsertRecurringTemplate`、`removeRecurringTemplate`、`restoreRecurringTemplate`；导入 normalize 会校验分类/账户/非零金额。

### 体验（Goal 2）

- **复盘 · 习惯表**：新增 **Daily / 每日** 列 — 当月每天一条迷你色块（完成/未完成/无计划）。
- **复盘 · 星期几柱状图**：进入时自下而上 grow-in 动画（`prefers-reduced-motion` / `html.motion-reduced` 关闭）。
- **Week / Timeline**：切换页面时 feed、模式切换条、周模块卡片有 enter stagger（`v211-polish.css`）。

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`（演示样本 seed 42）
2. **记账** — 滚到 **Recurring**，点 **Add recurring** 或铅笔图标；保存后列表显示「Monthly · day N · 金额」。
3. **复盘** — 「Habit by habit」表第二列为每日色条；下方 weekday 柱图切换进复盘页时应有生长动画。

## 截图（Round 6）

| 场景 | 路径 |
|------|------|
| 新建固定支出浮层 | `.overnight/shots/ledger-recurring-popover-light-1440.png` |
| 时间轴周视图 | `.overnight/shots/timeline-enter-light-1440.png` |
| 复盘（含习惯色条） | `.overnight/shots/review-ledger-light-1440.png` |
| 记账桌面 | `.overnight/shots/ledger-chromium-light-1440.png` |

## 设计对照（REQUIREMENTS）

- **记账一级能力 / 固定支出**：满足「recurring templates」与快速记账同一状态树；删除可撤销（同习惯）。
- **复盘关联**：延续 mood vs spend；习惯每日微图补充「habits insights」方向。

## 已知问题

- 固定支出表单目前仅 **支出分类**（工资等收入 recurring 需下一轮）。
- 底部导航仍可能挡数字键盘。
- fakecloud 联机冒烟未做。

## 测试

`npm test`：**258/258 通过**（含 recurring upsert/remove/restore）。

## 下一轮建议

收入 recurring、5298 fakecloud、ledger 移动端 safe-area、树图标签或 focus×spend 洞察。
