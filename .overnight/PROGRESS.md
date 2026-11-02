# Overnight progress

## Batch 4 · Round 9 — done

- **REVIEW.md：** HIGH/MED（CloudBase ledger、多币种分类、预算去重）仍为 Round 1 已修；本轮未新增 Antigravity 项。
- **Goal 1 — 在线预览 + 记账：** `demo-workspace.js` 新增 `isPreviewShowcaseEligible`；`maybeApplyDemoWorkspace` 在 `?local-preview=demo-showcase-v1` 时即使 `mode=cloudflare` 也会 seed 含 `ledger` 的三月虚构示例。`shouldBackfillCloudLedger` + `cloudLedgerBackfillPending`：远端 payload 无 `ledger` 字段但本机已有流水时，首次 pull 完成后 `saveState({ bumpUpdatedAt: true })` 触发 deferred push 回填云端。
- **Goal 2 — 409 QA：** `fakecloud-conflict.browser.test.mjs` 增加 headless 点击 **移除** 冲突条（`dialog.accept`），断言 localStorage 记录清除且行隐藏。
- **Goal 2 — QA：** 新测 `fakecloud-preview-ledger.browser.test.mjs`（5296 fakecloud + preview URL）— 无需手动 PUT，云端 `/api/state` 应含 demo 流水且 Today 支出卡片有金额。
- **Goal 2 — 截图：** `capture-batch4-round9.mjs`（5295）→ Week 全完成 **zh · dark · 390**（`b4r9-week-all-done-zh-dark-390-*`，WebKit + Chromium）。
- **文档：** CHANGELOG、`README` EN/ZH/DE 补充 preview 在线 seed + ledger 回填说明。
- **测试：** `npm test` **325 pass, 0 fail**；`npm run test:browser` **7 pass, 0 fail**。

## Half-done

- （无）

## Next（Round 10）

- 最后一轮：REPORT/CHANGELOG 收束、可选 ledger 页 1440 截图补全、全量 `npm test` + `test:browser` 门禁复述。
- 仍可选：极矮视口 dock/键盘重叠的 CSS 微调。

## Known bugs / gaps

- 极矮视口 dock/键盘：规则仍在 `v210` 的 v213 段。
- Journal streak 在 demo 全量日志上数字会很大（74 天），属样例数据。
- `#longTermGoalsPane` 在 Week 内默认隐藏；「长期」主导航进入 `longrangeView`。
- 非 preview URL 的纯 Cloudflare 首次访问仍不会自动 seed 记账（ intentional；真实用户从空账本开始）。

## npm test

```
325 pass, 0 fail (batch 4 round 9, unit gate)
7 pass, 0 fail (test:browser)
```

## Gate result

_pending (driver appends after commit)_

## Batch 4 · Round 8 — done

- **REVIEW.md：** HIGH/MED（CloudBase ledger、多币种分类、预算去重）仍为 Round 1 已修；本轮未新增 Antigravity 项。
- **Goal 2 — 409 冲突 QA：** 新增 `tests/fakecloud-conflict.browser.test.mjs` — fakecloud 上先为云端 payload 注入 demo ledger，再模拟远端 CAS 前进 + 本机习惯勾选触发 409；经 **设置 → 导入与导出 → 导入** 页可见冲突恢复条与 **Money merge preview**。
- **Goal 2 — Import 标签：** `setBackupTab("import")` 现在会调用 `refreshConflictRecoveryVisibility()`，避免冲突卡片在 Import 面板隐藏时预览不刷新（`app.js`）。
- **Goal 2 — 截图：** `capture-batch4-round8.mjs`（5297）→ Week 全完成 **de · dark · 390**、**Mac 壳 · de · 1440**、长期目标空状态 **de · dark · 390**（`b4r8-*`，WebKit + Chromium）。
- **测试：** `npm test` **322 pass, 0 fail**；`npm run test:browser` **6 pass, 0 fail**（含新 fakecloud 冲突用例）。

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
