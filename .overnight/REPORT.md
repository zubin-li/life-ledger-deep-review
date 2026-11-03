# Life Ledger — 主人反馈 pass（Round 4 · 2026-11-03）

Web **2.1.0**、Mac **3.1.0**。

## 改了什么

| 项目 | 说明 |
|------|------|
| **按压反馈** | 全站 `LifeLedgerInteraction.pressBump`；CSS 合并，行为与原先 `is-*-press` 一致 |
| **订阅空态** | 无每月订阅时显示 hairline 插画 +「添加订阅」 |
| **Mac 窗口** | 注入 Mac 壳后拍 Today **记一笔** sheet |
| **修复** | Today 支出按钮 `root is not defined` 导致无法跳转记账（browser 回归） |
| **CSS** | v210 **6252** 行（去重动效块） |

## 怎么点

1. `cd public && python3 -m http.server 5294 --bind 127.0.0.1`
2. **今日** → 点金额 → sheet；点 **打开记账** → 完整统计页
3. **记账** → 若 demo 无订阅模板，看订阅区空态插画
4. 重拍：`node .overnight/capture.mjs --port 5294 --prefix fb-r4`
5. Mac 壳：`node .overnight/capture-mac.mjs --port 5295 --prefix fb-r4-mac`

## 截图（Round 4）

| 文件 | 场景 |
|------|------|
| `fb-r4-ledger-zh-light-1440-chromium.png` | 记账统计页 |
| `fb-r4-today-sheet-zh-light-390-webkit.png` | Today 记一笔 |
| `fb-r4-mac-today-sheet-zh-light-1440-webkit.png` | **Mac 壳** + sheet |

## 测试

| 命令 | Round 4 |
|------|---------|
| `npm test` | **425** pass |
| `npm run test:browser` | **72** pass |
| `npm run desktop:check` | **0** fail |

详情：`.overnight/PROGRESS-2.md`

---

# Life Ledger — 主人反馈 pass（Round 3 · 2026-11-03）

Web **2.1.0**、Mac **3.1.0**。

## 改了什么

