# Life Ledger 夜间构建报告（Batch 3 · Round 2）

Round 1 已关闭审查中的数据安全问题。本 round 做 **REVIEW 剩余 LOW项**、**Today/日记 Goal 2 打磨**，并补截图与测试。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **CSS 分层说明** | `.overnight/CSS-LAYERS.md` — 为何 v211–v224 分文件加载，而非单文件合并。 |
| **清理 scratch** | `.overnight/scratch/` 已删并加入 `.gitignore`（审查 #9）。 |
| **isoFromDate 去重** | `ledger-core.js` 只保留 `isoDateFromDate`（审查 #8 部分）。 |
| **Today hero** | 今日 hero 卡片按时段（晨/午/傍晚/夜）有 subtle 背景光晕；习惯进度 >0 时进度环轻 pulse（尊重 reduced-motion）。 |
| **日记时间轴** | composer 聚焦时卡片浮起；日度模式下 **连续记录 streak** 徽章（≥2 天有 note 或 mood 原因）；条目入场与桌面 hover 微抬。 |
| **测试** | **299 pass, 0 fail**（+2 reflection streak）。 |

---

## 明早怎么验（约 3 分钟）

1. `cd public && python3 -m http.server 5291 --bind 127.0.0.1`
2. **今日** — 看 hero 左上角日期 chip 与深色卡片内缘是否有与时段相关的暖/冷色光（仅「今天」）。
3. **时间轴** → 切 **日度 / Daily** — 若连续多天写过日记或心情原因，标题下会出现 pill 形 streak 文案。
4. **时间轴** — 点进某天，在 composer 里输入，看聚焦时边框/阴影是否更明显。
5. `npm test` → **299 pass, 0 fail**

---

## 截图（Batch 3 Round 2）

| 场景 | 文件 |
|------|------|
| 中文 · Today hero · 1440 light | `b3r2-today-hero-zh-light-1440-chromium.png` / `-webkit.png` |
| 德文 · 记账（demo donut 已 wait）· 1440 | `b3r2-ledger-donut-de-light-1440-chromium.png` / `-webkit.png` |
| 英文 · 日记 streak · 390 dark | `b3r2-journal-streak-en-dark-390-chromium.png` / `-webkit.png` |

重拍脚本：`.overnight/capture-batch3-round2.mjs`（端口 5296）。

---

## REVIEW LOW 处理

| # | 状态 |
|---|------|
| 8 CSS 合并 | **文档化**（`CSS-LAYERS.md`）+ 去掉 JS 重复日期函数；未物理合并 CSS（避免巨型 diff）。 |
| 9 scratch 镜像 | **已删 + gitignore** |

---

## 已知问题

- fakecloud 仍缺 `functions/`。
- Demo 工作区日志很多，streak 可能显示「74 天」一类大数 — 真实数据下 streak 按连续有字/心情原因的天数计算。
- 记账页圆环在部分截图里对比度仍偏淡，下轮可加 scroll + 绘制等待。

---

## npm test

**299 pass, 0 fail**（Batch 3 Round 2，实测）。

---

## 下次可做

- README 三语补一句 reflection streak；习惯/复盘 insight 数字 roll-up。
- 记账图表截图稳定性；Goal 2 其他页面空状态再统一一轮。
