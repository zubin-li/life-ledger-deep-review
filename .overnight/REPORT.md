# Life Ledger 夜间构建总报告（Batch 4 · Round 9）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；明早请在本地浏览器验收。

---

## 本轮（Batch 4 · Round 9）改动

| 项目 | 说明 |
|------|------|
| **在线预览 + 记账** | `?local-preview=demo-showcase-v1` 在 **Cloudflare 模式**下也会载入含 **Money** 的三月虚构示例（不再仅限 `?mode=local`）。若云端 state 尚无 `ledger` 字段，首次同步后会 **自动 bump + push** 把本机账本写回云端（`shouldBackfillCloudLedger`）。 |
| **409 冲突 · 移除** | 浏览器测试现会 headless 点击导入页的 **移除**，确认冲突 localStorage 条目清除。 |
| **fakecloud 回归** | 新测 `fakecloud-preview-ledger.browser.test.mjs`：清空 storage → 打开 preview URL → 等待 cloud 徽章 → 断言 `/api/state` 上流水数 > 5、Today 支出卡片有金额。 |
| **截图** | Week 全完成庆祝条：**zh · dark · 390**（`b4r9-week-all-done-zh-dark-390-*.png`）。 |
| **文档** | README 三语 + CHANGELOG `[Unreleased]` 补充 preview / backfill 行为。 |
| **测试** | 单元 **325 pass**（+3）；浏览器 **7 pass**（+1 preview-ledger，冲突测含 dismiss）。 |

### 明早可试

1. **在线 + 预览示例（含记账）：**  
   `bash .overnight/fakecloud.sh 5298` → 打开  
   `http://127.0.0.1:5298/index.html?mode=cloudflare&local-preview=demo-showcase-v1`  
   （建议无痕或清空该 origin 的 storage）→ 等「已同步」→ 侧栏 **记账** / Today **今日支出** 应有 demo 数据；开发者工具里 GET `/api/state` 的 `payload.ledger` 应有流水。
2. **Week · zh · 深色 · 手机宽：** 本周目标全勾完 → 列表底庆祝条（见 `b4r9-week-all-done-zh-dark-390-webkit.png`）。
3. **冲突移除：** 沿用 Round 8 的 409 复现步骤，导入页点 **移除** 应清条（自动化已覆盖）。

---

## 截图（Batch 4 Round 9）

| 场景 | 文件 |
|------|------|
| zh · Week 全完成 · 390 dark | `b4r9-week-all-done-zh-dark-390-chromium.png` / `-webkit.png` |

Round 1–8 截图仍见 `b4r1-*` … `b4r8-*`。重拍本轮：`node .overnight/capture-batch4-round9.mjs`（5295）。

---

## 历史（Batch 4 Round 1–8）

- Round 1：Antigravity REVIEW 三条 HIGH/MED（CloudBase ledger、多币种分类、预算去重）。
- Round 2：`npm test` / `test:browser` 拆分；记账录入成功动画。
- Round 3：CSS 合并为单文件 `v210.css`；侧栏竖条 + Today 习惯勾选光晕。
- Round 4：习惯库抛光 + CI browser job。
- Round 5：复盘 summary 预览 + Week module stagger + ledger 进入选择器修复。
- Round 6：复盘 habit chips + Week insights enter。
- Round 7：`pages-art` 接入 shell；Week 横幅 + 窄屏 chips + fakecloud 冒烟。
- Round 8：409 冲突浏览器测 + Import 标签刷新 + de/Mac 截图。

---

## 已知问题 / 未做

- 非 preview 的真实 Cloudflare 首次访问仍从 **空账本** 开始（设计如此）。
- 极矮视口键盘与底栏可能重叠。
- Journal streak 在 demo 上数字偏大（样例数据）。

---

## npm test

**325 pass, 0 fail**（`npm test`，Batch 4 Round 9 实测）。  
**7 pass, 0 fail**（`npm run test:browser`）。

---

## 文档与版本

- 版本号仍为 **2.1.0** / Mac **3.1.0**。
- 设计笔记：`.overnight/LEDGER-DESIGN.md`（Round 1 起）。