| 项目 | 说明 |
|------|------|
| **记账 周/月** | 切换统计范围时有 **cross-fade**；圆环仍 **sweep**；分段控件跟手（`data-segment`） |
| **快捷键 /** | 打开 **⋯** 菜单并聚焦搜索（菜单内 `#ledgerFilter`） |
| **CSS 严重修复** | 曾误删块导致 **v210.css 只解析 35 条规则**（复盘习惯分、大量动效失效）→ 已修复；现 **6283** 行 |
| **Today** | 快速记账 sheet 关闭钮 **中/英/德 aria-label**；引导卡 **z-index 12000** |
| **对比 v2.0.10** | `node .overnight/compare-v2010.mjs` → `.overnight/diff-v2010.json` |

## 怎么点

1. `cd public && python3 -m http.server 5292 --bind 127.0.0.1`
2. **今日** → 点 **今日支出** 金额 → 记一笔 sheet（见截图）
3. **记账** → 切换 **周/月** 看统计区动画
4. 重拍：`node .overnight/capture.mjs --port 5292 --prefix fb-r3`

## 截图（Round 3）

| 文件 | 场景 |
|------|------|
| `fb-r3-today-sheet-zh-light-390-webkit.png` | Today **记一笔** sheet 打开 |
| `fb-r3-ledger-zh-light-1440-chromium.png` | 记账统计 + 周/月 |
| `fb-r3-today-zh-light-1440-chromium.png` | 今日侧栏顺序 |

## 测试

| 命令 | Round 3 |
|------|---------|
| `npm test` | **424** pass |
| `npm run test:browser` | **72** pass |
| `npm run desktop:check` | **0** fail |

详情：`.overnight/PROGRESS-2.md`

---

# Life Ledger — 主人反馈 pass（Round 2 · 2026-11-03）

Web **2.1.0**、Mac **3.1.0**。

## 改了什么

| 项目 | 说明 |
|------|------|
| **Today 快速记账** | **今日支出** 点 **金额** → 底部/居中 **记一笔** 浮层：一行录入、自动 **分类 chip**、当日合计、最近 3 笔；**完整统计** 仍进记账页 |
| **记账页** | 主屏去掉 **本月关联洞察**（散点进 hidden legacy，复盘仍完整） |
| **动效** | `.overnight/MOTION-RESEARCH.md`；`v210.css` 减约 **500** 行（合并 reduced-motion） |
| **API** | `LifeLedgerLedgerUI.quickAdd(text, date)` 供 Today 与记账页共用 |

## 怎么点（3 分钟）

1. `cd public && python3 -m http.server 5292 --bind 127.0.0.1`
2. Demo → **今日** → **今日支出** 点 **−950 €** → 试 `12,50 咖啡` → Enter
3. 点 **完整统计** / 侧栏 **记账** → 周/月 + 圆环 + 订阅 + 交易列表
4. 重拍：`node .overnight/capture.mjs --port 5292 --prefix fb-r2`

## 截图（Round 2）

| 文件 | 场景 |
|------|------|
| `fb-r2-today-zh-light-1440-chromium.png` | 今日 + 侧栏顺序 |
| `fb-r2-ledger-zh-light-1440-chromium.png` | 记账统计页 |
| `fb-r2-timeline-zh-light-1440-chromium.png` | 时间轴 |
| `fb-r2-longrange-en-light-1440-chromium.png` | 长期 |
| `fb-r2-ledger-de-dark-390-webkit.png` | 手机德文深色 |

## 测试

| 命令 | Round 2 |
|------|---------|
| `npm test` | **423** pass |
| `npm run test:browser` | **72** pass |
| `npm run desktop:check` | **0** fail |

详情：`.overnight/PROGRESS-2.md`

---

# Life Ledger — 主人反馈 pass（Round 1 · 2026-11-03）

Web **2.1.0**、Mac **3.1.0**。规格：每日记账 + 自动统计、界面更简、侧栏 **时间轴 → 记账 → 复盘**。

## 改了什么

| 项目 | 说明 |
|------|------|
| **记账页** | 打开即 **当天**（‹ 11月3日 ›）；顶栏快速录入；**周/月** 收支 + 圆环图 + 一行环比；每月订阅列表；交易 **一行一条**（今天展开、旧日折叠）；搜索/CSV/预算/固定收支进 **⋯** |
| **自动分类** | 备注关键词推断中/英/德；改分类会记住（如 Rewe → 日用） |
| **导航** | 侧栏与 Mac：**今日 → 本周 → 长期 → 时间轴 → 记账 → 复盘 → 习惯**；Mac **⌘5** 打开记账 |
| **Today 引导卡** | 「今日页可按你的习惯排列…」改为 **不透明** 底，不再透出习惯卡 |
| **标题** | 记账页去掉滚动区重复「记账」，只保留顶栏标题 |
| **脚本** | 只保留 `.overnight/capture.mjs`（删 121 个旧 capture 脚本） |

## 怎么点（5 分钟）

1. `cd public && python3 -m http.server 5297 --bind 127.0.0.1`
2. 打开 `http://127.0.0.1:5297/index.html?mode=local&local-preview=demo-showcase-v1`
3. 侧栏点 **记账** → 试 `12,50 咖啡` → 看分类 chip → 切换 **周/月**
4. **⋯** → 搜索、CSV、预算
5. **今日** → 确认 onboarding 提示不半透明

## 截图（本轮）

| 文件 | 场景 |
|------|------|
| `fb-r1-today-zh-light-1440-chromium.png` | 今日 + 引导卡 |
| `fb-r1-ledger-zh-light-1440-chromium.png` | 记账日中心 + 统计 |
| `fb-r1-ledger-de-dark-390-webkit.png` | 手机德文深色 + 底栏顺序 |
| `fb-r1-week-zh-light-1440-webkit.png` | 本周对照风格 |
| `fb-r1-review-zh-light-390-chromium.png` | 复盘 |
| `fb-r1-habits-de-light-1440-chromium.png` | 习惯设置 |

重拍：`node .overnight/capture.mjs --port 5297 --prefix fb-r1`

## 六个已知问题（Round 1）

| # | 状态 | 证据 |
|---|------|------|
| 1 引导半透明 | **已修** | CSS + `fb-r1-today-*` |
| 2 双「记账」 | **已修** | 隐藏 scroll header + 截图 |
| 3 导航位置 | **已修** | HTML + `NAV_PAGES` + ⌘5 |
| 4 天气空头 | **非回归** | HEAD = v2.0.10 headless（无网络/无城市） |
| 5 CSS/capture 膨胀 | **一半** | capture 已 Consolidate；CSS 仍 ~6790 行 → Round 2 |
| 6 全页回归 | **未做完** | 样本截图已拍；矩阵对比下一轮 |

## 测试

| 命令 | Round 1 |
|------|---------|
| `npm test` | **423** pass |
| `npm run test:browser` | **71** pass |
| `npm run desktop:check` | **0** fail |
| `npm run desktop:check` | **0** fail |

详情：`.overnight/PROGRESS-2.md`

---

# Life Ledger 夜间构建 — 全夜总览（Batch 13 · Round 10 收尾）

Web **2.1.0**、Mac **3.1.0**。隔离仓库：`/Users/ashan/Documents/Codex/ll-overnight`（无 remote，未部署）。

## 交付摘要

| 目标 | 内容 |
|------|------|
| **Goal 1 · 记账** | 见 Batch 3–11 首发与 `CHANGELOG [2.1.0]`；Batch 12–13 深化筛选/CSV/键盘/示例流水 onboarding。设计 `.overnight/LEDGER-DESIGN.md`，第三方 `THIRD_PARTY_NOTICES.md`。 |
| **Goal 2 · 抛光（Batch 13）** | 日记 autosave / 心情按压；习惯与周目标 toggle；全习惯庆祝 + 复盘 Money 按压；全局 **M**、长按编辑、Mac **⌘7**；侧栏 nav、分类 chip、Today 支出、图表/热力格按压反馈。 |
| **QA** | `npm test` **417** pass；`npm run test:browser` **71** pass。Antigravity **REVIEW.md**：无 HIGH/MED。 |

## 主人明天建议验收（5 分钟）

1. 终端：`cd public && python3 -m http.server 8080 --bind 127.0.0.1`，打开 `http://127.0.0.1:8080/index.html?mode=local&local-preview=demo-showcase-v1`。
2. **今日** → 点 **今日支出** 大数字 → **记账** 带 **11月3日** chip（`b13r10-release-today-ledger-day-zh-light-1440-chromium.png`）。
3. **复盘** → **本月支出** 点数字 → **记账** 同月、无日期 chip（`b13r10-release-review-ledger-month-zh-light-1440-chromium.png`）。
4. **记账** → 点 **每日支出** 热力格 → 筛选 + 高亮（`b13r10-release-ledger-heat-zh-light-1440-chromium.png`）。
5. 快速录入：`12,50 咖啡`；任意页 **M** 聚焦录入；手机 **长按** 一笔 → 编辑。
6. 深色 de / Mac 窗：`b13r10-release-ledger-de-dark-390-webkit.png`、`b13r10-release-ledger-mac-en-light-1440-webkit.png`。

重拍发布集：`node .overnight/capture-batch13-round10.mjs`（端口 **5294**）。

## Batch 13 十轮一览

| 轮 | 主题 |
|----|------|
| R1 | 空账本 onboarding + **记一笔示例**；环比 **≥ €100** 显示金额 |
| R2 | 日记 autosave 脉冲；心情 **just-picked**；支出环比 roll-up |
| R3 | CSV 预览表 + 拖放导入 + 列表 import 脉冲 |
| R4 | 习惯勾选 / 进度环；周目标 **just-toggled** |
| R5 | 全习惯庆祝 + orbit/卡高亮；复盘 Money **is-stat-press** |
| R6 | 全局 **M**、桌面快捷键条、长按编辑 |
| R7 | 复盘 jump chip 按压；Mac **显示 → 记账 ⌘7** |
| R8 | 侧栏 **is-nav-press**；分类 chip **is-chip-press** |
| R9 | Today 支出 **is-spend-press**；圆环/热力 **is-mode/heat-press** |
| **R10** | **CHANGELOG 并入 2.1.0 + 发布截图 `b13r10-release-*`** |

更早 Batch 3–12 见下方各轮 REPORT 与 `CHANGELOG [2.1.0]`。

## 截图索引（Batch 13 发布）

| 前缀 | 场景 |
|------|------|
| `b13r1`–`b13r3` | onboarding、日记/心情、CSV 预览 |
| `b13r4`–`b13r6` | 习惯/周目标、庆祝、全局 M |
| `b13r7`–`b13r9` | jump chip、nav/chip、Today/热力按压 |
| **`b13r10-release-*`** | **发布集：Today/Review/热力/de390/Mac** |

目录：`.overnight/shots/`。Batch 12 发布集：`b12r10-release-*`。

## 已知限制（ intentional / 留 2.2）

- 纯 Cloudflare **首次**访问不自动 seed 虚构流水（可用 **记一笔示例**）。
- `v210.css` 内分散的 `prefers-reduced-motion` **未**物理合并（REVIEW #1 → **2.2**）。
- 支出环比：中等增幅（差额 **< €100**）仍 **+N%**。
- Demo 旧缓存偶需 `?demo-reset=1`；复盘 jump chips 仅 **≤959px**。

## 测试（Batch 13 Round 10 实测）

| 命令 | 结果 |
|------|------|
| `npm test` | **417 pass, 0 fail** |
| `npm run test:browser` | **71 pass, 0 fail** |

---

# Life Ledger 夜间构建 — Batch 13 · Round 10

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **收尾** | `[Unreleased]` 并入 **2.1.0**；全夜总览（见上文）；`capture-batch13-round10.mjs` → **`b13r10-release-*`**（5294）。 |
| **文档** | `CHANGELOG` Batch 13 r10 final；`PROGRESS` 标记 Batch 13 完成。 |

## 怎么验

见全夜总览 **主人明天建议验收**；重拍：`node .overnight/capture-batch13-round10.mjs`。

---

# Life Ledger 夜间构建 — Batch 13 · Round 9

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2 · Today 支出卡** | 点 **今日支出** 金额或 **打开记账** 时 **`is-spend-press`** 按压反馈，再跳转 **记账** 当日筛选（r12 行为不变）。 |
| **Goal 2 · 记账图表** | **圆环 / 树图** 切换后 active 按钮 **`is-mode-press`**；**每日支出** 热力格点击 **`is-heat-press`**（筛选/滚列表逻辑不变）。 |
| **实现** | `today-widgets.js` `pulseTodaySpendControl`；`ledger-ui.js` `pulseLedgerChartMode` / `pulseLedgerHeatDay`；`v210.css` Batch 13 r9。 |
| **测试** | `npm test` **417**；`npm run test:browser` **71**（+2 Today/ledger press）。 |

## 验收

1. **1440 浅色 zh** → **Today** 滚到 **今日支出** 卡 → 点金额见短暂缩放（截图用 staged press：`b13r9-spend-press-zh-light-1440-chromium.png`）；真机点击会立刻进 **记账**。
2. **390 深色 de** → **Finanzen** → **Tägliche Ausgaben** 点一格 → 外圈高亮（`b13r9-ledger-heat-press-de-dark-390-webkit.png`）。
3. 重拍：`node .overnight/capture-batch13-round9.mjs`（端口 **5293**）。

---

# Life Ledger 夜间构建 — Batch 13 · Round 8

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2 · 导航** | 任意侧栏 **nav-item** 切换页面时 **`is-nav-press`** 按压高亮（含键盘 **M** 进记账时的 **Money** 项）。 |
| **Goal 2 · 记账 chip** | 快速录入下方 **最近/常用分类 chip** 点击时 **`is-chip-press`**，并照旧把分类名填入录入框。 |
| **实现** | `app.js` `pulseNavItemPress`；`ledger-ui.js` `pulseLedgerCategoryChip`；`v210.css` Batch 13 r8。 |
| **测试** | `npm test` **416**；`npm run test:browser` **69**（+2 nav/chip press）。 |

## 验收

1. **1440 浅色 zh** → 侧栏点 **记账** → **记账** 项短暂 accent 底（`b13r8-nav-press-zh-light-1440-chromium.png`）。
2. **390 深色 de** → **Finanzen** → 点 **Mobilität** chip → 描边高亮 + 输入框 `12,50 Mobilität`（`b13r8-ledger-chip-press-de-dark-390-webkit.png`）。
3. 重拍：`node .overnight/capture-batch13-round8.mjs`（端口 **5292**）。

---

# Life Ledger 夜间构建 — Batch 13 · Round 7

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2 · 复盘 jump chips** | 手机宽 **Money** 摘要下 **心情 / 习惯 / 专注 / 洞察** 跳转 chip 点击时 **`is-jump-press`** 按压反馈，再滚动到对应散点/洞察块。 |
| **Goal 1 · Mac 菜单** | **显示 → 记账**（德 **Geld**）**⌘7** 进入侧边栏 **Money** 页；README 三语注明 **⌘7** 与全局 **M**（快速录入聚焦）。 |
| **实现** | `app.js` `pulseReviewScatterJumpChip`；`src-tauri/lib.rs` `view_ledger`；`v210.css` Batch 13 r7。 |
| **测试** | `npm test` **415**；`npm run test:browser` **67**（+1 jump chip press）。 |

## 验收

1. **复盘** → 390 宽（或真机）→ 点 **习惯** chip → 短暂高亮 + 滚到习惯×支出图（`b13r7-review-jump-press-zh-light-390-chromium.png`）。
2. de 深色同场景（`b13r7-review-jump-press-de-dark-390-webkit.png`）。
3. **Mac**：菜单 **View → Money ⌘7**；任意视图 **M** → 记账 + 光标在快速录入（r6 行为不变）。
4. 重拍：`node .overnight/capture-batch13-round7.mjs`（端口 **5291**）。

---

# Life Ledger 夜间构建 — Batch 13 · Round 6

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 1 · 键盘 / 触控** | 任意视图按 **M** 打开 **记账** 并聚焦 **快速录入**（对话框/抽屉/弹层打开时不触发）；桌面 **Money** 页标题下显示 **M / N / / / ←→** 快捷键条；交易行 **长按**（Pointer，非鼠标）打开 **编辑**，左滑删除保留。 |
| **Goal 2 · 复盘** | **打开记账** 文字按钮与 **待记 recurring** 横幅按钮在跳转前播放与金额按钮相同的 **`is-stat-press`**。 |
| **实现** | `app.js` `bindGlobalKeyboardShortcuts`；`ledger-ui.js` `focusQuickEntry` / `bindTouchRowGestures`；`v210.css` Batch 13 r6。 |
| **测试** | `npm test` **414**；`npm run test:browser` **66**（+3：全局 M、长按编辑、复盘打开按压）。 |

## 验收

1. **今日**（或任意页）→ 键盘 **M** → 进入 **记账**，光标在快速录入框（`b13r6-global-m-review-de-dark-390-webkit.png` 为 de 深色 390 宽示例）。
2. **记账** 桌面宽度 → 月份标题下见灰色 **M · N · / · ← →** 提示（`b13r6-ledger-kbd-hints-en-light-1440-chromium.png`）。
3. 手机宽度 → **长按** 列表中一笔 → 出现编辑弹层（Playwright `ledger-long-press-edit.browser`）。
4. **复盘** → 点右上角 **Open Money / 打开记账** → 短暂按压高亮再跳转（`review-open-press.browser`）。
5. 重拍：`node .overnight/capture-batch13-round6.mjs`（端口 **5299**）。

---

# Life Ledger 夜间构建 — Batch 13 · Round 5

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2 · 习惯全完成** | 最后一项计入习惯勾选时，原有全屏 **celebration** 现同步触发更强 **进度环**（`is-all-complete-orbit`）与 **习惯 Today 卡** 描边高亮（`is-all-complete`），与单次勾选的 `is-progress-bump` 区分。 |
| **Goal 2 · 复盘 Money** | 月度摘要 **支出 / 收入 / 结余** 可点击数字在跳转记账前播放 **`is-stat-press`** 按压反馈（`pulseReviewLedgerStatBtn`）。 |
| **实现** | `app.js` `pulseAllCompleteOrbit` / `pulseHabitsAllCompleteCard` / `pulseReviewLedgerStatBtn`；`v210.css` Batch 13 r5。 |
| **测试** | `npm test` **413**；`npm run test:browser` **63**（+2 全完成庆祝 / 复盘 stat）。 |

## 验收

1. **今日** → 依次勾选所有计入完成度的习惯 → 出现庆祝文案，进度环与习惯卡同步高亮（动效约 1.9s；静态截图见 `b13r5-habit-all-complete-zh-light-1440-webkit.png`，此时为 **7/7** 完成态）。
2. **复盘** → **Money** 面板点任一金额 → 按钮短暂缩放后再进入记账（`b13r5-review-stat-press-de-dark-390-chromium.png` 为跳转后的 de 深色记账页）。
3. 重拍：`node .overnight/capture-batch13-round5.mjs`（端口 **5298**）。

---

# Life Ledger 夜间构建 — Batch 13 · Round 4

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2 · 习惯 / 周目标** | Today 点习惯：**just-checked / just-unchecked** 卡片反馈（含勾选 pop）；完成时 **#progressOrbit.is-progress-bump** 进度环轻弹；**本周** 勾选周目标时 **just-toggled** 动画后再重绘列表。 |
| **实现** | `app.js` `applyHabitCardPulse` / `pulseProgressOrbit` / `pulseWeeklyGoalRow`；`toggleHabit` 在 view-transition 与即时提交路径统一脉冲；`v210.css` Batch 13 r4。 |
| **测试** | `npm test` **412**；`npm run test:browser` **61**（+2 习惯/周目标）。 |

## 验收

1. **今日** → 点任一未完成习惯 → 卡片描边 + 勾选动画，右侧进度环短暂放大（`b13r4-habit-check-zh-light-1440-webkit.png`）。
2. **本周** → 点周目标左侧勾选 → 勾选框缩放高亮（`b13r4-week-goal-de-dark-390-chromium.png`）。
3. 重拍：`node .overnight/capture-batch13-round4.mjs`（端口 **5297**）。

---

# Life Ledger 夜间构建 — Batch 13 · Round 3

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 1 · CSV** | 导入确认层增加 **可滚动预览表**（日期、备注、金额，最多 5 行 +「还有 N 笔」）；**拖放** 银行 `.csv` 到记账页（虚线提示层）；导入成功后交易列表 **accent 描边脉冲**。 |
| **实现** | `ledger-core.js` `previewGermanBankCsv` → `samples`；`ledger-ui.js` `renderCsvImportPreview` / `bindLedgerCsvDrop` / `readLedgerCsvFile`；`index.html` `#ledgerCsvDropHint`；`v210.css` Batch 13 r3。 |
| **测试** | `npm test` **411**；`npm run test:browser` **59**（CSV 预览行断言更新）。 |

## 验收

1. **记账** → **导入 CSV**（或把 `.csv` 拖到页面）→ 确认层应看到 **REWE / Gehalt** 等预览行（`b13r3-csv-preview-de-light-1440-chromium.png`）。
2. 点 **导入** → 列表出现两笔交易，列表区短暂高亮描边（`b13r3-csv-import-zh-dark-390-webkit.png`）。
3. 重拍：`node .overnight/capture-batch13-round3.mjs`（端口 **5295**）。

---

# Life Ledger 夜间构建 — Batch 13 · Round 2

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2** | Today **每日复盘** 自动保存徽标防抖脉冲（`pulseHomeJournalSaved` / `#homeJournalSave.is-saved`）；**心情** 按钮 `just-picked` + `LifeLedgerInteraction.retarget`（Today + 抽屉）；**今日支出** 卡「较昨日…」环比文案变更时用 `rollText`。 |
| **测试** | `npm test` **409**；`npm run test:browser` **59**（+2 日记/心情）。 |

## 验收

1. **今日** → 滚动到 **Daily Reflection / 每日复盘** → 输入几字 → 右上角 **● autosaved** 应短暂变 accent 色（见 `b13r2-journal-autosave-en-light-1440-webkit.png`）。
2. 点 **心情** 任一选项 → 按钮有轻缩放反馈（截图时可能已弹出原因对话框，见 `b13r2-mood-pick-zh-light-390-chromium.png`）。
3. 重拍：`node .overnight/capture-batch13-round2.mjs`（端口 **5294**）。

---

# Life Ledger 夜间构建 — Batch 13 · Round 1

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **REVIEW** | 无 HIGH/MED；#3 支出环比在差额 **≥ €100** 时优先显示金额；#4 空账本 onboarding 增加 **记一笔示例**（toast 撤销）并说明默认分类已就绪。 |
| **记账** | `SPEND_COMPARE_AMOUNT_DELTA_MINOR`；`postSampleEntry` / `data-ledger-sample-entry`。 |
| **测试** | `npm test` **408**；`npm run test:browser` **57**（+1 `ledger-sample-entry`）。 |

## 验收

1. 本地空 `state.ledger`（或 `LifeLedgerLedger.emptyLedger()`）→ **记账** → 虚线 onboarding 内 **记一笔示例**（见 `b13r1-ledger-onboarding-zh-light-1440-chromium.png`）。
2. 点示例后应出现 **-3,50** 一类交易、onboarding 消失、可 **撤销**（见 `b13r1-ledger-sample-de-dark-390-webkit.png`）。
3. 重拍：`node .overnight/capture-batch13-round1.mjs`（端口 **5292**）。

---

# Life Ledger 夜间构建 — 全夜总览（Batch 12 · Round 10 收尾）

Web **2.1.0**、Mac **3.1.0**。隔离仓库：`/Users/ashan/Documents/Codex/ll-overnight`（无 remote，未部署）。

## 交付摘要

| 目标 | 内容 |
|------|------|
| **Goal 1 · 记账** | `state.ledger`（账户、分类、交易、预算、固定收支）；快速录入、CSV 德式导入/导出、uPlot 趋势、SVG 圆环/树图、热力日历、预算条；Today「今日支出」卡；复盘 Money 摘要；侧栏 **记账 / Money / Finanzen**；本地/云 CAS/备份 v3/demo/可撤销删除。设计见 `.overnight/LEDGER-DESIGN.md`，第三方见 `THIRD_PARTY_NOTICES.md`。 |
| **Goal 2 · 抛光** | 多轮 `v210.css`：空状态插画、页面进入动效、习惯 streak 日历、Journal/Week/Today/Review 与支出的关联散点与 deep link、记账筛选 UX（热力日/分类 chip、合计条、Esc 清筛选、收入·支出·净分列）、Today/Review → 记账一键跳转。 |
| **QA** | `npm test` **407** pass；`npm run test:browser` **56** pass（含 fakecloud、Mac shell、离线 PWA）。Antigravity **REVIEW.md**：无 HIGH/MED。 |

## 主人明天建议验收（5 分钟）

1. 终端：`cd public && python3 -m http.server 8080 --bind 127.0.0.1`，浏览器打开 `http://127.0.0.1:8080/index.html?mode=local&local-preview=demo-showcase-v1`。
2. **今日** → 点 **今日支出** 大数字 → **记账** 应出现 **日期 chip** + 热力格选日（`b12r10-release-today-ledger-day-zh-light-1440-chromium.png`）。
3. **复盘** → **本月支出摘要** 点大数字 → **记账** 同月、**无** 日期 chip（`b12r10-release-review-ledger-month-zh-light-1440-chromium.png`）。
4. **记账** → 点热力格一日 → 再点圆环分类 → 列表上方 **笔数·合计** + **清除全部筛选**（`b12r10-release-ledger-filters-zh-light-1440-chromium.png`）。
5. 快速录入试：`12,50 咖啡`；设置 → 导出/导入备份仍含 ledger。
6. 深色 / 德语 / 窄屏：见 `b12r10-release-ledger-de-dark-390-webkit.png`；Mac 窗口感：`b12r10-release-ledger-mac-en-light-1440-webkit.png`。

重拍发布集：`node .overnight/capture-batch12-round10.mjs`（端口 **5296**）。

## Batch 12 十轮一览

| 轮 | 主题 |
|----|------|
| R1 | 记账页 mood×spend / habit×spend 迷你散点 → 复盘 deep link |
| R2 | 热力格筛日 + chip；wellness 散点 tooltip |
| R3 | 记账侧 wellness 空态三步清单 |
| R4 | 交易/预算/固定收支 hairline 空态 + CTA |
| R5 | 圆环/树图筛分类 + chip |
| R6 | 筛选 **笔数·合计** + 多筛选 **清除全部** |
| R7 | 混合日 **收入·支出·净**；**Esc** 清筛选 |
| R8 | Today 支出 → 记账 **按 Today 日期** |
| R9 | 复盘 Money 摘要 → 记账 **按复盘月份** |
| **R10** | **全夜 REPORT 收尾 + 发布截图集 `b12r10-*`** |

更早 Batch 3–11 的记账首发与跨页洞察见下方各轮 REPORT 与 `CHANGELOG` `[2.1.0]` / `[Unreleased]`。

## 截图索引（Batch 12）

| 前缀 | 场景 |
|------|------|
| `b12r1`–`b12r3` | wellness 散点、热力筛日、空态清单 |
| `b12r4`–`b12r6` | 空态 CTA、分类筛选、合计条 |
| `b12r7`–`b12r9` | 分列合计、Today→记账、Review→记账 |
| **`b12r10-release-*`** | **发布集：Today/Review/筛选/de390/Mac** |

目录：`.overnight/shots/`。Batch 11 发布集：`b11r10-release-*`。

## 已知限制（ intentional / 留 2.2）

- 纯 Cloudflare **首次**访问不自动 seed 记账（真实用户从空账本开始）。
- `v210.css` 内分散的 `prefers-reduced-motion` **未**物理合并（REVIEW #1 → **2.2**）。
- 支出环比：中等增幅仍显示 **+N%**；极大跳变在 Today 卡用金额差（非 +999%）。
- Demo 旧缓存偶需 `?demo-reset=1`；Journal demo 下 reflection streak 数字偏大。

## 尝试后放弃

- 未新增重型图表库（uPlot + SVG）。
- 未改 `functions/`、D1 migration、Tauri 签名/更新器。
- GPL/AGPL 项目仅借鉴产品思路，无抄码。

## 测试（Batch 12 Round 10 实测）

| 命令 | 结果 |
|------|------|
| `npm test` | **407 pass, 0 fail** |
| `npm run test:browser` | **56 pass, 0 fail** |

---

# Life Ledger 夜间构建 — Batch 12 · Round 10

Web **2.1.0**、Mac **3.1.0**。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **收尾** | 全夜总览（见上文）；发布截图 `capture-batch12-round10.mjs` → `b12r10-release-*`。 |
| **文档** | `CHANGELOG` Batch 12 r10 final 条目。 |

## 怎么验

见全夜总览 **主人明天建议验收**；重拍：`node .overnight/capture-batch12-round10.mjs`（**5296**）。

---
# Life Ledger 夜间构建 — Batch 12 · Round 9

Web **2.1.0**、Mac **3.1.0**。仓库：`/Users/ashan/Documents/Codex/ll-overnight`。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2 / 复盘 ↔ 记账** | **Review**「本月支出摘要」三项金额（支出/收入/结余）与 **打开记账** 可点 → 进入 **记账** 并定位到 **当前复盘月份**（清除日/分类筛选；顶部月份 summary 有 retarget 动效）。 |
| **测试** | `npm test` **407**；`npm run test:browser` **56**（+1 `review-spending-ledger-month`）。 |

## 怎么验

1. Demo → **复盘** → **本月支出摘要** → 点任一 **大数字**（或 **打开记账**）→ 应到 **记账** 且 **无** 日期 chip / 热力格选日（见 `b12r9-review-spend-ledger-month-zh-light-1440-chromium.png`）。
2. 用复盘顶栏切到 **上个月** 再点支出数字 → 记账页标题月份应对应上月。
3. 重拍：`node .overnight/capture-batch12-round9.mjs`（端口 **5295**）。

## 未做 / 留 2.2

- `v210.css` reduced-motion 规则物理合并（REVIEW #1）。

---

# Life Ledger 夜间构建 — Batch 12 · Round 8

Web **2.1.0**、Mac **3.1.0**。仓库：`/Users/ashan/Documents/Codex/ll-overnight`。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2 / Today ↔ 记账** | **今日支出** 卡：点 **当日金额** 或 **打开记账** → 进入 **记账** 并自动按 Today 所选日期筛选（热力格高亮 + 日期 chip + 列表区 scroll/spotlight）。 |
| **测试** | `npm test` **406**；`npm run test:browser` **55**（+1 `today-spending-ledger-day`）。 |

## 怎么验

1. Demo → **今日** → **今日支出** 卡 → 点大数字（或 **打开记账**）→ 应到 **记账** 且见 **11月3日** 一类日期 chip 与当日交易（见 `b12r8-today-spend-ledger-day-zh-light-1440-chromium.png`）。
2. 在 Today 用顶栏换到别的日期再点金额 → 记账页应对应那天筛选。
3. 重拍：`node .overnight/capture-batch12-round8.mjs`（端口 **5294**）。

## 未做 / 留 2.2

- `v210.css` reduced-motion 规则物理合并（REVIEW #1）。

---

# Life Ledger 夜间构建 — Batch 12 · Round 7

Web **2.1.0**、Mac **3.1.0**。仓库：`/Users/ashan/Documents/Codex/ll-overnight`。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2 / 记账** | 筛选列表在 **同一天既有收入又有支出** 时，合计条分列 **收入 · 支出 · 净**；**Esc** 一键清除搜索/日期/分类筛选（弹层优先）。 |
| **测试** | `npm test` **404**；`npm run test:browser` **54**（+1 `ledger-escape-filters`）。 |

## 怎么验

1. Demo → **记账** → 点 **11 月 1 日**（或任意同时有工资与支出的热力格）→ 列表上方应见 `2 笔 · 收入 … · 支出 … · 净 …`（见 `b12r7-ledger-split-sum-zh-light-1440-chromium.png`）。
2. 按 **Esc**（或 Mac 上 **⎋**）→ 日期 chip 与合计条消失，恢复整月列表。
3. 在 **交易搜索** 框内按 **Esc** → 同样清除所有筛选。
4. 重拍：`node .overnight/capture-batch12-round7.mjs`（端口 **5297**）。

## 未做 / 留 2.2

- `v210.css` reduced-motion 规则物理合并（REVIEW #1）。

---

# Life Ledger 夜间构建 — Batch 12 · Round 6

Web **2.1.0**、Mac **3.1.0**。仓库：`/Users/ashan/Documents/Codex/ll-overnight`。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2 / 记账** | **交易** 列表在任意筛选（搜索/日期/分类）且有结果时显示 **笔数 · 合计** 条；**两个及以上** 筛选时出现 **清除全部筛选**；日期+分类组合无匹配时有专用空态。 |
| **逻辑** | 新增 `summarizeTransactions`；列表合计随筛选 `rollText` 更新。 |
| **测试** | `npm test` **402**；`npm run test:browser` **53**（+1 `ledger-filter-summary`）。 |

## 怎么验

1. Demo → **记账** → 点 **每日支出** 一格 → 再点 **分类** 圆环任一扇区 → 应见日期+分类 chip、绿色合计条与 **清除全部筛选**（见 `b12r6-ledger-filter-sum-zh-light-1440-chromium.png`）。
2. 点 **清除全部筛选** → chip 与合计条消失，恢复整月列表。
3. 若日+分类下无交易 → 虚线空态 + **清除全部筛选**。
4. 重拍：`node .overnight/capture-batch12-round6.mjs`（端口 **5292**）。

## 未做 / 留 2.2

- `v210.css` reduced-motion 规则物理合并（REVIEW #1）。

---

# Life Ledger 夜间构建 — Batch 12 · Round 5

Web **2.1.0**、Mac **3.1.0**。仓库：`/Users/ashan/Documents/Codex/ll-overnight`。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2 / 记账** | **分类** 圆环与树图区块可点选，筛选下方 **交易** 列表；列表上方显示可清除的 **分类 chip**（与热力图日期 chip 同款样式）。 |
| **逻辑** | `filterTransactions` 增加 `categoryId` 参数；换月时同时清除日期与分类筛选。 |
| **测试** | `npm test` **400**；`npm run test:browser` **52**（+1 `ledger-category-filter`）。 |

## 怎么验

1. Demo → **记账** → 点 **分类** 圆环任一扇区 → 列表应只剩该分类交易，出现「住房」等 chip（见 `b12r5-ledger-category-filter-zh-light-1440-chromium.png`）。
2. 再点同一扇区或 chip 上 **×** → 恢复整月列表。
3. 切换到 **树图** 后矩形同样可筛选。
4. 重拍：`node .overnight/capture-batch12-round5.mjs`（端口 **5291**）。

## 未做 / 留 2.2

- `v210.css` reduced-motion 规则物理合并（REVIEW #1）。

---

# Life Ledger 夜间构建 — Batch 12 · Round 4

Web **2.1.0**、Mac **3.1.0**。仓库：`/Users/ashan/Documents/Codex/ll-overnight`。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2** | **记账** 页 **交易** / **预算进度** / **固定收支** 空态改为 hairline 插画 + 主按钮 CTA（开始录入 → 聚焦快速录入；设置预算 / 添加固定项 → 打开弹层）。 |
| **Goal 2** | 搜索无结果、热力图选日无交易时显示 `search-empty` 插画；搜索空态带 **清除搜索**。 |
| **资源** | 新插画 `ledger-month-empty.svg`、`ledger-recurring-empty.svg`；已纳入 PWA `APP_SHELL`。 |
| **测试** | `npm test` **398**；`npm run test:browser` **51**（+2 `ledger-section-empty`）。 |

## 怎么验

1. 本地空白账本（或 `LifeLedgerLedger.emptyLedger()`）→ **记账** → 滚到 **交易** → 虚线卡片 + **开始录入**（见 `b12r4-ledger-list-empty-zh-light-1440-chromium.png`）。
2. 点 **开始录入** → 光标应进入上方快速录入框；**预算进度** / **固定收支** 空态按钮应打开对应表单。
3. 重拍：`node .overnight/capture-batch12-round4.mjs`（端口 **5298**）。

## 未做 / 留 2.2

- `v210.css` reduced-motion 规则物理合并（REVIEW #1）。

---

# Life Ledger 夜间构建 — Batch 12 · Round 3

Web **2.1.0**、Mac **3.1.0**。仓库：`/Users/ashan/Documents/Codex/ll-overnight`。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2** | **记账 · 本月关联洞察**：当月已有支出但心情/习惯天数不足以画 mini 散点时，显示与 **复盘 Money** 相同的三步 pill + **去 Today 记录**（`#ledgerWellnessEmptyHint`）。 |
| **测试** | `npm test` **397**；`npm run test:browser` **49**（+1 `ledger-wellness-empty`）。 |

## 怎么验

1. 本地空白档：记 **一笔支出**（不要记心情/习惯）→ **记账** → 滚到 **本月关联洞察** → 应见虚线框与三 pill（见 `b12r3-ledger-wellness-empty-zh-light-1440-chromium.png`）。
2. 点 **记录心情** → 应到 **Today**；Demo 数据充足时仍显示并排 mini 散点（Round 1–2 行为不变）。
3. 重拍：`node .overnight/capture-batch12-round3.mjs`（端口 **5295**）。

## 未做 / 留 2.2

- `v210.css` reduced-motion 规则物理合并（REVIEW #1）。

---

# Life Ledger 夜间构建 — Batch 12 · Round 2

Web **2.1.0**、Mac **3.1.0**。仓库：`/Users/ashan/Documents/Codex/ll-overnight`。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2** | **每日支出** 热力格可点选，筛选下方 **交易** 列表；日期 **chip** 可一键清除。 |
| **Goal 2** | **本月关联洞察** 散点支持悬停/键盘 **tooltip**（与复盘同源逻辑）。 |
| **修复** | 热力点击监听曾误放在 `bindRecurring` 内，导致点击无效 — 已移回 `bindInteractions`。 |
| **测试** | `npm test` **396**；`npm run test:browser` **48**。 |

## 怎么验

1. Demo → **记账** → 点 **每日支出** 任一有色格子 → 列表应只剩该日交易，标题下出现日期 chip（见 `b12r2-ledger-heat-filter-zh-light-1440-chromium.png`）。
2. 点 chip 上 **×** → 恢复整月列表。
3. 滚到 **本月关联洞察** → Tab 到散点 → 应出现浮动读数；**在复盘中查看 →** 仍跳转复盘（Round 1 行为）。
4. 重拍：`node .overnight/capture-batch12-round2.mjs`（端口 **5296**）。

## 未做 / 留 2.2

- `v210.css` reduced-motion 规则物理合并（REVIEW #1）。

---

# Life Ledger 夜间构建 — Batch 12 · Round 1

Web **2.1.0**、Mac **3.1.0**。仓库：`/Users/ashan/Documents/Codex/ll-overnight`。

## 本轮新增

| 项目 | 说明 |
|------|------|
| **Goal 2** | **记账** 页在分类/趋势/热力图下方新增 **本月关联洞察**：并排 mini **心情×支出**、**习惯×支出** 散点（与复盘同源 SVG）；**在复盘中查看 →** 会切到对应月份复盘并 spotlight 散点区。 |
| **重构** | `buildLedgerMonthDailyRows` / `ledgerViewMonthDates` 供复盘 Money 与记账页共用，避免两套日行逻辑。 |
| **REVIEW** | Antigravity 无 HIGH/MED；LOW #2 已在 Batch 11 用 >500% 金额差解决；#3 浏览器套件本轮 **46** 全绿。 |
| **测试** | `npm test` **395**；`npm run test:browser` **46**。 |

## 怎么验

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → 侧栏 **记账** → 向下滚到 **本月关联洞察**（见截图）。
2. 点 **在复盘中查看 →**（习惯或心情）→ 应进入 **复盘** 对应散点并短暂高亮。
3. 截图：`.overnight/shots/b12r1-ledger-wellness-*`；重拍 `node .overnight/capture-batch12-round1.mjs`（端口 **5297**）。

## 未做 / 留 2.2

- `v210.css` reduced-motion 规则物理合并（REVIEW #1）。

---

# Life Ledger 夜间构建 — 2.1.0 / Mac 3.1.0 终夜收束

Web **2.1.0**、Mac **3.1.0**。仓库路径：`/Users/ashan/Documents/Codex/ll-overnight`（无 git remote 的 overnight 克隆）。请在本地用 `public/` 静态服务或已安装的 Mac 应用验收。

## 交付摘要

| 目标 | 状态 |
|------|------|
| **Goal 1 — 记账** | 已交付：`state.ledger`、快速录入、月视图/图表/预算/CSV、Today 支出卡、复盘 Money 面板、侧栏 **记账 / Money / Finanzen**；设计见 `.overnight/LEDGER-DESIGN.md`。 |
| **Goal 2 — 全站打磨** | 多轮动效、空态、洞察文案与跨页导航（Today / 时间轴 / 本周 / 复盘）；样式集中在 `public/v210.css`。 |
| **Batch 11（Round 1–10）** | 离线 PWA 记账脚本缓存、CSV/−0 修复、复盘散点空态 pill、Mac×fakecloud QA、习惯 streak 网格、时间轴/本周 habit×spend chip 等；**394** 单元 + **45** 浏览器测试全绿。 |
| **Antigravity REVIEW** | HIGH/MED/LOW #1–#3 已修；#4 CSS 体积合并计划 **2.2**。 |

## 明早一键验收（Demo）

本地：`python3 -m http.server 5291 --bind 127.0.0.1`（cwd=`public`）→  
`http://127.0.0.1:5291/index.html?mode=local&local-preview=demo-showcase-v1`

1. **今日** — 心情×支出、习惯×支出 hint → 点链接应到复盘对应散点并短暂高亮（`b11r10-release-today-zh-light-1440-chromium.png`）。
2. **记账** — 月汇总、甜甜圈/趋势/热力图、预算条、交易列表（`b11r10-release-ledger-zh-light-1440-chromium.png`）。
3. **时间轴** — feed 标题下 mood×spend chip（`b11r10-release-journal-insight-zh-light-1440-chromium.png`）。
4. **本周** — 当前周标题下 habit×spend chip（de 深色移动：`b11r10-release-week-insight-de-dark-390-webkit.png`）。
5. **复盘** — Money 散点区（`b11r10-release-review-scatter-zh-light-1440-chromium.png`）；数据不足时空态三 pill 可跳转。
6. **Mac 窗口感** — shell 注入下 **Money**（`b11r10-release-ledger-mac-en-light-1440-webkit.png`）；菜单 **←/→** 换月在 fakecloud 套件已覆盖。

在线 demo（可选）：`bash .overnight/fakecloud.sh 5298`，同 URL 加 `mode=online` 流程见 Batch 5–7 REPORT。

## 终轮截图（Round 10）

| 文件 | 内容 |
|------|------|
| `.overnight/shots/b11r10-release-today-zh-light-1440-chromium.png` | 今日洞察 + 今日支出卡 |
| `.overnight/shots/b11r10-release-ledger-zh-light-1440-chromium.png` | 记账月视图 |
| `.overnight/shots/b11r10-release-journal-insight-zh-light-1440-chromium.png` | 时间轴 mood×spend |
| `.overnight/shots/b11r10-release-review-scatter-zh-light-1440-chromium.png` | 复盘散点 |
| `.overnight/shots/b11r10-release-week-insight-de-dark-390-webkit.png` | 本周 habit×spend（de/深色/390） |
| `.overnight/shots/b11r10-release-ledger-de-dark-390-webkit.png` | 记账移动 de 深色 |
| `.overnight/shots/b11r10-release-ledger-mac-en-light-1440-webkit.png` | Mac shell + Money |

重拍：`node .overnight/capture-batch11-round10.mjs`（端口 **5292**）。

## 已知限制（与 PROGRESS 一致）

- 纯 Cloudflare **首次**访问不会自动 seed 记账（需本地/demo/导入）。
- `v210.css` 约 5k 行，reduced-motion 规则分散 — **2.2** 再合并。
- 支出环比：中等涨幅仍显示 **+N%**；极大涨幅或低基线改用 **金额差**（ intentional）。

## 测试

```text
npm test          → 394 pass, 0 fail
npm run test:browser → 45 pass, 0 fail
```

## 下次可做的想法

- 2.2：`v210.css` motion 块合并；记账与习惯/心情的 **同一屏 mini 关联图**。
- 生产部署前：确认 SW 已缓存 `ledger-core.js` / `ledger-ui.js`（REVIEW #1 已修，部署时再验离线 PWA）。

---

# Life Ledger 夜间构建总报告（Batch 11 · Round 9）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 11 Round 9：** 本周页习惯×支出洞察 chip；Today 习惯链接 spotlight 对齐。

---

## 本轮（Batch 11 · Round 9）— 本周页关联洞察

| 项目 | 说明 |
|------|------|
| **Goal 2** | **本周** 视图在 **当前周** 时，页头（日期标题下）显示与 Today **同源** 的 **近 30 天习惯完成度×支出** 软提示；点 **复盘里看支出关联 →** 进入复盘 **习惯与支出** 散点并短暂 spotlight。Today 上同一链接行为已对齐（spotlight + smooth scroll）。 |
| **实现** | `#weekHabitSpendHint` + `renderWeekHabitSpendHint(weekOffset)`；样式类 **`week-page-spend-insight`**（与时间轴 `journal-feed-spend-insight` 分离，避免 Playwright 误匹配）。 |
| **单元测试** | `npm test` **394**（+1 AST 套件）。 |
| **浏览器** | `npm run test:browser` **45**（+1 Week → habit scatter）。 |
| **截图** | `.overnight/shots/b11r9-week-habit-spend-insight-zh-light-1440-chromium.png`、`.overnight/shots/b11r9-week-habit-spend-insight-de-dark-390-webkit.png`。 |
| **未做** | `v210.css` reduced-motion 大合并仍 **2.2**（Round 10 可选）。 |

**怎么验（可选）：**

1. Demo → 侧栏 **本周** → 标题下应见习惯×支出 chip（见 Round 9 截图）→ 点链接应到复盘 **习惯完成度与当日支出** 散点。
2. **今日** → 点习惯洞察链接，散点区应有 spotlight 高亮（与心情洞察一致）。
3. `npm test` + `npm run test:browser`。

---

# Life Ledger 夜间构建总报告（Batch 11 · Round 8）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 11 Round 8：** 时间轴心情×支出洞察；Mac 复盘/周视图菜单换期 QA。

---

## 本轮（Batch 11 · Round 8）— 时间轴关联洞察 + Mac 换期

| 项目 | 说明 |
|------|------|
| **Goal 2** | **时间轴** feed 标题（周/月/日模式）在数据足够时显示 **近 30 天心情与支出** 对比 chip，点 **复盘里看心情与支出 →** 进入复盘 mood 散点并短暂 spotlight；连续记录 streak 仍只在 **日度** 视图出现。 |
| **Mac** | 新浏览器套件：注入 shell 后于 **复盘** / **本周** 断言 `LifeLedgerMac.handle("date:prev|next")` 会改变 `#reviewTitle` / `#weekPageTitle`。 |
| **单元测试** | `npm test` **393**（AST 断言 journal  wiring + CSS）。 |
| **浏览器** | `npm run test:browser` **44**（+2 journal insight / mac review-week）。 |
| **截图** | `.overnight/shots/b11r8-journal-spend-insight-zh-light-1440-chromium.png`、`.overnight/shots/b11r8-review-header-de-dark-390-webkit.png`。 |
| **未做** | `v210.css` reduced-motion 大合并仍 **2.2**。 |

**怎么验（可选）：**

1. Demo → **时间轴**（默认周度即可）→ 标题下应见心情×支出 chip（见 Round 8 截图）→ 点链接应到复盘 mood 散点。
2. Mac 窗口或 shell 注入 → **复盘** / **本周** → 菜单 **上一月/下一月** 或 **上一周/下一周** 应换标题（Round 8 QA 覆盖）。
3. `npm test` + `npm run test:browser`。

---

# Life Ledger 夜间构建总报告（Batch 11 · Round 7）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 11 Round 7：** Today 习惯洞察直达 habit 散点；Mac 菜单 date:prev QA；习惯连续网格动效。

---

## 本轮（Batch 11 · Round 7）— 洞察导航 + Mac 换月 + 习惯 streak 动效

| 项目 | 说明 |
|------|------|
| **Goal 2** | **Today** 习惯×支出 hint 点 **复盘里看支出关联** 会进入复盘并滚到 **习惯完成度与当日支出** 散点（与心情 hint 对称）。习惯检视器 **28 日连续** 网格：已完成格短 stagger scale-in（`prefers-reduced-motion` 关闭）。 |
| **Mac × fakecloud** | `fakecloud-ledger-mac-shell.browser.test.mjs` 增加 **`date:prev`** 菜单换月断言（与既有 **← / date:next / N** 同套件）。 |
| **单元测试** | `npm test` **393**（无新增单元项）。 |
| **浏览器** | `npm run test:browser` **42**（Today habit hint 断言 `#review-scatter-habit`）。 |
| **截图** | `.overnight/shots/b11r7-today-habit-hint-chip-zh-light-1440-chromium.png`、`.overnight/shots/b11r7-review-habit-scatter-zh-light-1440-chromium.png`、`.overnight/shots/b11r7-habit-streak-grid-de-dark-390-webkit.png`。 |
| **未做** | `v210.css` reduced-motion 大合并仍 **2.2**。 |

**怎么验（可选）：**

1. Demo → **今日** → 点习惯洞察里的 **复盘里看支出关联 →** → 复盘页应定位 **习惯完成度与当日支出**（见 Round 7 散点截图）。
2. **习惯** → 选中 demo 习惯 → 侧栏 **6 Tage in Folge** 网格应有轻微弹入（de 深色见 Round 7 截图）。
3. `bash .overnight/fakecloud.sh 5297` + shell 注入 → **Finanzen** → 菜单/快捷键换月仍绿（全量 `npm run test:browser`）。

---

# Life Ledger 夜间构建总报告（Batch 11 · Round 6）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 11 Round 6：** 复盘散点空态 pill 可跳转；Mac 在线记账快捷键 + 菜单换月 QA。

---

## 本轮（Batch 11 · Round 6）— 散点空态导航 + Mac 快捷键

| 项目 | 说明 |
|------|------|
| **Goal 2** | 复盘 **Money** 散点数据不足时，三步 checklist 改为按钮：**记录心情** → Today、**完成习惯** → 习惯页、**记一笔支出** → 记账；pill 增加 hover/focus/按压反馈。 |
| **Mac × fakecloud** | 扩展 `fakecloud-ledger-mac-shell.browser.test.mjs`：在 WebKit + shell 注入 + 云 demo 下断言 **←** 换月、**N** 聚焦快速录入、`LifeLedgerMac.handle("date:next")` 换月。 |
| **单元测试** | `npm test` **393**（无新增单元项）。 |
| **浏览器** | `npm run test:browser` **42**（scatter 空态 +1 断言跳转记账）。 |
| **截图** | `.overnight/shots/b11r6-review-scatter-steps-zh-light-1440-chromium.png`、`.overnight/shots/b11r6-ledger-month-arrow-de-dark-390-webkit.png`。 |
| **未做** | `v210.css` reduced-motion 大合并仍 **2.2**。 |

**怎么验（可选）：**

1. 本地：有本月支出、无散点数据 → **复盘** → Money 区点 **记一笔支出** → 应进入 **记账**。
2. `bash .overnight/fakecloud.sh 5297` + Mac 窗口或 shell 注入 → **Finanzen** → **←** 应换月（对照 Round 6 截图）。
3. 全量：`npm test` + `npm run test:browser`。

---

# Life Ledger 夜间构建总报告（Batch 11 · Round 5）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 11 Round 5：** Mac shell × fakecloud 在线记账 smoke；复盘散点空态 checklist + 主 CTA。

---

## 本轮（Batch 11 · Round 5）— Mac 在线记账 QA + 复盘散点空态

| 项目 | 说明 |
|------|------|
| **Mac × fakecloud** | 新套件 `fakecloud-ledger-mac-shell.browser.test.mjs`：注入 `desktop/mac/shell.js` + `shell.css`，`?mode=cloudflare&local-preview=demo-showcase-v1`，等云同步后点 **Finanzen**，确认 `ll-mac`、demo 交易行与月支出摘要。 |
| **Goal 2** | 复盘 **Money** 有支出但散点数据不足时：三条 pill（记录心情 / 完成习惯 / 记一笔支出）+ 主色 **去 Today 记录**；进入动画分步 stagger（`prefers-reduced-motion` 关闭）。 |
| **单元测试** | `npm test` **393**（无新增单元项）。 |
| **浏览器** | `npm run test:browser` **42**（+1 Mac fakecloud 记账）。 |
| **截图** | `.overnight/shots/b11r5-review-scatter-empty-zh-light-1440-chromium.png`、`.overnight/shots/b11r5-ledger-summary-de-dark-390-webkit.png`。 |
| **未做** | `v210.css` reduced-motion 大合并仍 **2.2**。 |

**怎么验（可选）：**

1. `bash .overnight/fakecloud.sh 5297` → 浏览器 `http://127.0.0.1:5297/index.html?mode=cloudflare&local-preview=demo-showcase-v1` → 等 **云** 保存模式 → 侧栏 **Finanzen** / **记账**。
2. 本地空习惯 + 一笔支出 → **复盘** → Money 面板底部应见三步 checklist 与主按钮（对照 Round 5 截图）。
3. 全量：`npm test` + `npm run test:browser`。

---

# Life Ledger 夜间构建总报告（Batch 11 · Round 4）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 11 Round 4：** fakecloud 端到端打开记账页；离线 PWA 缓存脚本回归；快速录入提交钮成功微动效。

---

## 本轮（Batch 11 · Round 4）— fakecloud 记账 + 离线 PWA QA

| 项目 | 说明 |
|------|------|
| **fakecloud** | 扩展 `fakecloud-preview-ledger.browser.test.mjs`：云端 demo 同步后进入侧栏 **记账**，断言交易列表、月支出摘要、分类图表容器。 |
| **离线 PWA** | 新套件 `ledger-offline-pwa.browser.test.mjs`：先在线灌缓存，再 DevTools 式 offline 刷新，确认 `LifeLedgerLedger` 与 demo 交易仍可显示（覆盖 REVIEW #1 场景）。 |
| **Goal 2** | 快速录入成功后「添加/Hinzufügen」按钮短暂 scale pop（`ledgerQuickSubmitPop`，尊重 reduced-motion）。 |
| **单元测试** | `npm test` **393**（无新增单元项）。 |
| **浏览器** | `npm run test:browser` **41**（+1 离线 PWA）。 |
| **截图** | `.overnight/shots/b11r4-ledger-charts-zh-light-1440-chromium.png`（demo 月视图 donut/热力/趋势）、`b11r4-ledger-quick-success-de-dark-390-webkit.png`（de 深色录入后高亮交易行）。 |
| **未做** | `v210.css` reduced-motion 大合并仍 **2.2**；Mac shell × fakecloud 组合 smoke 留下轮。 |

**怎么验（可选）：**

1. **离线：** `cd public && python3 -m http.server 5291 --bind 127.0.0.1` → 打开 demo → 等 SW 就绪 → DevTools **Offline** → 刷新 → **记账** 应完整（非 ReferenceError）。
2. **fakecloud：** `bash .overnight/fakecloud.sh 5296` → `?mode=cloudflare&local-preview=demo-showcase-v1` → 等云同步后点 **记账**。
3. 全量：`npm test` + `npm run test:browser`（约 2 分钟）。

---

# Life Ledger 夜间构建总报告（Batch 11 · Round 3）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 11 Round 3：** 修复旧 demo 缓存缺 Today 洞察 hint；Today 支出关联提示视觉 chip 化。

---

## 本轮（Batch 11 · Round 3）— Demo 洞察对齐 + Today chip

| 项目 | 说明 |
|------|------|
| **Demo 迁移** | 活跃 demo 若已有 `state.ledger` 但缺少 `meta.demo.insightAlign`，启动时一次性重跑 mood / budget / habit / focus 对齐（`maybeRealignDemoInsights`），不必 `?demo-reset=1`。 |
| **Goal 2** | Today 习惯×支出 / 心情×支出 hint 增加软 chip 底与边框；心情 hint 补进入动画（尊重 reduced-motion）。 |
| **单元测试** | `npm test` **393**（+1：`realignDemoInsights`）。 |
| **浏览器** | `npm run test:browser` **40** 全绿。 |
| **截图** | `.overnight/shots/b11r3-today-mood-hint-stale-realigned-zh-light-1440-chromium.png`、`.overnight/shots/b11r3-today-habit-hint-chip-de-dark-390-webkit.png`。 |
| **未做** | `v210.css` reduced-motion 大合并仍 **2.2**。 |

**怎么验（可选）：**

1. DevTools → Application → 编辑 `life-ledger-preview-demo-showcase-v1`：删掉 `meta.demo.insightAlign`，把所有 `logs[*].mood` 改成同一值 → 刷新 → **今日** 应仍出现「近 30 天：心情较好日…」条。
2. 对照 Round 3 截图看 hint 是否呈圆角 chip。
3. 全量：`npm test` + `npm run test:browser`。

---

# Life Ledger 夜间构建总报告（Batch 11 · Round 2）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 11 Round 2：** 在 Round 1 REVIEW 修复之上补 QA 与小幅 a11y，并复跑全量 Playwright。

---

## 本轮（Batch 11 · Round 2）— QA + 快速录入 a11y

| 项目 | 说明 |
|------|------|
| **单元测试** | `npm test` **392**（+1：`NETWORK_FIRST_SUFFIXES` 显式断言 ledger 脚本）。 |
| **浏览器** | `npm run test:browser` **40** 套件全绿；新增 `ledger-quick-entry.browser.test.mjs`（空账本 WebKit 390，提交 `-4,20 午餐` → 列表 `is-enter` 行）。 |
| **a11y** | 快速录入解析失败时 `#ledgerQuickInput` 带 `aria-invalid`（视觉 `is-error` 不变）。 |
| **截图** | `.overnight/shots/b11r2-ledger-quick-entry-zh-light-390-webkit.png`（录入后交易行）、`b11r2-ledger-demo-de-dark-1440-chromium.png`（demo 深色桌面）。 |
| **未做** | `v210.css` reduced-motion 大合并仍 **2.2**。 |

**怎么验（可选）：**

1. `cd public && python3 -m http.server 5291 --bind 127.0.0.1` → `?mode=local` → 侧栏 **记账** → 输入 `-3,50 测试` → **添加**，应出现高亮进入动画的交易行。
2. 故意输入乱码 → 输入框红框且 VoiceOver/审查元素可见 `aria-invalid="true"`。
3. 全量：`npm test` + `npm run test:browser`。

---

# Life Ledger 夜间构建总报告（Batch 11 · Round 1）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 11 启动：** 处理 Antigravity 对 Batch 10 终稿的复审（`REVIEW.md`），优先修复离线 PWA 与 CSV 金额解析。

---

## 本轮（Batch 11 · Round 1）— REVIEW 修复

| 项目 | 说明 |
|------|------|
| **HIGH** | 离线 PWA：`ledger-core.js` / `ledger-ui.js` 已加入 `NETWORK_FIRST_SUFFIXES`，与 `APP_SHELL` 预缓存一致，避免断网后 `LifeLedgerLedger` 未定义。 |
| **MED** | 德银 CSV：`parseGermanAmount` 不再对纯点小数（如 `12.50-`）误删 `.` 导致金额放大 100 倍。 |
| **LOW** | `formatMoney(-0)` 显示为 `0,00 €` 而非 `-0,00 €`。 |
| **未做** | `v210.css` reduced-motion 大合并仍留 **2.2**（REVIEW LOW #4）。 |
| **测试** | `npm test` **391**（+2）；单跑 `tests/ledger-csv-import-confirm.browser.test.mjs` 通过。 |

**怎么验离线脚本（可选）：** DevTools → Application → Service Workers → 勾选 Offline → 刷新已安装 PWA → 打开侧栏 **记账** 应正常渲染（此前可能白屏/控制台 ReferenceError）。

**明天早上怎么快速验（功能面与 Batch 10 相同）：**

1. `cd public && python3 -m http.server 5291 --bind 127.0.0.1` → `index.html?mode=local&local-preview=demo-showcase-v1` → **记账**、**复盘** Money、**今日** 支出卡。
2. 对照 `.overnight/shots/b10r10-release-*.png`。
3. 全量：`npm test` + `npm run test:browser`（勿与 capture 并行）。

---

# Life Ledger 夜间构建总报告（Batch 10 · Round 10 · 终轮收工）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 10 已 10/10 终稿。** 记账（Goal 1）与全站抛光（Goal 2）已交付；本轮为终轮缓冲 QA，无新功能 diff。

---

## 本轮（Batch 10 · Round 10）— 终轮 QA + 截图复验

| 项目 | 说明 |
|------|------|
| **REVIEW** | Antigravity 仍无 HIGH/MED；LOW #1 语言恢复分支已在代码中简化；#2 CSS 合并、#3 增幅文案留文档说明。 |
| **测试** | `npm test` **389**；`npm run test:browser` **39**（串行 ~113s，与 Round 9 同规模）。 |
| **截图** | 复跑 `node .overnight/capture-batch10-round10.mjs`（**5291**）→ `.overnight/shots/b10r10-release-*.png`（6 张）；目视 Today 中文洞察/支出、de 深色移动记账页无布局回归。 |
| **文档** | `.overnight/PROGRESS.md` 标记 Batch 10 完成；本 REPORT 顶栏更新。 |

**明天早上怎么快速验（与 Round 9 相同）：**

1. `cd public && python3 -m http.server 5291 --bind 127.0.0.1` → `index.html?mode=local&local-preview=demo-showcase-v1` → 侧栏 **记账**、**复盘** Money、**今日** 支出与习惯/心情 hint。
2. 对照 `.overnight/shots/b10r10-release-*.png` 与 `b10r4`…`b10r8` 空态/动效截图。
3. 全量：`npm test` + `npm run test:browser`（勿与 **5291** capture 并行）。

**2.2 再议（非阻塞）：** `v210.css` reduced-motion 物理合并；Cloudflare 首次不 seed 账本；demo 缓存未 reset 时 Today 心情×支出 hint 可能缺失。

---

## 上一轮（Batch 10 · Round 9）— 发布整理 + 终轮截图

| 项目 | 说明 |
|------|------|
| **CHANGELOG** | `[Unreleased]` 中 Batch 10 抛光条目并入 **[2.1.0]**；`[Unreleased]` 现为空。 |
| **GitHub Release 文案** | `.github/releases/v2.1.0.md` 补充 Batch 10 空态/动效与 **389 + 39** 测试规模。 |
| **清单** | `.overnight/ROUND10-CHECKLIST.md`（Batch 10 终轮项已全部勾选）。 |
| **截图** | `node .overnight/capture-batch10-round10.mjs`（**5291**）→ `b10r10-release-*`（Today 洞察/支出、记账 zh、复盘 Money、de 深色移动、Mac 壳 en 记账）。 |
| **测试** | `npm test` **389**；`npm run test:browser` **39**（串行 ~115s）。 |

**明天早上怎么快速验：**

1. `python3 -m http.server 5291 --bind 127.0.0.1`（cwd `public/`）→ 打开 `index.html?mode=local&local-preview=demo-showcase-v1` → 侧栏 **记账**、**复盘** Money、**今日** 支出卡片与习惯/心情 hint。
2. 对照 `.overnight/shots/b10r10-release-*.png` 与 Round 4–8 的 `b10r4`…`b10r8` 空态/动效截图。
3. 全量：`npm test` + `npm run test:browser`（勿与 **5291** capture 并行）。

**仍已知（非阻塞）：** Cloudflare 首次不 seed 账本；`v210.css` reduced-motion 物理合并留 **2.2**；demo 缓存未 reset 时 Today 心情×支出 hint 可能缺失；日历模式侧栏筛选条默认隐藏。

---

## 上一轮（Batch 10 · Round 8）— 时间轴日历空月 CTA + 重复 id 修复

| 项目 | 说明 |
|------|------|
| **时间轴 · 日历** | 空月（无日志、无当月照片）时 `#journalCalendarEmptyArt` 显示 hairline 空态 + **去写今日复盘**；侧栏列表空月同 CTA；筛选无匹配时 **search-empty** quiet 条。 |
| **Bugfix** | 侧栏与日历 overlay 曾共用 `id="journalEmptyWriteToday"`，事件绑在隐藏节点上，日历按钮无效；已拆为 `timelineEmptyWriteToday` / `timelineCalendarEmptyWriteToday`，空月判定用 `timelineMonthEntryBasis`（不含「仅选中今天」占位）。 |
| **Mac 壳** | 截图验证 demo 记账页在注入 `shell.js` 下的窗口 chrome：`b10r8-ledger-mac-shell-zh-light-1440-chromium.png`。 |
| **截图** | `.overnight/shots/b10r8-timeline-calendar-empty-*.png` 等（`node .overnight/capture-batch10-round8.mjs`，**5296**）。 |
| **测试** | `npm test` **389**；`npm run test:browser` **39**（+2 `timeline-calendar-empty`，端口 **5284**）。 |

**怎么验：**

1. 本地档清 `logs`（或 `meta.demo.active = false`）→ **时间轴** → **日历** → 见空态与 **去写今日复盘**，点击应到 Today 日记区并聚焦 `#dayNote`。
2. 有笔记无照片时，在侧栏（若可见）切 **Photos** 筛选 → quiet 条「没有符合筛选的条目」。
3. 全量：`npm test` + `npm run test:browser`（勿与 **5296** capture 并行）。

**仍已知：** Cloudflare 首次不 seed 账本；`v210.css` reduced-motion 未物理合并；日历模式默认隐藏侧栏筛选 UI。

---

## 上一轮（Batch 10 · Round 7）— 散点空态 bugfix + Today「完成」动效

| 项目 | 说明 |
|------|------|
| **Bugfix** | 复盘 Money 散点空态误判断 `expenseMinor > 0`；账本支出为负 minor，已改为 **`expenseMinor < 0`**，否则空态永不出现（Round 6 文案/UI 已写好但未触发）。 |
| **Today 编辑** | 点 **完成** 后：工具栏 **`is-saved`** 脉冲（修复 JS 曾写 `tc-saved` 与 CSS 不一致）；bar 在 720ms 内保持可见；右下角 **编辑卡片** 按钮 **`tc-edit-saved-flash`**。 |
| **截图** | `.overnight/shots/b10r7-review-scatter-empty-zh-light-1440-chromium.png`、`.overnight/shots/b10r7-today-edit-saved-zh-light-1440-chromium.png` 等（`node .overnight/capture-batch10-round7.mjs`，**5296**）。 |
| **测试** | `npm test` **389**；`npm run test:browser` **37**（+2 `review-scatter-empty` / `today-cards-edit-saved`，端口 **5286** / **5285**）。 |

**怎么验：**

1. 本地档：`meta.demo.active = false`，仅 1 笔本月支出、清空多数 `logs` / 习惯 / 专注 → **复盘** → Money 区见 **散点图还需要一点数据** 与 **去 Today 记录**（与截图 seed 相同思路）。
2. **今日** → **编辑卡片** → 拖动一张卡片 → **完成** → 应看到工具栏轻抬 + **完成** 按钮光晕，随后 bar 收起、**编辑卡片** 按钮边框/阴影闪一下（非 reduced-motion）。
3. 全量：`npm test` + `npm run test:browser`（勿与 **5296** capture 并行）。

**仍已知：** Cloudflare 首次不 seed 账本；`v210.css` reduced-motion 未物理合并；demo 日度 feed 可能仍有仅照片行。

---

## 上一轮（Batch 10 · Round 6）— Today 组件库引导 + 复盘散点空态

| 项目 | 说明 |
|------|------|
| **Today** | 首次进入 Today（未写入 `life-ledger-today-cards-onboarding-dismissed`）时，右下角 **编辑卡片** 上方出现不透明引导条：`layout-edit-hint` 插画 + **打开组件库** / **知道了**；点组件库或进入编辑模式后永久收起。 |
| **复盘 · Money** | 本月已有支出但心情/习惯/专注散点尚未满足数据门槛时，Money 面板下方 dashed 空态 + **去 Today 记录**。 |
| **截图** | `.overnight/shots/b10r6-today-onboard-zh-chromium-light-1440-chromium.png` 等 6 张（`node .overnight/capture-batch10-round6.mjs`，端口 **5296**）。 |
| **测试** | `npm test` **389**；`npm run test:browser` **35**（+2 `today-cards-onboard`，端口 **5294**）。 |

**怎么验：**

1. DevTools → Application → 删除 `life-ledger-today-cards-onboarding-dismissed` → **今日** → 见引导条；点 **打开组件库** 应弹出 `#tcLibrary` 且引导不再出现。
2. 本地档：仅保留本月 1 笔支出、清空多数 `logs` 心情天数 → **复盘** → Money 区见散点空态（demo 全量数据下通常已有散点，不会显示）。
3. 全量：`npm test` + `npm run test:browser`（勿与 **5296** capture 并行）。

**仍已知：** Cloudflare 首次不 seed 账本；`v210.css` reduced-motion 未物理合并；demo 日度 feed 可能仍有仅照片行。

---

## 上一轮（Batch 10 · Round 5）— 本周 / 复盘空态 CTA 对齐

| 项目 | 说明 |
|------|------|
| **本周** | 无周目标：dashed 空态 + **添加第一个本周目标**（聚焦输入框）；空白 `#weeklyOutputText`：复盘模块上方 **开始写本周复盘**；长期目标 tab：hairline + **添加长期目标**（打开对话框）。 |
| **复盘** | 空白 `#reviewText`：**开始写复盘**；展开「详细指标」后无习惯分数 / 无指标 / 明细表不足时，分别 **去习惯页添加**、**去 Today 打卡**（与习惯库 / 时间轴空态同一套 `ll-polished` 语言）。 |
| **截图** | `.overnight/shots/b10r5-week-empty-zh-chromium-light-1440-chromium.png`、`.overnight/shots/b10r5-review-empty-zh-light-chromium-light-1440-chromium.png` 等（`node .overnight/capture-batch10-round5.mjs`，端口 **5296**）。 |
| **测试** | `npm test` **388**；`npm run test:browser` **33**（+2 `week-review-empty`，端口 **5297**）。 |

**怎么验：**

1. 清 `weeklyGoals` / `weeklyOutputs` → **本周** → 见双空态与两个主按钮；点 **添加第一个本周目标** 应聚焦底部输入框。
2. 清 `reviews` 且 `habits=[]` → **复盘** → 滚到「这个月的复盘」见 **开始写复盘**；展开习惯分数见 **去习惯页添加**。
3. 全量：`npm test` + `npm run test:browser`（勿与 **5296** capture 并行）。

**仍已知：** Cloudflare 首次不 seed 账本；`v210.css` reduced-motion 未物理合并；demo 日度 feed 可能仍有仅照片行。

---

## 上一轮（Batch 10 · Round 4）— 时间轴日记空态 + Today 网格节奏

| 项目 | 说明 |
|------|------|
| **时间轴 · 日/周/月 feed** | 无月份筛选：居中 dashed 空态 + hairline + 主按钮（日度 **去写今日复盘** 跳转 Today 并聚焦 `#dayNote`；周度/月度分别打开 **本周** / **月度复盘**）。已选月份但无条目：横向 **search-empty** quiet 条（与习惯筛选空态同族）。 |
| **Today 卡片网格** | 非编辑态间距略收紧；浏览 Today 时 hero 下方卡片入场略滞后；桌面鼠标悬停卡片轻抬升（尊重 reduced-motion）。 |
| **截图** | `.overnight/shots/b10r4-journal-empty-zh-light-1440-chromium.png`、`.overnight/shots/b10r4-today-grid-zh-light-1440-chromium.png` 等（`node .overnight/capture-batch10-round4.mjs`，端口 **5296**）。 |
| **测试** | `npm test` **386**；`npm run test:browser` **31**（+2 `journal-feed-empty`）。 |

**怎么验：**

1. 本地空档（或清 `logs` 且关闭 demo）→ **时间轴** → **日度** → 见 **去写今日复盘**，点击应到 Today 日记区。
2. Demo 预览 → **时间轴** → **周度** → 选某一月 → 若该月无周复盘文本，见横向 search-empty 条（可用 devtools 清空 `weeklyOutputs` 后重载 preview 档复现）。
3. Demo **今日** → 感受卡片间距与 hover（需非编辑、非 reduced-motion）。
4. 全量：`npm test` + `npm run test:browser`（勿与 **5296** capture 并行）。

**仍已知：** Cloudflare 首次不 seed 账本；`v210.css` reduced-motion 未物理合并；demo 日度 feed 可能仍有仅照片行。

---

## 上一轮（Batch 10 · Round 3）— 习惯库空态 + Today hero 节奏 + QA 串行

| 项目 | 说明 |
|------|------|
| **习惯库** | 零习惯时隐藏提醒/三格概览/筛选/表头（`habits-view--empty`），居中 dashed 空态 + hairline + **添加第一个习惯**（等同顶栏「新增习惯」，打开 `#habitDialog`）。搜索无匹配时用 `search-empty.svg` 横向 quiet 条。 |
| **Today hero** | 仅「今天」浏览时，日期/引文/出处/进度文案与进度环有短 stagger 入场（`prefers-reduced-motion` / `html.motion-reduced` 关闭）。 |
| **QA** | 浏览器套件改为 **`--test-concurrency=1`**；`habits-empty` / `review-scatter` 静态端口改为 **5288** / **5287**，避免与 recurring / fakecloud-preview 争 5295/5296。 |
| **截图** | `.overnight/shots/b10r3-habits-empty-zh-light-light-1440-chromium.png`、`.overnight/shots/b10r3-today-hero-zh-light-light-1440-chromium.png`（`node .overnight/capture-batch10-round3.mjs`，端口 **5295**）。 |
| **测试** | `npm test` **384**；`npm run test:browser` **29**（+2 `habits-empty`，串行约 90s）。 |

**怎么验：**

1. 清空 `state.habits` 或新本地档 → **习惯设置** → 见居中空态与 **添加第一个习惯**（不应再被下方筛选栏挤到视口外）。
2. Demo 预览 → **今日** → 刷新或切回今天，hero 引文区有轻微分层入场（与整卡 `pageCardIn` 叠加，正常）。
3. Demo 习惯页搜索 `zzzzz` → 见搜索空插画条。
4. 全量：`npm test` + `npm run test:browser`（browser 已串行，无需重跑碰运气；fakecloud 仍占 **5298/5299**）。

**仍已知：** Cloudflare 首次不 seed 账本；`v210.css` reduced-motion 未物理合并；capture 脚本与 `npm run test:browser` 勿同时占用 **5295**。

---

## 上一轮（Batch 10 · Round 2）— 长期页空态 + 侧栏节奏

| 项目 | 说明 |
|------|------|
| **长期（Horizon）** | 无阶段时用 hairline 山旗插画 + **开始第一个阶段**；阶段计划 / 长期事项空网格用横向 quiet 插画条（`long-range.js` + `v210.css`）。 |
| **侧栏** | **时间轴**、**记账** 导航项上方轻分隔，区分「计划 / 记忆 / 工具」三组。 |
| **文档** | README 三语写明支出对比在 **>500%** 且基线 ≥€15 时显示 **金额差**（与 Round 1 行为一致）。 |
| **截图** | `.overnight/shots/b10r2-longrange-empty-zh-light-1440-chromium.png` 等（`node .overnight/capture-batch10-round2.mjs`，端口 **5293**）。 |
| **测试** | `npm test` **384**；`npm run test:browser` **27**（+2 `longrange-empty`）。 |

**怎么验：**

1. 本地空数据或清空 `planning.phases` → 侧栏 **长期** → 见插画空态与黑色 **开始第一个阶段**（点开后为「新阶段」对话框）。
2. 侧栏 **时间轴** / **记账** 上方应有细线分隔（桌面宽侧栏最明显）。
3. 全量：`npm test` + `npm run test:browser`（跑 browser 前勿占用 **5291–5299**；fakecloud 用 **5298**）。

**仍已知：** Cloudflare 首次不 seed 账本；`v210.css` reduced-motion 未物理合并；browser 套件与 fakecloud 并行偶发需重跑。

---

## 上一轮（Batch 10 · Round 1）— 支出对比与 REVIEW 清理

| 项目 | 说明 |
|------|------|
| **REVIEW** | LOW #1 备份恢复语言分支简化；LOW #3 极大增幅（>500%）改 **金额差** 而非 **+999%**；LOW #2 CSS 合并仍留 **2.2**。 |
| **行为** | 例：昨日 €20、今日 €500 → Today 卡显示 **较昨日多 €480.00**（见截图）。小基线（<€15）逻辑不变。 |
| **截图** | `.overnight/shots/b10r1-today-spend-amount-delta-zh-light-1440-chromium.png`、`*-dark-*`（`node .overnight/capture-batch10-round1.mjs`，端口 **5292**）。 |
| **测试** | `npm test` **384**；`npm run test:browser` **25**（+1 极端 surge）。 |

**怎么验：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → 在记账里造「昨日小额、今日大额」→ **今日** 支出卡对比行应为 **较昨日多 … €**，不应出现 **999%**。
2. 全量：`npm test` + `npm run test:browser`。

**仍已知：** Cloudflare 首次不 seed 账本；`v210.css` reduced-motion 未物理合并；+80%～+500% 仍用百分比句。

---

## Batch 9 · Round 10 · 终稿（归档）

# Life Ledger 夜间构建总报告（Batch 9 · Round 10 · 终稿）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 9 已完成 10/10。** 单元 **384**、浏览器 **24** 全绿；`CHANGELOG` Batch 9 内容已并入 **2.1.0**。

---

## 本轮（Batch 9 · Round 10）— 发布整理与验收截图

| 项目 | 说明 |
|------|------|
| **CHANGELOG** | `[Unreleased]` 清空；Batch 9 的 spend 对比修复、Today 洞察、时间轴 skeleton/stale/空态、Week roll、QA 套件说明并入 **`[2.1.0]`**。 |
| **GitHub Release 草稿** | `.github/releases/v2.1.0.md` 增加 Batch 9 亮点与测试计数。 |
| **终轮截图** | `.overnight/shots/b9r10-release-*`（`node .overnight/capture-batch9-round10.mjs`，端口 **5291**）。 |
| **测试** | `npm test` **384**；`npm run test:browser` **24**。 |

**明早怎么验（5 分钟）：**

1. `cd public && python3 -m http.server 8080 --bind 127.0.0.1` → 打开 `index.html?mode=local&local-preview=demo-showcase-v1`（或 Mac 应用同一 demo）。
2. **今日**：见习惯/心情两行 30 天洞察 + 支出卡片（对比 `b9r10-release-today-insights-zh-light-1440-chromium.png`）。
3. **记账 / 复盘 / 本周**：支出 hint 无 −900% 类 inflated %；换周时指标有 roll（Round 4–5 已测）。
4. 全量：`npm test` + `npm run test:browser`（跑 browser 前勿占用 **5271–5275 / 5291–5299**）。

**仍留 2.2 / 已知：** `v210.css` reduced-motion 大合并；Cloudflare 首次不 seed 账本；旧 demo localStorage 可能缺心情 hint（`?demo-reset=1`）；极大增幅仍 **+999%** 封顶。

**Batch 9 交付摘要（Goal 1 + Goal 2）：**

- **记账：** `state.ledger`、快速录入、图表/预算/CSV、Today 支出卡、复盘 Money 面板、云同步/备份/撤销删除（见 `CHANGELOG [2.1.0]` 与 `.overnight/LEDGER-DESIGN.md`）。
- **抛光：** 跨页 spend 对比文案与 baseline 数学修复；Week 数字 roll；时间轴 paint/stale/空态；Today 习惯×支出与心情×支出 demo 洞察；Mac 壳 spend hint 回归；README 三语已写 Today 洞察 bullet。

**推荐截图路径（before/after 对照）：**

| 主题 | 路径 |
|------|------|
| Today 洞察 + hero | `.overnight/shots/b9r10-release-today-insights-zh-light-1440-chromium.png` |
| Today 支出卡 | `.overnight/shots/b9r10-release-today-spending-zh-light-1440-chromium.png` |
| 复盘 Money | `.overnight/shots/b9r10-release-review-ledger-zh-light-1440-chromium.png` |
| 记账移动暗色 DE | `.overnight/shots/b9r10-release-ledger-de-dark-390-webkit.png` |
| Mac Today 洞察 | `.overnight/shots/b9r9-mac-today-insights-zh-light-1440-webkit.png` |

**曾尝试又放弃：** reduced-motion CSS 物理合并（10 轮内风险/体积权衡，留 2.2）；Cloudflare 自动 seed 账本（与「空云首次」产品 intentional 冲突）。

---

## 上一轮（Batch 9 · Round 9）— 文档与 Mac 壳 Today

| 项目 | 说明 |
|------|------|
| **README** | EN / ZH / DE 在「主要功能」增加 **Today 习惯×支出 / 心情×支出** 近 30 天 demo 洞察一句（链回复盘散点）。 |
| **Mac 壳回归** | `spend-compare-mac-shell.browser.test.mjs` 在 demo 下断言 **Today** 两行洞察文案可见。 |
| **测试** | `npm test` **384**；`npm run test:browser` **24**（用例内容扩展，条数不变）。 |
| **截图** | `.overnight/shots/b9r9-mac-today-*`（`node .overnight/capture-batch9-round9.mjs`，端口 **5298**，WebKit + Mac shell，zh/de × light/dark）。 |

**怎么验：**

1. 打开 demo（`?local-preview=demo-showcase-v1`）→ **今日**：心情卡与基础目标标题下各有一行洞察 + 复盘链接（浏览器见 Round 8 截图；Mac 窗口见 `b9r9-mac-today-insights-zh-light-1440-webkit.png`）。
2. README 三语搜索「30 天」或「30-day」应能看到新 bullet。
3. `npm run test:browser` 应 **24** 条全过。

**未做 / 已知：** `v210.css` reduced-motion 大合并仍 **2.2**；Cloudflare 首次不 seed 账本；旧 demo 缓存可能缺心情 hint。

---

## 上一轮（Batch 9 · Round 8）— Today 心情×支出洞察

| 项目 | 说明 |
|------|------|
| **Today · 心情卡** | Demo 下心情选项下方显示近 **30 天** 较好日 vs 较低落日平均支出，**复盘里看心情与支出 →** 跳转复盘并滚到 `#review-scatter-mood`（`#todayMoodSpendHint`）。 |
| **Today · 习惯** | 原有 **习惯×支出** hint 与心情 hint 共用 **`today-insight-hint`** 链接样式。 |
| **Demo 数据** | `alignDemoMoodWithSpend` 覆盖近 **45 天**支出日并补全 log，使 30 天滚动洞察与复盘一致。 |
| **测试** | `npm test` **384**；`npm run test:browser` **24**（+1 `today-habit-spend-hint.browser`）。 |
| **截图** | `.overnight/shots/b9r8-today-mood-spend-hint-*`、`.overnight/shots/b9r8-today-habit-spend-hints-*`（`node .overnight/capture-batch9-round8.mjs`，端口 **5297**）。 |

**怎么验：**

1. Demo → **今日**：心情卡底部一行支出关联（见 `b9r8-today-mood-spend-hint-zh-light-1440-chromium.png`）；基础目标上方仍有习惯×支出句。
2. 点 **复盘里看心情与支出 →** 应进入复盘且可见心情散点区。
3. 若看不到心情 hint：清除 `life-ledger-preview-demo-showcase-v1` 或打开 `?demo-reset=1` 重新 seed。
4. `npm run test:browser` 应 **24** 条全过。

**未做 / 已知：** `v210.css` reduced-motion 大合并仍 **2.2**；Cloudflare 首次不 seed 账本；旧 demo 缓存可能缺心情 hint。

---

## 上一轮（Batch 9 · Round 7）— Today 洞察与日度 stale 叠层

| 项目 | 说明 |
|------|------|
| **Today** | Demo 下 **今日基础目标** 上方显示近 **30 天** 习惯完成高/低日的平均支出对比，**复盘里看支出关联 →** 跳转复盘（`#todayHabitSpendHint`）。 |
| **时间轴 feed** | 日度模式换月保留旧条目时加 **`ll-stale-veil`** 顶部 shimmer；照片加载完移除 **`stale` + veil**（不再长期半透明）。 |
| **测试** | `npm test` **384**；`npm run test:browser` **23**（+1 daily stale veil）。 |
| **截图** | `.overnight/shots/b9r7-today-habit-spend-hint-*`、`.overnight/shots/b9r7-journal-stale-veil-*`（`node .overnight/capture-batch9-round7.mjs`，端口 **5297**）。 |

**怎么验：**

1. Demo → **今日**：习惯标题下应有一行支出关联文案（见 `b9r7-today-habit-spend-hint-zh-light-1440-chromium.png`）。
2. **时间轴** → **日度** → 切换 **定位月份**：旧内容略 dim + 顶部 shimmer，加载后恢复正常（`b9r7-journal-stale-veil-*`）。
3. `npm run test:browser` 应 **23** 条全过；跑 fakecloud 前先停占用 **5296–5298** 的进程。

**未做 / 已知：** `v210.css` reduced-motion 大合并仍 **2.2**；Cloudflare 首次不 seed 账本；对比基线 ≥ €15 时仍 **+999%** 封顶。

---

## 上一轮（Batch 9 · Round 6）— 筛选闪屏与空状态

| 项目 | 说明 |
|------|------|
| **时间轴 feed** | 周/月模式换月份不再摘掉 **`ready`**（同步重绘无 skeleton 空白）；日度模式换月保留旧条目并加 **`ll-paint-host--stale`** 直至照片加载完。 |
| **习惯 / 复盘** | 筛选无匹配 **`ll-empty-enter`**；复盘 **每个习惯** hairline 空态 **`hydrateHairlineMounts` + `ll-empty`**（`v210.css` Batch 9 r6）。 |
| **测试** | `npm test` **381**；`npm run test:browser` **22**（+1 `journal-feed-filter`）。 |
| **截图** | `.overnight/shots/b9r6-habit-filter-empty-*`、`.overnight/shots/b9r6-review-habit-empty-*`（`node .overnight/capture-batch9-round6.mjs`，端口 **5296**）。 |

**怎么验：**

1. Demo → **时间轴**（默认周度）→ 连换 **定位月份**：列表应连续可见、不整页闪白（对比 Round 5 截图）。
2. **习惯设置** → 搜索 **`zzz-no-match`** → 虚线提示卡居中轻入（见 `b9r6-habit-filter-empty-zh-light-1440-chromium.png`）。
3. **复盘** → 习惯对比区若数据不足，hairline 空插画居中（见 `b9r6-review-habit-empty-*`）。
4. `npm run test:browser` 应 **22** 条全过。

**未做 / 已知：** `v210.css` reduced-motion 大合并仍 **2.2**；Cloudflare 首次不 seed 账本；对比基线 ≥ €15 时仍 **+999%** 封顶。

---

## 上一轮（Batch 9 · Round 5）— 时间轴 skeleton 与空状态

| 项目 | 说明 |
|------|------|
| **时间轴 feed** | `#journalFeed` 带 **`ll-paint-host`**，日度模式拉照片前先显示 **`ll-skeleton--feed`**，加载完加 **`ll-paint-host--ready`**（`prefers-reduced-motion` 仍直出内容）。 |
| **空状态** | 时间轴 feed / 日历条目列表 / 复盘 inspector 表格的空 hairline 卡片统一 **`ll-empty`** 与居中宽度（见 `v210.css` Batch 9 r5）。 |
| **fakecloud** | preview 用例在 **本周** 之后进入 **复盘**，断言 `#reviewLedgerSpendHint` 无四位数 +%、含 **较上月同期** 类文案；`fakecloud-online` 先 **clear + 等 cloud** 减少并行 flake。 |
| **测试** | `npm test` **379**；`npm run test:browser` **21**（+1 `journal-feed-paint`）。 |
| **截图** | `.overnight/shots/b9r5-journal-feed-*`、`.overnight/shots/b9r5-review-inspector-empty-*`（`node .overnight/capture-batch9-round5.mjs`，端口 **5295**）。 |

**怎么验：**

1. Demo → **时间轴**：首次进入日度 feed 应短暂 skeleton 再出现条目（或看 Round 5 截图）。
2. 空数据月 / 复盘明细无数据时，空状态插画居中、有 **llEmptyReveal** 动效（减弱动效下无动画）。
3. `bash .overnight/fakecloud.sh 5296` → showcase 同步 → **复盘** 本月支出 hint 可读。
4. `npm run test:browser` 应 **21** 条全过。

**未做 / 已知：** `v210.css` reduced-motion 大合并仍 **2.2**；Cloudflare 首次不 seed 账本；对比基线 ≥ €15 时仍 **+999%** 封顶。

---

## 上一轮（Batch 9 · Round 4）— 本周 roll-up 与 fakecloud 烟测

| 项目 | 说明 |
|------|------|
| **本周数字 roll** | 点 **‹** 切换工作区周时，完成率、本周支出、最长连续、专注分钟与 Today/记账汇总一样做 **roll** 动画（`prefers-reduced-motion` 下仍为直切）。 |
| **fakecloud** | demo 首次云同步后打开 **本周**，支出 hint 仍为 **较上周同期 +999%** 封顶量级，无四位数 +%（浏览器测内嵌）。 |
| **测试** | `npm test` **379**；`npm run test:browser` **20**（+1 Week roll）。 |
| **截图** | `.overnight/shots/b9r4-week-insights-roll-*`（`node .overnight/capture-batch9-round4.mjs`，端口 **5294**）。 |

**怎么验：**

1. Demo → **本周** → 连点两次 **‹**：完成率等数字应有短暂上滚切换（或看 Round 4 截图）。
2. 可选：`bash .overnight/fakecloud.sh 5298` → `?mode=cloudflare&local-preview=demo-showcase-v1` → 同步完成后 **本周** 卡片下 hint 正常。
3. `npm run test:browser` 应含 **Week insights roll metric values** 与扩展后的 fakecloud preview 用例。

**未做 / 已知：** `v210.css` reduced-motion 大合并仍 **2.2**；Cloudflare 首次不 seed 账本；对比基线 ≥ €15 时仍 **+999%** 封顶。

---

## 上一轮（Batch 9 · Round 3）— 金额 caption 与 Mac 壳 hint 回归

| 项目 | 说明 |
|------|------|
| **Today 金额句** | 昨日支出 **< €15**、今日更高时，**今日支出** 卡显示 **较昨日多 €47.00**（非 +1600%）；见 `b9r3-today-spend-amount-caption-zh-light-1440-chromium.png`。 |
| **Mac 壳** | WebKit 注入 `desktop/mac/shell.js` + `shell.css`，demo **本周** 支出 tile **+999%** 封顶、**复盘** **+26%** 正常；见 `b9r3-mac-week-spend-hint-*` / `b9r3-mac-review-spend-hint-*`。 |
| **测试** | 新 `tests/spend-compare-mac-shell.browser.test.mjs`（2 条）；`npm test` **379**；`npm run test:browser` **19**。 |
| **截图** | `.overnight/shots/b9r3-*`（`node .overnight/capture-batch9-round3.mjs`，端口 **5294**）。 |

**怎么验：**

1. 本地 `?mode=local`：昨天 **−€3**、今天 **−€50** → **今日支出** 卡 **较昨日多 €47.00**（截图同上）。
2. Demo + Mac 窗口或 Round 3 截图：**本周** 数据洞察 **较上周同期 +999%**（非四位数）；**复盘** 本月支出 **+26%**。
3. CI 本地：`npm run test:browser` 应含 **Mac shell demo week and review spending hints** 用例。

**未做 / 已知：** `v210.css` reduced-motion 大合并仍 **2.2**；Cloudflare 首次不 seed 账本；对比基线 ≥ €15 时大额跳升仍 **+999%** 封顶。

---

## 上一轮（Batch 9 · Round 2）— 对比文案与 demo 习惯名

| 项目 | 说明 |
|------|------|
| **增幅封顶** | 支出**上升**时 caption 的 ±% 最高 **999%**（如 demo 本周 **较上周同期 +999%**，不再 +1249%）。 |
| **小基数** | 对比期支出 **< €15** 且今日/本周/本月更高时，改显示 **金额差**（如「较昨日多 €947…」），见 `preferSpendCompareAmountCaption`。 |
| **下降** | 仍相对对比期精确 −%（Round 1 基线修复不变）。 |
| **Demo 习惯** | `buildDemoWorkspace` / `relocalizeDemoWorkspace` 把 starter 习惯 `name` 写成 zh/de/en；习惯设置列表见 **运动**（`b9r2-habits-zh-light-1440-chromium.png`）。 |
| **测试** | `npm test` **379**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b9r2-*`（`node .overnight/capture-batch9-round2.mjs`，端口 **5293**）。 |

**怎么验：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **本周** → 数据洞察 **本周支出** 下应为 **+999%** 或金额句，而非四位数 +%（`b9r2-week-spend-hint-zh-light-1440-chromium.png`）。
2. **习惯设置**（中文）→ 列表首项 **运动**，非 Exercise（同上 habits 截图）。
3. **复盘** → 本月支出摘要 → **较上月同期 +26%** 量级正常（`b9r2-review-spend-hint-zh-dark-390-webkit.png`）。
4. 自建：昨天 **−3 €**、今天 **−50 €** → **今日支出** 卡应显示 **较昨日多 €47…** 而非 +1600%。

**已知：** 对比基线 ≥ €15 时大额跳升仍显示 +999% 封顶；reduced-motion CSS 大合并留 2.2；Cloudflare 首次不 seed 账本。

---

## 上一轮（Batch 9 · Round 1）— 支出对比 % 基线

| 项目 | 说明 |
|------|------|
| **审查** | `.overnight/REVIEW.md` MED #1 已复现并修复；LOW #3 语言偏好分支简化；LOW #1 CSS 合并仍留 2.2。 |
| **逻辑** | 新增 `temporalSpendChangePercent`；Today / Week / Review 的「较昨日 / 上周 / 上月」caption 一律相对**对比期**算 ±%。 |
| **测试** | `ledger-core.test.mjs` 下降 90% 用例；`npm test` **376**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b9r1-spend-decrease-baseline-*`（`node .overnight/capture-batch9-round1.mjs`，端口 **5292**）。 |

**怎么验：**

1. 本地 `?mode=local`（非 demo）：昨天记 **−100 €**、今天 **−10 €** → **今日** 支出卡应显示 **较昨日 −90%**（中文）或 **−90 % gg. gestern**（德文），见 `b9r1-spend-decrease-baseline-zh-light-1440-chromium.png` / `b9r1-spend-decrease-baseline-de-dark-390-webkit.png`。
2. Demo 上若仍是「较昨日 +xxxx%」，多半是昨日基数极小导致的**上升**对比，属预期；下降侧不再出现 −900% 类错误。

**已知：** 支出**增加**时小基数仍可能显示很大的 +%；Cloudflare 首次不 seed 账本；reduced-motion CSS 大合并留 2.2。

---

## 上一批（Batch 8 完成 · Round 10）— 发布整理

Web **2.1.0** / Mac **3.1.0**。Batch 8 已收尾；CHANGELOG **2.1.0** 日期 **2026-11-03**；单元 **374**、浏览器 **17** 全绿（Batch 8 末轮）。

---

## 本轮（Batch 8 · Round 10）— 发布整理

| 项目 | 说明 |
|------|------|
| **CHANGELOG** | `[Unreleased]` 内容并入 `[2.1.0]`（Changed/Fixed）；空 `[Unreleased]` 占位。 |
| **Release notes** | `.github/releases/v2.1.0.md` 增加 Batch 8 亮点段落。 |
| **测试** | 修复 `review-scatter.browser.test.mjs` roll 动画 race；`npm test` **374**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b8r10-release-*`（`node .overnight/capture-batch8-round10.mjs`，端口 **5291**）。 |

**明天早上建议路径（demo）：**

1. `public/index.html?mode=local&local-preview=demo-showcase-v1`
2. **今日** → 滚到 **今日支出** → 分类 chip + **较昨日**（`b8r10-release-today-spending-zh-light-1440-chromium.png`）
3. **本周** → **数据洞察** 五格 + 三行 hint（`b8r10-release-week-insights-zh-light-1440-chromium.png`）
4. **复盘** → **本月支出摘要** → **较上月同期**（`b8r10-release-review-ledger-zh-light-1440-chromium.png`）
5. **记账** 全页（德语深色手机：`b8r10-release-ledger-de-dark-390-webkit.png`）

**Batch 8 各轮细节：** 见下文 Round 9 → Round 1 条目；设计见 `.overnight/LEDGER-DESIGN.md`；Antigravity 审查见 `.overnight/REVIEW.md`（无 HIGH/MED）。

**留到 2.2：** `v210.css` reduced-motion 物理合并；Cloudflare 首次不 seed 账本；demo 对比数字可能很夸张。

---

## 上一轮（Batch 8 · Round 9）— 本周完成率对比

| 项目 | 说明 |
|------|------|
| **逻辑** | `habitCompletionStatsInRange`：区间内（仅到今天）已计分习惯完成比例；`alignedWeekCompletionCompare` 把 Mon–today 窗口平移 7 天比百分点差。 |
| **UI** | `#weekCompletionHint` 在 **完成率** 百分比下，如 demo「较上周同期 −57 个百分点」。 |
| **测试** | `week-insights-completion.test.mjs`；`npm test` **374**；`npm run test:browser` **17**（fakecloud 偶发需清端口）。 |
| **截图** | `.overnight/shots/b8r9-*`（`node .overnight/capture-batch8-round9.mjs`，端口 **5299**）。 |

**怎么验：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **本周** → 滚到 **数据洞察** → 第一格 **完成率** 下见小字（`b8r9-week-completion-hint-zh-light-1440-chromium.png`）。
2. 英文手机：`b8r9-week-completion-hint-en-light-390-webkit.png`。
3. 上周同期无可比习惯数据时 caption 隐藏。

**已知：** demo 上周完成率基数与本周差异大，百分点可能很夸张；reduced-motion CSS 大合并仍留 2.2；Round 10 见 `ROUND10-CHECKLIST.md`。

---

## 上一轮（Batch 8 · Round 8）— 本周日记天数

| 项目 | 说明 |
|------|------|
| **逻辑** | `journalEntryDaysInRange`：区间内 `log.note` 或 `log.moodReason` 非空（与时间轴 feed 一致）；`alignedWeekJournalCompare` 把 Mon–today 窗口平移 7 天比天数。 |
| **UI** | `#weekJournalHint` 在 **专注时长** 金额下，如「2 天写了日记或事件 · 与上周同期相同」。 |
| **测试** | `week-insights-journal.test.mjs`；`npm test` **373**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b8r8-*`（`node .overnight/capture-batch8-round8.mjs`，端口 **5298**）。 |

**怎么验：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **本周** → 滚到 **数据洞察** → **专注时长** 格见小字 caption（`b8r8-week-journal-hint-zh-light-1440-chromium.png`）。
2. 德语深色手机：`b8r8-week-journal-hint-de-dark-390-webkit.png`。
3. 本周没有任何日记/事件记录时 caption 隐藏；仅有日记天也会让洞察空状态插画消失。

**已知：** demo 上周同期日记天数可能与本周相同，caption 会显示「相同」；reduced-motion CSS 大合并仍留 2.2。

---

## 上一轮（Batch 8 · Round 7）— Today vs 昨日

| 项目 | 说明 |
|------|------|
| **逻辑** | `alignedDaySpendCompare`：默认货币当日支出 vs 前一自然日；复用 `spendInsightDeltaPercent`。 |
| **UI** | `.tw-spend-compare` 在「今日支出 · N 笔」下方；demo 上如「较昨日 +2113%」（昨日咖啡、当日房租）。 |
| **测试** | `ledger-core.test.mjs`、`today-spending-hint.test.mjs`；`npm test` **371**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b8r7-*`（`node .overnight/capture-batch8-round7.mjs`，端口 **5297**）。 |

**怎么验：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **今日** → 滚到 **今日支出** → caption 下见 **较昨日**（`b8r7-today-spend-yesterday-zh-light-1440-chromium.png`）。
2. 英文手机：`b8r7-today-spend-yesterday-en-light-390-webkit.png`。
3. 当天无支出、昨天有支出时显示「较昨日无新支出」。

**已知：** demo 昨日基数小，百分比可能很夸张；reduced-motion CSS 大合并仍留 2.2。

---

## 上一轮（Batch 8 · Round 6）— 复盘 vs 上月同期

| 项目 | 说明 |
|------|------|
| **逻辑** | `alignedMonthSpendCompare`：把「1 日至 min(今天, 月末)」与上月相同日历日区间比默认货币支出；复用 `spendInsightDeltaPercent`。 |
| **UI** | `#reviewLedgerSpendHint` 在支出 stat 下方；demo 上如「较上月同期 +26%」。 |
| **测试** | `ledger-core.test.mjs`、`review-spending-compare.test.mjs`；`npm test` **369**；`npm run test:browser` **17**（fakecloud 偶发需清端口重跑）。 |
| **截图** | `.overnight/shots/b8r6-*`（`node .overnight/capture-batch8-round6.mjs`，端口 **5296**）。 |

**怎么验：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **复盘** → 滚到 **本月支出摘要** → 支出数字下见对比行（`b8r6-review-spend-hint-zh-light-1440-chromium.png`）。
2. 德语深色手机：`b8r6-review-spend-hint-de-dark-390-webkit.png`。
3. 切换复盘月份：已结束月份用整月 vs 整上月；当前月用「到今天」对齐。

**已知：** demo 样本上月基数小，百分比可能很夸张；reduced-motion CSS 大合并仍留 2.2。

---

## 上一轮（Batch 8 · Round 5）— 本周支出 vs 上周同期

| 项目 | 说明 |
|------|------|
| **逻辑** | `alignedWeekSpendCompare`：把「周一至 min(周日,今天)」整段平移 7 天，比默认货币支出；复用 `spendInsightDeltaPercent` 算升降幅。 |
| **UI** | `#weekSpendingHint` 小字：如 demo 上「较上周同期 +1249%」/ *+1249% vs same days last week*；无对比数据时隐藏。 |
| **测试** | `ledger-core.test.mjs`、`week-insights-spending.test.mjs`；`npm test` **367**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b8r5-*`（`node .overnight/capture-batch8-round5.mjs`，端口 **5295**）。 |

**怎么验：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **本周** → 滚到 **数据洞察** → 第五格金额下见对比行（`b8r5-week-spending-hint-zh-light-1440-chromium.png`）。
2. 切换语言：英文手机截图见 `b8r5-week-spending-hint-en-light-390-webkit.png`。
3. 上周同期无支出、本周有支出时显示「较上周同期有新增支出」（非 demo 场景可自建数据验证）。

**已知：** demo 样本上周基数小，百分比可能很夸张（数学正确）；reduced-motion CSS 大合并仍留 2.2。

---

## 上一轮（Batch 8 · Round 4）— 本周支出洞察

| 项目 | 说明 |
|------|------|
| **逻辑** | `rangeSummary(ledger, start, end)` 汇总区间内默认货币收支；本周格只计 **周一～今天**（未来日不计）。 |
| **UI** | 洞察区第 5 格「**本周支出**」/ *Week spending* / *Ausgaben diese Woche*；有账本可点 → **记账** 并跳到该周月份。 |
| **测试** | `ledger-core.test.mjs`、`week-insights-spending.test.mjs`；`npm test` **366**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b8r4-*`（`node .overnight/capture-batch8-round4.mjs`，端口 **5294**，需滚到洞察区）。 |

**怎么验：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **本周** → 滚到 **数据洞察** → 见第五格 **−992,93 €** 量级（`b8r4-week-spending-zh-light-1440-chromium.png`）。
2. 点 **本周支出** → 侧栏 **记账** 打开且月份对应该周。
3. 无 `state.ledger` 交易时第五格为 **—** 且不可点。

**已知：** reduced-motion CSS 大合并仍留 2.2；Week/Today 截图需 scroll 才进镜。

---

## 上一轮（Batch 8 · Round 3）— Today 支出卡抛光

| 项目 | 说明 |
|------|------|
| **逻辑** | 新 helper `spendingTodayDetail`：当日支出总额、笔数、金额最大的分类（供 Today 卡与后续洞察复用）。 |
| **UI** | 有当日支出时显示彩色 **分类 chip**（如 demo 的「住房」）+ caption「今日支出 · N 笔」；全新账本不再显示误导性的「本月累计 · €0.00」；S 号卡隐藏重复标题、本月累计单独一行，避免与 −950 € 叠字。 |
| **i18n** | 德语固定待记胶囊改为 **1 offener Posten / N offene Posten**（与「笔数」语义一致）。 |
| **测试** | `ledger-core.test.mjs`、`today-spending-hint.test.mjs` 各 +1；`npm test` **363**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b8r3-*`（`node .overnight/capture-batch8-round3.mjs`，端口 **5293**）。 |

**怎么验：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **今日** → 滚到 **今日支出** → 见大额 + **住房** chip +「1 笔固定待记」+「今日支出 · 1 笔」（`b8r3-today-spending-topcat-zh-light-1440-chromium.png`）。
2. 清空 ledger 的 local 模式 → 仅见 €0、语法 hint、无「本月累计」（`b8r3-today-spending-empty-zh-light-390-chromium.png`）。
3. 德语深色手机：「1 offener Posten」（`b8r3-today-spending-de-dark-390-webkit.png`）。

**已知：** reduced-motion CSS 大合并仍留 2.2；Cloudflare 首次不 seed 记账。

---

## 上一轮（Batch 8 · Round 2）— 待记笔数

| 项目 | 说明 |
|------|------|
| **问题** | Round 1 逻辑已按 ISO 周判待记，但 Today / Money / Review 仍按**模板条数**显示「1 项」，周固定易误导。 |
| **修复** | `recurringPendingOccurrenceCount`：monthly=0/1，weekly=当月该 weekday 尚未记清的日期数；三处 copy 同步（中文「笔」）。 |
| **附带** | 语音输入上下文里的内置习惯名走 `displayHabitName`。 |
| **测试** | `ledger-core.test.mjs` +1；`npm test` **361**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b8r2-*`（`node .overnight/capture-batch8-round2.mjs`，端口 **5292**）。 |

**怎么验：**

1. Demo 记账页：若存在未记清的周固定 + 月固定，横幅应类似「本月尚有 **5** 笔固定待记：…」（见 `b8r2-ledger-recurring-count-zh-light-1440-chromium.png`）。
2. 自建 weekly 固定项，只记第一周 → Today 支出卡胶囊应显示 **N 笔固定待记**（N>1），而非「1 项」。
3. 复盘 **本月支出摘要** 下条数与记账页一致。

**已知：** `v210.css` reduced-motion 大合并仍留 2.2；Cloudflare 首次不 seed 记账（ intentional）。

---

## 上一轮（Batch 8 · Round 1）— 周固定项待记

| 项目 | 说明 |
|------|------|
| **问题** | 周 cadence 固定项：记一笔同分类同金额后，整月待记横幅/Today 胶囊/复盘条会误消失（REVIEW #2）。 |
| **修复** | 按 **ISO 周** 判断每笔是否满足该周发生日；**全部记入账** 对 weekly 补记当月所有已过去的 weekday 发生日。 |
| **测试** | `ledger-core.test.mjs` +2；`npm test` **360**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b8r1-ledger-recurring-*`（`node .overnight/capture-batch8-round1.mjs`，端口 **5291**）。 |

**怎么验：** Demo `?mode=local&local-preview=demo-showcase-v1` → **记账** → 见「本月尚未记：订阅」横幅（对照 `b8r1-ledger-recurring-zh-light-1440-chromium.png`）。若自建 **weekly** 固定项，记第一周后横幅应仍在，直到当月各周都记齐或点 **全部记入账**。

**已知：** UI 计数已改为「笔数」（Round 2）；CSS reduced-motion 大合并仍留 2.2。

---

## 上一批收官（Batch 7 · Round 10）

### Batch 7 · Round 10 · 收官

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 7 Round 10（最后一轮）：** CHANGELOG 发版整理、全量 QA、验收截图；单元 **358**、浏览器 **17** 全绿。

---

## 本轮（Batch 7 · Round 10）— 发版整理与回归

| 项目 | 说明 |
|------|------|
| **CHANGELOG** | `[Unreleased]` 不再重复堆叠；`[2.1.0]` 一条读完记账 + Goal 2 + Batch 7（固定待记：记账横幅 / Today 胶囊 / 复盘条）+ 主要修复。 |
| **CSS 文档** | `CSS-LAYERS.md` 记录 reduced-motion 大合并留到 2.2（REVIEW #4）。 |
| **QA** | 全量 `npm run test:browser`；`npm test` **358**。 |
| **截图** | `.overnight/shots/b7r10-ship-*`（`node .overnight/capture-batch7-round10.mjs`，端口 **5290**）。 |

**明早 5 分钟验收路径：**

1. `public/index.html?mode=local&local-preview=demo-showcase-v1` → **今日**（支出 + 心情 + 固定待记胶囊）→ **记账**（待记横幅、图表）→ **复盘**（Money 摘要 + 散点 + 固定待记条）。对照 `b7r10-ship-today-spending-zh-light-1440-chromium.png`、`b7r10-ship-ledger-month-zh-light-1440-chromium.png`、`b7r10-ship-review-money-zh-light-1440-chromium.png`。
2. 德语深色手机：`b7r10-ship-ledger-recurring-de-dark-390-webkit.png`。
3. 在线假云（可选）：`.overnight/fakecloud.sh` 后跑 fakecloud 相关 browser 套件。

**本夜交付摘要（Goal 1 + Goal 2）：**

- **记账：** `state.ledger` 全链路（本地 / CAS / 备份 / demo / 撤销）；快录、图表、预算、CSV、Today 卡、复盘洞察与散点。
- **固定待记：** 三屏联动（Money / Today / Review），`recurringId` + 启发式去重。
- **动效与空状态：** 合并 `v210.css`、多页 enter/roll/retarget；WebKit label / 不透明 popover 约束已遵守。
- **刻意未做：** `v210.css` reduced-motion 物理合并；更精确的固定项匹配。

**Antigravity REVIEW：** MED CSV 空列等已在先前批次修复；LOW #4 CSS 合并记为 2.2 技术债。

---

## 历史（Batch 7 · Round 9）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 7 Round 9：** 复盘「本月支出摘要」固定待记条 + Antigravity REVIEW 复核；单元 **358**、浏览器 **17** 全绿。

---

## 本轮（Batch 7 · Round 9）— 复盘固定待记条

| 项目 | 说明 |
|------|------|
| **Review · 记账摘要** | 仅当复盘月份 = 当前月且仍有未记固定模板时，支出/收入/结余下方显示蓝色提示条；**去记账** 打开 **记账** 并滚到待记横幅。 |
| **REVIEW.md** | CSV 空列、导出本地化、inspector 短路已在先前批次修复；本轮确认单测仍覆盖。 |
| **QA** | `review-recurring-due.browser.test.mjs`（端口 **5275**）；切到上个月断言条消失；`npm test` **358**；`npm run test:browser` **17**。 |
| **截图** | `.overnight/shots/b7r9-*`（`node .overnight/capture-batch7-round9.mjs`，端口 **5289**）。 |

**怎么试：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **复盘** → **本月支出摘要** 下见「还有 1 项固定收支尚未记入本月。」+ **去记账**（见 `b7r9-review-recurring-due-zh-light-1440-chromium.png`）。
2. 点 **去记账** → **记账** 页蓝色待记条在视口内；**全部记入账** 后回到 **复盘**，条应消失。
3. 复盘标题旁 **‹** 切到上个月 → 条不出现（仅当前月提醒）。

**前后对比：** Round 8 只在 **今日** 卡片提醒；Round 9 在 **复盘** 月度 Money 面板同样跟进，与 Goal 1「复盘支出摘要」集成一致。

**已知：** CSS reduced-motion 大表合并仍未做；同金额手动录入仍会消掉待记（启发式）。

---

## 历史（Batch 7 · Round 8）

Web **2.1.0** / Mac **3.1.0**。

**Batch 7 Round 8：** Today「固定待记」胶囊 + 记账保存刷新 Today 卡；浏览器端口去重；单元 **358**、浏览器 **16** 全绿。

---

## 本轮（Batch 7 · Round 8）— Today 固定待记胶囊

| 项目 | 说明 |
|------|------|
| **Today · 今日支出** | 当月仍有未记的固定模板时，金额旁显示蓝色 **固定待记** 胶囊（如「1 项固定待记」）；点击打开 **记账** 并滚到待记横幅。 |
| **刷新** | 在记账页 **全部记入账** 后，Today 卡片胶囊会消失（无需手动切页）。 |
| **QA** | `today-spending-hint.test.mjs` +1；`today-spending-recurring.browser.test.mjs`（端口 **5274**）；并行测试端口冲突修复（5271–5273 等）；`npm test` **358**；`npm run test:browser` **16**。 |
| **截图** | `.overnight/shots/b7r8-*`（`node .overnight/capture-batch7-round8.mjs`，端口 **5286**）。 |

**怎么试：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **今日** → **今日支出** 卡片应见 **1 项固定待记**（与「平静」心情胶囊可并存，见 `b7r8-today-recurring-pill-zh-light-1440-chromium.png`）。
2. 点胶囊 → **记账** 页出现蓝色待记条 → **全部记入账** → 回到 **今日**，胶囊应隐藏。
3. 浏览非当前自然月的历史日时，胶囊不出现（仅真实「本月」）。

**前后对比：** Round 7 只在记账页提醒待记；Round 8 在 Today 主屏也能看见并一键跳转。

**已知：** CSS reduced-motion 大表合并仍未做；同金额手动录入仍会消掉待记（启发式）。

---

## 历史（Batch 7 · Round 7）

Web **2.1.0** / Mac **3.1.0**。

**Batch 7 Round 7：** 记账「固定收支待记」横幅 + 全部记入账；Today 本月累计 roll；单元 **357**、浏览器 **15** 全绿。

---

## 本轮（Batch 7 · Round 7）— 固定收支待记

| 项目 | 说明 |
|------|------|
| **Money · 待记横幅** | 浏览**当前月**时，若固定模板在本月尚无对应流水，显示蓝色提示条（demo 下通常为「订阅」一项）；**全部记入账** 一次写入并带上 `recurringId`。 |
| **匹配规则** | 新流水带 `recurringId`；旧数据仍按「同月 + 同分类 + 同金额」视为已记（与手动录入兼容）。 |
| **Today** | 侧栏「本月累计 · €…」在金额变化时使用与复盘相同的数字 roll 动画。 |
| **Bugfix** | `bindRecurring` 未接收 `ym`，导致批量按钮此前静默无效。 |
| **测试** | `ledger-core.test.mjs` +2；`ledger-recurring-due.browser.test.mjs`；`npm test` **357**；`npm run test:browser` **15**。 |
| **截图** | `.overnight/shots/b7r7-*`（`node .overnight/capture-batch7-round7.mjs`，端口 **5286**）。 |

**怎么试：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **记账** → 见「本月尚未记：订阅」→ 点 **全部记入账** → 横幅消失、交易列表多一笔 `-12,99 €`（见 `b7r7-ledger-recurring-due-zh-light-1440-chromium.png`）。
2. 固定收支区仍可对单项点 **记一笔**；撤销删除与以前相同。
3. **今日** 快速录入一笔支出 → 观察卡片右侧「本月累计」数字 roll（需非 reduced-motion）。

**前后对比：** Round 6 只有 Today→复盘跳转；Round 7 在记账主流程补上固定项跟进，减少漏记房租/订阅。

**已知：** CSS reduced-motion 大表合并仍未做；同金额不同用途的手动录入会误消待记（可接受启发式）。

---

## 历史（Batch 7 · Round 6）

Web **2.1.0** / Mac **3.1.0**。

**Batch 7 Round 6：** Today 心情胶囊一键进复盘散点图；单元 **355**、浏览器 **14** 全绿。

---

## 本轮（Batch 7 · Round 6）— 心情胶囊 → 复盘

| 项目 | 说明 |
|------|------|
| **Today · 今日支出** | 心情胶囊改为可点击按钮；进入 **复盘** 并滚到「心情与当日支出」散点（无散点则滚到本月支出摘要）。 |
| **样式** | 胶囊 hover 微抬、`focus-visible` 描边；`prefers-reduced-motion` 关闭 hover 位移。 |
| **REVIEW** | Antigravity MED/LOW #1–#3 已在早期批次修复；本轮仅复核单测。 |
| **测试** | `today-spending-hint.test.mjs` +1；`today-spending-mood.browser.test.mjs` 增加点击断言；`npm test` **355**；`npm run test:browser` **14**。 |
| **截图** | `.overnight/shots/b7r6-*`（`node .overnight/capture-batch7-round6.mjs`，端口 **5287**）。 |

**怎么试：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **今日** → 点 **今日支出** 旁的心情胶囊（如「平静」）→ 应到 **复盘** 且看见散点图（见 `b7r6-today-mood-to-review-zh-light-1440-chromium.png`）。
2. 键盘：Tab 到胶囊 → Enter/Space 同样跳转。
3. 无心情或无账本时胶囊不出现（与 Round 5 相同）。

**前后对比：** Round 5 仅展示胶囊；Round 6 把 tooltip 文案兑现为真实导航。

**已知：** CSS reduced-motion 大表合并仍未做（REVIEW #4）；demo 习惯名仍为英文。

---

## 历史（Batch 7 · Round 5）

Web **2.1.0** / Mac **3.1.0**。

**Batch 7 Round 5：** Today 支出卡心情胶囊 + 记账快捷键/复盘 i18n 浏览器回归；单元 **354**、浏览器 **14** 全绿。

---

## 本轮（Batch 7 · Round 5）— 支出 × 心情 + QA

| 项目 | 说明 |
|------|------|
| **Today · 今日支出** | 当天已记录心情且账本有数据时，金额旁显示心情胶囊（很好/平静/低落 → 三语）；tooltip 指向复盘「心情与支出」对照。 |
| **样式** | `v210.css` 末尾：胶囊配色对齐 Today 心情按钮、轻量 enter 动画、`prefers-reduced-motion` 关闭。 |
| **测试** | `today-spending-mood.browser.test.mjs`、`ledger-shortcuts.browser.test.mjs`；`review-habit-scores` 增加 zh「当前连续」断言；`npm test` **354**；`npm run test:browser` **14**。 |
| **截图** | `.overnight/shots/b7r5-*`（`node .overnight/capture-batch7-round5.mjs`，端口 **5288**）。 |

**怎么试：**

1. Demo：`?mode=local&local-preview=demo-showcase-v1` → **今日** 滚到 **今日支出**，应见金额与 **平静 / Ruhig** 等胶囊（见 `b7r5-today-spend-mood-zh-light-390-chromium.png`）。
2. 清空 `state.logs` 当日心情或删掉 `ledger` → 胶囊应消失。
3. **记账** → 不在输入框时 **←** 换月、**/** 搜索、**N** 快速录入（`ledger-shortcuts.browser.test.mjs` 覆盖）。

