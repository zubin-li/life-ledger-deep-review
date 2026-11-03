# Owner feedback pass 2.1.0 — progress

Web **2.1.0** / Mac **3.1.0** · repo `/Users/ashan/Documents/Codex/ll-overnight` (isolated)

## Round 4 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **B 按压动效** | `LifeLedgerInteraction.pressBump`；CSS 合并为 `:is(.ll-press-bump, .is-*-press)`；删重复 `ledgerRowEnter` |
| **D4 配图** | `ledger-subscriptions-empty.svg` + 订阅区空态 CTA；入 `sw.js` |
| **Mac 壳** | `.overnight/capture-mac.mjs` → `fb-r4-mac-today-sheet-zh-light-1440-webkit.png` |
| **回归** | `today-widgets.js` 误用 `root` → `window`（修复 3 个 browser 测试） |
| **C5 CSS** | **6283 → 6252** 行（去重 press + row enter） |
| **截图** | `node .overnight/capture.mjs --port 5294 --prefix fb-r4`（9 张） |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | 仍远高于 50% 目标；需删 legacy wellness 等大块 |
| **B FLIP** | 列表折叠/展开仍无 FLIP；新交易已有 `is-enter` |
| **D4 配图** | habits/journal/week 区头图仍可补 |

### Known bugs / limits

- Headless 天气仍无温度（r1 环境结论不变）。
- `.overnight/base` v2.0.10 worktree 可 `git worktree remove` 清理。

### Evidence (六个已知问题 · r4)

1. **C1** — Mac 壳 sheet 截图；onboarding 仍见底栏（产品 z-index 12000 已设）
2. **C2** — `fb-r4-ledger-zh-light-1440-chromium.png` 单顶栏标题
3. **C3** — 侧栏顺序；`fb-r4-today-zh-light-1440-chromium.png`
4. **C4** — 未重跑；r1 有效
5. **C5** — **6252** 行；单 capture + capture-mac
6. **C6** — r3 `diff-v2010.json` 仍有效；r4 目视矩阵 OK

### Self-review (Round 4)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | press 仅 transform/opacity；`motion-reduced` 一条规则 | OK |
| ui-ux-pro-max | Today sheet Mac 1440 可点关；订阅空态 CTA ≥44px 级 | OK |
| design-dna | 记账 panel 与 week 一致（fb-r4-ledger 目视） | OK |
| Screenshots | WebKit/Chromium r4 矩阵 + Mac sheet | OK |
| Rauno / Linear | 无 layout 动画；页内 stagger 保留 | OK |
| Tests | **425** unit + **72** browser + desktop:check **0** | OK |

### Detail polish (running)

- 订阅空态 hairline + 「添加订阅」链到 recurring
- pressBump 统一入口（legacy class 名保留给测试）

### `npm test` (round 4 gate)

