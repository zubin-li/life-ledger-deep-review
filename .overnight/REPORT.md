# Life Ledger 夜间构建报告（Round 12）

## 本轮新增与改进

### 记账 · Today 卡片

- **语法示例行**（`tw-spend-hint`）在账本里已有任意一笔交易后隐藏，不再只在「今日有支出」时才消失。
- 今日仍无支出时，主文案仍是「今天还没有支出记录」——只是不再重复教 `12,50 咖啡` 语法（与记账页首访横幅「记第一笔后收起」对齐）。

### 体验（Goal 2）

- **月度复盘 · 习惯完成率折线图：** 线条沿路径绘制（stroke-dashoffset），圆点依次出现。
- **复盘顶栏三块洞察数字：** 轻微 stagger 入场（opacity + translateY）。
- 动效仅 transform/opacity/stroke；`motion-reduced` 与系统减少动效时关闭。

### 文档与测试

- README **英 / 中 / 德** 说明导入 CSV 后 Today 示例也会消失。
- `tests/today-spending-hint.test.mjs` 锁定 hint 逻辑。
- **`npm test`：269/269 通过**（+1 用例）。

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`
2. **Today hint：** 清空 `state.ledger.transactions` → 侧栏 Today → 支出卡片应见灰色示例行；记一笔或导入 CSV → 刷新 Today，示例行应消失（即使今天支出为 0）。
3. **复盘动效：** 侧栏 **复盘** → 向下滚动至「Completion, day by day」折线图（需足够习惯数据；演示数据可用 Settings 里的 sample）。
4. **日记空状态：** 侧栏 **时间轴** → 子 tab **Daily**（非 Weekly）→ 清空当月 logs 可见 hairline 书本空状态。

## 截图（Round 12）

| 场景 | 路径 |
|------|------|
| Mac 窗口 · 空周目标 | `.overnight/shots/week-goals-empty-mac-shell-1440.png` |
| 时间轴 · 空月（Daily） | `.overnight/shots/journal-empty-zh-light-1440.png` |
| 复盘（含趋势区） | `.overnight/shots/review-trend-draw-light-1440.png` |

（Round 10–11 截图仍有效：记账 onboarding、week empty、review sparks 等。）

## 设计对照（REQUIREMENTS）

- **友好录入 / 少打扰：** 用户原话倾向「快速记一笔」——学会语法后 Today 与 Money 页都不再重复示例（Round 11 Money 横幅 + Round 12 Today hint）。
- **更 crafted 的洞察与动效：** 复盘趋势与 habit sparkline（Round 10）同一套 stagger/绘制语言。

## 已知问题

- fakecloud 仍缺 `functions/`。
- 极矮视口 dock vs 键盘：CSS 已加，未真机复测。
- `mergeRemoteCloudPayload` conflict adopt 边界（local ledger）未改。

## 测试

`npm test`：**269/269 通过**。

## 下一轮建议

全量 Playwright capture 回归；整理 REPORT 截图索引；若有时间可微调「有历史、今日零支出」Today 卡片 copy（非必须）。