**前后对比：** Round 4 只有金额与 sparkline；Round 5 在同一张卡上增加心情上下文，与复盘 Money 散点/洞察同一数据轴。

**已知：** 习惯名仍为 demo 英文；CSS reduced-motion 大表合并仍未做（REVIEW #4）。

---

## 历史（Batch 7 · Round 4）

Web **2.1.0** / Mac **3.1.0**。

**Batch 7 Round 4：** 复盘页习惯评分明细重新可见 + 记账 **N** 快捷键；单元 **353**、浏览器 **11** 全绿。

---

## 本轮（Batch 7 · Round 4）— 复盘习惯评分 + N 快捷键

| 项目 | 说明 |
|------|------|
| **复盘 · Habit scores** | 原先被 `pages-858` Round 12 隐藏的 `#inspectorReviewTable` 在宽屏（≥960px）默认展开，展示各习惯完成率与连续天数；窄屏仍为 `<details>`，点开才渲染（性能与 Round 1 短路一致）。 |
| **布局修复** | `setInsightView` 不再写入无效 `month` token；workspace 宽屏下 `data-insight-view="trend"` 与 CSS 一致。 |
| **记账** | 在记账页按 **N** 聚焦 Schnellerfassung（德）/ 快速录入（中）/ quick entry（英）。 |
| **测试** | `tests/review-habit-scores.browser.test.mjs`；`review-scatter` 换月断言更稳；`npm test` **353**；`npm run test:browser` **11**。 |
| **截图** | `.overnight/shots/b7r4-*`（`node .overnight/capture-batch7-round4.mjs`，端口 **5289**）。 |

