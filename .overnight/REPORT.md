# Life Ledger 夜间构建报告（Batch 2 · Round 6）

在 Round 5（移动 insight 小标题 + 冲突预览字号）之上，本 round 让 **移动复盘** 在长篇散点之间可以一键跳转，并在 **切换月份** 时让支出摘要数字有过渡感。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **跳转药丸** | 本月支出摘要统计下方：`心情 / 习惯 / 专注 / 洞察`（en/de 同步），仅 ≤959px 显示；点击平滑滚到对应散点或洞察卡片。 |
| **锚点与可聚焦** | 各散点 wrap 与洞察栈带 `id` + `scroll-margin-top`，避免被顶栏挡住。 |
| **金额 roll** | 复盘月份变化时，支出/收入/结余调用已有 `rollText`，与 Today「今日支出」一致；尊重 `motion-reduced`。 |
| **样式** | `public/v221-review-scatter-jump.css`；`index.html` / `sw.js` 已挂预缓存。 |
| **测试** | 277 项全绿（`review-scatter-grid.test.mjs` 断言 jump markup + v221）。 |
| **CHANGELOG** | Unreleased 已记 v221。 |

REQUIREMENTS：延续「mood vs habits vs spending 相关洞察」——移动端三张散点 + 三段文字很长，跳转条减少盲目滚动（对应 owner 对复盘相关性的持续打磨）。

---

## 明早怎么验（约 2 分钟）

1. **移动跳转：** `cd public && python3 -m http.server 5291 --bind 127.0.0.1` → 390 宽、浅色、中文、演示工作区 → **复盘** → 滚到 **本月支出摘要**，应见四个药丸；点 **习惯** 应滚到习惯散点。对照 `.overnight/shots/review-scatter-jump-zh-light-390.png`。
2. **宽屏无药丸：** 1440 宽对照 `review-scatter-jump-light-1440.png`（只有三列散点，无跳转条）。
3. **整页回归（德/深色）：** `review-scatter-fullpage-de-dark-390.png`。
4. **月份 roll：** 复盘页用 ← → 换月，观察支出/收入/结余是否短暂 roll（非 reduced-motion 时）。
5. **回归：** `npm test` → **277 pass, 0 fail**。

---

## 截图

| 场景 | 文件 |
|------|------|
| 跳转条 · 移动中文浅色（新） | `review-scatter-jump-zh-light-390.png`、`review-scatter-jump-webkit-zh-light-390.png` |
| 复盘 Money 整页 · 德/深色 390（新） | `review-scatter-fullpage-de-dark-390.png` |
| 宽屏无跳转条（新） | `review-scatter-jump-light-1440.png` |
| Round 5 | `review-scatter-grid-zh-light-390.png`、冲突预览 390 等 |

---

## 试过 / 未做

- **Desktop 不显示跳转条：** 宽屏三列已同屏，药丸会占垂直空间且无必要 — 用 CSS `display:none` ≥960px。
- **未做** fakecloud 真 CAS；未做 chip 选中态（避免与 focus-visible 打架）。

---

## 已知问题

- fakecloud 不能代表真 Cloudflare 409。
- 390 首屏仍可能只看到摘要 + 药丸 + 第一张散点顶部（与真机一致）；用药丸或继续滚动看全三张图。

---

## npm test

**277 pass, 0 fail**（Batch 2 Round 6，实测）。
