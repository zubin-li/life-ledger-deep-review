# Life Ledger 夜间构建报告（Batch 2 · Round 4）

在 Round 3（专注散点、冲突 light 截图）之上，本 round 把复盘 **三张散点并排** 做成宽屏网格，并整理 **三句支出对比** 为 insight 卡片；补齐冲突合并预览的 **深色移动** 回归截图。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **复盘 · 散点网格** | `review-scatter-grid`：1440 宽屏三列 mood / habit / focus；mobile 仍单列带分隔线。 |
| **复盘 · 洞察栈** | `review-ledger-insights`：三句平均支出文案放入浅色卡片，宽屏三列对齐散点。 |
| **样式** | `public/v219-review-scatter-grid.css`（PWA 预缓存已更新）。 |
| **冲突截图** | 390×844 深色：Chromium + WebKit（de），展示 Finanzen-Vorschau / Money merge preview。 |
| **测试** | 277 项全绿（+1 结构契约测试）。 |
| **CHANGELOG** | Unreleased 已记散点网格与 insight 栈。 |

REQUIREMENTS：延续「mood vs habits vs spending 相关洞察」——宽屏一屏扫三张图 + 三句数字，不必纵向滚很长。

---

## 明早怎么验（约 2 分钟）

1. **散点网格：** `public` + `5291`，`?mode=local`，**演示工作区** → **Review** → **Monthly spending** 卡片内应见 **三列散点**（宽屏）与下方 **三句 insight**。对照 `.overnight/shots/review-scatter-grid-light-1440.png`。
2. **冲突预览（移动）：** 对照 `import-conflict-ledger-preview-dark-390.png` 或 WebKit 德语版。
3. **回归：** `npm test` 应为 **277 pass, 0 fail**。

---

## 截图

| 场景 | 文件 |
|------|------|
| 复盘 · 三列散点 + insight（新） | `review-scatter-grid-light-1440.png` |
| 导入 · 冲突预览 dark 390（新） | `import-conflict-ledger-preview-dark-390.png` |
| 导入 · 冲突预览 WebKit dark de 390（新） | `import-conflict-ledger-preview-webkit-dark-de-390.png` |
| Round 3 | `review-focus-spend-light-1440.png`, `import-conflict-ledger-preview-light-1440.png` |

---

## 试过 / 未做

- **未做** fakecloud 真 CAS（clone 仍无 `functions/`）。
- **Capture 修复：** 390 宽需先点 `#mobileToolbarToggle` 再开设置（已写入 `capture-round4.mjs`）。

---

## 已知问题

- fakecloud 不能代表真 Cloudflare 409。
- 冲突 UI 仅在 `pendingRemoteResolution` 记录存在时出现。

---

## npm test

**277 pass, 0 fail**（Batch 2 Round 4，实测）。