**怎么试：**

1. **复盘** → 向下滚到 **Habit scores / 习惯评分**（demo 下有多条习惯与 **Focus by topic**）。
2. 手机宽度：点 summary 展开，应看到与桌面相同的数据块。
3. **记账** → 不在输入框时按 **N**，光标应进入快速录入行（见 `b7r4-ledger-quick-focus-de-light-1440-chromium.png`）。

**前后对比：** Round 3 仅 CSV 确认层；Round 4 的 `b7r4-review-habit-scores-en-light-1440-chromium.png` 为宽屏新出现的习惯评分卡片。

**已知：** zh 移动截图里 streak 标签仍为英文 UI 字符串（习惯名 demo 为英）；并行 browser 需各文件独占端口（habit-scores 用 **5290**）。

---

## 历史（Batch 7 · Round 3）

Web **2.1.0** / Mac **3.1.0**。

**Batch 7 Round 3：** CSV 导入改为应用内确认层 + shimmer CSS 去重；单元 **353**、浏览器 **9** 全绿。

---

## 本轮（Batch 7 · Round 3）— CSV 确认层

| 项目 | 说明 |
|------|------|
| **导入 UI** | 选 CSV 后弹出 **导入 CSV / CSV importieren**  sheet，显示将写入的笔数；取消不写库；与编辑交易弹层同 z-index、不透明遮罩。 |
| **CSS** | 骨架屏 shimmer 统一为 `ll-shimmer`；合并 skeleton 的 reduced-motion 规则（REVIEW #4 一小步）。 |
| **测试** | `tests/ledger-csv-import-confirm.browser.test.mjs`（取消保持 0 笔、确认后 2 笔）；`npm test` **353**；`npm run test:browser` **9**。 |
| **截图** | `.overnight/shots/b7r3-*`（`node .overnight/capture-batch7-round3.mjs`，端口 **5291**）。 |

