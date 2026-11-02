# Life Ledger 夜间构建报告（Batch 3 · Round 1）

Antigravity 代码审查（`.overnight/REVIEW.md`）指出备份/收入/CSV 三类**数据安全**问题。本 round 优先全部 HIGH/MED 修复，并补回归测试与截图。

---

## 本 round 新改动

| 项目 | 说明 |
|------|------|
| **备份导出含 ledger** | 设置 → 导出任意范围时，`scopedState` 现在带上 `ledger`（按月/周/日会过滤交易日期）。 |
| **快录 & 编辑保留收入** | `2000 工资` / `2000 Gehalt` 无 `+` 也会记为正数收入；编辑交易改金额不再把工资变成餐饮支出。 |
| **德 CSV 引号** | 银行导出里 `"-12,50"` 这类字段可正常导入。 |
| **默认货币汇总** | 月汇总、今日支出、热力图只加总 `settings.defaultCurrency`（默认 EUR），避免 EUR+CNY 直接相加。 |
| **部分恢复合并 ledger** | 合并备份（非整包覆盖）会把导入包里的记账交易/分类等与现有数据按 id 合并。 |
| **Today 零支出显示** | 今日 0 支出时不再出现 `-0,00 €`。 |
| **快录日期** | 无「昨天/今天」词时，用本地日期而非 UTC。 |
| **测试** | **297 pass, 0 fail**（+8 项）。 |

---

## 明早怎么验（约 5 分钟）

1. `cd public && python3 -m http.server 5291 --bind 127.0.0.1`
2. **记账** → 快录 `2000 工资` → 月汇总收入应增加（非餐饮负值）。
3. **设置 → 备份 → 导出全部** → 打开 JSON，确认有 `"ledger"` 且含 `transactions`。
4. **设置 → 导入** 刚导出的文件（或另一台/另一 scope 合并）→ 交易仍在。
5. **CSV 导入**：一行 `01.11.2026;Test;"-12,50"` → 应导入 1 条，非 silent skip。
6. **Today** → 有历史但今日无支出 → 金额显示 `0,00 €` 而非 `-0,00`。
7. `npm test` → **297 pass, 0 fail**

---

## 截图（Batch 3 Round 1）

| 场景 | 文件 |
|------|------|
| 德文 · Today 支出（demo）· 390 | `b3r1-spending-zero-de-390-chromium.png` / `-webkit.png` |
| 中文 · 记账侧栏 · 1440 | `b3r1-ledger-overview-zh-light-1440-chromium.png` / `-webkit.png` |

（记账页 demo 全屏图表可下轮加 `waitFor` 后重拍；本 round 重点在数据修复。）

---

## REVIEW 处理情况

| # | 严重度 | 状态 |
|---|--------|------|
| 1–3 | HIGH | 已修 + 测试 |
| 4–6 | MED | 已修 + 测试 |
| 7 | LOW | 已修（本地日期） |
| 8 | LOW | 未做（CSS 文件未合并） |
| 9 | LOW | 未做（`.overnight/scratch/` 仍约 6.6MB） |

审查结论 **NOT SAFE** 的三项（备份丢 ledger、收入变支出、引号 CSV）已在本 round 关闭。

---

## 已知问题

- fakecloud 仍缺 repo-root `functions/`。
- CSS 文件较多（审查 #8）；功能无回归。

---

## npm test

**297 pass, 0 fail**（Batch 3 Round 1，实测）。

---

## 下次可做

- 合并或归档 `v211`–`v223` CSS；清理 scratch 镜像。
- 真 cloud 409 + ledger 手测；Goal 2 journal/Today 构图再大胆一版。
