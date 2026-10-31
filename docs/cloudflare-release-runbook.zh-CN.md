# Cloudflare Worker 发布与回滚操作手册

[English](cloudflare-release-runbook.md) · **简体中文**

本文说明 **2.0.6** 起统一的 Cloudflare 完整版拓扑与分阶段发布流程。本地测试与 dry-run **不能**证明生产环境的 Access 策略、绑定是否齐全或 D1 迁移是否已应用。

## 标准拓扑（资源名称不变）

| 组件 | 路径 / 名称 |
| --- | --- |
| Worker 入口 | `src/index.js` |
| 静态资源 | `public/`（Assets 绑定 `ASSETS`） |
| D1 | 绑定 `DB`，库名 `life-ledger-deep-review-db` |
| R2 照片 | 绑定 `PHOTOS`，桶 `life-ledger-deep-review-photos` |
| Workers AI | 绑定 `AI` |
| 迁移 | `migrations/`（当前_additive_ Revision **0006** 为 `states.revision`，对应 CAS 同步协议 **2**） |
| 配置 | `wrangler.jsonc` |

**不要**把 GitHub Pages 或仅本地静态站点当作已连接的云端服务；生产始终是 Worker + Assets，并置于 Cloudflare Access 之后。

## 推荐顺序

1. **备份 / 盘点** — 导出个人备份；记录当前 Worker 地址与 deployment/version id。
2. **本地门禁** — `npm ci`、`npm test`、`npx wrangler deploy --dry-run`。
3. **预检清单** — `npm run deploy:preflight`（本地 dry-run + 只读远程盘点：deployments 列表、待执行 D1 迁移）。清单写入 `.life-ledger-deployments/`（已 gitignore）。
4. **核对待执行迁移** — 确认仅剩_additive_ 迁移（含 `0006_state_revision.sql`）。
5. **确认后部署** — `npm run deploy:cloudflare -- --confirm`：先应用远程待执行迁移，再 `wrangler deploy --strict --keep-vars`，并写入 `BUILD_SHA` 与发布说明。预检或迁移失败则中止。
6. **鉴权版本端点** — `npm run deploy:verify -- --url https://<你的-worker-域名>`（可用环境变量 `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` 提供服务令牌头，脚本不会打印密钥）。期望 `GET /api/version` 返回 JSON，`readiness.ready: true`，schema **6**、备份 schema **3**、同步协议 **2**，且各绑定标志为 true。HTML 登录页视为失败。
7. **功能冒烟** — `/deployment-mode.js`、鉴权后的 `/api/state`、照片、语音、日历（如启用）、PWA。

### 为何必须 `--keep-vars`

仪表盘里维护的 Worker 变量/密钥（`TEAM_DOMAIN`、`POLICY_AUD`、Google 日历 OAuth 等）必须在 CLI 部署后保留；`--keep-vars` 避免覆盖这些值。

## 回滚边界

- **应用代码**：从预检清单生成命令 — `npm run deploy:rollback-command -- --manifest .life-ledger-deployments/manifest-....json` — 再手动执行输出的 `wrangler rollback <previous-version-id> --name life-ledger-deep-review`。
- **数据库**：迁移 **0006** 仅新增 `states.revision` 列；回滚 Worker **不会**删除该列，也**不应**执行破坏性 SQL。旧版代码应能容忍多出的列。

## 生产核对（仅线上）

| 项目 | 方法 |
| --- | --- |
| D1 schema | `/api/version` → `readiness.d1.revisionColumnReady` |
| R2 / AI | `/api/version` 绑定布尔值 |
| Access | 带有效 Access 会话或服务令牌访问 `/api/version` |
| CAS 协议 | PUT 携带 `baseRevision`；过期修订返回 `409 STATE_CONFLICT` |

## npm 脚本

| 脚本 | 作用 |
| --- | --- |
| `deploy:preflight` | 本地门禁 + 只读盘点清单 |
| `deploy:cloudflare -- --confirm` |  guarded 迁移 + strict 部署 |
| `deploy:verify -- --url …` | 部署后 `/api/version` 校验 |
| `deploy:rollback-command -- --manifest …` | 仅打印回滚命令 |
| `deploy` | 同 `deploy:cloudflare`（必须带 `--confirm`） |

原先的 `npm run db:migrations:apply && wrangler deploy` 由上述分阶段工具替代。