**怎么试：** 侧栏 **记账** → **导入 CSV** → 选银行文件 → 在居中卡片点 **导入** 或 **Abbrechen**（Esc / 点暗区等同取消）。

**前后对比：** Round 2 用系统 `confirm`；Round 3 的 `b7r3-*` 为浅色 zh / 深色 de 移动宽下的同一套产品 UI。

**已知：** 截图里若仍见「虚构示例数据」横幅，是因为本地 demo 未清除，仅 ledger 被置空做演示；真实用户无 demo 时不显示。

---

## 历史（Batch 7 · Round 2）

Web **2.1.0** / Mac **3.1.0**。

**Batch 7 Round 2：** 记账导入确认 + 桌面快捷键 + CSS 去重（审查 LOW #4 一部分）；单元 **353**、浏览器 **8** 全绿。

---

| 项目 | 说明 |
|------|------|
| **CSV 导入** | 选文件后先 `previewGermanBankCsv`，系统 `confirm` 显示将导入/跳过的行数；取消不写库；成功 toast 可带跳过数。 |
| **键盘** | 在记账页且未在输入框打字时：**← / →** 切换月份（与按钮同动画）；**/** 聚焦交易搜索。月份导航 `title` 有三语提示。 |
| **CSS** | 去掉重复的 `rvSparkGrow` 动画块，避免与后面 `rv-spark-grow` 双轨。 |
| **测试** | +1 单元（preview 不 mutate）；`npm test` **353**；`npm run test:browser` **8**。 |
| **截图** | `.overnight/shots/b7r2-*`（`node .overnight/capture-batch7-round2.mjs`，端口 **5294**）。 |

**怎么试：** 侧栏 **记账** → 按 **/** → 输入商户名筛选；焦点不在输入框时按 **←** 看标题月份与汇总数字 retarget。导入 CSV 时会弹出确认框。

