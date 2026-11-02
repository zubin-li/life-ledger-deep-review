# Life Ledger 夜间构建总报告（Batch 5 · Round 7 起）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

---

## 本轮（Batch 5 · Round 7）改动

| 项目 | 说明 |
|------|------|
| **复盘换月** | 侧栏 **复盘** → 点标题旁 **‹ ›**：四张指标卡与习惯对比区应再次轻微入场；数字仍走 rollText。 |
| **周期习惯图** | 复盘页下方 **选择指标** chip 或柱/线切换：SVG 柱/线/点 retarget 动画。 |
| **Today 编辑** | **Edit cards** → 拖一张卡或 **←/→** 见虚线高亮；点 **Done** 底栏与按钮短暂 pulse。 |
| **空状态** | 周期习惯无数据时用统一 `ll-empty-enter`。 |
| **测试** | 单元 **333 pass**；浏览器 **8 pass**。 |
| **截图** | `b5r7-review-metrics-*`、`b5r7-today-edit-*`。重拍：`node .overnight/capture-batch5-round7.mjs`（5295）。 |

**验收提示：** 复盘在 10 月 ↔ 9 月间切换看指标卡；在 chip 间点选看小图动画；Today 编辑卡片后点 Done 看底栏反馈。

---

## 上一轮（Batch 5 · Round 6）改动

| 项目 | 说明 |
|------|------|
| **日历模式入场** | 时间轴 → **日历**：月历格短暂 scale 入场（`is-calendar-entering`）。 |
| **Feed 月份筛选** | 日/周/月 feed 顶栏 **定位月份** 变更时，标题与下拉有轻微反馈，列表刷新。 |
| **加载更多** | **继续向前翻** 只动画新出现的行，已读条目不再整页重闪。 |
| **日历侧栏筛选** | 全部 / 照片 / 笔记 切换时，左侧日列表行轻微横向入场。 |
| **Composer** | 日历布局下快速笔记框 focus 外框与保存中 pulse（与 workspace 一致）。 |
| **测试** | 单元 **332 pass**；浏览器 **8 pass**。 |
| **截图** | `b5r6-calendar-*`、`b5r6-feed-filter-*`。重拍：`node .overnight/capture-batch5-round6.mjs`（5294）。 |

**验收提示：** 时间轴点 **日历** 看月格依次弹出；在日度 feed 改 **Go to month** 或点 **Read further back**；日历模式下切换 **All / Photos / Notes** 看左侧列表；在 composer 输入应见保存态闪烁。

---

## 上一轮（Batch 5 · Round 5）改动

| 项目 | 说明 |
|------|------|
| **时间轴 feed 切换** | 侧栏 **时间轴** → 点 **周度 / 月度 / 日度**：列表行应再次轻微入场；页头标题区在切换时有 `pageCardIn`。 |
| **Photos 模式** | 同一页点 **照片记忆**：按月分组的缩略图网格 stagger 入场（仍保留照片 FLIP）。 |
| **Today 照片墙** | 有内容的墙卡片底部轻微暗角，层次更清晰。 |
| **测试** | 单元 **332 pass**；浏览器 **8 pass**。 |
| **截图** | `b5r5-photos-*`、`b5r5-feed-weeks-*`、`b5r5-today-wall-*`。重拍：`node .overnight/capture-batch5-round5.mjs`（5297）。 |

**验收提示：** 时间轴在日/周/月三种 feed 间来回点，列表不应「死贴」在页面上；切到 **照片记忆** 应看到网格依次出现；Today demo 第一面非空照片墙底部有 vignette。

---

## 上一轮（Batch 5 · Round 4）改动

