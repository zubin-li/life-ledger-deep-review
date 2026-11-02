# Life Ledger 夜间构建总报告（Batch 4 · Round 4）

Web **2.1.0** / Mac **3.1.0**。本仓库为无 remote 的 overnight 克隆；明早请在本地浏览器验收。

---

## 本轮（Batch 4 · Round 4）改动

| 项目 | 说明 |
|------|------|
| **习惯库抛光（Goal 2）** | 侧栏进入「习惯设置」时概览三卡、筛选栏、列表区依次淡入；筛选 pill 有按压反馈；选中习惯行 accent 描边；搜索无结果时虚线提示卡；启用/每日/周期数字在数据变化时会 roll。 |
| **CI** | GitHub Actions 增加独立 `browser` job；仓库内安装 `playwright`，浏览器测试不再硬编码仅本机路径。 |
| **测试** | 单元 **315 pass**；浏览器 **4 pass**。 |
| **截图** | 习惯概览三卡（中/德、亮/暗、1440/390）→ 见下表。 |

### 明早可试

1. **习惯设置** → 从「今日」切过来 → 注意顶部三张统计卡是否依次出现（非整页瞬间弹出）。
2. **习惯设置** → 筛选「已暂停」或搜索不存在的关键词 → 列表下方应出现虚线框提示，而非空白。
3. **习惯设置** → 点选不同习惯 → 当前行应有轻微 accent 光晕（workspace 布局下最明显）。
4. **暂停再启用习惯** → 概览数字「8→7→8」应有短 roll 动画（需 `prefers-reduced-motion` 关闭）。

---

## 截图（Batch 4 Round 4）

| 场景 | 文件 |
|------|------|
| 中文 · 习惯概览三卡 · 1440 light | `b4r4-habits-overview-zh-light-1440-chromium.png` / `-webkit.png` |
| 德文 · 习惯概览三卡 · 390 dark | `b4r4-habits-overview-de-dark-390-chromium.png` / `-webkit.png` |

Round 1–3 截图仍见 `b4r1-*`、`b4r2-*`、`b4r3-*`。重拍：`node .overnight/capture-batch4-round4.mjs`。

---

## 历史（Batch 4 Round 1–3）

- Round 1：Antigravity REVIEW 三条 HIGH/MED（CloudBase ledger、多币种分类、预算去重）。
- Round 2：`npm test` / `test:browser` 拆分；记账录入成功动画。
- Round 3：CSS 合并为单文件 `v210.css`；侧栏竖条 + Today 习惯勾选光晕。

---

## 已知问题 / 未做

- fakecloud 浏览器完整云同步/409 UI 未长跑。
- 复盘「详细指标」折叠内 score-grid 仍易被忽略。
- 极矮视口键盘与底栏可能重叠。

---

## npm test

**315 pass, 0 fail**（`npm test`，Batch 4 Round 4 实测）。  
**4 pass, 0 fail**（`npm run test:browser`）。

---

## 文档与版本

- `CHANGELOG.md`：`[Unreleased] Changed` 含习惯库抛光与 CI browser job。
- 版本号仍为 **2.1.0** / Mac **3.1.0**。
