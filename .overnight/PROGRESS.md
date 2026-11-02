# Overnight progress

## Batch 4 · Round 10 — done（最后一轮）

- **REVIEW.md：** HIGH/MED #1–#3 已在 Round 1 落地（`mergeRemoteCloudPayload` on CloudBase、`categoryBreakdown` 默认币种、`mergeLedgerForBackup` 预算 `(month, categoryId)`）；本轮复核代码仍在位，无新增 Antigravity 项。LOW #4–#5 已在 Round 2–3 处理（CSS 合并、`npm test` / `test:browser` 拆分）。
- **Goal 1 — 截图补全：** `capture-batch4-round10.mjs`（5294）→ 记账页 **zh · light · 1440**、**de · dark · 1440**、极矮视口 **en · keypad · 390×520**（`b4r10-*`，WebKit + Chromium，共 6 张）。
- **Goal 2 — 极矮视口：** `v210.css` 将 keypad 底栏避让从仅 `max-height: 560px` 扩展为 **≤640px** 与 **≤480px** 两档（更多 `padding-bottom` / `scroll-margin-bottom`）。
- **Goal 2 — 收束：** `CHANGELOG` 补充 Round 10 移动端避让说明；`REPORT.md` 更新为 Batch 4 总验收指南。
- **测试：** `npm test` **325 pass, 0 fail**；`npm run test:browser` **7 pass, 0 fail**（与 Round 9 capture 并行跑时 fakecloud 5298 偶发竞态；单独跑 browser 套件稳定）。

## Half-done

- （无 — overnight Batch 4 收尾）

## Next（若主人继续）

- 真实 Cloudflare 部署后验证 ledger backfill（非 preview URL 仍从空账本开始，by design）。
- 可选：合并 `Unreleased` CHANGELOG 条目到下一 stable tag 流程。

## Known bugs / gaps

- 极矮视口（&lt;480px 高）仍依赖滚动，未做 fixed keypad overlay。
- Journal streak 在 demo 全量日志上数字会很大（74 天），属样例数据。
- `#longTermGoalsPane` 在 Week 内默认隐藏；「长期」主导航进入 `longrangeView`。
- 非 preview URL 的纯 Cloudflare 首次访问不会自动 seed 记账（ intentional）。

## npm test

```
325 pass, 0 fail (batch 4 round 10, unit gate)
7 pass, 0 fail (test:browser, sequential run)
```

## Gate result

_pending (driver appends after commit)_

## Batch 4 · Round 9 — done

- **REVIEW.md：** HIGH/MED（CloudBase ledger、多币种分类、预算去重）仍为 Round 1 已修；本轮未新增 Antigravity 项。
- **Goal 1 — 在线预览 + 记账：** `demo-workspace.js` 新增 `isPreviewShowcaseEligible`；`maybeApplyDemoWorkspace` 在 `?local-preview=demo-showcase-v1` 时即使 `mode=cloudflare` 也会 seed 含 `ledger` 的三月虚构示例。`shouldBackfillCloudLedger` + `cloudLedgerBackfillPending`：远端 payload 无 `ledger` 字段但本机已有流水时，首次 pull 完成后 `saveState({ bumpUpdatedAt: true })` 触发 deferred push 回填云端。
- **Goal 2 — 409 QA：** `fakecloud-conflict.browser.test.mjs` 增加 headless 点击 **移除** 冲突条（`dialog.accept`），断言 localStorage 记录清除且行隐藏。
- **Goal 2 — QA：** 新测 `fakecloud-preview-ledger.browser.test.mjs`（5296 fakecloud + preview URL）— 无需手动 PUT，云端 `/api/state` 应含 demo 流水且 Today 支出卡片有金额。
- **Goal 2 — 截图：** `capture-batch4-round9.mjs`（5295）→ Week 全完成 **zh · dark · 390**（`b4r9-week-all-done-zh-dark-390-*`，WebKit + Chromium）。
- **文档：** CHANGELOG、`README` EN/ZH/DE 补充 preview 在线 seed + ledger 回填说明。
- **测试：** `npm test` **325 pass, 0 fail**；`npm run test:browser` **7 pass, 0 fail**。

## Driver gate after round 1
ℹ tests 313 ℹ pass 313 ℹ fail 0 

## Driver gate after round 2
ℹ tests 310 ℹ pass 310 ℹ fail 0 

## Driver gate after round 3
ℹ tests 312 ℹ pass 312 ℹ fail 0 

## Driver gate after round 4
ℹ tests 315 ℹ pass 315 ℹ fail 0 

## Driver gate after round 5
ℹ tests 319 ℹ pass 319 ℹ fail 0 

## Driver gate after round 6
ℹ tests 321 ℹ pass 321 ℹ fail 0 

## Driver gate after round 7
ℹ tests 322 ℹ pass 322 ℹ fail 0 

## Driver gate after round 8
ℹ tests 322 ℹ pass 322 ℹ fail 0 

## Driver gate after round 9
ℹ tests 325 ℹ pass 325 ℹ fail 0 

## Driver gate after round 10
ℹ tests 325 ℹ pass 325 ℹ fail 0 
