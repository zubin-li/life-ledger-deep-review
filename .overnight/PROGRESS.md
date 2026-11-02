# Overnight progress

## Batch 5 · Round 10 — done（最后一轮）

- **REVIEW.md：** 无未修复 HIGH/MED；CSV/编辑/CSS 已在 R1 落地。
- **SHOWCASE 发版素材：**
  - 虚构 **记账 / Money / Geld** 桌面与手机 PNG：`docs/images/demo-preview/{en,zh,de}-{desktop,mobile}/*-08-ledger-v21.png`（WebKit 生成，reduced-motion 定格）。
  - `docs/SHOWCASE.md`、`SHOWCASE.zh-CN.md`、`SHOWCASE.de-DE.md` 插入桌面大图 + 手机表格列；导语改为 2.1 含记账。
  - `tests/readme-locales.test.mjs` +1：三语 showcase 必须引用且磁盘存在 `*-08-ledger-v21.png`。
  - 脚本：`.overnight/capture-showcase-ledger-v21.mjs`（端口 **5299**）。
- **CHANGELOG：** Unreleased 记录 Batch 5 R10 文档与截图。
- **验收截图：** `capture-batch5-round10.mjs`（5291）→ `b5r10-showcase-ledger-*`（WebKit + Chromium）。
- **测试：** 单元 **336 pass**；浏览器 **8 pass**。

## Half-done

- （无 — overnight 十轮收束）

## Next（明早 / 发版前）

- 可选：Today v6 侧栏缩略图仍无「记账」高亮（专用 `08-ledger-v21` 已覆盖记账页）；README 顶图仍为 Today v6。
- 发版时按 `AGENTS.md` 对齐 tag、GitHub Release、Pages 与生产部署（本克隆无 remote，由 owner 在主仓操作）。

## Known bugs / gaps

- 并行跑多个 fakecloud / 未清理 wrangler 时 browser 套件仍可能超时（清进程后 **8 pass**）。
- 非 preview URL 的纯 Cloudflare 首次访问不会自动 seed 记账（ intentional）。
- demo 工作区有多张 `tw-wall` 卡片，截图脚本取第一张非空墙。

## npm test

```
336 pass, 0 fail (batch 5 round 10, unit gate)
8 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 5 · Round 9 — done

- **REVIEW.md：** 无新 HIGH/MED；历史 CSV/CSS/编辑校验已在 R1 修复。
- **Goal 2 — 设置 / 备份对话框：**
  - `pulseModalDialog`：打开 **设置** 或 **导入与导出** 时 sheet + backdrop 轻入场（`is-modal-enter`）。
  - `pulseBackupTabSwitch`：Export ↔ Import 切换时 tab 与当前 panel `retarget`（`is-tab-switch` / `is-retargeting`）。
- **Goal 2 — Today rhythm：** hero/mood 顶行 `gap` clamp + 与卡片网格间 `margin-bottom`（`v210.css` Batch 5 round 9）。
- **Goal 2 — 复盘 scatter（reduced-motion）：** `is-scatter-spotlight-static` 外框；jump chip 点击写入 `aria-live` 区域。
- **测试：** `view-enter-selectors` +1 契约；单元 **335 pass**；浏览器 **8 pass**。
- **截图：** `capture-batch5-round9.mjs`（5292）→ `b5r9-settings-*`、`b5r9-backup-import-*`、`b5r9-today-hero-*`（WebKit + Chromium）。

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

## Driver gate after round 10
ℹ tests 336 ℹ pass 336 ℹ fail 0 
