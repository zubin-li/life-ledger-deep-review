# Overnight progress

## Batch 5 · Round 1 — done

- **REVIEW.md（Antigravity Batch 4 复核）：**
  - **MED #1** — `exportTransactionsCsv` 增加 `amount;currency` 列，多币种导出不混为 `amount_eur`；单测 `exportTransactionsCsv includes amount and currency per row`。
  - **LOW #2** — `index.html` / `sw.js`：`pages-polish.css` 改回在 `v210.css` 之前；`css-consolidation.test.mjs` 断言 v210 为最后一张样式表。
  - **LOW #3** — 编辑 popover 金额解析失败时 `.is-error` + 早退，输入时清除错误态。
  - **LOW #4** — `cloudflare-release.test.mjs` deploy 用 `mkdtemp` 的 `manifestDir`，避免写 `.life-ledger-deployments/`。
- **Goal 2 — 长期页：** `#longrangeView` 进入时分段 stagger（pin / heading / phase board / sections）；`prefers-reduced-motion` 关闭动画。
- **Goal 2 — 截图：** `capture-batch5-round1.mjs`（5293）→ `b5r1-longrange-zh-light-1440-*`、`b5r1-longrange-de-dark-390-*`（WebKit + Chromium）。
- **文档：** CHANGELOG Unreleased、`CSS-LAYERS.md` 更新 cascade 说明。

## Half-done

- （无）

## Next（Round 2）

- 可选：编辑 popover 的 browser 回归（无效金额提交）。
- Goal 2：Journal / Today  hero 或 Focus 计时器微交互；Mac shell 截图（inject shell.js）。
- 若主人要发 stable：合并 Unreleased → tag 流程。

## Known bugs / gaps

- 极矮视口（&lt;480px 高）记账 keypad 仍依赖滚动，未做 fixed overlay。
- `npm run test:browser` 全套件并行时 fakecloud 5296 偶发竞态（与 Batch 4 相同；清 wrangler 后顺序跑 **7 pass**）。
- 非 preview URL 的纯 Cloudflare 首次访问不会自动 seed 记账（ intentional）。

## npm test

```
327 pass, 0 fail (batch 5 round 1, unit gate)
7 pass, 0 fail (test:browser, after killing stray fakecloud)
```

## Gate result

_pending (driver appends after commit)_

## Batch 4 · Round 10 — done（最后一轮）

- **REVIEW.md：** HIGH/MED #1–#3 已在 Round 1 落地（`mergeRemoteCloudPayload` on CloudBase、`categoryBreakdown` 默认币种、`mergeLedgerForBackup` 预算 `(month, categoryId)`）；本轮复核代码仍在位，无新增 Antigravity 项。LOW #4–#5 已在 Round 2–3 处理（CSS 合并、`npm test` / `test:browser` 拆分）。
- **Goal 1 — 截图补全：** `capture-batch4-round10.mjs`（5294）→ 记账页 **zh · light · 1440**、**de · dark · 1440**、极矮视口 **en · keypad · 390×520**（`b4r10-*`，WebKit + Chromium，共 6 张）。
- **Goal 2 — 极矮视口：** `v210.css` 将 keypad 底栏避让从仅 `max-height: 560px` 扩展为 **≤640px** 与 **≤480px** 两档（更多 `padding-bottom` / `scroll-margin-bottom`）。
- **Goal 2 — 收束：** `CHANGELOG` 补充 Round 10 移动端避让说明；`REPORT.md` 更新为 Batch 4 总验收指南。
- **测试：** `npm test` **325 pass, 0 fail**；`npm run test:browser` **7 pass, 0 fail**（与 Round 9 capture 并行跑时 fakecloud 5298 偶发竞态；单独跑 browser 套件稳定）。

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

## Driver gate after round 1
ℹ tests 327 ℹ pass 327 ℹ fail 0 
