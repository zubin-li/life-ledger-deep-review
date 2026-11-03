# Owner feedback pass 2.1.0 — progress

Web **2.1.0** / Mac **3.1.0** · repo `/Users/ashan/Documents/Codex/ll-overnight` (isolated)

## Round 1 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **A 记账 redesign (core)** | 日切换 + 快速录入；周/月统计（donut + 月视图日条）；订阅列表；`inferCategoryFromNote` + `rememberCategoryHint`；monthly 自动记账 `autoPostDueMonthlyRecurring`；slim 交易行 + ⋯ 菜单；`categoryBreakdownRange` 修复周分类 |
| **A6 / C3 导航** | `index.html` 顺序；Mac **⌘5** 记账；`NAV_PAGES` 含 `ledger` + 旧 nav-order 迁移；`applyNavOrder` |
| **C1 onboarding 半透明** | `.tc-onboard-hint` → 不透明 `var(--surface-2)` |
| **C2 双标题** | 隐藏 `#ledgerView > .view-scroll-header`（保留顶栏 `#viewTitle`） |
| **C5 capture 脚本** | 删除 121 个 `capture-*.mjs`，保留 **`.overnight/capture.mjs`** |
| **C4 天气空头** | `weather-headless-compare.mjs`：HEAD 与 **v2.0.10** worktree 行为一致（无城市 / 假 cache 均无温度文本）→ **环境限制，非回归** |
| **测试** | `npm test` **423 pass**；`npm run test:browser` **71 pass**；`npm run desktop:check` **0 fail** |
| **截图** | `.overnight/shots/fb-r1-*.png`（7 张，已目视） |
| **文档** | `CHANGELOG [2.1.0]`、`README` EN/ZH/DE 记账段、`REPORT.md` 本轮摘要 |

### Half-done

| Area | Next |
|------|------|
| **B 动效** | 合并 `is-*-press` / `just-*` 为统一 pattern；donut/统计切换 cross-fade |
| **C5 v210.css** | 仍 ~6790 行；需删已移除 UI 规则并合并 `prefers-reduced-motion` |
| **C6 vs v2.0.10** | 未做全页矩阵 diff；已拍 fb-r1 六页样本 |
| **A 日折叠** | 已实现（非筛选时仅 `viewDay` 展开）；点日头切换 `viewDay` |

### Known bugs / limits

- Headless 天气：需真实 `life-ledger-weather-cache` 结构 + 网络 fetch 才有温度（与 v2.0.10 相同）。
- Demo 下跳过 subscription auto-post（避免横幅/示例冲突）。
- 主屏仍保留 hidden legacy viz / wellness 块供测试与深链。

### Evidence (六个已知问题)

1. **C1** — `public/v210.css` `.tc-onboard-hint`；截图 `fb-r1-today-zh-light-1440-chromium.png`（提示卡不透明）
2. **C2** — `#ledgerView > .view-scroll-header { display: none; }`；截图 `fb-r1-ledger-zh-light-1440-chromium.png`
3. **C3** — `index.html` nav + `app.js` `NAV_PAGES`；`fb-r1-ledger-de-dark-390-webkit.png` 底栏 Heute 在 Finanzen 前
4. **C4** — `.overnight/weather-headless-compare.mjs` JSON 输出；worktree `.overnight/base`（用后 `git worktree remove`）
5. **C5** — 121 capture 脚本已删；CSS 行数未达标
6. **C6** — 待 round 2 系统对比；本轮 `fb-r1-*` 目视无侧栏顺序回归

### `npm test` (round 1 gate)

```
423 pass, 0 fail (unit)
71 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. `v210.css` 瘦身（目标 <50% 行数）
2. C6 与 v2.0.10 截图矩阵 + 修回归
3. B 动效整合 + 去掉 dead JS（trend/treemap 主路径）
4. 移除 worktree `.overnight/base`（若仍存在）
