# Provenance: Life Ledger 中国大陆分发与 App 路线研究

生成日期：2026-09-20

## 本地项目证据

- `public/app.js`：核对 Cloudflare / CloudBase / local provider 判断、Google Calendar capability、照片与时间轴入口。
- `public/cloudbase-sync.js`：核对 CloudBase 身份验证与整体状态同步方式。
- `public/photo-memories.js`：核对照片能力、后端 API 与 Cloudflare 部署限制。
- `scripts/build-cloudbase.mjs`、`package.json`：核对 CloudBase 构建是否复用主前端。
- `README.md`、`README.zh-CN.md`、`docs/cloudbase-china*.md`：核对当前对外部署说明。

## 官方与一手来源

- Cloudflare China Network overview: https://developers.cloudflare.com/china-network/
- Cloudflare China Network onboarding: https://developers.cloudflare.com/china-network/get-started/
- Cloudflare China products: https://developers.cloudflare.com/china-network/reference/available-products/
- Cloudflare China FAQ: https://developers.cloudflare.com/china-network/faq/
- Google OAuth web server flow: https://developers.google.com/identity/protocols/oauth2/web-server
- Tencent CloudBase plans/resource points: https://cloud.tencent.com/document/product/876/127357
- Tencent CloudBase pricing: https://cloudbase.cloud.tencent.com/pricing
- Tencent CloudBase static hosting: https://cloud.tencent.com/document/product/876/46900
- Tencent CloudBase ICP conditions: https://cloud.tencent.com/document/product/876/128405
- Tencent CloudBase Web SDK: https://cloud.tencent.com/document/product/876/46332
- Tencent CloudBase storage: https://cloud.tencent.com/document/product/876/122509
- Tencent CloudBase voice integration: https://docs.cloudbase.net/en/ai/agent/voice
- MDN PWA installation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing
- Apple macOS web apps: https://developer.apple.com/videos/play/wwdc2023/10120/
- WebKit iOS web push: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- Android distribution: https://developer.android.com/studio/publish
- Capacitor documentation: https://capacitorjs.com/docs
- Tauri 2 documentation: https://v2.tauri.app/
- Apple Developer Program: https://developer.apple.com/programs/enroll/
- Google Play developer registration: https://support.google.com/googleplay/android-developer/answer/6112435

## 对照项目

- Joplin sync architecture: https://joplinapp.org/help/dev/spec/sync/
- Joplin sync options: https://joplinapp.org/help/apps/sync/
- Actual Budget installation: https://actualbudget.org/docs/install/
- Actual Budget synchronization: https://actualbudget.org/docs/getting-started/sync/
- AppFlowy repository: https://github.com/AppFlowy-IO/AppFlowy

## 分析方法与限制

- 结论结合项目代码核查、平台官方文档以及成熟开源项目的分发模式。
- 中国大陆实际可用性受运营商、地区、时间和域名影响；官方文档无法替代真实网络测试。
- 费用、免费额度、平台政策及商店费用可能变化，实施前应重新核对官方页面。
- 工程路线为产品与架构建议，不代表已完成 APK、Tauri 包或统一 provider adapter。
