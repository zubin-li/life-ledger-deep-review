# Kickoff — Web Today 第 1 步：视觉确认稿（新会话从这里开始）

## 先读（只读这三份，不要扫全仓库）
1. `.hermes/handoffs/LIFE_LEDGER_HISTORY_AND_REQUIREMENTS_2026-10-17.md` — 完整历程与累计需求
2. `.hermes/plans/2026-10-17-web-today-feasibility.md` — 用户已批准的方案
3. 本文件

## 用户已批准（2026-10-17）
- 只做 **网页版 Today**。本周/长期/时间轴/洞察不动；Mac 应用不动。
- 方案：卡片贴格子、只存“顺序 + 尺寸”；电脑 4 列 / 平板 2 列 / 手机 1 列；拖动用 SortableJS（第 2 步才接入）；外壳、配色、圆角、动效复用 main 原版；Today 与其他页同宽、整页滚动、**删除**滚动条（不是透明）。
- 尺寸表（约 16 个变体）：问候、心情、每日日程、复盘(含专注切换)、专注、月历(通栏)、7 日节律 = 固定一种；习惯 2（4 个 / 8 个）；天气 2；热力图 2；照片墙 3。

## 第 1 步要交付的（只出图，不改正式代码）
- 用真实页面代码 + 真实数据副本渲染，不画假 mockup。
- 截图：每张卡的每个尺寸（浅色）；整页默认布局 1440 浅色 / 深色、1180、800、390 手机；编辑模式（删除、尺寸切换、拖动示意、添加组件）。中文为主，德文抽查一张（最长文本）。
- 一段编辑模式录屏。
- 放到 `docs/today-widgets/step1-review/`，附 `index.html` 一页总览，交付给用户用 MEDIA: 或 ::preview。
- 自检后再交：无溢出、无截断、无空洞、无乱码、无滚动条；自动测试通过 ≠ 视觉通过，最终只由用户判断。

## 环境
- 仓库 `/Users/ashan/Documents/Codex/ll-361-blank-fix`，分支 `codex/today-direction-prototype`；工作树有未提交改动，**不要 reset/checkout 覆盖**；快照分支 `snapshot/today-dirty-2026-10-17`（8cb22c8）。
- 原版对照：`/Users/ashan/.hermes/cache/scratch/ll-main/public/`（main）。
- 本地预览：`http://127.0.0.1:43117/?mode=local&lang=zh&preview=local`（`npm run preview:local`）。
- 真实数据副本与截图脚本：`/Users/ashan/.hermes/cache/scratch/ll-probe/`（`classic.mjs`、`mobile.mjs`、`compare.mjs` 可改用）。**不写用户真实浏览器、不操作前台。**
- 截图做法：在 scratch 下复制一份工作树做原型改动，避免污染主工作树；或只用注入 CSS/JS 的方式渲染。

## 规矩
- 先出图给用户确认，确认前不进入第 2 步、不 commit/push/部署。
- 不让 AntiGravity/Cursor 做视觉判断（用户 10/15 要求）。
- 回复用中文、简洁，只讲效果和需要用户决定的事。
