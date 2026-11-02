# Overnight progress

## Batch 5 · Round 9 — done

- **REVIEW.md：** 无新 HIGH/MED；历史 CSV/CSS/编辑校验已在 R1 修复。
- **Goal 2 — 设置 / 备份对话框：**
  - `pulseModalDialog`：打开 **设置** 或 **导入与导出** 时 sheet + backdrop 轻入场（`is-modal-enter`）。
  - `pulseBackupTabSwitch`：Export ↔ Import 切换时 tab 与当前 panel `retarget`（`is-tab-switch` / `is-retargeting`）。
- **Goal 2 — Today rhythm：** hero/mood 顶行 `gap` clamp + 与卡片网格间 `margin-bottom`（`v210.css` Batch 5 round 9）。
- **Goal 2 — 复盘 scatter（reduced-motion）：** `is-scatter-spotlight-static` 外框；jump chip 点击写入 `aria-live` 区域。
- **测试：** `view-enter-selectors` +1 契约；单元 **335 pass**；浏览器 **8 pass**。
- **截图：** `capture-batch5-round9.mjs`（5292）→ `b5r9-settings-*`、`b5r9-backup-import-*`、`b5r9-today-hero-*`（WebKit + Chromium）。

## Half-done

- （无）

## Next（Round 10 · 最后一轮）

- 可选：SHOWCASE 虚构 PNG 含侧栏「记账」；全站 reduced-motion 走查剩余动画。
- 发版前：对齐 showcase 截图与 v6 图集说明。

## Known bugs / gaps

- 并行跑多个 fakecloud / 未清理 wrangler 时 browser 套件仍可能超时（清进程后 **8 pass**）。
- 非 preview URL 的纯 Cloudflare 首次访问不会自动 seed 记账（ intentional）。
- demo 工作区有多张 `tw-wall` 卡片，截图脚本取第一张非空墙。
- SHOWCASE 桌面图仍为 2.0 v6 集，正文已说明记账入口。

## npm test

```
335 pass, 0 fail (batch 5 round 9, unit gate)
8 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 5 · Round 8 — done

- **REVIEW.md：** MED（CSV 币种）与 LOW（编辑 popover 校验）已在代码中修复；本轮未改。LOW（CSS 顺序）当前 `index.html` 已是 `pages-polish` → `v210` 末位，无需调整。
- **Goal 2 — 侧栏 / 页面切换一致性：**
  - `switchToView`：`pulseShellNav` — 顶栏 `#viewTitle.is-view-switch`、当前 `.nav-item.is-landing` 微动效（跳过首次加载）。
  - **本周** 周切换：`pulseWeekWorkspaceMotion` — 页头 + 三个 module 卡 retarget；入场 stagger 含 `#weekView.view.is-entering .module-card`。
  - **记账** 换月：`pulseLedgerMonthMotion` — 标题 h2 + 三张汇总卡 retarget（与复盘换月同级）。
  - **复盘** scatter jump chip：点击目标区块 `is-scatter-spotlight` 外框过渡。
- **文档：** `docs/SHOWCASE*` 三语增加「记账 / Money / Geld」说明（v6 虚构图尚未含记账页，发版前可补专用截图）。
- **测试：** `view-enter-selectors` +1 契约；单元 **334 pass**；浏览器 **8 pass**（并行 fakecloud 争 5296 时需先 `pkill wrangler`）。
- **截图：** `capture-batch5-round8.mjs`（5293，勿与 fakecloud 5296 并行）→ `b5r8-nav-ledger-*`、`b5r8-ledger-month-*`、`b5r8-week-nav-*`。

## Driver gate after round 5
ℹ tests 332 ℹ pass 332 ℹ fail 0 

## Driver gate after round 6
ℹ tests 332 ℹ pass 332 ℹ fail 0 

## Driver gate after round 7
ℹ tests 333 ℹ pass 333 ℹ fail 0 

## Driver gate after round 8
ℹ tests 334 ℹ pass 334 ℹ fail 0 

## Driver gate after round 9
ℹ tests 335 ℹ pass 335 ℹ fail 0 
