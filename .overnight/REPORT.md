# Life Ledger 夜间构建报告（Round 13 · 接近终稿）

面向明早本地浏览器验收：2.1.0（web）/ Mac 3.1.0。本 clone 无 git remote，未部署。

---

## 本轮（Round 13）

### Today · 今日支出卡片

- **有账本、今日零支出：** 副文案改为更短的「安静日」用语（中文「今日暂无新支出。」等），与「从未记过账」的首访文案区分。
- **语法示例行** 仍在一笔流水或 CSV 导入后永久隐藏（Round 12 行为不变）。

### 工程

- 全量 Playwright 截图回归（WebKit + Chromium，Mac shell 注入）：`.overnight/capture-regression.mjs` → `capture-ledger.mjs`，21 场景。
- **`npm test`：270/270 通过**（+1 契约测试）。

---

## 去哪里点

1. 本地：`http://127.0.0.1:5291/index.html?mode=local`（需 `public/` 下 `python3 -m http.server 5291 --bind 127.0.0.1`）
2. **Today · 安静日：** 仅保留「昨天一笔、今天零笔」的账本 → Today → 支出卡片应显示 `-€0.00`、**今日暂无新支出**、无灰色 `12,50 咖啡` 示例。
3. **Today · 首访：** 清空 `state.ledger.transactions` → 应见示例语法行 + 「今天还没有支出记录」类文案。
4. **记账：** 侧栏 **Money / 记账 / Finanzen** — 快速录入、分类图、热力图、预算、CSV、 recurring。
5. **复盘：** 侧栏 **Review** — 月度支出、心情/专注/习惯 vs 支出洞察、习惯完成率折线绘制动效。

---

## 截图索引（`.overnight/shots/`）

| 场景 | 文件 |
|------|------|
| 记账 · Chromium 桌面 | `ledger-chromium-light-1440.png` |
| 记账 · WebKit 深色 DE 手机 | `ledger-webkit-dark-de-390.png` |
| 记账 · Mac 窗口 | `ledger-mac-shell-light-1440.png` |
| 记账 · treemap EN/DE | `ledger-treemap-light-1440.png`, `ledger-treemap-de-light-1440.png` |
| 记账 · 手机键盘 | `ledger-mobile-keypad-light-390.png` |
| 记账 · recurring | `ledger-recurring-popover-light-1440.png`, `ledger-recurring-weekly-light-1440.png` |
| 记账 · 中文 onboarding | `ledger-onboarding-zh-light-1440.png` |
| Today · 支出（演示数据） | `today-spending-zh-390.png` |
| Today · 安静日（仅昨日流水） | `today-spending-quiet-zh-390.png` |
| 复盘 · 支出面板 | `review-ledger-light-1440.png`, `review-focus-spend-light-1440.png` |
| 复盘 · sparkline / 趋势绘制 | `review-sparks-light-1440.png`, `review-trend-draw-light-1440.png` |
| 周 · 洞察 | `week-insights-light-1440.png` |
| 周 · 空目标 | `week-goals-empty-zh-light-1440.png`, `week-goals-empty-mac-shell-1440.png` |
| 时间轴 · 日历 / 入场 | `timeline-calendar-light-1440.png`, `timeline-enter-light-1440.png` |
| 日记 · 空月 Daily | `journal-empty-zh-light-1440.png` |

---

## 2.1.0 功能摘要（Round 1–12 已交付）

- **`state.ledger`：** 账户、分类、流水、预算、 recurring；整数分 + ISO 货币；备份 v3 / 云 CAS 内嵌 JSON；撤销删除。
- **录入：** 自然语言快速字段、触摸数字键盘、chip 分类、CSV（`;` + 德式小数/日期）。
- **视图：** 月概览、donut/treemap、日历热力、uPlot 趋势、预算条、搜索筛选。
- **集成：** Today 支出卡片、复盘月度摘要与关联洞察。
- **Goal 2（部分）：** v210–v215 CSS — 页面入场、骨架屏、空状态、review/习惯 sparkline 与趋势绘制、Today/记账 onboarding。

设计笔记：`.overnight/LEDGER-DESIGN.md`。第三方记录：`THIRD_PARTY_NOTICES.md`。

---

## 设计对照（REQUIREMENTS）

- **快速记账、少打扰：** 学会语法后隐藏示例；安静日不再重复「还没有支出记录」的初访语气（Round 13）。
- **crafted 洞察：** 复盘动效与 habit sparkline 同一套 stagger/绘制语言（Round 10–12）。

---

## 已知问题

- **fakecloud：** 本 clone 无 `functions/`，`.overnight/fakecloud.sh` 无法做完整在线版 smoke。
- **极矮视口：** 记账数字键盘与底部 dock 可能仍轻微重叠（CSS padding 已加，未真机验）。
- **`mergeRemoteCloudPayload`：** 冲突 adopt 时 local-only ledger 边界 case 未改（既有 gap）。

---

## 试过但未采纳 / 留待以后

- 在 overnight clone 复制整套 Cloudflare `functions/`（违反「不改 server」且体积大）— 仍用静态 `?mode=local` 验收。
- 为 Today 安静日单独加 hairline 插画 — 信息密度已够，避免卡片过高。

---

## 测试

最后一轮 gate：**270 pass, 0 fail**（Round 13）。

Round 14 建议：终稿 REPORT、扫一遍截图、无新功能 unless 发现 regression。
