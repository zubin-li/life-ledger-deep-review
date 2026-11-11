# Life Ledger 中国大陆分发与 App 路线研究

日期：2026-09-20

## 执行结论

Life Ledger 不应把 Cloudflare 作为中国大陆普通用户的唯一正式路径，也不应继续追求 CloudBase 与 Cloudflare 的逐功能完全对齐。

最合理的产品结构是：

> 一个本地优先客户端（PWA / APK / 桌面 App）＋ 可选的同步与 AI 服务。

普通用户下载安装后，应当无需账号、无需部署、无需理解 Cloudflare，即可使用习惯、心情、日记、复盘、专注、照片缩略图、导入与导出。只有跨设备同步、云端照片备份、AI 整理和 Google Calendar 等联网能力，才要求用户连接自己的服务。

短期建议保留 CloudBase，但将它明确定位为“中国大陆核心同步版”，不承诺与 Cloudflare 全功能一致；Cloudflare 继续作为“国际完整功能版”。长期应把客户端和后端能力拆开，用 capability / provider adapter 连接不同服务。

## 一、当前 CloudBase 到底落后在哪里

代码核查表明，CloudBase 构建会复用当前 `public/` 前端，并通过自己的同步适配器保存整体状态。因此它并没有漏掉全部新功能。

以下能力会随主前端自动更新：习惯、心情及原因、每日记录、每日与长期目标、周/月复盘、Focus、热力图、无照片时间轴、多语言、主题、响应式界面及 JSON 导入导出。

真正缺少的是三组依赖 Cloudflare 后端的能力：

| 能力 | Cloudflare 完整版 | CloudBase 当前版 |
|---|---|---|
| 基础记录与跨设备同步 | Access + D1 | 邮箱 OTP + CloudBase 文档数据库，已实现 |
| AI 语音快速记录 | Workers AI | 未实现 |
| Google Calendar | Worker OAuth / API | 未实现 |
| 私人照片 | R2 + D1 元数据 | 未实现 |
| 照片备份 `.llmedia` | 已实现 | 仅普通 JSON，不含照片 |

所以问题不是“两套前端”，而是“同一客户端拥有不同服务能力”。以后应在代码与文档里明确这一点。

## 二、中国大陆用户能否直接使用 Cloudflare

可以尝试，但不适合作为面向 B 站普通用户的唯一承诺路径。

