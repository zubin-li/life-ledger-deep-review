# 中国大陆部署：腾讯云 CloudBase

Life Ledger 的 CloudBase 版本面向希望在中国大陆稳定访问、同时把数据保存在自己腾讯云账号中的个人用户。它与 Cloudflare 版本使用同一套界面，但同步层改为 CloudBase 身份认证与文档型数据库。

## 先看结论

- **个人自用可以 0 元开始**：使用 CloudBase 免费体验环境和系统分配的 `*.tcloudbaseapp.com` 地址，不必购买域名。
- **不会自动产生超额账单**：截至 2026 年 8 月，免费体验环境为每月 3000 资源点，不支持开启按量付费；只有使用者主动升级才会进入付费套餐。
- **需要每 6 个月手动续期**：免费环境不自动续费，到期前一个月可续期 6 个月。
- **默认域名只适合个人体验/开发测试**：腾讯云官方不把它承诺为正式生产域名。若以后公开运营产品，才需要购买域名、备案并使用满足备案条件的付费环境。

最新规则请以[CloudBase 资源点价格文档](https://cloud.tencent.com/document/product/876/127357)、[静态网站托管域名说明](https://cloud.tencent.com/document/product/876/46900)和[ICP 备案要求](https://cloud.tencent.com/document/product/876/128405)为准。

## 数据如何流动

```text
浏览器 / 安装后的 PWA
   ├── localStorage                 每次操作立即本地保存
   ├── JSON 导出                    自主备份
   └── CloudBase Web SDK v3         登录后跨设备同步
              ↓
       你自己的 CloudBase 环境
       ├── 邮箱验证码身份认证
       └── life_ledger_states 集合
           （仅创建者可读写）
```

项目没有共用后台，也不会把不同部署者的数据汇总到作者的数据库。

## 首次准备（只做一次）

### 1. 创建免费环境

1. 打开 [CloudBase 控制台](https://tcb.cloud.tencent.com/)并登录腾讯云。
2. 创建一个**免费体验版**环境。
3. 数据库类型选择**文档型数据库/云数据库**，地域建议选择**上海**。
4. 记下完整的环境 ID，例如 `your-env-123456`。

不要主动切换为个人版或打开付费功能；免费体验环境本身不支持按量付费。

### 2. 开启邮箱验证码登录

在该环境中进入**身份认证 → 登录方式 → 常规登录**，开启**邮箱验证码登录**与平台内置的邮件代发。Life Ledger 使用无密码 OTP；不存在的邮箱用户首次验证后会自动建立账号。

然后在身份认证/应用配置中复制 Web 端的 **Publishable Key / Access Key（可发布密钥）**。它是给浏览器使用的公开标识，不是腾讯云 `SecretKey`；绝对不要把腾讯云 API `SecretId`、`SecretKey` 写入网页或 Git 仓库。

参考：[CloudBase Web SDK v3 邮箱 OTP](https://docs.cloudbase.net/api-reference/webv3/authentication)。

### 3. 创建私人数据集合

1. 进入**文档型数据库 → 集合管理 → 新建集合**。
2. 集合名必须填写 `life_ledger_states`。
3. 在**数据权限**中选择**仅创建者可读写**。

这个权限会用 CloudBase 自动写入的 `_openid` 隔离每个账户。不要选择“所有用户可读”。参考：[数据库安全规则](https://docs.cloudbase.net/rule/rule-example)。

## 方案 A：从 Git 仓库部署（推荐，接近一键）

如果 GitHub 访问稳定，可以直接使用本项目公开仓库；否则先把仓库导入 Gitee，再选择 Gitee 仓库。CloudBase 当前同时支持 GitHub、GitLab、Gitee 和公开 Git URL。

1. 打开 CloudBase **静态网站托管 → 新建应用 → Git 仓库部署**。
2. 仓库填写 `https://github.com/zubin-li/life-ledger-deep-review`，分支填写 `main`。
3. 使用下面的构建设置：

| 设置 | 值 |
|---|---|
| Node.js | 20 或以上 |
| 安装命令 | `npm ci` |
| 构建命令 | `npm run build:cloudbase` |
| 构建产物 | `dist/cloudbase` |
| 部署路径 | `/` |

4. 添加构建环境变量：

| 变量 | 值 |
|---|---|
| `TCB_ENV_ID` | 第 1 步的完整环境 ID |
| `TCB_ACCESS_KEY` | 第 2 步的 Publishable Key |
| `TCB_REGION` | `ap-shanghai`（广州环境填 `ap-guangzhou`） |

5. 点击部署。仓库中的当前版 `cloudbaserc.json` 会让 CloudBase 完成依赖安装、构建和静态发布。
6. 打开系统分配的 HTTPS 地址，使用邮箱验证码登录一次。在会话仍有效时，同一设备无需反复输入验证码。

官方流程参考：[CloudBase 静态网站托管快速开始](https://docs.cloudbase.net/hosting/quick-start)。

## 方案 B：本地一条命令部署

适合已经下载源码、希望明确控制每次发布内容的用户：

```bash
git clone https://github.com/zubin-li/life-ledger-deep-review.git
cd life-ledger-deep-review
npm ci
npx --yes --package @cloudbase/cli@3.7.3 tcb login
```

在当前终端提供公开的环境配置，然后运行项目封装好的部署命令：

```bash
export TCB_ENV_ID="你的环境ID"
export TCB_ACCESS_KEY="你的Publishable Key"
export TCB_REGION="ap-shanghai"
npm run deploy:cloudbase
```

也可以复制 `.env.example` 作为字段清单，但不要把填入真实值的 `.env` 提交到 Git；仓库已经默认忽略所有 `.env` 文件。

该命令会：

1. 复制干净的 `public/` 前端文件；
2. 注入该部署者自己的环境 ID 与 Publishable Key；
3. 使用当前 CloudBase CLI 上传到静态网站根路径。

它**不会**上传本机 `localStorage` 中的测试数据；浏览器数据不在源码目录里。

## 更新自己的部署

Git 部署用户只需把自己的 fork/Gitee 镜像同步到新的 `main` 提交，再重新触发构建。CLI 用户执行：

```bash
git pull
npm ci
npm run deploy:cloudbase
```

更新前先从 Life Ledger 导出一次完整 JSON。部署代码不会覆盖云数据库中的已有记录，但备份仍是最稳妥的习惯。

## 费用与域名决策

| 使用方式 | 必须买域名 | CloudBase 基础费用 | 适合场景 |
|---|---:|---:|---|
| 本地打开 | 否 | 0 元 | 单设备、不需要同步 |
| 免费环境 + 默认域名 | 否 | 0 元起 | 个人自用、家庭试用、开发测试 |
| 付费环境 + 自定义域名 | 是 | 域名费用 + CloudBase 套餐 | 面向公众的正式产品 |

截至 2026 年 8 月，CloudBase 个人版页面标示限时价格为 19.9 元/月，但价格和活动会变化，README 不把它当作长期承诺。免费环境不能作为 ICP 备案资源；正式备案要求个人版及以上、环境剩余有效期超过 6 个月，并开启固定 IP。

## 常见问题

### 国内用户是否一定要备案？

个人自用默认域名时不需要自己购买域名，也没有自己的域名需要备案。只有绑定自有域名并作为正式网站运营时，才进入域名购买、实名认证与 ICP 备案流程。

### 为什么不能把数据库创建也放进网页里？

浏览器端不应拥有腾讯云管理员权限。集合创建和安全规则属于账户级高权限操作，保留为一次性的控制台步骤，能避免把云 API 密钥泄露给前端。这是安全边界，不是遗漏。

### 免费额度耗尽会不会自动扣卡？

免费体验环境当前不支持按量付费，因此不会因为 Life Ledger 使用量增加而自动转成超额计费。资源耗尽时同步可能暂时不可用，但本地保存仍继续。只有账户所有者主动升级为付费套餐，费用规则才会改变。

### Publishable Key 可以公开吗？

可以。它用于标识浏览器应用，真正的数据边界由邮箱会话和集合安全规则保障。腾讯云 API `SecretKey` 不可以公开，也不在本方案中使用。

### 登录或数据库请求提示来源域名不受信任怎么办？

把部署后得到的完整 HTTPS 地址加入 CloudBase 环境的**安全来源/安全域名**，然后重新打开应用。只加入自己实际使用的域名，不要用宽泛的通配符。