| 项目 | 说明 |
|------|------|
| **习惯页入场** | 侧栏进入「习惯设置」时：标题区 → 每日提醒卡 → 三张统计卡 → 筛选栏 → 习惯列表依次 `pageCardIn`（`#habitsView.view.is-entering`）。 |
| **本周页入场** | 页头标题区先入场；四个 module 卡片仍用原有 stagger；下方 **Completed Days** 里七天日历列 200–410ms 依次出现。 |
| **CSS 审计** | `pages-858` 里 `.view.is-entering #weekView …` 在 `is-entering` 挂在 `#weekView` 上时仍匹配后代；module 卡片由 v210 更高优先级规则覆盖。 |
| **测试** | 单元 **330 pass**；浏览器 **8 pass**（若 fakecloud 超时，先结束占用 5296/5298 的 wrangler 进程）。 |
| **截图** | `b5r4-habits-zh-light-1440-*`、`b5r4-habits-de-dark-390-*`、`b5r4-week-en-light-1440-*`、`b5r4-week-zh-dark-390-*`。重拍：`node .overnight/capture-batch5-round4.mjs`（5296）。 |

**验收提示：** 侧栏 **习惯设置** ↔ **今日** 来回切，应看到统计三卡与列表轻微依次入场；**本周** 页在 module 卡片之后，周一到周日列应略带延迟依次出现。

---

## 上一轮（Batch 5 · Round 3）改动

| 项目 | 说明 |
|------|------|
| **复盘入场动效** | 侧栏进入「复盘 / Review / Monatsrückblick」时，顶部指标卡、完成率折线、底部复盘区应依次轻微入场（与 Round 2 修复 Today/长期页为同一类选择器问题）。 |
| **记账 keypad（矮屏）** | 手机宽度且视口高 ≤480px：聚焦快速录入框时，数字键盘固定在底部 Tab 栏上方，不必滚到底找键盘。 |
| **测试** | 单元 **330 pass**（+1 CSS 契约）；浏览器 **8 pass**。 |
| **截图** | `b5r3-review-zh-light-1440-*`、`b5r3-review-de-dark-390-*`、`b5r3-ledger-keypad-en-light-390-*`。重拍：`node .overnight/capture-batch5-round3.mjs`（5297）。 |

**验收提示：** 侧栏 **复盘** ↔ **本周** 来回切换，指标三卡应有 stagger；记账页在窄矮窗口点快速录入，键盘应贴底悬浮。

---

## 上一轮（Batch 5 · Round 2）

| 项目 | 说明 |
|------|------|
| **入场动效 bug** | 侧栏切换时 `is-entering` 加在 `#todayView` 等自身上，但 CSS 写成「祖先 `.view.is-entering` 里的 `#todayView`」，长期/日记/Today 卡片 stagger 实际未播放；已改为 `#todayView.view.is-entering …`。 |
| **Today Focus 回归** | `setDailyToolPage` 曾把 `nextPage` 写死为 `journal`，Focus 面板无法切换；已恢复。Today → Focus 标签 → 开始计时，内联环在运行时有轻微 breathe。 |
| **Today 动效** | 回到 Today 时 hero / mood / daily-tool / calendar 依次 `pageCardIn`。 |
| **记账浏览器测** | 编辑 popover 填 `not-a-number` → 红框，流水金额不变（`ledger-edit-amount.browser.test.mjs`）。 |
| **CI 竞态** | `today-spending` 静态服改端口 **5291**，与 fakecloud **5296** 并行时不再互抢。 |
| **截图** | `b5r2-today-zh-light-1440-mac-*`（Mac 壳）、`b5r2-focus-de-dark-390-*`、`b5r2-journal-en-light-1440-*`。重拍：`node .overnight/capture-batch5-round2.mjs`（5295）。 |

**验收提示：** 侧栏先点「本周」再点「今日」，hero 与日记区应有轻微依次入场；Today 顶栏 **Focus** 可切到计时页；记账编辑金额填乱码不会保存。

---

## 上一轮（Batch 5 · Round 1）

