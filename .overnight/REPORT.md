# Life Ledger 夜间构建总报告（Batch 4 · Round 3）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；明早请在本地浏览器验收。

---

## 本轮（Batch 4 · Round 3）改动

| 项目 | 说明 |
|------|------|
| **CSS 合并（REVIEW #4）** | 23 个 `v211`–`v232` 文件并入 `v210.css`；`<head>` 与 Service Worker 预缓存各少 22 条请求。 |
| **Goal 2 微抛光** | 侧栏当前页蓝色竖条淡入；Today 习惯勾选时卡片短暂绿色光晕。 |
| **测试** | `css-consolidation.test.mjs` + 既有样式断言改读 `v210.css` → `npm test` **312 pass**；`test:browser` **4 pass**。 |
| **截图** | `capture-batch4-round3.mjs`（5297）→ 见下表。 |

### 明早可试

1. **任意页面** → 切换侧栏「今日 / 记账 / 复盘」→ 观察左侧 active 竖条是否平滑出现（非瞬间弹出）。
2. **今日 · 习惯卡** → 勾一项 → 卡片应短暂出现 accent 描边（约 0.4s，与原有 ✓ 弹跳并存）。
3. **开发者工具 Network** → 刷新后样式应为 `v210.css` 单文件，不应再请求 `v211-polish.css` 等（旧 SW 需硬刷新一次）。

---

## 截图（Batch 4 Round 3）

| 场景 | 文件 |
|------|------|
| 中文 · Today hero · 1440 light | `b4r3-today-hero-zh-light-1440-chromium.png` / `-webkit.png` |
| 德文 · 记账月度汇总 · 390 dark | `b4r3-ledger-summary-de-dark-390-chromium.png` / `-webkit.png` |

Round 1–2 截图仍见 `b4r1-*`、`b4r2-*`。重拍：`node .overnight/capture-batch4-round3.mjs`。

---

## 历史（Batch 4 Round 1–2）

- Round 1：Antigravity REVIEW 三条 HIGH/MED（CloudBase ledger、多币种分类、预算去重）。
- Round 2：`npm test` / `test:browser` 拆分；记账录入成功动画（已并入 `v210.css`）。

---

## 已知问题 / 未做

- fakecloud 浏览器完整云同步/409 UI 未长跑。
- 极矮视口键盘与底栏可能重叠（规则在 `v210` 内 v213 段）。
- Journal streak / score-grid 折叠等与 Batch 3 相同。
- CI 尚未默认跑 `test:browser`（本地或后续 round 可加）。

---

## npm test

**312 pass, 0 fail**（`npm test`，Batch 4 Round 3 实测）。  
**4 pass, 0 fail**（`npm run test:browser`）。

---

## 文档与版本

- `CHANGELOG.md`：`[Unreleased] Changed` 含 CSS 合并与 Today/侧栏抛光。
- `.overnight/CSS-LAYERS.md`：说明今后只扩展 `v210.css`。
- 版本号仍为 **2.1.0** / Mac **3.1.0**。
