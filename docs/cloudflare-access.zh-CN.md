# Cloudflare Access 设置

Life Ledger 使用 Cloudflare Access 作为云同步的身份边界，Worker 自身不实现密码或 OAuth。

## 保护 Worker

1. 在 Cloudflare 打开 **Workers & Pages**。
2. 选择你的 Life Ledger Worker。
3. 进入 **Settings → Domains & Routes**。
4. 找到 `workers.dev` 地址并点击 **Enable Cloudflare Access**。
5. 如需调整策略，打开 **Manage Cloudflare Access**。
6. 创建 **Allow** 策略，只允许自己的邮箱或少量可信任成员。
7. 可以使用 Cloudflare 默认身份提供商，也可以自行配置邮箱一次性验证码。
8. 打开 Access 应用，在 Additional settings 中复制 **Application Audience (AUD) Tag**。
9. 在 Zero Trust 设置中找到团队域名，格式为 `https://<团队名>.cloudflareaccess.com`。
10. 在 Worker 的 **Settings → Variables and Secrets** 中添加两个文本变量：
    - `TEAM_DOMAIN`：完整的 HTTPS 团队域名；
    - `POLICY_AUD`：Application Audience 标签。

保护整个 Worker 是最简单的方式：静态网页和 `/api/state` 会一起经过 Access。Worker 会独立验证 `Cf-Access-Jwt-Assertion` 的签名、签发方和 Audience，然后使用其中经过验证的邮箱。

## 登录有效期

登录有效期需要在便利性和日记敏感程度之间平衡。私人设备可以设置较长时间；共享电脑应设置较短时间，并在使用后退出。

## 验证同步

1. 在浏览器无痕窗口打开部署地址。
2. 确认 Life Ledger 出现前会先显示 Access。
3. 使用允许的账户登录。
4. 做一个不敏感的测试修改。
5. 在第二台已验证设备上打开应用，确认修改已经出现。

如果缺少 `TEAM_DOMAIN` 或 `POLICY_AUD`，云同步会安全地保持关闭，本地使用不受影响。不要通过备用身份请求头或共享密码把 D1 API 变成公开可写接口。
