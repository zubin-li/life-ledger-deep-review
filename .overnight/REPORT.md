# Life Ledger 夜间构建报告（Batch 2 · Round 10 · 终轮）

Round 9 修语言 boot 后，本 round 收尾：**修掉今日支出卡的运行时 bug**、加强移动记账极矮视口留白，并补浏览器回归。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **Today 支出 TDZ** | `ledgerHasEntries` 在 `note` 文案之前声明；此前空账本 + 今日零支出会在 `spending()` 里抛 `ReferenceError`，卡片可能整段不渲染。 |
| **移动记账** | `v213-onboarding.css`：`max-width:640px` 且 `max-height:560px` 时加大页底 padding，减轻 keypad 与底部 dock 重叠。 |
| **测试** | 静态声明顺序 + Playwright（中文 syntax hint、德文 onboarding dismiss 刷新后仍隐藏）→ **289 total**。 |
| **截图** | 6 张 round10 回归（390 今日 hint、390 德文 onboarding 矮视口、1440 中文深色 onboarding）。 |

---

## 明早怎么验（约 3 分钟）

1. `cd public && python3 -m http.server 5291 --bind 127.0.0.1`
2. **Today** → 清空 `state.ledger` 或新本地配置 → 「今日支出」应显示 **试试：12,50 咖啡**，且无控制台报错。
3. **记账**（空账本）→ 出现 onboarding → 点 **知道了** → 刷新 → onboarding 不应再出现。
4. 手机高度模拟（DevTools 390×520）→ 记账页滚动到底，数字键盘不应被 tab bar 完全挡住。
5. 看截图：`.overnight/shots/round10-spending-hint-zh-390-chromium.png`、`round10-ledger-onboarding-de-light-390-webkit.png`
6. `npm test` → **289 pass, 0 fail**

---

## 截图（Round 10）

| 场景 | 文件 |
|------|------|
| 中文 · 今日支出 hint · 390 | `round10-spending-hint-zh-390-chromium.png` / `-webkit.png` |
| 德文 · 记账 onboarding · 390×520 | `round10-ledger-onboarding-de-light-390-chromium.png` / `-webkit.png` |
| 中文深色 · 记账 onboarding · 1440 | `round10-ledger-onboarding-zh-dark-1440-chromium.png` / `-webkit.png` |

Round 9 Mac 预算截图、Round 8 移动预算弹层仍有效。

---

## Batch 2 整体交付（给明早总览）

- **记账（Goal 1）：** `state.ledger`、快录、图表、CSV、Today 卡片、复盘联动、预算 UI、云合并/备份 — 见 `CHANGELOG [2.1.0]` 与 `.overnight/LEDGER-DESIGN.md`。
- **Goal 2：** 复盘散点/跳转/spy、冲突预览、roll 动画、空态/onboarding、习惯 spark 入场等（`v210`–`v223`）。
- **版本：** Web **2.1.0** / Mac **3.1.0**（metadata 测试已对齐）。

---

## 试过 / 未做

- **未做：** fakecloud 真 409（overnight 克隆无 `functions/`）。
- **已修：** Round 10 前存在的 spending 卡 TDZ（静态测试之前只查字符串顺序，未查声明位置）。

---

## 已知问题

- fakecloud 不能代替生产 Cloudflare。
- 极矮视口若真机仍贴边，可只调 `v213` 里 340px/220px 常量。

---

## npm test

**289 pass, 0 fail**（Batch 2 Round 10，实测）。

---

## 下次可做

- 真 cloud 409 + ledger 三路合并手测；habit/mood/spend 相关性文案再打磨；journal 空态与 Today hero 构图可再大胆一版。
