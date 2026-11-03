# Owner feedback pass 2.1.0 — progress

Web **2.1.0** / Mac **3.1.0** · repo `/Users/ashan/Documents/Codex/ll-overnight` (isolated)

## Round 2 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **D1 Today 快速记账** | 点 **今日支出** 金额 → `#todayLedgerSheet`（录入 + 推断分类 chip + 最近 3 笔 + **完整统计**）；`LifeLedgerLedgerUI.quickAdd` 与记账页共用提交 |
| **D3 动效研究** | `.overnight/MOTION-RESEARCH.md`（ui-animation / design-dna / Linear·Stripe·Vaul 等） |
| **A5 主路径瘦身** | 记账页 **本月关联洞察** 移入 `.ledger-legacy-viz`（主屏不再显示；DOM/测试保留） |
| **C5 CSS** | `v210.css` **6790 → 6290** 行（删 79 个重复 `@media (prefers-reduced-motion)`；`index.html` 启动时加 `html.motion-reduced`） |
| **C6 截图矩阵** | `node .overnight/capture.mjs --port 5292 --prefix fb-r2` → 9 张（today/week/longrange/timeline/ledger/review/habits × zh/de × 1440/390）；目视侧栏顺序与面板风格 OK |
| **插画 D4** | `assets/hairline/today-quick-ledger.svg` + PWA shell |
| **测试** | `npm test` **423**；`npm run test:browser` **72**（+1 today sheet）；`npm run desktop:check` **0** |
| **文档** | README EN/ZH/DE 记账段、CHANGELOG `[Unreleased]` r2 |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | 目标 &lt;50% 仍差 ~1600 行；合并 Batch 13 `is-*-press` 规则、删 legacy 专用大块 CSS |
| **B 动效** | 周/月统计区 cross-fade；donut sweep；统一 `.ll-press-bump` |
| **C6 vs v2.0.10** | 未做像素 diff；已拍 fb-r2 全页样本，待 worktree 对比脚本 |

### Known bugs / limits

- Headless 天气仍无温度（与 r1 相同，环境限制）。
- Wellness 深链/空态在 **hidden legacy** 内，需 `evaluate` 点击（测试已更新）。
- `v210.css` 全局 `@media (prefers-reduced-motion)` fallback 对未加 `motion-reduced` 的旧会话仍生效。

### Evidence (六个已知问题 · r2)

1. **C1** — `.tc-onboard-hint` 仍 `background: var(--surface-2)`；`fb-r2-today-zh-light-1440-chromium.png` 目视不透明（模型描述偶误）
2. **C2** — 单标题；`fb-r2-ledger-zh-light-1440-chromium.png`
3. **C3** — 侧栏顺序；`fb-r2-ledger-de-dark-390-webkit.png`
4. **C4** — 未重跑；r1 结论仍有效
5. **C5** — capture 仍单一脚本；CSS **6290** 行（未达标）
6. **C6** — fb-r2 九页矩阵；无 v2.0.10 自动 diff

### Detail polish backlog (r2)

- Today sheet：关闭按钮三语 `aria-label`
- 记账周/月切换动效
- 删除 legacy hidden 块内 dead JS 绑定（低优先）
- Mac shell 下 sheet 底栏避让再验

### Self-review (Round 2)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | Sheet uses transform/opacity only; exit faster than enter | OK |
| ui-animation | No `transition: all` on new sheet rules | OK |
| ui-ux-pro-max | Sheet primary button ≥44px on mobile padding | OK |
| design-dna | Sheet uses existing `panel` / `--surface-2` | OK |
| Rauno / Linear | One motion per tap (sheet OR nav, not both) | OK |
| Screenshots | Ledger 与 week/review 同 panel 语言；nav 记账在复盘前 | OK |
| Tests | 423 + 72 green | OK |

### `npm test` (round 2 gate)

```
423 pass, 0 fail (unit)
72 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. `v210.css` 继续瘦身 + 统一 press 动效
2. v2.0.10 worktree 截图 diff 脚本 + 修回归
3. 周/月 stats cross-fade + donut draw-in
4. Today sheet 截图（打开态）入 REPORT

---

## Round 1 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **A 记账 redesign (core)** | 日切换 + 快速录入；周/月统计（donut + 月视图日条）；订阅列表；`inferCategoryFromNote` + `rememberCategoryHint`；monthly 自动记账 `autoPostDueMonthlyRecurring`；slim 交易行 + ⋯ 菜单；`categoryBreakdownRange` 修复周分类 |
| **A6 / C3 导航** | `index.html` 顺序；Mac **⌘5** 记账；`NAV_PAGES` 含 `ledger` + 旧 nav-order 迁移；`applyNavOrder` |
| **C1 onboarding 半透明** | `.tc-onboard-hint` → 不透明 `var(--surface-2)` |
| **C2 双标题** | 隐藏 `#ledgerView > .view-scroll-header`（保留顶栏 `#viewTitle`） |
| **C5 capture 脚本** | 删除 121 个 `capture-*.mjs`，保留 **`.overnight/capture.mjs`** |
| **C4 天气空头** | `weather-headless-compare.mjs`：HEAD = v2.0.10 headless（无城市 / 假 cache 均无温度文本）→ **环境限制，非回归** |
| **测试** | Round 1: **423** unit + **71** browser |
| **截图** | `.overnight/shots/fb-r1-*.png` |
| **文档** | `CHANGELOG [2.1.0]`、`README` EN/ZH/DE 记账段、`REPORT.md` 本轮摘要 |

## Driver gate after sprint 1
ℹ tests 423 ℹ pass 423 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 
