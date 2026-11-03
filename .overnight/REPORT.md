# Life Ledger 夜间构建总报告（Batch 7 · Round 1）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

**Batch 7 启动：** 按 Antigravity `REVIEW.md` 修 CSV 与复盘 inspector 性能；单元 **352**、浏览器 **8** 全绿。

---

## 本轮（Batch 7 · Round 1）— 审查修复

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
| 10 | 测试（可选） | 仓库根目录 `npm test` + `npm run test:browser`（若 fakecloud 超时先 `pkill -f wrangler`） |

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
- `#inspectorReviewTable` 仍隐藏（习惯评分明细只在 DOM 存在，主面板用 `#reviewPeriodHabits` 等可见区块）。

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