**前后对比：** Round 1 的 `b7r1-ledger-import-*` 侧重 CSV 按钮区；Round 2 的 `b7r2-ledger-filter-*` 展示搜索框聚焦与 REWE 过滤；`b7r2-ledger-month-*` 展示移动端切到 **Oktober 2026**。

**已知：** 导入确认仍是浏览器原生 `confirm`（简洁但样式不可定制）。

---

## 历史（Batch 7 · Round 1）

Web **2.1.0** / Mac **3.1.0**。

**Batch 7 启动：** 按 Antigravity `REVIEW.md` 修 CSV 与复盘 inspector 性能；单元 **352**、浏览器 **8** 全绿。

---

## Batch 7 · Round 1 — 审查修复

| 项目 | 说明 |
|------|------|
| **德式 CSV 空列** | Sparkasse 等导出中 `;;` 不再丢列，Betrag 仍读第 8 列；表头含 `Buchungstag` 会跳过首行。 |
| **CSV 导出语言** | 分类列用当前界面语言（如 de → Lebensmittel）。 |
| **复盘 inspector** | `#inspectorReviewTable` 在折叠/隐藏时不跑习惯卡片 HTML。 |
| **测试** | +2 单元用例；`npm test` **352**；`npm run test:browser` **8**。 |
| **截图** | `.overnight/shots/b7r1-ledger-import-*`（重拍：`node .overnight/capture-batch7-round1.mjs`，端口 **5295**）。 |

