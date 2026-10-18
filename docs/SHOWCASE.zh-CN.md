# Life Ledger 产品展示

[English](SHOWCASE.md) · [简体中文](SHOWCASE.zh-CN.md) · [Deutsch](SHOWCASE.de-DE.md) · [返回中文 README](../README.zh-CN.md)

Life Ledger 把每日习惯、具体计划和长期复盘放进同一个本地优先空间。以下截图只使用虚构数据。3.6 带来了模块化原生仪表盘：今日与本周支持自由重排与折叠的气泡卡片、全月习惯热力网格、周洞察分析与全套发丝线稿插画。

## 桌面体验

10 月 16 日仅调整今日：恢复原网页配色，画布限制 1236px，保留方形比例和紧凑四习惯默认展示。下方图库新增 1920px／1000px 实测。全部为隔离的普通网页截图，不代表已安装 Mac 版验收；仍待你确认视觉。

**网页版今日贴格子（10 月 18 日）：**卡片贴格子、拖动排序，只在内容会变化时提供尺寸；月历只显示心情。虚构数据，仅网页版。<img src="today-widgets/grid/today-zh-desktop-light.png" alt="中文网页版今日贴格子"><img src="today-widgets/grid/today-zh-mobile.png" width="300" alt="手机单列，顺序一致">

**今日修正：**[真实默认排版、尺寸与拖动录屏](local-web/today-repair/index.html)，截图脚本未额外重新摆位。<img src="local-web/today-repair/today-1440-zh-light.png" alt="中文今日真实默认排版"><img src="local-web/today-repair/today-390-zh-light.png" width="300" alt="手机阅读布局与虚构记录">

**窄窗口修正：**800px 时侧栏与内容并排，工具栏操作与日期分行，避免按钮被遮挡。[桌面截图](local-web/breakpoints/today-800-zh-light.png) · [移动断点截图](local-web/breakpoints/today-760-zh-light.png) · [回归结果](local-web/breakpoints/results.json)。这是隔离浏览器验收，不代表已安装 Mac 版通过验收。

