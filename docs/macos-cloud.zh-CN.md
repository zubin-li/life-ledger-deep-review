# Life Ledger Mac 版：联网版配置教程

## 最简单的用法

**只在这台 Mac 上用（不需要任何配置）**

1. 从 [Mac 3.0.0 发布页](https://github.com/zubin-li/life-ledger-deep-review/releases/tag/mac-v3.0.0) 下载 `Life-Ledger-3.0.0-mac-arm64.zip`，双击解压，把 **Life Ledger** 拖进"应用程序"。
2. 第一次打开时，macOS 会提示应用未经公证：打开 **系统设置 → 隐私与安全性**，在下方点 **仍要打开**（只需一次）。
3. 在第一个窗口点 **打开本机**，就可以开始记录了。

**多台设备同步（手机、电脑、Mac 看同一份记录）**

1. 先按[自托管说明](self-hosting.zh-CN.md)把 Life Ledger 部署到你自己的 Cloudflare 账户，再按下面第 1、2 步开启邮箱验证码登录。
2. 打开 Mac 应用，在 **连接云端** 里填你的部署地址，点 **连接**，输入邮箱和收到的验证码。

**以后想换模式**：在应用里打开 **设置 → 数据 → 切换到同步模式 / 切换到本机模式**，会回到第一个窗口重新选择。浏览器里也有同一个按钮。本机和云端的记录互相独立；想把记录带过去，先在 **设置 → 导入与导出** 导出备份，到新模式里再导入。

## 详细步骤

Mac 应用有两种打开方式：**本机模式**（不用账号，记录只在这台 Mac 上），以及**连接你自己的云端**，也就是部署在你自己 Cloudflare 账户里的 Life Ledger，用邮箱收验证码登录。联网版会在 Mac 应用、浏览器和手机之间同步记录、照片和 Google 日历。

Life Ledger 没有公共服务器，你的数据只在你自己的 Cloudflare 账户里。

## 准备

- 一个 Cloudflare 账户（免费版就够）。
- 已经部署好的 Life Ledger。还没部署的话，先按[自托管说明](self-hosting.zh-CN.md)完成，再回到这里。
- 大约 10 分钟。

## 1. 开启邮箱验证码（One-time PIN）

1. 打开 [Cloudflare 控制台](https://dash.cloudflare.com/)，进入 **Zero Trust**。第一次进入时随便起一个团队名，选免费方案即可。
2. 进入 **Integrations → Identity providers**。
3. 选择 **Add new identity provider → One-time PIN**，保存。

## 2. 用 Cloudflare Access 保护你的部署

1. 在 **Zero Trust → Access controls → Applications** 中选择 **Create new application → Self-hosted**。
2. 填入你的部署域名，例如 `your-life-ledger.pages.dev`。如果用的是 Pages，再加一条预览域名 `*.your-life-ledger.pages.dev`，这样每个部署地址都受保护。
3. 在 **Access policies** 中新建一条 **Allow** 策略，**Emails** 填你自己的邮箱（家人要用就把他们的邮箱也加上，每个邮箱的数据互相独立）。
4. 在 **Login methods** 中保留 **One-time PIN**。
5. **Session duration** 决定 Mac 应用保持登录多久。自己的 Mac 建议 1 个月；共用电脑选几个小时。
6. 选择 **Create**。

检查：用浏览器的无痕窗口打开你的部署地址，应该先看到 Cloudflare 要求输入邮箱的页面，然后才是 Life Ledger。

## 3. 在 Mac 应用里连接

1. 打开 Life Ledger，在第一个窗口的**连接云端**里粘贴你的部署地址（必须以 `https://` 开头），点**连接**。
2. 输入邮箱，点 **Send login code**。
3. 输入邮件里的验证码（10 分钟内有效），点 **Sign in**。

应用会记住地址，下次打开直接进入你的云端。在你设置的会话时长内保持登录。

## 日常使用

- **在本机和云端之间切换**：**设置 → 数据 → 切换到同步模式 / 切换到本机模式**，或菜单 **文件 → 切换工作区…**。本机和云端的数据互相独立，不会互相复制。
- **名称和头像**：联网版里随云端同步，所有设备显示一样；本机模式只保存在这台 Mac 上。
- **退出登录**：菜单 **文件 → 退出云端登录**。下次打开需要重新收验证码。
- **备份和照片导出**保存在**下载**文件夹。
- **忘记地址**：在第一个窗口点**忘记地址**。

## 常见问题

| 看到的情况 | 处理方法 |
| --- | --- |
| "This One-Time PIN has already been used" | 邮件安全扫描先点开了链接。点 **Request new code** 重新获取。 |
| 收不到邮件 | 查看垃圾邮件；邮箱必须与 Allow 策略里填的完全一致。 |
| 打开 Life Ledger 时没有要求验证码 | 这个域名还没有被 Access 保护，按第 2 步为它再加一条。 |
| Life Ledger 里提示"云同步需要登录" | 登录已过期，点击提示重新输入验证码。如果反复出现，说明部署没有经过 Access 登录：检查第 2 步，确认 Access 应用覆盖了 `/api/*`。 |
| macOS 提示无法打开应用 | 应用没有经过苹果公证。打开 **系统设置 → 隐私与安全性**，点 **仍要打开**（只有第一次需要）。 |

## 隐私

Mac 应用没有自己的服务器。它只是在窗口里显示你的部署，把登录 Cookie 保存在这台 Mac 上应用自己的存储中；验证码只在登录页面里使用。
