# 用 Codex 一次完成 Life Ledger 部署或升级

[English](deploy-with-codex.md) · **简体中文** · [Deutsch](deploy-with-codex.de-DE.md)

下面的提示词适用于第一次部署，也适用于已经有 Worker、D1、R2 或 Google OAuth 的升级。把整段复制给能够操作你本地终端与浏览器的 Codex。也可以只把仓库网址交给 Codex 并要求部署完整版本；仓库中的 `AGENTS.md` 会把代理引导回本说明。

它不会取消必要的本人确认：Cloudflare/Google 登录、R2 按量计费订阅、Google 未验证应用警告、删除或覆盖数据仍应由账户所有者确认。其他只读盘点、测试、非破坏性迁移、部署和验证应连续完成。

```text
请部署或升级我自己的 Life Ledger：
https://github.com/zubin-li/life-ledger-deep-review

目标是完整 Cloudflare 版本：Worker、D1、Workers AI、Cloudflare Access、私有 R2 照片、快速记录和可选的只读 Google Calendar。先判断这是首次部署还是已有部署的升级；已有资源必须复用，禁止重新创建同名资源、清空数据库、覆盖个人记录或上传仓库示例数据。

按以下顺序执行。不要把基础部署、R2 和 Google OAuth 混在一次未验证的操作里。

一、只读盘点

1. 读取 README、docs/self-hosting.zh-CN.md、PRIVACY.md、CHANGELOG.md、wrangler.jsonc、package.json 和 migrations。
2. 拉取当前 main，记录准确 Commit；执行 npm ci 和 npm test。
3. 检查当前 Cloudflare 账户中的 Worker、正式网址、最近稳定 Deployment ID、D1、R2 bucket、Workers AI、Access 与 Secret 名称。只确认 Secret 是否存在，绝不输出值。
4. 检查远程 D1 已执行和待执行的 migrations，并确认现有数据量。只执行尚未执行的非破坏性迁移。
5. 检查本地未提交改动。账户 ID、数据库 ID、OAuth Secret 和个人部署配置不得提交到上游仓库。

二、准备云端资源

1. 根据账户情况选择仓库提供的 Cloudflare 部署流程或 CLI；首次完整部署前必须先准备或绑定 D1 与 R2。
2. 先检查现有 D1、R2 订阅和 `life-ledger-deep-review-photos` bucket；存在就复用，不得重复创建。
3. 如果尚未启用 R2，说明：即时费用、每月免费额度、超额自动计费，以及应用内 8GB/操作次数限制不是 Cloudflare 硬消费上限。等待账户所有者明确接受 R2 按量计费后再继续。
4. 使用 Standard storage，bucket 保持私有，不创建公开域名。
5. 账户 ID、数据库 ID、OAuth Secret 和个人部署配置不得提交到上游仓库。

三、部署并保护

1. 只执行尚未执行的非破坏性 D1 migration，然后在 DB、AI 和 PHOTOS binding 都存在的情况下部署 Worker 与静态资源。
2. Cloudflare Access 只允许账户所有者指定的邮箱；正确配置 TEAM_DOMAIN 和 POLICY_AUD。
3. 部署后验证正式网址、`/deployment-mode.js`、登录后的 `/api/state`、刷新后的同步、快速记录入口、私人照片上传/读取/时间轴、PWA 与备份导入导出；照片测试只能使用虚构素材。
4. 上述验收未通过前，不要进入 Google Cloud 配置。
5. 不要为了适配账户而修改 `public/app.js` 等产品源码，也不要删除 PHOTOS binding 逃避 R2 前置条件。

四、Google Calendar（仅在用户选择启用时）

1. 先查找已有 Google Cloud Project 和 OAuth Web Client；存在就复用，不要重复创建。
2. 启用 Google Calendar API，并只配置：
   https://www.googleapis.com/auth/calendar.calendarlist.readonly
   https://www.googleapis.com/auth/calendar.events.readonly
3. 根据正式 Worker URL 生成：
   https://<正式域名>/api/calendar/callback
4. Google OAuth Client 的 Authorized redirect URI 与 Cloudflare Secret GOOGLE_CALENDAR_REDIRECT_URI 必须逐字符一致。
5. 检查以下 Secret 是否存在但不显示值：
   GOOGLE_CALENDAR_CLIENT_ID
   GOOGLE_CALENDAR_CLIENT_SECRET
   CALENDAR_TOKEN_KEY
   GOOGLE_CALENDAR_REDIRECT_URI
6. 缺少 CALENDAR_TOKEN_KEY 时，生成 32 个随机字节的 URL-safe Base64 值，并只写入 Cloudflare Secret。
7. 重新部署后，从正式 Life Ledger 页面点击连接，生成全新的 OAuth state；不要复用旧授权链接。

授权必须在同一个标签页完成：Life Ledger 会用 location.assign 进入 Google。出现“Google 尚未验证此应用”时，由账户所有者在当前标签页亲自选择“高级 → 前往 Life Ledger → 继续”，然后等待当前标签页自动回到 /?calendar=connected&view=today。不要手动切换回旧 Life Ledger 标签页。OAuth state 十分钟后过期；超时就从 Life Ledger 重新开始。

不要根据用户说“已授权”判断成功。回跳后必须同时验证：
- 当前标签页确实已自动返回 Life Ledger；
- /api/calendar/status 返回 configured: true、connected: true，accounts 至少为 1；
- D1 calendar_connections 至少有一条记录；
- 日历列表与当月事件可以读取；
- 刷新页面后仍保持连接。

若失败，先检查当前 URL、回调错误、Worker 日志、redirect URI 和 OAuth state，不要盲目重建 OAuth Client。

五、最终验收

只有获得证据后才报告完成。最终报告必须包含：正式网址、GitHub Commit、npm test 结果、D1 migration 状态、Access 状态、R2 bucket/binding 状态、Workers AI/快速记录状态、Google Calendar 状态、PWA 状态、最近稳定 Deployment ID 和回退点。

只有登录、持续授权、R2 订阅、Google 安全警告、删除或覆盖数据时才暂停等待本人操作。其他步骤连续完成。失败最多尝试两种有新证据的方法；仍失败就报告准确错误和已完成状态，不要不断创建新资源。
```

## 成功判定

“网页能打开”不等于完整部署成功。至少要同时满足：核心同步正常、R2 已绑定、快速记录可用；若选择 Google Calendar，则同一标签页完成回调且 API 与 D1 都确认已连接。
