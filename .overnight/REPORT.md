# Life Ledger 夜间构建报告（Round 1）

## 本轮新增

**记账**作为独立侧栏入口（Today 与习惯之间的「Money / 记账 / Finanzen」）。点击后可：

- 切换月份，查看收入 / 支出 / 结余
- 在 **Quick entry** 输入如 `12,50 咖啡`、`-45 Miete gestern` 后点 **Add**
- 点分类 chip 预填金额模板
- 看分类圆环（有数据后着色）与当月每日支出热力格
- 删除交易并通过 toast **撤销**

数据存在 **`state.ledger`**，随本机保存、云同步 JSON、v3 备份导入导出（旧备份无 ledger 不受影响）。

## 去哪里点

1. 本地打开：`http://127.0.0.1:5291/index.html?mode=local`（或你平时的本地路径）
2. 左侧 **记账** / **Money**
3. 试录入：`12.50 coffee` 或 `12,50 咖啡`

## 截图

| 场景 | 路径 |
|------|------|
| 桌面浅色 Chromium 1440 | `.overnight/shots/ledger-chromium-light-1440.png` |
| 手机深色 WebKit 390 | `.overnight/shots/ledger-webkit-dark-de-390.png` |

## 设计文档

- `.overnight/LEDGER-DESIGN.md` — 数据模型与开源参考（Actual、ezBookkeeping、Ivy 等；GPL 项目仅借鉴思路）

## 尚未完成（明早预期之外的功能）

- 版本号仍为 2.0.10（2.1.0 与 README 专节留待后续轮）
- Today 卡片「今日支出」、月度复盘摘要、示例数据、预算、趋势 uPlot、CSV 界面、触摸大键盘
- 全站 Goal 2 抛光（动效、关联洞察等）

## 测试

`npm test`：**248/248 通过**（含 8 条 ledger-core 测试）。

## 下一轮建议

优先 Today 卡 + 2.1.0 版本对齐，再 CSV UI 与复盘联动。
