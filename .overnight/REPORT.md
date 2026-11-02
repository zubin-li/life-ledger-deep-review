# Life Ledger 夜间构建报告（Batch 2 · Round 8）

Round 7 的复盘 scroll-spy 之后，本 round 补全 **Goal 1 里一直缺口的「设置分类预算」**：数据层本来就有 `state.ledger.budgets` 与 demo 样本，但 UI 空态仍写「后续版本」。现在可以在 Money 页直接设限、看进度、改删并撤销。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **Core API** | `upsertCategoryBudget`、`removeCategoryBudget`、`restoreCategoryBudget`；金额用 `parseAmountToken`（支持 `350,00`）；每分类每月一条上限。 |
| **Money UI** | 区块标题旁 **设置预算**；空态引导点击；有数据时进度条 + ✎/×；不透明全屏 popover（与固定收支同一套 `ledger-edit-popover`）。 |
| **样式** | `public/v223-ledger-budget-ui.css`（标题行、行内操作钮）。 |
| **测试** | +3 单元测试（281 total）。 |
| **文档** | CHANGELOG / README 三语各一句。 |

REQUIREMENTS：owner 要的记账 **budget progress per category**（requirements 表 Goal 1）— 从「只能看 demo」变为 **可编辑、可撤销、随 state 备份/同步**。

---

## 明早怎么验（约 2 分钟）

1. `cd public && python3 -m http.server 5291 --bind 127.0.0.1` → 侧边栏 **记账 / Money**。
2. 滚到 **预算进度**：演示数据应见 Groceries/Dining/Transport 三条进度；点 **设置预算** 选分类、填上限（如 `200`）→ 保存。
3. 点某行 ✎ 改上限；点 × 删除 → toast **撤销** 应恢复。
4. 对照截图：`.overnight/shots/ledger-budget-progress-light-1440-chromium.png`（宽屏 + 侧栏）、`ledger-budget-popover-zh-light-390-chromium.png`（弹层）。
5. `npm test` → **281 pass, 0 fail**。

---

## 截图

| 场景 | 文件 |
|------|------|
| 中文 390 · 设置预算弹层 | `ledger-budget-popover-zh-light-390-chromium.png` / `-webkit.png` |
| 德文深色 390 · 进度条 | `ledger-budget-progress-de-dark-390-chromium.png` |
| 英文宽屏 1440 | `ledger-budget-progress-light-1440-chromium.png` |

---

## 试过 / 未做

- **未做：** fakecloud `functions/`  symlink；Mac shell 专用预算截图。
- **小瑕疵：** Playwright 先 `goto` 再 `reload` 时，弹层标题偶现英文而分类名为中文（语言 init 时序）；真机从设置选语言无此问题。

---

## 已知问题

- fakecloud 仍不能代表真 Cloudflare 409。
- 极矮视口 dock / 键盘重叠（沿用 round 6 记录）。

---

## npm test

**281 pass, 0 fail**（Batch 2 Round 8，实测）。
