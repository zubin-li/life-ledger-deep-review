# Life Ledger 夜间构建总报告（Batch 3 · Round 10 · 收官）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；明早请在本地浏览器验收。

---

## 本轮（Round 10）改动

| 项目 | 说明 |
|------|------|
| **`fakecloud.sh` 修复** | 工作目录改为 `${TMPDIR}/life-ledger-overnight-fakecloud`，避免 Wrangler 向上读取仓库根目录 `wrangler.jsonc`，导致 D1 绑定到生产库名但无 `states` 表（GET `/api/state` 500）。 |
| **fakecloud 实测** | `./.overnight/fakecloud.sh 5298` → GET 404「No cloud state yet」→ PUT `baseRevision:0` 含 `ledger.transactions` → GET revision 1、流水 1 条。 |
| **测试** | `fakecloud-stub.test.mjs` 增加「目录在 repo 外」断言 → **310 pass, 0 fail**。 |
| **截图** | `capture-batch3-round10.mjs`（5296）→ 见下表。 |

---

## 明早怎么验（约 3 分钟）

1. **本地记账：** `public/index.html?mode=local&local-preview=demo-showcase-v1` → 侧栏 **记账 / Money / Finanzen** → 快速录入 `12,50 咖啡`、换月看 donut/热力图 stagger、预算条、CSV 导入（德文 `;` + 引号金额）。
2. **Today：** **今日** → **今日支出** 卡片 → 点「打开记账」；有 demo 数据时应显示当日/本月金额（非 `-0,00`）。
3. **复盘：** **复盘** → 本月支出摘要、散点（心情/习惯/专注 vs 支出）→ 换月看数字 roll + `v231` 面板 stagger。
4. **备份：** 设置 → 导出备份 → 再导入（或 scoped 合并），确认 `state.ledger` 仍在。
5. **在线替身（可选）：** `./.overnight/fakecloud.sh 5298` → `http://127.0.0.1:5298/`（需本机 wrangler；middleware 模拟 Access 邮箱 `qa@example.invalid`）。
6. **`npm test`** → **310 pass, 0 fail**。

设计细节见 `.overnight/LEDGER-DESIGN.md`；REVIEW.md 中 HIGH/MED 项已在 Batch 2–3 修复（见 CHANGELOG `[Unreleased]` Fixed）。

---

## 功能地图（Goal 1 + 2 交付摘要）

- **`state.ledger`**：账户、分类（icon/色）、交易、预算、 recurring；整数 minor + EUR/CNY；随 local / 云 CAS / 备份 v3 / demo / 撤销删除。
- **记账页：** 自然语言快速录入、触摸键盘、列表编辑/复制/滑动删除、donut/treemap、热力图、uPlot 趋势、预算进度、搜索筛选、德 CSV 进/出。
- **Today 卡片 · 今日支出**；**复盘 · 月度支出** + 三类 scatter + 洞察文案。
- **动效（Goal 2）：** Today/journal hero、review roll/stagger、记账空状态、预算/图表换月 retarget（`v224`–`v231`）；遵守 `prefers-reduced-motion`。

---

## 截图（Batch 3 Round 10）

| 场景 | 文件 |
|------|------|
| 中文 · demo 分类 donut · 1440 light | `b3r10-ledger-donut-zh-light-1440-chromium.png` / `-webkit.png` |
| 英文 · Today 支出卡 · 390 dark | `b3r10-today-spending-en-dark-390-chromium.png` / `-webkit.png` |

更早批次：`b3r8-*`（热力图）、`b3r9-*`（空账本 onboarding、复盘记账面板）等同目录。

重拍 Round 10：`.overnight/capture-batch3-round10.mjs`（端口 **5296**）。

---

## 已知问题 / 未做

- **fakecloud** 使用 QA stub API，与生产 `functions/` 行为等价性仅单元测试 + 本轮手测 GET/PUT；未在浏览器里跑完整云同步 UI 409 冲突流。
- **极矮视口** 数字键盘与底栏可能仍重叠（`v213` 已加 padding，真机可再调）。
- **Journal streak** 在 demo 全量日志上数字偏大（样例数据）。
- **score-grid** 在折叠的「详细指标」内，需展开 summary。
- **CSS 切片** 仍为 `v210`–`v231` 多文件（REVIEW LOW #8 合并留待日后）。

---

## 试过但未保留

- 在 repo 内 `.overnight/scratch/fakecloud` 跑 pages dev（会被根 `wrangler.jsonc` 劫持）。
- pages dev 的 `--config`（Wrangler 4 明确不支持）。

---

## npm test

**310 pass, 0 fail**（Batch 3 Round 10，实测）。

---

## 文档与版本

- `CHANGELOG.md`：`[2.1.0]` + `[Unreleased]` 汇总 Batch 3 polish 与 fakecloud 修复。
- `README.md` / `README.zh-CN.md` / `README.de-DE.md`：记账段落已对齐。
- `THIRD_PARTY_NOTICES.md`：MIT/Apache 借鉴项已登记。
