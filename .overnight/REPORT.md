# Life Ledger 夜间构建总报告（Batch 4 · Round 2）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；明早请在本地浏览器验收。

---

## 本轮（Batch 4 · Round 2）改动

| 项目 | 说明 |
|------|------|
| **测试脚本** | `npm test` 不再启动 Playwright；浏览器套件改 `npm run test:browser`（REVIEW #5）。 |
| **记账微交互** | 录入成功表单光晕、新交易行进入动画、添加按钮按压（`v232-ledger-entry-feedback.css`）。 |
| **测试** | `npm test` **310 pass**；`test:browser` **4 pass**（+1 脚本断言）。 |
| **截图** | `capture-batch4-round2.mjs`（5295）→ 见下表。 |

### 明早可试

1. **记账页** → 快速录入 `4,20 咖啡` → 列表顶行应短暂高亮进入；输入框有绿色光晕。
2. **CI/沙箱友好：** 只跑 `npm test` 约 0.5s，不再占 5295 端口。
3. **完整 UI 回归：** `npm run test:browser`（约 6s，需 Playwright）。

---

## 截图（Batch 4 Round 2）

| 场景 | 文件 |
|------|------|
| 中文 · 录入后交易列表 · 1440 light | `b4r2-ledger-entry-zh-light-1440-chromium.png` / `-webkit.png` |
| 德文 · 快速录入区 · 390 dark | `b4r2-ledger-quick-de-dark-390-chromium.png` / `-webkit.png` |

Round 1 截图仍见 `b4r1-*`。重拍：`node .overnight/capture-batch4-round2.mjs`。

---

## 历史（Batch 4 Round 1）

Antigravity REVIEW 三条 HIGH/MED 已修（CloudBase ledger、多币种分类、预算去重）。详见 `PROGRESS.md` Round 1 节。

---

## 已知问题 / 未做

- CSS `v210`–`v232` 多文件合并（REVIEW LOW #4）。
- fakecloud 浏览器完整云同步/409 UI 未长跑。
- 极矮视口键盘与底栏可能重叠（`v213`）。
- Journal streak / score-grid 折叠等与 Batch 3 相同。

---

## npm test

**310 pass, 0 fail**（`npm test`，Batch 4 Round 2 实测）。  
**4 pass, 0 fail**（`npm run test:browser`）。

---

## 文档与版本

- `CHANGELOG.md`：`[Unreleased] Added` 含 v232 与 test:browser 说明。
- README EN/ZH/DE：`test` / `test:browser` 表格行已更新。
- 版本号仍为 **2.1.0** / Mac **3.1.0**。