| 项目 | 说明 |
|------|------|
| **Antigravity 复核修复** | CSV 导出含 `currency` 列；编辑金额无效时红框提示；CSS 顺序 `pages-polish` → `v210`；deploy 单测用临时 manifest 目录。 |
| **长期页动效** | 侧栏「长期」进入时 pin / 标题 / 阶段看板 / 计划区块依次 `pageCardIn`（`v210.css`）。 |
| **截图** | `b5r1-longrange-zh-light-1440-*`、`b5r1-longrange-de-dark-390-*`。重拍：`node .overnight/capture-batch5-round1.mjs`（5293）。 |
| **测试** | 单元 **327 pass**（+2：CSV 导出、cascade）；浏览器 **7 pass**。 |

**验收提示：** 导出 CSV 表头现为 `date;note;category;amount;currency`；若同时有 EUR/CNY 流水，导出文件可区分币种。编辑一笔交易 → 金额填 `abc` → 应出现红色边框且不保存错误金额。

---

## 历史（Batch 4 · Round 10 · 收束）


| 项目 | 说明 |
|------|------|
| **记账截图** | `b4r10-ledger-overview-zh-light-1440-*`、`b4r10-ledger-overview-de-dark-1440-*`、`b4r10-ledger-keypad-en-light-520-*`（WebKit + Chromium）。重拍：`node .overnight/capture-batch4-round10.mjs`（5294）。 |
| **移动端 keypad** | 极矮视口（宽 ≤640px 且高 ≤640px / ≤480px）增加底栏避让，减轻数字键盘与 Tab 栏重叠。 |
| **文档** | CHANGELOG 补充上述 CSS；本报告与 `PROGRESS.md` 标记 Batch 4 十轮结束。 |
| **测试** | 单元 **325 pass**；浏览器 **7 pass**（含 fakecloud 在线/冲突/preview、记账 onboarding、Today 提示、Review jump-spy）。 |

---

## 明早从哪里开始（推荐路径）

### 1. 本地版 + 完整虚构示例（含记账）

```text
cd public && python3 -m http.server 5291 --bind 127.0.0.1
```

打开：`http://127.0.0.1:5291/index.html?mode=local&local-preview=demo-showcase-v1`

- 侧栏 **记账 / Money / Finanzen**
- **Today → 今日支出** 卡片
- **复盘** 底部 Money 面板（心情/习惯/专注 vs 支出散点图）
- 快速录入试：`12,50 咖啡`、`-45 Miete gestern`、`+2000 工资`

### 2. 在线版 fakecloud（无真 Cloudflare）

```bash
bash .overnight/fakecloud.sh 5298
```

- 空账本在线：`http://127.0.0.1:5298/index.html?mode=cloudflare`
- **预览 + 记账 demo：**  
  `http://127.0.0.1:5298/index.html?mode=cloudflare&local-preview=demo-showcase-v1`  
  （建议无痕）→ 等同步徽章 → 侧栏记账与 Today 支出应有数据；GET `/api/state` 的 `payload.ledger` 含流水。

### 3. Mac 窗口（不启动已安装的 Life Ledger.app）

Headless 壳注入见 `.overnight/shots/b4r8-week-all-done-mac-de-light-1440-*` 的拍法（`desktop/mac/shell.js` + `shell.css`）。

---

## 2.1.0 交付摘要

### Goal 1 — 记账（`state.ledger`）

- **数据：** 账户、分类（图标+色）、流水、月度预算、固定收支模板；整数 minor + ISO 币种（默认 EUR，支持 CNY）。
- **同步：** 随现有 JSON state 走本地保存、Cloudflare CAS、备份 v3、demo sample；删除可撤销。
- **录入：** 自然语言快速字段、触屏数字键盘、分类 chips、编辑/复制/滑动删除、德式 CSV 导入导出。
- **视图：** 月汇总、环形图/树图、日历热力、uPlot 趋势、预算进度、搜索筛选。
- **集成：** Today 支出卡片、月度复盘 Money 摘要与相关洞察图。