**真实本地网站：**执行 `npm run preview:local` 后[直接操作](http://127.0.0.1:43117/?mode=local&lang=zh&preview=local)。与 Tauri 复用页面／卡片源码，不伪造系统窗口栏。[录屏与检查](local-web/index.html)。下图是虚构示例；实际本地网站保存独立的浏览器记录。

<img src="local-web/today-zh-light.png" alt="中文本地网页共用已确认的桌面设计" />
<img src="local-web/habits-390-zh.png" width="300" alt="中文窄屏网页与可达设置入口" />

**窗口整合：**[录屏与验证](integrated-shell/index.html)。统一顶部、圆角外框、可收起导航、底部个人空间。Chromium 截图不伪造系统红黄绿按钮；未打包或安装。

<img src="integrated-shell/today-zh-light.png" alt="中文完整桌面外框" />
<img src="integrated-shell/habits-390-zh.png" width="300" alt="中文手机布局不添加 Mac 顶栏" />

**长期／习惯确认版：**[录屏与对照](horizon-habits/index.html)。当前阶段置顶、计划步骤记日期、阶段回看留快照、月复盘有入口，习惯页统一外观。复用旧记录与原图标；虚构示例，未安装。

<img src="horizon-habits/horizon-zh-light.png" alt="长期页：阶段置顶、分领域计划和步骤记录" />
<img src="horizon-habits/habits-zh-light.png" alt="习惯页：搜索筛选、原图标和生效日期设置" />

**时间轴／洞察确认版：**[录屏和对照](timeline-insights/index.html)。日／周／月沿同一条轴向下浏览，文字优先，周照片按需展开。洞察展示记录覆盖、可探索趋势、原习惯图标和单列周期目标。虚构演示数据，待亲自确认，未安装。

<img src="timeline-insights/insights-zh-light.png" alt="中文洞察：完成率、记录覆盖及基于记录的观察" />

**最新本周 / 时间轴确认点：** [录屏与多语言对照](week-reflection/index.html)。本周以复盘为主，保留周日历、洞察和目标；时间轴按周回看文字与照片。寄语固定横向双格，心情固定小方格。以下日历/图片是虚构测试数据，未安装发布、未获用户视觉确认。

<img src="week-reflection/timeline-zh-light.png" alt="周复盘时间轴：按周选择原有文字与同周照片占位图" />

**最新本周/共用外框确认点：** [录屏与多语言深浅色截图](week-polish/index.html)。七天选择、原习惯图标、整页滚动的目标和复盘；今日同步更新外框与鼠标光影。虚构数据，未安装发布、未获用户视觉确认。

<img src="week-polish/week-zh-light.png" alt="实际本周界面：七天选择、当天详情与复用原习惯图标" />

**本轮确认点：天气与组件库。** [查看真实操作录屏及深浅色截图](today-widgets/weather-gallery/index.html)。天气采用温度/时间双轴曲线，支持鼠标与键盘探索；欢迎卡保留当前天气。11 个现有组件在独立目录中选择，未添加卡片不再占据编辑栅格。本轮不是已安装发布版；心情与月度热力图的视觉重做仍待下一步。

<img src="today-widgets/weather-gallery/today-zh-light.png" alt="本轮实际界面：温度曲线、当前天气与独立组件库" />

### 今日：计划与复盘

**可选组件检查点：** 添加独立心情、八级习惯热力图、本机照片/GIF/视频墙和逐小时天气；外框统一 S/M/横向 L，并提供方形 L。新组件默认隐藏，保留已有布局。[尺寸对照与已知限制](today-widgets/README.md)。以下天气为模拟数据，不是实时预报；尚未打包安装或获得用户视觉确认。

[查看实际操作录屏](today-widgets/edit-cards/index.html)：普通卡片固定；编辑时点卡片打开专属设置；热力图为完整自然月与小色点。

<img src="today-widgets/edit-cards/normal-zh-light.png" alt="中文：完整月份热力图，普通模式不常驻设置" />

<img src="today-web-parity/screens/today-desktop-1440-zh-light.png" alt="今日确认版：原有习惯图标、冷色画布与三种组件尺寸" />

Today 2.0 推出模块化小组件平台：12 列响应式栅格包含概览、习惯、日历、专注、照片、复盘与节奏卡片，支持小/中/大三种离散尺寸与差异化内容层级，直接无缓动二维拖拽、键盘方向键移动与事务级撤销。

**今日确认版：** 实际桌面路由复用网页配色与原图标。小号显示优先习惯，中号合并显示四个习惯，大号保留完整横向轨道；点击习惯卡片即可打卡，重排后保留键盘焦点。截图使用隔离的无界面浏览器与虚构数据；本检查点尚未打包，也尚未经用户确认视觉效果。

### 单日记录

<img src="images/demo-preview/zh-desktop/zh-02-daily-review-v5.png" alt="中文桌面版习惯打卡、心情与日记抽屉" />

点击日历中的过去或当天，即可查看习惯打卡、心情和日记，不必离开当前月份。

### 本周：承诺与输出

<img src="images/demo-preview/zh-desktop/zh-03-weekly-plan-v5.png" alt="中文桌面版本周目标与本周输出" />

本周目标采用提醒事项式交互：完成后保留划线记录，作为真实推进的证据；下方提供完整的本周输出空间。

### 复盘：写成一个月

<img src="images/demo-preview/zh-desktop/zh-04-monthly-review-v5.png" alt="中文月度复盘以文档呈现，下方是短的完成趋势" />

这个月先给出 7/30/90 天完成率、连续天数和趋势，然后才是文字复盘。习惯得分留在检查器里。今日是左右两栏，时间轴把日记页放在月历旁边。一天最多三张私人照片，留在这台设备上。

### 专注：看见时间去了哪里

<img src="images/demo-preview/zh-desktop/zh-05-focus-month-v5.png" alt="中文桌面版月度专注统计" />

按主题比较专注分钟数，并通过月度热力图观察节奏，不再用 Session 数量替代真实投入时间。

### 时间轴：重新看见走过的日子

<img src="images/demo-preview/zh-desktop/zh-07-timeline-v5.png" alt="Life Ledger 中文时间轴中的心情、复盘与私人照片记忆" />

沿时间顺序回看心情、原因、日记语境和经过压缩的私人照片记忆。图中的记录与图片均为虚构演示数据。

### 习惯：规则可以成长

<img src="images/demo-preview/zh-desktop/zh-06-habit-settings-v5.png" alt="中文桌面版习惯设置" />

习惯支持每日、每周和每月规则，可以决定是否计入每日完成度，也可以从指定日期开始调整目标而不改写历史。

## 手机体验

<img src="horizon-habits/longrange-390-zh.png" width="390" alt="中文移动端长期页，紧凑阶段置顶条" />

<img src="timeline-insights/timeline-390-zh.png" width="390" alt="中文移动端纵向周度时间轴" />

手机布局采用固定底部导航，并把单日抽屉变成专注、接近全屏的纵向复盘空间。

<table>
  <tr>
    <td width="33%"><img src="today-web-parity/screens/today-mobile-390-zh-light.png" alt="中文手机版每日规划" /></td>
    <td width="33%"><img src="images/demo-preview/zh-mobile/zh-02-daily-review-v5.png" alt="中文手机版单日复盘" /></td>
    <td width="33%"><img src="images/demo-preview/zh-mobile/zh-03-weekly-plan-v5.png" alt="中文手机版本周计划" /></td>
  </tr>
  <tr>
    <td align="center"><strong>今日</strong></td>
    <td align="center"><strong>单日复盘</strong></td>
    <td align="center"><strong>本周</strong></td>
  </tr>
  <tr>
    <td width="33%"><img src="images/demo-preview/zh-mobile/zh-04-monthly-review-v5.png" alt="中文手机版月度复盘" /></td>
    <td width="33%"><img src="images/demo-preview/zh-mobile/zh-05-focus-month-v5.png" alt="中文手机版专注复盘" /></td>
    <td width="33%"><img src="images/demo-preview/zh-mobile/zh-06-habit-settings-v5.png" alt="中文手机版习惯设置" /></td>
  </tr>
  <tr>
    <td align="center"><strong>复盘</strong></td>
    <td align="center"><strong>专注</strong></td>
    <td align="center"><strong>习惯</strong></td>
  </tr>
</table>

<p align="center">
  <img src="images/demo-preview/zh-mobile/zh-07-timeline-v5.png" width="33%" alt="Life Ledger 中文手机版时间轴" />
</p>
<p align="center"><strong>时间轴</strong> · 在小屏幕上也能清楚回看心情、语境与照片记忆。</p>

## 继续了解

- [立即使用中文仅本机版](https://zubin-li.github.io/life-ledger-deep-review/?mode=local&lang=zh)
- [部署到自己的 Cloudflare](self-hosting.zh-CN.md)
- [配置 Cloudflare Access](cloudflare-access.zh-CN.md)