Cloudflare 官方明确说明，普通全球网络访问若需跨越中国大陆边界，会遭遇明显的延迟和可靠性问题；真正的 Cloudflare China Network 是 Enterprise 的额外订阅，并要求 ICP 备案及内容审核。[Cloudflare China Network](https://developers.cloudflare.com/china-network/)、[中国网络接入要求](https://developers.cloudflare.com/china-network/get-started/)

Cloudflare 还明确写明，Pages 并不在其中国大陆网络中提供，`pages.dev` 证书也不部署在大陆网络；R2 不能直接在大陆创建存储桶，只能通过全球加速扩展。[China Network FAQ](https://developers.cloudflare.com/china-network/faq/)、[可用产品](https://developers.cloudflare.com/china-network/reference/available-products/)

因此实际判断是：

- 技术用户、单人自用、部分地区和运营商可能体验正常。
- 不能承诺全国、全天候、移动/联通/电信都稳定。
- 照片上传、语音上传和 D1/R2 API 比纯静态页面更依赖跨境链路。
- Google Calendar 还依赖 Google OAuth 与 API，本身不适合成为大陆核心体验。[Google OAuth Web Server 流程](https://developers.google.com/identity/protocols/oauth2/web-server)
- 把网页封装成 APK 并不会自动改善跨境后端的可用性。

在对外宣传前，应让 3–5 位真实大陆测试者分别使用移动、联通、电信网络测试，而不是依据作者在欧洲的访问结果判断。

## 三、CloudBase 是否值得继续维护

值得保留，但只维护核心同步能力，不值得现在追求完整对齐。

CloudBase 的价值是：它提供中国大陆可访问的静态托管、数据库、身份认证、存储与云函数。免费环境目前每月包含 3,000 资源点、每个账号一个环境，并需每六个月手动续期；免费环境不支持按量付费，因此适合低风险个人测试。[CloudBase 资源点与套餐](https://cloud.tencent.com/document/product/876/127357)、[CloudBase 价格](https://cloudbase.cloud.tencent.com/pricing)

但其默认 `*.tcloudbaseapp.com` 域名被官方定位为开发/测试用途，存在访问频率与安全限制。公开、正式、长期运营通常需要自有域名、付费环境与相应 ICP 条件。[静态托管说明](https://cloud.tencent.com/document/product/876/46900)、[CloudBase ICP 备案条件](https://cloud.tencent.com/document/product/876/128405)

完整补齐技术上可行：CloudBase Web SDK 本身支持身份、数据库、函数、存储与 AI；照片可存入私有云存储。[Web SDK](https://cloud.tencent.com/document/product/876/46332)、[云存储](https://cloud.tencent.com/document/product/876/122509) 但语音识别需要额外接入腾讯 ASR 或类似服务。CloudBase Agent 的直接语音输入当前只有单句、60 秒/3 MB 限制，不符合 Life Ledger 数分钟复盘的完整需求。[CloudBase Voice](https://docs.cloudbase.net/en/ai/agent/voice)

因此推荐定位为：

> Life Ledger China Core Edition：国内可访问的核心记录、本地功能与私人跨设备同步。

当前不建议投入：

- Google Calendar 移植：国内价值低，外部依赖仍在 Google。
- AI 语音完全对齐：涉及独立 ASR、模型、密钥、限额、计费、安全与质量回归。
- 为理论完整性把每个 Cloudflare API 重新写成腾讯版本。

照片是未来最值得补齐的 CloudBase 能力，因为 CloudBase 已具备私有存储，且照片与“记忆时间轴”的产品价值直接相关。

## 四、App 能解决什么

App 能显著降低使用阻力，但不能凭空提供跨设备同步。

下载安装后，无需任何服务器即可完成：

- 习惯、心情、日记、目标与 Focus；
- 本地照片和时间轴；
- 本地通知；
- 导入、导出和离线使用；
- 每个用户的数据保存在自己的设备沙盒，互不共享。

但下列能力仍需要网络服务：

- 手机与电脑自动同步；
- 云端照片备份；
- 设备丢失后的自动恢复；
- 云端 AI 语音转写和文字整理；
- Google Calendar 持续读取。

因此正确原则不是“每个 App 用户都必须注册 Cloudflare”，而是：

> 下载即可本地使用；同步与 AI 是用户主动开启的可选能力。

## 五、开源项目通常如何处理

Joplin 最值得借鉴：客户端本地优先，数据先保存在设备中，同步层抽象为驱动，可连接 Joplin Cloud、Nextcloud、S3、WebDAV、Dropbox、OneDrive 或本地文件系统。客户端不被一个云平台绑死。[Joplin 同步架构](https://joplinapp.org/help/dev/spec/sync/)、[Joplin 同步选项](https://joplinapp.org/help/apps/sync/)

Actual Budget 把“可离线使用的客户端”和“跨设备同步服务器”明确分开。下载安装并不等于自动得到云同步，用户可自托管服务器或选择第三方托管。[Actual 安装](https://actualbudget.org/docs/install/)、[Actual 同步](https://actualbudget.org/docs/getting-started/sync/)

AppFlowy 同样提供桌面、移动客户端及自托管选项，体现了“普通用户直接下载”和“技术用户掌控后端”可以并存。[AppFlowy 仓库](https://github.com/AppFlowy-IO/AppFlowy)

共同模式是：

1. 客户端直接可用；
2. 本地数据是第一层；
3. 同步是可替换的目标，而非客户端的前置条件；
4. 官方托管可以存在，但自托管始终保留。

## 六、推荐技术路线

### 现在：先把 PWA 做成真正的默认入口

现有网页已经是 PWA。现代桌面与移动浏览器支持把 PWA 安装为独立窗口应用；macOS Sonoma 也支持将网页加入 Dock，iOS/iPadOS 16.4 起的主屏幕 Web App 支持推送等能力。[MDN PWA 安装](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing)、[Apple macOS Web Apps](https://developer.apple.com/videos/play/wwdc2023/10120/)、[iOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

这条路径免费、无需重写，应先把“添加到主屏幕/桌面”的引导做好。

### 第一款安装包：Android APK

Android 是最适合优先验证的原生包：

- 可以直接分发签名 APK，不必经过 Google Play；
- 国内可通过 GitHub Release、Gitee 或国内对象存储镜像下载；
- 用户允许“安装未知来源”后即可安装；
- 首版完全本地运行，不产生作者服务器费用。[Android 官方分发说明](https://developer.android.com/studio/publish)

可以使用 Capacitor 包装现有 Web 前端，并逐步使用原生相册、文件、麦克风与通知能力。[Capacitor](https://capacitorjs.com/docs)

### macOS / Windows：需求验证后使用 Tauri 2

Tauri 2 可以复用现有 Web UI，同时覆盖 macOS、Windows、Linux、Android 和 iOS，且使用系统 WebView，包体通常比 Electron 小。[Tauri 2](https://v2.tauri.app/)

但 macOS 面向普通用户顺畅分发需要签名和 notarization，Apple Developer Program 为 99 美元/年。[Apple Developer Program](https://developer.apple.com/programs/enroll/) 在付费前，可继续用 PWA 验证真实使用频率。

若通过 Google Play 全球上架 Android，则开发者注册费为一次性 25 美元；直接 APK 分发不需要这笔商店费用。[Google Play 开发者注册](https://support.google.com/googleplay/android-developer/answer/6112435)

## 七、推荐架构

```text
Life Ledger Client
PWA / Android APK / Desktop App
          │
    Local-first storage
          │
    Optional capabilities
          │
 ┌────────┼────────────┐
Cloudflare   CloudBase   Future adapters
full edition core sync  WebDAV / S3 / hosted
```

客户端通过统一能力接口判断后端支持什么：

```text
sync: true
photos: true/false
voiceAI: true/false
calendar: true/false
```

这样 CloudBase 缺照片或语音时，客户端只隐藏对应能力，不会形成另一套前端，也不会迫使每个功能维护两遍。

## 八、建议路线图

### 阶段 A：立即执行，低成本

1. Cloudflare 标记为“国际完整功能版”。
2. CloudBase 标记为“中国大陆核心同步版 / 社区验证中”。
3. README 增加清晰的功能矩阵，不再暗示两者完全一致。
4. 为 PWA 增加更直接的安装说明。
5. B 站招募 3–5 位大陆测试者，覆盖移动、联通、电信与 Android/iPhone。

### 阶段 B：Android APK 验证

1. 用 Capacitor 包装现有前端。
2. 默认本地数据，无账号、无部署。
3. 支持导入/导出、本地通知、相册与麦克风。
4. 高级设置中提供“连接我的服务器”，而不是首次启动强制 Cloudflare。
5. GitHub Release 自动生成 APK，并提供国内镜像。

### 阶段 C：统一服务适配层

1. 把当前 Cloudflare API 正式抽象为 provider adapter。
2. 定义统一 sync / photos / voice / calendar capability。
3. 保留 CloudBase 核心 adapter；等真实需求或国内贡献者出现，再补照片和 AI。
4. 不在现阶段引入 WebDAV/S3 同步；冲突解决、照片同步和加密远比简单上传复杂。

### 阶段 D：真实需求验证后

1. Tauri macOS/Windows 包。
2. 可选官方托管服务。
3. 中国区照片与 AI provider。
4. 原生 Widget、菜单栏快速记录等高级入口。

## 最终产品定义

“数据属于用户”不等于“每个用户必须学会部署 Cloudflare”。

最适合 Life Ledger 的定义是：

> 普通用户下载即用，数据默认留在本地；需要跨设备同步和 AI 的用户，可以连接自己的服务；未来官方托管可以作为便利选项，但永远不是唯一入口。

这样既保留开源、自托管和数据所有权，也不会让非技术用户在第一步就流失。