**建议自测 CSV：** 从银行导出含空 IBAN/BIC 列的 `;` 文件 → **记账 → CSV importieren / 导入 CSV**，行数应与 Betrag 列一致。

---

## 历史（Batch 6 · Round 10 · 收束）

Web **2.1.0** / Mac **3.1.0**。

**Batch 6 十轮结束：** 记账首发 + 全站 Goal 2 抛光 + Antigravity 审查项已修；单元 **350**、浏览器 **8** 全绿。

---

## 明早验收清单（建议 15–25 分钟）

| # | 做什么 | 通过标准 |
|---|--------|----------|
| 1 | 本地 demo | `public/` → `5291` → `?mode=local&local-preview=demo-showcase-v1` 能打开，侧栏 **记账** 有三卡与图表 |
| 2 | 快速录入 | 试 `12,50 咖啡`、`-45 Miete gestern`；列表出现新行，撤销可用 |
| 3 | Today 卡 | **今日** 滚到 **今日支出 / Spending today**，有金额与近 7 日迷你折线（demo） |
| 4 | 复盘 Money | **复盘** → **本月支出摘要**：散点 hover 有 tip；**Tab** 聚焦散点 → **→** 换点（Round 9）；底部 **Budget** 行可见（demo 超支，见 `b6r10-review-budget-*`） |
| 5 | 语言 | **设置 → 语言** en/zh/de 切换，记账默认分类名与 UI 一致 |
| 6 | CSV | **设置 → 导入与导出** 或记账页导出；表头含 `currency`；德式 CSV 可导入（`;`、小数逗号） |
| 7 | 在线 fakecloud | `bash .overnight/fakecloud.sh 5298` → `?mode=cloudflare&local-preview=demo-showcase-v1` 同步后记账有数据 |
| 8 | 文档 | README / SHOWCASE 三语 hero 为 **08-ledger-v21**；手机 Product tour 四图含 Money |
| 9 | 回归 | 习惯颜色/图标选择器：颜色在 `<label>` 外、popover 不透明（2.0.10 修复，勿回归） |
| 10 | 测试（可选） | 仓库根目录 `npm test` + `npm run test:browser`（**11** 项；若 fakecloud 超时先 `pkill -f wrangler`） |

