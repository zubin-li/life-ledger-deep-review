# Life Ledger 夜间构建报告（Round 8）

## 本轮新增与改进

### 记账（Goal 1）

- **树图标签**：按格子大小与语言（中/英/德）计算可显示字符数，德文长词用 `…` 截断；tooltip 仍为全名。
- 树图文字描边略加强，浅色块上可读性更好。

### 体验（Goal 2）

- **复盘 · 本月支出摘要**：新增 **习惯完成度 × 支出** 对比行（`habitCompletionSpendInsight`）。需要当月至少 4 天既有支出又有习惯完成率差异；当前演示 seed 常只有 2 天记录，界面上可能只看到「心情」「专注」两行——下一轮会补演示日志天数。
- **骨架屏**：`paintWithSkeleton` 用于复盘热力图/习惯对比条；时间轴 **日度** _feed_ 拉照片前显示占位；本周洞察数字在重算时短暂 shimmer。
- 新样式表 `public/v212-skeleton.css`（PWA 已缓存）。

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`（演示 seed 42）
2. **记账 → 分类 → 树图**：德文界面下大格应显示如「Wohnen」（见新截图）。
3. **复盘 → 本月支出摘要**：有足月数据时会出现第三行习惯×支出；演示数据下可能只有两行。
4. **时间轴 → 日度**：切换月份时 feed 会先闪骨架再出内容（照片 I/O 慢时更明显）。
5. **本周**：切换周次时右侧四个洞察数字有极短 loading 态。

## 截图（Round 8）

| 场景 | 路径 |
|------|------|
| 德文树图标签 | `.overnight/shots/ledger-treemap-de-light-1440.png` |
| 本周洞察 | `.overnight/shots/week-insights-light-1440.png` |
| 复盘（心情+专注×支出） | `.overnight/shots/review-focus-spend-light-1440.png` |

## 设计对照（REQUIREMENTS）

- **跨维度洞察**（心情/专注/习惯 vs 支出）：习惯维度已接入核心逻辑；演示数据覆盖仍不足。
- **骨架代替跳动**、**德文 CSV/记账**：骨架本轮扩展到复盘/时间轴/本周；CSV 等既有能力未改。

## 已知问题

- 习惯×支出复盘句在短演示月下不出现（算法门槛 4 天，非 bug）。
- fakecloud 端到端仍缺 `functions/`。
- 极矮视口底部 dock vs 记账键盘：与 round 7 相同。

## 测试

`npm test`：**265/265 通过**（+treemap 截断、habitCompletionSpendInsight、sw 缓存项）。

## 下一轮建议

为 demo 多写几天 11 月 log + 支出，让复盘第三行可截图；日历模式时间轴同样加 skeleton；树图按背景色自动切换深浅字色。
