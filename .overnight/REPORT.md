# Life Ledger 夜间构建总报告（Batch 4 · Round 1）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；明早请在本地浏览器验收。

---

## 本轮（Batch 4 · Round 1）改动

| 项目 | 说明 |
|------|------|
| **Antigravity REVIEW 修复** | CloudBase 同步保留本地 `ledger`；分类 donut/treemap 只计默认货币；备份合并预算按「月+分类」去重。 |
| **测试** | +3 用例 → **313 pass, 0 fail**（`npm test` 实测）。 |
| **截图** | `capture-batch4-round1.mjs`（5294）→ 见下表。 |

### REVIEW 对照

| # | 级别 | 状态 |
|---|------|------|
| 1 | HIGH CloudBase 丢 ledger | ✅ 已修 |
| 2 | MED 多币种分类汇总 | ✅ 已修 |
| 3 | MED 预算 UUID 重复 | ✅ 已修 |
| 4 | LOW CSS 文件过多 | 未做 |
| 5 | LOW browser 测试进默认 test | 未做 |

---

## 明早怎么验（约 3 分钟）

1. **本地记账：** `public/index.html?mode=local&local-preview=demo-showcase-v1` → 侧栏 **记账** → 快速录入、换月看 donut/热力图、预算、CSV。
2. **Today：** **今日支出** 卡片 → 「打开记账」。
3. **复盘：** **本月支出摘要** + 三类 scatter（见截图 `b4r1-review-ledger-zh-dark-1440-*`）。
4. **CloudBase 用户（若用）：** 从旧版远端拉取后本地记账应仍在（需真实 CloudBase 环境；本 round 仅源码+静态测试）。
5. **`npm test`** → **313 pass, 0 fail**。

设计细节见 `.overnight/LEDGER-DESIGN.md`；Batch 3 功能地图仍适用。

---

## 截图（Batch 4 Round 1）

| 场景 | 文件 |
|------|------|
| 德文 · 分类 donut · 1440 light | `b4r1-ledger-donut-de-light-1440-chromium.png` / `-webkit.png` |
| 中文 · 复盘记账面板 · 1440 dark | `b4r1-review-ledger-zh-dark-1440-chromium.png` / `-webkit.png` |
| 英文 · Today 支出卡 · 390 light | `b4r1-today-spending-en-light-390-chromium.png` / `-webkit.png` |

更早批次：`b3r10-*`、`b3r9-*` 等同目录。

重拍 Round 1：`.overnight/capture-batch4-round1.mjs`（端口 **5294**）。

---

## 已知问题 / 未做

- fakecloud 浏览器完整云同步/409 UI 未长跑。
- 极矮视口键盘与底栏可能重叠（`v213`）。
- CSS `v210`–`v231` 多文件合并（REVIEW LOW）。
- Journal streak / score-grid 折叠等与 Batch 3 相同，见 `PROGRESS.md`。

---

## npm test

**313 pass, 0 fail**（Batch 4 Round 1，实测）。

---

## 文档与版本

- `CHANGELOG.md`：`[Unreleased] Fixed` 含本轮三条 Cloud/记账修复。
- 版本号仍为 **2.1.0** / Mac **3.1.0**（无新版本 bump）。