**代表截图（Round 10）：**

- 记账 zh 1440：`.overnight/shots/b6r10-ledger-zh-light-1440-chromium.png`
- Today 支出 de dark 390：`.overnight/shots/b6r10-today-spend-de-dark-390-webkit.png`
- 复盘 Budget + 散点 en：`.overnight/shots/b6r10-review-budget-en-light-1440-webkit.png`
- Mac 壳 Finanzen de：`.overnight/shots/b6r10-ledger-mac-de-light-1440-webkit.png`

重拍：`node .overnight/capture-batch6-round10.mjs`（端口 **5296**）。

---

## 2.1.0 交付摘要（Goal 1 + Goal 2）

### 记账（`state.ledger`）

- **数据：** 账户、分类（图标+色）、流水、月度预算、固定收支；整数 minor + EUR/CNY；缺字段 = 空账本；随本地/云 CAS/备份 v3/demo 迁移；删除可撤销。
- **录入：** 自然语言快速字段、触屏数字键盘、分类 chips、编辑/复制/滑动删除（水平阈值）、德式 CSV 导入导出。
- **视图：** 月汇总、donut/treemap、日历热力、uPlot 趋势、预算条、搜索筛选。
- **集成：** Today **今日支出** 卡、复盘 Money 面板（心情/习惯/专注 vs 支出、预算洞察、散点键盘可达性）。

设计：`.overnight/LEDGER-DESIGN.md` · 第三方：`THIRD_PARTY_NOTICES.md`

### 全站抛光（Batch 3–6）

- 侧栏/页面入场、数字 roll-up、Review 指标与 jump-spy、Week/习惯/长期/时间轴动效、Money 空状态与图表 retarget、设置对话框入场等（主样式 `public/v210.css`）。
- **审查修复（Batch 6 R1）：** 分类英文名、CSV 引号/尾减号、popover Esc/遮罩、滑动删除 vertical 阈值、Mac 记账换月、CNY 汇总提示。

### 刻意未做

- 不改 `functions/`、D1 migration；云端非 preview 首次不 seed 账本。
- **Round 4 起：** `#inspectorReviewTable` 在复盘页宽屏默认可见（窄屏 `<details>` 内展开）；折叠时仍跳过 DOM 计算。

---

## 本轮（Batch 6 · Round 10）改动

| 项目 | 说明 |
|------|------|
| **收束文档** | 本报告顶部验收清单；`CHANGELOG` [Unreleased] 散点键盘说明；`capture-batch6-round10.mjs`。 |
| **测试** | 单元 **350 pass**；浏览器 **8 pass**（本轮实测）。 |
| **截图** | 见上表 `b6r10-*`。 |

---

## 上一轮（Batch 6 · Round 9）改动

| 项目 | 说明 |
|------|------|
| **Scatter 键盘** | 每张图首点可 Tab 聚焦；←→↑↓ / Home / End 在同 SVG 内 roving；`focus-visible` 高亮与 pointer tip 共用样式；`review-scatter-live` 同步。 |
| **测试** | 单元 **350 pass**（+1）；浏览器 **8 pass**（focus + ArrowRight 更新 live 区）。 |
| **截图** | `.overnight/shots/b6r9-scatter-focus-*`。重拍：`node .overnight/capture-batch6-round9.mjs`（**5297**）。 |

**去哪点：** `?local-preview=demo-showcase-v1` → **复盘** → **本月支出摘要** → 在 **Mood vs daily spending** 上按 Tab 直到散点获得焦点（或点击后 Tab），应出现 tip；再按 → 换点。

---

## 快速启动命令

```text
cd public && python3 -m http.server 5291 --bind 127.0.0.1
# http://127.0.0.1:5291/index.html?mode=local&local-preview=demo-showcase-v1
```

```bash
bash .overnight/fakecloud.sh 5298
# http://127.0.0.1:5298/index.html?mode=cloudflare&local-preview=demo-showcase-v1
```

---

## npm test（Batch 6 Round 10 实测）

| 命令 | 结果 |
|------|------|
| `npm test` | **350 pass, 0 fail** |
| `npm run test:browser` | **8 pass, 0 fail** |

---

## 截图索引（Batch 6）

| 轮次 | 场景 | 前缀 |
|------|------|------|
| R1 | 审查修复、CNY 提示 | `b6r1-ledger-*` |
| R2 | Today 支出 spark、分类名 | `b6r2-*` |
| R3–R6 | 复盘洞察、预算、demo 对齐 | `b6r3`–`b6r6` |
| R7 | 周/月习惯卡片、hero retarget | `b6r7-*` |
| R8 | scatter tip、habit spark title | `b6r8-*` |
| R9 | scatter 键盘 focus | `b6r9-*` |
| **R10** | **收束：记账 / Today / 复盘 Budget / Mac 壳** | **`b6r10-*`** |

更早 Batch 3–5：见下文历史节 · 目录 `.overnight/shots/`

---

## 版本与文档

- 版本：**2.1.0**（web）/ **3.1.0**（Mac）
- `CHANGELOG`：`[2.1.0]` 记账首发 + `[Unreleased]` Batch 3–6 抛光
- README **EN / ZH / DE** + SHOWCASE 三语含 Money  fictitious 图

---

<!-- 以下为各轮详细记录，供追溯 -->

## 上一轮（Batch 6 · Round 8）改动

| 项目 | 说明 |
|------|------|
| **Scatter 读数** | 心情 / 习惯 / 专注 vs 支出散点：透明 hit 区 + 不透明浮动 tip（日期、金额、第三维标签）；屏幕阅读器 `review-scatter-live` 同步。 |
| **习惯 spark** | `#reviewHabitCompare` 迷你条每格 SVG `<title>`（三语日期 + 完成/未完成/未计划）；hover 时完成/未完成条略提亮。 |
| **REVIEW 审查** | 历史 MED 项已在早期轮次修复；本轮未复现新问题。 |
| **测试** | 单元 **349 pass**；浏览器 **8 pass**。 |
| **截图** | `.overnight/shots/b6r8-*`（含 tip 可见的 `b6r8-scatter-tip-en-light-1440-chromium.png`）。重拍：`node .overnight/capture-batch6-round8.mjs`（**5298**）。 |

**去哪点：** `?local-preview=demo-showcase-v1` → **复盘** → 滚到 **本月支出摘要** → 在 **Mood vs daily spending** 等散点图上移动鼠标/手指，应出现白底 tip；再向下看 **每个习惯** 表格，悬停 **每日**  spark 条可看原生 tooltip。

**已知遗留：** inspector 习惯表仍隐藏；Tab 逐点聚焦已在 Round 9 完成。

---

## 上一轮（Batch 6 · Round 7）改动

| 项目 | 说明 |
|------|------|
| **分类安全** | 仅中文名与默认分类相同、但图标/颜色不同的自定义分类，切语言时不再被改成 Groceries；新 seed 带 `defaultSlug`。 |
| **复盘 · 周/月习惯** | `#reviewPeriodHabits` 卡片圆角 + 入场交错（与 inspector 同款动效，但在主面板可见）。 |
| **Today hero** | 在日滚动条切换日期时，标题 quote 与 date chip 有短促 `is-day-retarget`（尊重 reduced-motion）。 |
| **README** | 英/中/德 Product tour 手机四图：Today · **Money** · Timeline · Review。 |
| **测试** | 单元 **349 pass**（+1）；浏览器 **8 pass**（偶发 fakecloud 超时需清 wrangler）。 |
| **截图** | `.overnight/shots/b6r7-*`。重拍：`node .overnight/capture-batch6-round7.mjs`（**5299**）。 |

**去哪点：** `?local-preview=demo-showcase-v1` → **复盘** 向下滚看 **按周、按月计的习惯** 卡片；**今日** 点日滚动条换一天看 hero 文案轻弹；README 手机行应含记账竖图。

**已知遗留：** 隐藏 inspector 表格仍未挂到主布局；scatter 点 hover 读数未做。

---

## 上一轮（Batch 6 · Round 6）改动

| 项目 | 说明 |
|------|------|
| **Demo 预算洞察** | `alignDemoMoodWithBudgetOverspend` 在超支分类有支出的日子写入「很好/平静」，其它支出日偏「低落」，便于看到 Budget 行第二句（ calm/good 占比）。 |
| **Inspector** | 有数据时习惯统计为圆角卡片 + 入场交错（`inspector-stat-list--live`）；当前复盘页 CSS 仍隐藏 `review-score-table`，主验收请看 Money 区。 |
| **README** | 英/中/德首屏 hero 改为 `08-ledger-v21` 桌面图。 |
| **测试** | 单元 **348 pass**（+1）；浏览器 **8 pass**。 |
| **截图** | `.overnight/shots/b6r6-review-budget-positive-*`（含 `.review-ledger-insight-delta`）。重拍：`node .overnight/capture-batch6-round6.mjs`（**5298**）。 |

**去哪点：** `?local-preview=demo-showcase-v1` → **复盘** → **Money** 区 **Budget** 行（应含第二句心情对比）；README 打开即见记账 hero。

**已知遗留：** inspector 卡片样式在现行布局中不可见；Today 侧栏缩略图仍为 v6 小图（Product tour 里另有 ledger 图）。

---

## 上一轮（Batch 6 · Round 5）改动

| 项目 | 说明 |
|------|------|
| **预算 · 心情** | 超支分类摘要行可追加第二句：超支类支出日 **低落更少**，或 **很好/平静** 占比更高（`positiveHotRate`）。 |
| **复盘趋势** | 当月尚无可连线完成率时，**Completion, day by day** 卡片显示 hairline 引导，不再只有空 SVG。 |
| **Inspector** | 复盘侧栏习惯明细数据不足时用同一套 hairline 空状态。 |
| **测试** | 单元 **347 pass**（+1）；浏览器 **8 pass**。 |
| **截图** | `.overnight/shots/b6r5-review-budget-*`、`b6r5-review-trend-empty-*`。重拍：`node .overnight/capture-batch6-round5.mjs`（**5297**）。 |

**去哪点：** `?local-preview=demo-showcase-v1` → **复盘** → 向下看 **Money** 区 **Budget** 行（可含心情第二句）；清空当月打卡或新月份 → 看 **每天的完成率** 下方 hairline。

**已知遗留：** README 顶图仍是 Today v6；showcase 默认数据未必触发「平静更多」第二句（逻辑已支持）。

---

## 上一轮（Batch 6 · Round 4）改动

| 项目 | 说明 |
|------|------|
| **复盘 · 预算** | 当月有分类超限时，洞察区新增 **预算** 行：超支个数、合计超出金额、最大超支分类；若在那些分类有支出的日子里「低落」更多，会追加百分比句。 |
| **Demo** | `buildDemoSample` 末尾收紧当月 1–2 个高支出分类的预算上限，showcase 打开复盘即可看到预算行（不影响真实用户账本）。 |
| **习惯表格空状态** | 复盘页 **每个习惯** 无足够数据时显示 hairline 插画 + 三语引导，不再只是一行 insufficient 文案。 |
| **测试** | 单元 **346 pass**（+2）；浏览器 **8 pass**。 |
| **截图** | `.overnight/shots/b6r4-review-budget-*`。重拍：`node .overnight/capture-batch6-round4.mjs`（**5296**）。 |

**去哪点：** 侧栏 **复盘** → 滚到 **本月支出摘要** → 看底部洞察 **预算 / Budget**（demo：`?local-preview=demo-showcase-v1`）。

**已知遗留：** README 首屏大图未换；超支–心情句仅在低落侧更高时出现。

---

## 上一轮（Batch 6 · Round 3）改动

| 项目 | 说明 |
|------|------|
| **复盘 · 记账** | 月支出三卡下方显示 **本月最大支出分类**；洞察区在对比两句后追加 **约高出 N%**（`spendInsightDeltaPercent`）。 |
| **空状态** | `hairlineEmptyMarkup` 统一 `ll-empty-enter`（时间轴列表、feed、习惯设置等复用处）。 |
| **README** | 英/中/德 Product tour 在 Timeline 与手机三图之间插入 **08-ledger-v21** 桌面截图；顶图 hero 仍为 Today v6。 |
| **测试** | 单元 **344 pass**（+1）；浏览器 **8 pass**。 |
| **截图** | `.overnight/shots/b6r3-review-ledger-*`。重拍：`node .overnight/capture-batch6-round3.mjs`（**5295**）。 |

**去哪点：** 侧栏 **复盘** → 向下滚到 **记账 / 本月支出摘要** → 看 **Größte Ausgabe / 最大支出** 与底部 **STIMMUNG/心情** 洞察里的百分比句。

**已知遗留：** README 首屏大图未换；若希望首屏即见记账，可改 hero 或 Today 侧栏缩略图。

---

## 上一轮（Batch 6 · Round 2）改动

| 项目 | 说明 |
|------|------|
| **分类名修复** | 加载 `state.ledger` 时，若默认分类的 `name` 曾被旧逻辑写成「日用」等，`normalize` 会恢复 English canonical，界面切回 en 显示 Groceries 等。 |
| **Today 支出卡** | 有近 7 日支出数据时出现绿色迷你折线（即使今天尚未记账）；样式在 `v210.css`。 |
| **测试** | 单元 **343 pass**（+3）；浏览器 **8 pass**。 |
| **截图** | `.overnight/shots/b6r2-today-spend-*`、`b6r2-ledger-de-dark-390-*`。重拍：`node .overnight/capture-batch6-round2.mjs`（**5294**）。 |

**去哪点：** **今日** 滚动到 **今日支出 / Spending today** 卡，看金额下方折线；**设置 → 语言** 在 en/zh 间切换后打开 **记账**，默认分类名应对应语言。

**已知遗留：** README 顶图仍是 Today v6，未单独突出记账侧栏。

---

## 上一轮（Batch 6 · Round 1）

| 项目 | 说明 |
|------|------|
| **审查修复** | 默认分类英文名不再被 zh/de 初始化覆盖；德语 CSV 引号字段 + 尾缀 `-` 金额；编辑 popover 点遮罩/Esc 关闭；滑动删除需近似水平；Mac **⌘[** / **⌘]** 在 **记账** 页换月。 |
| **外币提示** | 当月有 CNY（或非默认币种）流水但未计入 EUR 汇总时，三卡下方出现灰色说明（`.ledger-fx-hint`）。 |
| **测试** | 单元 **340 pass**（+4）；浏览器 **8 pass**。 |
| **截图** | `.overnight/shots/b6r1-ledger-*`。重拍：`node .overnight/capture-batch6-round1.mjs`（**5293**）。 |

**去哪点：** 侧栏 **记账 / Money / Geld** → 看月汇总与图表；**设置 → 导入与导出** 可试 CSV；Mac 窗口在记账页试菜单 **上一月/下一月**。

**已知遗留：** 若在旧版曾在中文界面首次打开过记账，部分分类 `name` 字段可能已是中文，切回英文界面仍显示该字符串（新用户与新 seed 无此问题）。

---

## 上一轮收束（Batch 5 · Round 10）


| 项目 | 说明 |
|------|------|
| **SHOWCASE 记账图** | 英/中/德各 2 张（桌面 1600×1050、手机 860×1864 量级）：`docs/images/demo-preview/**/{en,zh,de}-08-ledger-v21.png`；侧栏可见 **记账 / Money / Geld** 高亮。 |
| **SHOWCASE 正文** | 三语页面增加桌面 `<img>` + 手机表格列；导语改为 2.1 含记账（其余 v6 图仍为 2.0 卡片改版）。 |
| **测试** | `readme-locales` 断言 ledger 展示图存在；单元 **336 pass**；浏览器 **8 pass**。 |
| **截图** | `.overnight/shots/b5r10-showcase-ledger-*`。重拍 showcase PNG：`node .overnight/capture-showcase-ledger-v21.mjs`（5299）；验收图：`node .overnight/capture-batch5-round10.mjs`（5291）。 |

**验收提示：** 打开 `docs/SHOWCASE.zh-CN.md` 预览或 README 里的 showcase 链接，应看到 **记账** 专节大图；本地 `?local-preview=demo-showcase-v1` 与图一致。

**发版前可选：** README 顶图仍是 Today v6；若希望首屏也体现记账，可另拍 Today 侧栏或换 hero 链到 `08-ledger-v21`。

---

## 上一轮（Batch 5 · Round 9）改动

| 项目 | 说明 |
|------|------|
| **设置 / 备份** | 顶栏 **设置** 或 **导入与导出**：对话框轻微上滑入场；在备份对话框内 **导出 ↔ 导入** 切换时，当前面板再次入场。 |
| **Today 顶行** | hero 与 mood 之间间距略增，顶行与下方卡片网格多留一点呼吸感。 |
| **复盘 scatter** | 系统开启「减少动态效果」时，jump chip 仍用静态外框高亮目标区块，并通过 `aria-live` 读出区块名。 |
| **测试** | 单元 **335 pass**；浏览器 **8 pass**。 |
| **截图** | `.overnight/shots/b5r9-*`。重拍：`node .overnight/capture-batch5-round9.mjs`（端口 **5292**）。 |

**验收提示：** 点 **设置** 看对话框是否轻弹；**设置 → 导入与导出** 再点 **导入** tab；**今日** 顶行 hero/mood 间距是否更匀；复盘（demo 有记账数据时）在 reduced-motion 下点 scatter chip 应仍有外框且屏幕阅读器可感知切换。

---

## 上一轮（Batch 5 · Round 8）改动

| 项目 | 说明 |
|------|------|
| **侧栏切换** | 在 Today / 记账 / 本周等页面间切换：顶栏标题与当前侧栏项有轻微入场/landing 动效（非首次打开应用时）。 |
| **本周换周** | **本周** → **‹ ›** 或 **This week**：页头与三个 module 卡片 retarget，与复盘换月同级。 |
| **记账换月** | **记账** → **‹ ›**：月份标题 + 收入/支出/结余三卡 retarget。 |
| **复盘 scatter** | 复盘页底部 jump chip（心情/习惯/专注）点击后，对应 scatter 区块短暂高亮外框。 |
| **SHOWCASE** | 英/中/德 showcase 文档增加记账入口说明；PNG 仍为 2.0 v6，专用记账图留待发版。 |
| **测试** | 单元 **334 pass**；浏览器 **8 pass**。 |
| **截图** | `.overnight/shots/b5r8-*`。重拍：`node .overnight/capture-batch5-round8.mjs`（端口 **5293**，勿与 fakecloud **5296** 同时跑）。 |

**验收提示：** 侧栏 **今日 → 记账 → 本周** 看顶栏标题是否轻弹；记账与本周各点一次 **‹**；复盘有 scatter 时点 chip 看区块外框。

---

## 上一轮（Batch 5 · Round 7）改动

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