设计笔记：`.overnight/LEDGER-DESIGN.md` · 第三方说明：`THIRD_PARTY_NOTICES.md`

### Goal 2 — 全站抛光（Batch 3–4）

- Today / Journal hero、习惯库、Week 模块与全完成横幅、Review 指标预览 / jump-spy / 柱状图动画、Money 空状态与图表 retarget、录入成功反馈、侧栏动效等（样式主要在 `v210.css`）。
- **Antigravity REVIEW** 三条 HIGH/MED 已修；CSS  proliferation 已合并；browser 测独立为 `npm run test:browser`。

---

## 截图索引（Batch 4）

| 轮次 | 代表场景 | 前缀 |
|------|----------|------|
| R1–R4 | 记账、Today、Review 早期 | `b4r1`–`b4r4` |
| R5 | Review 折叠预览、Week 模块 | `b4r5-*` |
| R6 | Review habit chips、Week 全勾 | `b4r6-*` |
| R7 | Week 横幅、窄屏 chips | `b4r7-*` |
| R8 | 409 冲突、de/Mac 庆祝条、长期空状态 | `b4r8-*` |
| R9 | zh · Week 全完成 · dark 390 | `b4r9-*` |
| **R10** | **记账 1440 zh/de + 矮视口 keypad** | **`b4r10-*`** |
| **B5 R1** | **长期页 zh 1440 / de dark 390** | **`b5r1-longrange-*`** |
| **B5 R2** | **Mac Today zh、Focus de 390、Journal en 1440** | **`b5r2-*`** |
| **B5 R5** | **时间轴 Photos 网格、周度 feed、Today 墙 vignette** | **`b5r5-*`** |

更早 Batch 3 截图：`b3r1`–`b3r10`、以及 `capture-ledger.mjs` 产出的 `ledger-*` 系列。

目录：`.overnight/shots/`

---

## 尝试后放弃 / 未做

- 未引入新图表库（沿用 uPlot + SVG donut/treemap）。
- 未对 `functions/` 服务端或 D1 migration 做任何改动（ledger 仅在客户端 state 内）。
- 非 preview 的真实云端首次访问 **不** 自动 seed 记账（真实用户从空账本开始）。
- 极矮视口未改为 fixed 浮层 keypad（仅 padding/scroll-margin 缓解）。

---

## 已知问题

- Demo 数据下 Journal **reflection streak** 数字偏大。
- Week 面板内不显示 `#longTermGoalsPane`；长期目标走侧栏「长期」视图。
- CloudBase 真实环境：Round 1 已修 pull 丢 ledger；部署前仍建议主人用副本试一次同步。
- 并行跑多个 fakecloud / browser 测时偶发端口竞态（单独 `npm run test:browser` 稳定）。

---

## npm test（Batch 5 Round 2 实测）

| 命令 | 结果 |
|------|------|
| `npm test` | **329 pass, 0 fail** |
| `npm run test:browser` | **8 pass, 0 fail**（含记账编辑校验；跑前若 fakecloud 超时可先 `pkill -f wrangler`） |

## npm test（Batch 5 Round 1 实测）

| 命令 | 结果 |
|------|------|
| `npm test` | **327 pass, 0 fail** |
| `npm run test:browser` | **7 pass, 0 fail**（跑前若失败可先 `pkill -f wrangler`） |

## npm test（Batch 4 Round 10 实测）

| 命令 | 结果 |
|------|------|
| `npm test` | **325 pass, 0 fail** |
| `npm run test:browser` | **7 pass, 0 fail** |

---

## 版本与文档

- 版本：**2.1.0**（web）/ **3.1.0**（Mac）— `package.json`、`index.html` cache、`sw.js`、`src/release-metadata.js`、`src-tauri/`。
- `CHANGELOG`：`[2.1.0]` 记账首发 + `[Unreleased]` Batch 3–4 抛光条目。
- README **EN / ZH / DE** 含记账与 preview/backfill 说明。
