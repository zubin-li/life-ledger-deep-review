# Life Ledger 夜间构建总报告（Batch 5 · Round 1 起）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；请在本地浏览器或 Mac 应用窗口验收。

---

## 本轮（Batch 5 · Round 1）改动

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
