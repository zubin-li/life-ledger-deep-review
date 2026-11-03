# Overnight progress

## Batch 11 · Round 1 — done

- **REVIEW.md（Batch 10 终稿复审）：** **HIGH #1** 已修复 — `public/sw.js` 的 `NETWORK_FIRST_SUFFIXES` 追加 `"/ledger-core.js"`、`"/ledger-ui.js"`；`tests/service-worker.test.mjs` 断言离线 PWA 会 intercept 这两份脚本。**MED #2** 已修复 — `parseGermanAmount` 与 `parseAmountToken` 一致，仅在有 `,` 与 `.` 并存时去掉千分位 `.`；`tests/ledger-core.test.mjs` 覆盖 `12.50-` 行。**LOW #3** 已修复 — `formatMoney` 归一化 `-0`。**LOW #4** CSS 物理合并仍 **2.2**（未动）。**INFO #5** 浏览器套件在本环境可跑（本轮 `ledger-csv-import-confirm.browser.test.mjs` 通过）。
- **文档：** `CHANGELOG [Unreleased]` 三条 Fixed。
- **测试：** `npm test` **391** pass / 0 fail；单跑 CSV 确认 browser test 1 pass。

## Half-done

- （无）

## Next

- Batch 11 若继续：Goal 2 小抛光或 2.2 候选（`v210.css` reduced-motion 合并）；全量 `npm run test:browser`（39 套件，勿与 capture 5291 并行）。
- Owner 验收路径不变（见 `.overnight/REPORT.md`）。

## Known bugs / gaps

- 纯 Cloudflare 首次访问不自动 seed 记账（ intentional）。
- `v210.css` 分散 `@media (prefers-reduced-motion)` 未物理合并（留 2.2）。
- 中等增幅（如 +80%～+500%）仍用 **+N%** 文案（ intentional）。
- 旧 demo 缓存未 re-seed 时，Today **心情×支出** hint 可能不显示（需清除 preview 存储或 `demo-reset=1`）。
- 旧 demo 缓存未 bump persona 时，`habit.name` 可能仍为英文，但 UI 经 `displayHabitName` 仍本地化。
- Demo 激活时日度 feed 仍可能因虚构照片出现仅照片行（ intentional）；真空白态验本地档并 `meta.demo.active = false` 或清 logs。
- 日历模式下侧栏筛选条默认 CSS 隐藏；筛选无匹配 quiet 条主要在 **照片** 等布局侧栏可见时出现（逻辑已就绪）。

## npm test

```
391 pass, 0 fail (batch 11 round 1, unit gate)
1 pass, 0 fail (ledger-csv-import-confirm.browser.test.mjs spot check)
```

## Gate result

_pending (driver appends after commit)_

---

## Batch 10 · Round 10 — done（终轮 10/10）

- **REVIEW.md：** 无 HIGH/MED；LOW #1 已修复（`syncBackupPreferencesToRuntime` 仅 `explicitLang !== "false"`）；LOW #2 `v210.css` reduced-motion 物理合并仍 **2.2**；LOW #3 极端增幅金额文案为 intentional。
- **终轮 QA：** `npm test` **389** pass；`npm run test:browser` **39** pass（~113s）；复跑 `node .overnight/capture-batch10-round10.mjs`（**5291**）→ `b10r10-release-*` 六张截图；抽检 Today 洞察/支出卡片、de 深色 390 记账页布局正常。
- **发布状态：** Web **2.1.0** / Mac **3.1.0**；`CHANGELOG [2.1.0]` + 空 `[Unreleased]`；`.overnight/ROUND10-CHECKLIST.md` 全勾选；`.overnight/REPORT.md` 终稿已更新。
- **Batch 10 收工：** 记账（Goal 1）+ 抛光（Goal 2）交付完毕；下一迭代见 PROGRESS「Known bugs」与 owner 反馈。

## Driver gate after round 1
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 2
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 3
ℹ tests 384 ℹ pass 384 ℹ fail 0 

## Driver gate after round 4
ℹ tests 386 ℹ pass 386 ℹ fail 0 

## Driver gate after round 5
ℹ tests 388 ℹ pass 388 ℹ fail 0 

## Driver gate after round 6
ℹ tests 389 ℹ pass 389 ℹ fail 0 

## Driver gate after round 7
ℹ tests 389 ℹ pass 389 ℹ fail 0 

## Driver gate after round 8
ℹ tests 389 ℹ pass 389 ℹ fail 0 

## Driver gate after round 9
ℹ tests 389 ℹ pass 389 ℹ fail 0 

## Driver gate after round 10
ℹ tests 389 ℹ pass 389 ℹ fail 0 

## Driver gate after round 1
ℹ tests 391 ℹ pass 391 ℹ fail 0 
