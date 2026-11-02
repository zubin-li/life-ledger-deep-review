# Life Ledger 夜间构建报告（Batch 2 · Round 9）

Round 8 补全预算 UI 后，本 round 修掉 **语言与界面不同步** 的根因，并加强复盘数字 roll 与 Mac 窗口下的记账截图回归。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **语言 boot** | 仅写入 `life-ledger-language`（未点设置里「选语言」）时，首屏也会用存储语言，与备份恢复逻辑一致；修复自动化/深链下「弹层英文、分类中文」。 |
| **测试** | +4 语言 init 单元、+1 记账预算浏览器、复盘 roll 断言更严 → **286 total**。 |
| **截图** | Mac shell 注入下中文预算弹层、德文深色进度条（1440×2 DPR）。 |

---

## 明早怎么验（约 2 分钟）

1. `cd public && python3 -m http.server 5291 --bind 127.0.0.1`
2. 控制台执行 `localStorage.setItem('life-ledger-language','zh')`（**不要**设 preference-set）→ 刷新 → 侧边栏 **记账**，点 **设置预算**，标题应为 **设置预算**，页眉 kicker 为 **记账**。
3. **复盘** → 换上个月 → 支出数字应有短暂 roll 动画（非 reduced-motion）。
4. Mac 窗口感：看 `.overnight/shots/ledger-budget-popover-zh-mac-1440-chromium.png`（圆角 chrome + 中文弹层）。
5. `npm test` → **286 pass, 0 fail**。

---

## 截图

| 场景 | 文件 |
|------|------|
| Mac shell · 中文 · 设置预算弹层 1440 | `ledger-budget-popover-zh-mac-1440-chromium.png` / `-webkit.png` |
| Mac shell · 德文深色 · 预算进度 1440 | `ledger-budget-progress-mac-de-dark-1440-chromium.png` / `-webkit.png` |

Round 8 截图仍有效：`ledger-budget-popover-zh-light-390-*`、`ledger-budget-progress-light-1440-*`。

---

## 试过 / 未做

- **未做：** fakecloud `functions/` symlink（克隆无 Cloudflare functions）。
- **已修：** Round 8 报告的 Playwright 语言时序问题（根因在 boot 的 `currentLang`，非 popover 本身）。

---

## 已知问题

- fakecloud 仍不能代表真 Cloudflare 409。
- 极矮视口 dock / 键盘重叠（沿用）。

---

## npm test

**286 pass, 0 fail**（Batch 2 Round 9，实测）。
