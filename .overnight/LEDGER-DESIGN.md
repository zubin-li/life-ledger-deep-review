# Life Ledger 记账（Bookkeeping）设计说明

## 研究摘要（仅借鉴思路，无 GPL/AGPL 代码）

| 项目 | 许可 | 借鉴点 |
|------|------|--------|
| [Actual Budget](https://github.com/actualbudget/actual) | MIT | 整数 minor units、账户 + 分类树、快速录入 |
| [ezBookkeeping](https://github.com/mayswind/ez-bookkeeping) | MIT | 多币种、分类 icon/色、月度概览 |
| [Firefly III](https://github.com/firefly-iii/firefly-iii) | AGPL | **仅概念**：交易字段、预算按分类（未抄代码） |
| [Cashew](https://github.com/jameskokoska/Cashew) | GPL | **仅概念**：自然语言式金额+备注、热力日历 |
| [Ivy Wallet](https://github.com/Ivy-Apps/ivy-wallet) | Apache-2.0 | 分类 chip、大数字键盘（触摸） |
| [Maybe Finance](https://github.com/maybe-finance/maybe) | AGPL | **仅概念**：月度趋势、复盘摘要 |

图表：**uPlot**（已在 `weather-widget.js` 中 vendored）用于趋势；分类占比用 **SVG 圆环**（无新依赖）。

## 数据模型 `state.ledger`

```text
ledger.version          // 1
ledger.settings         // { defaultCurrency: "EUR", secondaryCurrency: "CNY" }
ledger.accounts[]       // id, name, currency, kind, icon, color, archived
ledger.categories[]     // id, name, kind: expense|income, icon, color, parentId?, archived
ledger.transactions[]   // id, accountId, categoryId, amountMinor (signed), currency, date (ISO), note, createdAt, updatedAt
ledger.budgets[]        // id, categoryId, month "YYYY-MM", limitMinor, currency
ledger.recurring[]      // id, template fields, cadence (later UI)
ledger.meta             // recentCategoryIds[], lastEntryAt
```

- **金额**：有符号整数 minor units（支出为负、收入为正），与 Actual/ezBookkeeping 一致。
- **缺失 `state.ledger`**：运行时视为空账本；旧备份/云 payload 无此字段时行为不变。
- **同步**：ledger 随现有 JSON state 走 localStorage、CAS 云同步、v3 备份、冲突快照；远程无 ledger 时保留本机 ledger（`mergeRemoteCloudPayload` 第四参）。

## 屏幕与导航

1. **侧栏「记账」**（`data-view="ledger"`）— 与习惯设置同级，四版本 + 深浅色 + 390px。
2. **记账主页**：月份切换、收入/支出/结余、快速录入、分类 chips、交易列表、SVG 分类环、支出热力格（当月）。
3. **后续轮次**：预算条、趋势 uPlot、CSV 导入对话框、Today 卡片、月度复盘摘要、触摸数字键盘。

## 快速录入

单字段解析（`parseQuickEntry`）：

- `12,50 咖啡` / `Kaffee 3.2` / `-45 Miete gestern` / `+2000 工资`
- 德/英/中日期词：gestern、yesterday、昨天、heute、today、今天
- 分类：备注文本与已有分类名模糊匹配；未匹配则进「未分类」

## CSV（德国银行）

- 分隔符 `;`，小数逗号，日期 `DD.MM.YYYY`
- `importGermanBankCsv` / `exportTransactionsCsv` 在 `ledger-core.js`
- 导入为**新交易**（不自动建账户），默认入账到主账户

## Goal 2 抛光（分轮）

- 本轮：`v210.css` 记账页排版、录入成功微反馈、`prefers-reduced-motion` 安全。
- 后续：Today/复盘关联、全局 motion、空状态插画、数字 roll-up。

## 实现文件

- `public/ledger-core.js` — 纯逻辑 + `window.LifeLedgerLedger`
- `public/ledger-ui.js` — 页面渲染与 undo 删除
- `public/v210.css` — 记账样式（级联最后）
- `tests/ledger-core.test.mjs` — 解析、合计、CSV、normalize
