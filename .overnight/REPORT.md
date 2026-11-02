# Life Ledger 夜间构建总报告（Batch 4 · Round 8）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；明早请在本地浏览器验收。

---

## 本轮（Batch 4 · Round 8）改动

| 项目 | 说明 |
|------|------|
| **409 冲突 · 浏览器回归** | 新测 `fakecloud-conflict.browser.test.mjs`：`.overnight/fakecloud.sh` + `?mode=cloudflare&local-preview=demo-showcase-v1`，先 PUT 补齐云端 `ledger`，再模拟「远端已更新 + 本机 stale PUT」→ **设置 → 导入与导出 → 导入** 页应出现冲突恢复条与 **Money merge preview**。 |
| **Import 标签刷新** | 切到备份「导入」标签时会重新跑 `refreshConflictRecoveryVisibility()`，避免冲突预览在面板隐藏时仍是空（`public/app.js`）。 |
| **截图补全** | Week 全完成横幅：**de · dark · 390**；Mac 注入壳 **de · 1440**；Week 内长期目标空状态 hairline：**de · dark · 390**。 |
| **测试** | 单元 **322 pass**；浏览器 **6 pass**（+1 冲突流程）。 |

### 明早可试

1. **在线版本地替身：** `bash .overnight/fakecloud.sh 5298` → 打开 Cloudflare 模式；改数据后可用另一标签页改 `/api/state` 制造 revision 差，再看导入页的冲突卡片（与自动化测试同思路）。
2. **Week · de · 深色 · 手机宽：** 本周目标全勾完 → 列表底庆祝条（见 `b4r8-week-all-done-de-dark-390-*.png`）。
3. **Mac 窗口感：** 同场景在注入 `desktop/mac/shell.js` 下的 1440 截图（`b4r8-week-all-done-mac-de-light-1440-*.png`）。

---

## 截图（Batch 4 Round 8）

| 场景 | 文件 |
|------|------|
| de · Week 全完成 · 390 dark | `b4r8-week-all-done-de-dark-390-chromium.png` / `-webkit.png` |
| de · Week 全完成 · Mac 壳 1440 light | `b4r8-week-all-done-mac-de-light-1440-chromium.png` / `-webkit.png` |
| de · 长期目标空状态 · 390 dark | `b4r8-long-term-empty-de-dark-390-chromium.png` / `-webkit.png` |

Round 1–7 截图仍见 `b4r1-*` … `b4r7-*`。重拍：`node .overnight/capture-batch4-round8.mjs`（5297）。

---

## 历史（Batch 4 Round 1–7）

- Round 1：Antigravity REVIEW 三条 HIGH/MED（CloudBase ledger、多币种分类、预算去重）。
- Round 2：`npm test` / `test:browser` 拆分；记账录入成功动画。
- Round 3：CSS 合并为单文件 `v210.css`；侧栏竖条 + Today 习惯勾选光晕。
- Round 4：习惯库抛光 + CI browser job。
- Round 5：复盘 summary 预览 + Week module stagger + ledger 进入选择器修复。
- Round 6：复盘 habit chips + Week insights enter。
- Round 7：`pages-art` 接入 shell；Week 横幅 + 窄屏 chips + fakecloud 冒烟。

---

## 已知问题 / 未做

- Cloudflare 模式下 demo 工作区不会像 `?mode=local` 那样自动 seed 带 `ledger` 的样例；首轮纯云端同步可能无记账数据（测试里用 PUT 显式补齐）。
- 409 的「下载保留副本 / 移除」按钮尚未做 headless 点击覆盖。
- 极矮视口键盘与底栏可能重叠。

---

## npm test

**322 pass, 0 fail**（`npm test`，Batch 4 Round 8 实测）。  
**6 pass, 0 fail**（`npm run test:browser`）。

---

## 文档与版本

- `CHANGELOG.md`：`[Unreleased]` 含 fakecloud 冲突测试、Import 标签刷新。
- 版本号仍为 **2.1.0** / Mac **3.1.0**。
