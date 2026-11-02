# Life Ledger 夜间构建报告（Batch 2 · Round 5）

在 Round 4（宽屏三列散点 + insight 卡片）之上，本 round 让 **移动复盘** 更易扫读，并补齐 **冲突预览 light 390** 回归图。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **洞察小标题** | 三句支出对比前增加 kicker：**心情 / Mood / Stimmung**、**习惯 / Habits / Gewohnheiten**、**专注 / Focus / Fokus**（与上方散点一一对应）。 |
| **移动样式** | `public/v220-review-mobile.css`：窄屏散点全宽、caption/legend 略收紧；洞察卡片内文 0.82rem；冲突 **Money merge preview** 在手机上字号从 9px 提到约 10–11.5px。 |
| **资源** | `index.html`、`sw.js` 预缓存已挂 v220。 |
| **测试** | 277 项全绿（契约断言 kicker + v220 断点）。 |
| **CHANGELOG** | Unreleased 已记 v220 与 insight kickers。 |

REQUIREMENTS：延续「mood vs habits vs spending 相关洞察」——移动单列时用小标题对齐三张图与三句话，减少「长段落不知道在讲哪张图」的认知负担。

---

## 明早怎么验（约 2 分钟）

1. **移动复盘：** `cd public && python3 -m http.server 5291 --bind 127.0.0.1` → 390 宽、`?mode=local`，语言选中文，**演示工作区** → **复盘** → 向下到 **本月支出摘要**，应见散点全宽 + 洞察卡片内 **心情 / 习惯 / 专注** 小标题。对照 `.overnight/shots/review-scatter-grid-webkit-zh-light-390.png`。
2. **冲突预览（移动浅色）：** 对照 `import-conflict-ledger-preview-light-390.png`（Money merge preview 区块应更易读）。
3. **回归：** `npm test` → **277 pass, 0 fail**。

---

## 截图

| 场景 | 文件 |
|------|------|
| 复盘 · 移动中文 + kickers（新） | `review-scatter-grid-zh-light-390.png`、`review-scatter-grid-webkit-zh-light-390.png` |
| 导入 · 冲突预览 light 390（新） | `import-conflict-ledger-preview-light-390.png` |
| Round 4 | `review-scatter-grid-light-1440.png`、冲突 dark 390 等 |

---

## 试过 / 未做

- **Capture 修复：** 必须从 `public/` 起 HTTP；中文需同时写 `life-ledger-language-preference-set=true`（已写入 `capture-round5.mjs`）。
- **未做** fakecloud 真 CAS（clone 仍无 `functions/`）。

---

## 已知问题

- fakecloud 不能代表真 Cloudflare 409。
- 390 截图视口高度有限，散点三张往往需滚动才看全（与真机一致）。

---

## npm test

**277 pass, 0 fail**（Batch 2 Round 5，实测）。
