# 自托管说明

Life Ledger 支持两条互相独立的私有云路线：

- **Cloudflare Workers + D1 + Workers AI**，步骤见下文，并包含 AI 语音复盘；
- **腾讯云 CloudBase**，更适合中国大陆，完整步骤见[国内 CloudBase 部署指南](cloudbase-china.zh-CN.md)。

## 推荐方式：Deploy to Cloudflare

README 中的一键部署按钮会让 Cloudflare 把本仓库复制到你的 GitHub 账户，在你的 Cloudflare 账户中创建 Worker 与 D1 数据库，执行迁移并发布应用。部署配置中保留自动识别的 `npm run deploy` 命令即可。

第一次部署之后，应先使用 Cloudflare Access 保护 Worker，再正式依赖云同步。在 Access 尚未启用时，网页仍然可以本地使用，云端 API 会有意返回 `401`。

仓库中的 Wrangler 配置会自动创建 Workers AI 绑定，不需要 OpenAI 账号或另外填写 API Key。只有应用识别到 Cloudflare 部署模式时，每日复盘中才会出现**快速记录**；录音经 Access 保护的 Worker 转写并整理成可编辑草稿，原始音频随即释放。`0002_voice_usage.sql` 只新增每日计数：每位用户每天最多 3 次、累计 20 分钟。

## 可选的私人照片记忆

照片记忆使用 Cloudflare R2。第一次使用前，先在 Cloudflare 控制台启用 R2，再创建 `wrangler.jsonc` 已声明的私有存储桶：

```bash
npx wrangler r2 bucket create life-ledger-deep-review-photos
```

照片会先在浏览器中压缩，每天最多三张，压缩后单张最大 1.2 MB，每个账号的照片库上限为 8 GB。R2 不开放公共链接；所有查看、上传和删除都必须经过 Worker 的身份验证。时间轴会把照片与当天心情、原因放在一起；按月 `.llmedia` 导入导出保证照片仍然可以迁移。

## 可选的只读 Google 日历

Google 日历是可选功能，并且只在具备安全后端的 Cloudflare 部署版开放。每位自托管用户都使用自己的 Google OAuth 客户端；本项目不会提供共享客户端、共享代理或共享额度。Life Ledger 只申请“读取日历列表”和“读取日程”权限，不能修改 Google 日历。

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 新建或选择项目，启用 **Google Calendar API**。
2. 在 **Google Auth Platform → Branding** 填写已经部署的 Life Ledger 主页、`/privacy.html` 隐私页面和开发者联系邮箱。
3. Audience 选择 **External**。如需长期个人使用，请把 Publishing status 设为 **In production**；如果一直停留在 Testing，刷新授权通常会在 7 天后失效。
4. 新建 **OAuth client ID → Web application**，把自己的部署域名写进 Authorized redirect URI：

   ```text
   https://你的-Life-Ledger-域名/api/calendar/callback
   ```

5. 把凭据写入 Cloudflare 加密 Secret，绝不能放进仓库或浏览器存储：

   ```bash
   npx wrangler secret put GOOGLE_CALENDAR_CLIENT_ID
   npx wrangler secret put GOOGLE_CALENDAR_CLIENT_SECRET
   npx wrangler secret put CALENDAR_TOKEN_KEY
   npx wrangler secret put GOOGLE_CALENDAR_REDIRECT_URI
   ```

   `CALENDAR_TOKEN_KEY` 必须是包含 32 个随机字节的 URL-safe Base64 字符串；`GOOGLE_CALENDAR_REDIRECT_URI` 必须与 Google 中登记的地址完全一致。如果部署的是 Pages 项目，请改用 `wrangler pages secret put <NAME> --project-name <PROJECT>`。

6. 重新部署，打开**今日 → 每日安排 → 连接 Google 日历**，确认只读权限并选择要显示的日历。需要工作账号时，点击**添加另一个 Google 账号**再连接一个账号。重复日程默认折叠，可在同一设置面板中展开。

`0003_google_calendar.sql` 会把加密授权信息和可重建的日程缓存放在主 Life Ledger 状态之外。缓存不包含描述、地点、附件和参与者。断开连接会撤销 Google 授权，并删除凭据和缓存。完整边界见[隐私说明](../PRIVACY.md)。

## 手动部署

```bash
npm install
npx wrangler login
npx wrangler d1 create life-ledger-deep-review-db
npx wrangler r2 bucket create life-ledger-deep-review-photos
```

把命令返回的数据库 ID 写入 `wrangler.jsonc`，替换其中的 `database_id` 占位值，然后执行：

```bash
npm run deploy
```

不要把个人化后的数据库 ID 提交到上游 Pull Request。

## 更新版本

如果使用一键部署，Cloudflare 会把新生成的仓库连接到 Workers Builds。查看上游 Release，把需要的改动合并到自己的仓库，Cloudflare 会部署新的提交。

重要更新前建议：

1. 在 Life Ledger 中导出完整 JSON 备份；
2. 查看 `CHANGELOG.md` 和数据库迁移；
3. 执行部署；
4. 在重要设备上检查一个最近日期和一个历史复盘。

## 免费额度行为

Cloudflare 免费方案或 Workers AI 免费额度达到上限后，API 可能暂时拒绝同步或语音请求，但浏览器本地保存和手动输入仍然可用。只有在明确接受费用规则时才主动升级 Cloudflare 方案。如果要让很多用户共同使用同一个部署，应先查看 Cloudflare 用量面板；应用内的个人限额不能替代云账户的总额度限制。

CloudBase 当前的免费体验环境不能开启按量付费。个人自用可使用系统分配的默认域名，不必购买域名；但腾讯云把默认域名定位为开发/测试用途。费用、续期和正式运营域名的边界见[国内方案费用说明](cloudbase-china.zh-CN.md#费用与域名决策)。