```
425 pass, 0 fail (unit)
72 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. v210.css 大块删除（hidden legacy 样式移出或删）
2. 日组折叠 FLIP / View Transitions 试点
3. CHANGELOG/README 记账段落补「订阅空态 + 动效统一」

---

## Round 3 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **B 周/月动效** | `ledgerStatsScopePulse` + `.is-scope-swap` / `ledger-stats-scope-in`；`data-segment` + `syncSegments`；donut `retarget` 保留 |
| **C5 CSS** | 修复 **v210 语法错误**（`.ledger-skeleton` 误合并导致仅 35 条规则生效 → 复盘习惯分 inspector 全挂）；删 dead `ledger-panels`/trend 样式；**6283** 行（r2: 6290） |
| **C6 vs v2.0.10** | `.overnight/compare-v2010.mjs` → `.overnight/diff-v2010.json` + `base-r3-*` / `head-r3-*` 截图（预期 diff：Today 支出卡、导航、2.1 抛光） |
| **D polish** | Today sheet 关闭 **aria-label** 三语；onboarding **z-index 12000**；mobile 记账 edit popover 底栏避让；`/` 快捷键打开 **⋯** 并 focus 搜索 |
| **测试/回归** | 修 **v210 解析** 后 review habit scores 全绿；ledger shortcuts 改 `.ledger-day-title`；fakecloud 端口 **5298**（避免与 debug 5296 冲突） |
| **截图** | `fb-r3-*` 含 **`fb-r3-today-sheet-zh-light-390-webkit.png`** |
| **死代码** | 移除未使用的 `renderTrend` / uPlot 记账趋势 |

### Half-done

| Area | Next |
|------|------|
| **C5 v210.css** | 仍远高于 50% 目标（6283 vs ~3250）；需继续删 legacy / 合并 press |
| **B 动效** | 统一 `.ll-press-bump`（仍分散 `is-*-press`） |
| **C6** | diff 为像素比例，非视觉 sign-off；habits 32% diff 需人工看是否 OK |

### Known bugs / limits

- Headless 天气仍无温度（r1 环境结论不变）。
- v2.0.10 worktree 在 `.overnight/base`（可 `git worktree remove .overnight/base` 清理）。
- Today onboarding WebKit headless 仍用 `evaluate` 点 dismiss（底栏 hit-test 偶发）；产品侧已抬高 z-index。

### Evidence (六个已知问题 · r3)

1. **C1** — onboarding z-index **12000**；sheet/popover 不透明
2. **C2** — `fb-r3-ledger-zh-light-1440-chromium.png` 单标题
3. **C3** — 侧栏顺序；`fb-r3-ledger-de-dark-390-webkit.png`
4. **C4** — 未重跑；r1 有效
5. **C5** — capture 单脚本；CSS **6283**（修复解析后全站样式恢复）
6. **C6** — `diff-v2010.json` + fb-r3 矩阵

### Self-review (Round 3)

| Checklist | Finding | Action |
|-----------|---------|--------|
| ui-animation | Stats swap opacity/transform only; reduced-motion off | OK |
| ui-ux-pro-max | Sheet/popover z-index ≥ 底栏；touch 关闭 44px 级 | OK |
| design-dna | 记账页 panel 与 week/review 一致（fb-r3 目视） | OK |
| Screenshots | Today sheet + 记账统计页可用 | OK |
| CSS catastrophe | r3 初版破坏 v210 解析 → 已修并加 browser 回归 | **Fixed** |
| Tests | 424 unit + **72** browser + desktop:check 0 | OK |

### `npm test` (round 3 gate)

```
424 pass, 0 fail (unit)
72 pass, 0 fail (browser)
desktop:check 0 fail
```

### Next round priority

1. v210.css 继续瘦身至 <50%
2. 统一 press / list FLIP 动效
3. 更多 hairline 空态插画（habits/journal/week/review）
4. Mac shell sheet 截图

---

## Round 2 (2026-11-03)

### Done

| Area | Notes |
|------|--------|
| **D1 Today 快速记账** | 点 **今日支出** 金额 → `#todayLedgerSheet`（录入 + 推断分类 chip + 最近 3 笔 + **完整统计**）；`LifeLedgerLedgerUI.quickAdd` 与记账页共用提交 |
| **D3 动效研究** | `.overnight/MOTION-RESEARCH.md`（ui-animation / design-dna / Linear·Stripe·Vaul 等） |
| **A5 主路径瘦身** | 记账页 **本月关联洞察** 移入 `.ledger-legacy-viz`（主屏不再显示；DOM/测试保留） |
| **C5 CSS** | `v210.css` **6790 → 6290** 行（删 79 个重复 `@media (prefers-reduced-motion)`；`index.html` 启动时加 `html.motion-reduced`） |
| **C6 截图矩阵** | `node .overnight/capture.mjs --port 5292 --prefix fb-r2` → 9 张 |
| **插画 D4** | `assets/hairline/today-quick-ledger.svg` + PWA shell |
| **测试** | Round 2: **423** unit + **72** browser |

---

## Round 1 (2026-11-03)

（见 git 历史 / REPORT Round 1）

## Driver gate after sprint 1
ℹ tests 423 ℹ pass 423 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 2
ℹ tests 424 ℹ pass 424 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 

## Driver gate after sprint 3
ℹ tests 425 ℹ pass 425 ℹ fail 0 ℹ tests 23 ℹ pass 23 ℹ fail 0 
