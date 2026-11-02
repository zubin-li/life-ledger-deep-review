# Life Ledger 夜间构建报告（Round 14 · 终稿）

面向明早本地浏览器验收：**Web 2.1.0 / Mac 3.1.0**。本 clone 无 git remote，未部署、未改 Cloudflare `functions/`。

---

## 14 轮交付摘要

| 目标 | 状态 |
|------|------|
| **Goal 1 记账** | `state.ledger`、快速录入、视图与 CSV、Today 卡片、复盘集成、备份/云 JSON、演示数据、撤销删除 |
| **Goal 2 打磨** | `v210`–`v215`：入场、骨架屏、空状态、onboarding、review/习惯动效、数字 roll-up |
| **版本与文档** | `package.json` / PWA / Tauri **2.1.0 / 3.1.0**；README 三语；`CHANGELOG [2.1.0]` 已合并全部 Unreleased 细节 |
| **测试** | **270** 项全绿（含 ledger、CSV、merge、Today hint） |
| **截图** | `.overnight/shots/` 21 张（WebKit + Chromium，1440/390，亮/暗，zh/de，Mac shell） |

设计笔记：`.overnight/LEDGER-DESIGN.md`。第三方：`THIRD_PARTY_NOTICES.md`。

---

## 明早怎么验（5 分钟）

1. 终端：`cd public && python3 -m http.server 5291 --bind 127.0.0.1`
2. 浏览器：`http://127.0.0.1:5291/index.html?mode=local`
3. **侧栏 → 记账 / Money / Finanzen**：试 `12,50 咖啡`、分类 chip、donut/treemap、热力图、预算条、CSV 导入（德式 `;`）。
4. **Today → 今日支出**：演示数据有当日合计；用「仅昨天一笔、今天零笔」数据应见 **今日暂无新支出**、无灰色语法示例（见截图 `today-spending-quiet-zh-390.png`）。
5. **复盘 Review**：月度支出、心情/习惯/专注 vs 支出洞察、趋势线绘制动效。
6. **深色 / 德文 / 390 宽**：侧栏语言与主题切换各扫一眼。

Mac 窗口形态：同一 URL，Playwright 注入 `desktop/mac/shell.js` + `shell.css`（脚本见 `.overnight/capture-ledger.mjs`）。

---

## 截图索引（`.overnight/shots/`）

| 场景 | 文件 |
|------|------|
| 记账 · Chromium 桌面 | `ledger-chromium-light-1440.png` |
| 记账 · WebKit 深色 DE 手机 | `ledger-webkit-dark-de-390.png` |
| 记账 · Mac 窗口 | `ledger-mac-shell-light-1440.png` |
| 记账 · treemap EN/DE | `ledger-treemap-light-1440.png`, `ledger-treemap-de-light-1440.png` |
| 记账 · 手机键盘 | `ledger-mobile-keypad-light-390.png` |
| 记账 · recurring | `ledger-recurring-popover-light-1440.png`, `ledger-recurring-weekly-light-1440.png` |
| 记账 · 中文 onboarding | `ledger-onboarding-zh-light-1440.png` |
| Today · 支出（演示） | `today-spending-zh-390.png` |
| Today · 安静日 | `today-spending-quiet-zh-390.png` |
| 复盘 · 支出面板 | `review-ledger-light-1440.png`, `review-focus-spend-light-1440.png` |
| 复盘 · sparkline / 趋势 | `review-sparks-light-1440.png`, `review-trend-draw-light-1440.png` |
| 周 · 洞察 / 空目标 | `week-insights-light-1440.png`, `week-goals-empty-zh-light-1440.png`, `week-goals-empty-mac-shell-1440.png` |
| 时间轴 / 日记空态 | `timeline-calendar-light-1440.png`, `timeline-enter-light-1440.png`, `journal-empty-zh-light-1440.png` |

重拍命令（需先起 5291 静态服务）：`node .overnight/capture-regression.mjs`

---

## REQUIREMENTS 对照（节选）

- **快速记账、少打扰：** 首笔后隐藏 Today/Money 语法示例；安静日不再用「还没有支出记录」语气（Round 13–14）。
- **crafted 洞察：** 复盘与习惯 sparkline 共用 stagger/绘制语言（Round 10–12）。
- **WebKit 坑：** 交互控件不在 `<label>` 内；弹出层不透明且置顶（未回归）。

完整愿望表：`/Users/ashan/Documents/Codex/ll-361-blank-fix/.hermes/requirements/REQUIREMENTS.md`。

---

## 已知问题（未在本 clone 修）

- **在线版 smoke：** 无 `functions/`，`.overnight/fakecloud.sh` 不能代表 Cloudflare 真环境；记账仍随现有 state JSON 设计，需在完整仓库验 CAS。
- **`mergeRemoteCloudPayload`：** 冲突 adopt 时 local-only ledger 边界 case（既有 gap）。
- **极矮视口：** 记账数字键盘与底部 dock 可能轻微重叠。

---

## 试过但未采纳

- 复制整套 Cloudflare `functions/` 到 overnight clone（违反约束且体积大）。
- Today 安静日单独插画（卡片高度与信息密度已够）。

---

## Round 14 具体改动

- 仅 **CHANGELOG** 整理：`[2.1.0]` 单节可读发布说明；`PROGRESS.md` / 本报告终稿；截图全量回归通过。
- **npm test：270 pass, 0 fail**。

---

## 若还有时间（下一迭代想法）

- 记账与习惯/心情的 **相关图**（散点或双轴）在 review 再加深一层。
- 云冲突 UI 针对 ledger 的专用合并预览。
- 真机验证 keypad vs dock padding。
