# Life Ledger 夜间构建报告（Round 7）

## 本轮新增与改进

### 记账（Goal 1）

- **固定收支**：Recurring 区标题改为「固定收支」；新建/编辑浮层支持 **支出 + 收入** 分类（optgroup），可设 **每月** 或 **每周**（星期几）。
- 核心：`cadence` / `weekday`、`nearestWeekdayIso`、`applyRecurringTemplate` 对 weekly 生效；收入金额仍自动规范为正数。
- **树图**：较大分块内显示缩短的分类名（SVG `<text>`），小格仍仅 tooltip。
- **移动端**：记账页底部增加 safe-area + 键盘区留白，减轻与底部导航重叠。

### 体验（Goal 2）

- **复盘 · 本月支出摘要**：在 mood vs spend 下方增加 **专注 vs 支出** 一行（`focusSpendInsight`：高专注日 vs 低专注日平均支出）。
- **复盘 · 习惯洞察**：最佳连续天数数字轻微渐变强调（`motion-reduced` 时关闭）。
- 截图种子数据会写入演示用 `focusSessions`，便于看见新文案。

### 联机 / 测试

- 新增 `tests/ledger-cloud-merge.test.mjs`：验证远程 payload 无 `ledger` 时保留本机账本。
- `.overnight/fakecloud.sh` 已写好，但 **本 overnight 克隆无 `functions/`、`schema.sql`**，未能启动 wrangler；合并逻辑由单测覆盖。

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`（演示 seed 42）
2. **记账 → Recurring → 添加固定项**：切换「每周」、选收入分类（如工资）。
3. **复盘**：滚动到「本月支出摘要」，应可见心情与专注两行对比（演示数据下）。
4. **记账 → 分类图 → 树图**：大色块内应有短标签。

## 截图（Round 7）

| 场景 | 路径 |
|------|------|
| 每周 recurring 浮层 | `.overnight/shots/ledger-recurring-weekly-light-1440.png` |
| 移动端键盘区 | `.overnight/shots/ledger-mobile-keypad-light-390.png` |
| 复盘专注×支出 | `.overnight/shots/review-focus-spend-light-1440.png` |
| 树图（含标签） | `.overnight/shots/ledger-treemap-light-1440.png` |

## 设计对照（REQUIREMENTS）

- **记账 / 固定项、CSV、Today 卡片、复盘摘要**：延续；本轮补齐 **工资类 recurring** 与 **跨维度洞察**（专注×支出，对应 owner 要的 correlations 方向）。

## 已知问题

- 极矮视口下底部 dock 仍可能略挡键盘最后一行（已加 padding，未改 shell 布局）。
- fakecloud 端到端需完整 Cloudflare 版仓库里的 `functions/`。
- 树图小格标签仍省略，避免拥挤。

## 测试

`npm test`：**263/263 通过**（+income recurring、weekly、focusSpendInsight、cloud merge）。

## 下一轮建议

在有 functions 的环境跑 fakecloud；Week/Timeline 骨架加载；树图小标签对比度与德文长词截断。
