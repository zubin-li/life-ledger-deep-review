# Life Ledger 夜间构建报告（Round 5）

## 本轮新增与改进

### 记账（Goal 1）

- **分类视图切换**：记账页「分类」面板可在 **圆环 / 树图** 间切换；树图为自研 slice-and-dice SVG（无新依赖），颜色读取主题 accent CSS 变量。
- **图表加载感**：支出趋势在 uPlot 挂载前显示 shimmer skeleton；分类图在首帧后去掉占位圆环。
- **Demo 与复盘**：`alignDemoMoodWithSpend` 在演示数据中把「支出偏低日」标为 **很好**、「偏高日」标为 **低落**，复盘 **本月支出摘要** 会出现心情 vs 支出对比句。

### 体验与验证（Goal 2）

- **Mac 窗口**：无界面 WebKit 注入 Mac 壳层，截取记账页桌面截图（见下表）。
- **截图脚本**：`.overnight/capture-ledger.mjs` 现含 demo 心情对齐、树图模式、Mac shell 三种额外镜头。

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`（演示样本 + seed 42 账本）
2. **记账** — 分类标题右侧 **Donut / Treemap**；树图应看到多块彩色矩形（住房占大块）。
3. **复盘** — 「Monthly spending」下方应有一句 *On great-mood days you spent … vs … on low-mood days*；Mood 卡片显示 1 Good / 1 Low（11 月仅 2 天）。
4. Mac 本地窗口：`?desktop=tauri-local` 与截图一致的壳层布局。

## 截图（Round 5）

| 场景 | 路径 |
|------|------|
| 复盘支出 + 心情对比 | `.overnight/shots/review-ledger-light-1440.png` |
| 记账树图分类 | `.overnight/shots/ledger-treemap-light-1440.png` |
| Mac 壳 · 记账 | `.overnight/shots/ledger-mac-shell-light-1440.png` |
| 记账桌面浅色（圆环） | `.overnight/shots/ledger-chromium-light-1440.png` |
| 记账手机深色德语 | `.overnight/shots/ledger-webkit-dark-de-390.png` |
| Today 今日支出 中文 390 | `.overnight/shots/today-spending-zh-390.png` |

## 设计对照（REQUIREMENTS）

- **记账一级能力 / 德国 EUR / 图表**：树图满足「分类占比 alternate view」；复盘心情 vs 支出对应「correlations e.g. mood vs … spending」。
- **Demo 可展示**：月初仍有圆环/热力图/Today 支出（Round 4）+ 复盘洞察（Round 5）。

## 已知问题

- 底部悬浮导航仍会部分遮挡记账数字键盘（旧壳层）。
- 树图块上无文字标签（仅 `title` tooltip），小屏可读性一般。
- 固定支出仍只能「记一笔」，不能编辑周期/金额（下一轮）。

## 测试

`npm test`：**257/257 通过**（含 `alignDemoMoodWithSpend`）。

## 下一轮建议

固定支出编辑浮层、Week/Timeline 页面过渡动画、复盘习惯微图表、fakecloud 本地冒烟。
