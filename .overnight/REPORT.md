# Life Ledger 夜间构建总报告（Batch 4 · Round 5）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；明早请在本地浏览器验收。

---

## 本轮（Batch 4 · Round 5）改动

| 项目 | 说明 |
|------|------|
| **复盘「详细指标」** | 折叠标题右侧显示本月 **平均习惯完成率** 与 **专注分钟**（中/英/德）；首次进入复盘且未点开时，折叠块有淡 accent 描边与 summary 颜色 pulse，点开后不再提示。 |
| **Week 页** | 从侧栏进入「本周」时，四个 module 卡片依次淡入；周历无日程的格子文案带轻 enter 样式。 |
| **记账页动画** | 修正进入动画 CSS：动画挂在 `#ledgerView.view.is-entering` 上（此前选择器无效，卡片不会 stagger）。 |
| **测试** | 单元 **319 pass**；浏览器 **4 pass**。 |
| **截图** | 复盘折叠 summary、Week 页眉（德/暗/390）→ 见下表。 |

### 明早可试

1. **复盘** → 滚到「详细指标」→ 折叠行应显示类似「平均 13% · 专注 1260 分钟」（demo 数据因月而异）。
2. **复盘** → 若从未点开过，折叠块有一圈淡蓝描边；点开后描边消失，刷新也不再出现。
3. **本周** → 从「今日」切过来 → 四个模块卡片应依次出现（非整页同时弹出）。
4. **记账** → 从侧栏进入 → 摘要卡/面板应再次有 stagger 进入（与 round 3 设计一致，此前 WebKit 可能未生效）。

---

## 截图（Batch 4 Round 5）

| 场景 | 文件 |
|------|------|
| 中文 · 复盘详细指标 summary · 1440 light | `b4r5-review-metrics-zh-light-1440-chromium.png` / `-webkit.png` |
| 德文 · Week 页眉 · 390 dark | `b4r5-week-modules-de-dark-390-chromium.png` / `-webkit.png` |

Round 1–4 截图仍见 `b4r1-*` … `b4r4-*`。重拍：`node .overnight/capture-batch4-round5.mjs`。

---

## 历史（Batch 4 Round 1–4）

- Round 1：Antigravity REVIEW 三条 HIGH/MED（CloudBase ledger、多币种分类、预算去重）。
- Round 2：`npm test` / `test:browser` 拆分；记账录入成功动画。
- Round 3：CSS 合并为单文件 `v210.css`；侧栏竖条 + Today 习惯勾选光晕。
- Round 4：习惯库抛光 + CI browser job。

---

## 已知问题 / 未做

- fakecloud 浏览器完整云同步/409 UI 未长跑。
- Week 全页 module 体 / insights 空状态仍可再抛光。
- 极矮视口键盘与底栏可能重叠。

---

## npm test

**319 pass, 0 fail**（`npm test`，Batch 4 Round 5 实测）。  
**4 pass, 0 fail**（`npm run test:browser`）。

---

## 文档与版本

- `CHANGELOG.md`：`[Unreleased] Changed` 含复盘 summary、Week stagger、ledger 选择器修复。
- 版本号仍为 **2.1.0** / Mac **3.1.0**。
