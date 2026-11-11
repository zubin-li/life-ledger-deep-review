# Provenance — Calendar Sync Feasibility

研究日期：2026-08-23

## 官方资料

1. Google Calendar API — Scopes  
   https://developers.google.com/workspace/calendar/api/auth  
   用于：权限含义、最小权限、public app verification 提示。页面更新日期 2026-07-22。

2. Google OAuth 2.0 — Web server applications  
   https://developers.google.com/identity/protocols/oauth2/web-server  
   用于：authorization-code flow、offline access、refresh token、client secret 保管、incremental authorization。

3. Google Calendar API — Incremental synchronization  
   https://developers.google.com/workspace/calendar/api/guides/sync  
   用于：initial full sync、sync token、410 后 full resync。

4. Google Calendar API — Push notifications  
   https://developers.google.com/workspace/calendar/api/guides/push  
   用于：HTTPS webhook、无事件正文、channel expiration 与续订。

5. Google Calendar API — Resource versions / ETags  
   https://developers.google.com/calendar/api/guides/version-resources  
   用于：If-Match 条件修改与冲突防护。

6. Google Calendar API — Events resource  
   https://developers.google.com/workspace/calendar/api/v3/reference/events  
   用于：event ID、etag、status、recurrence、start/end、time zone。

7. Google Calendar API — Recurring events  
   https://developers.google.com/workspace/calendar/api/guides/recurringevents  
   用于：instance、exception 与系列修改语义。

8. Google Calendar API — Usage limits  
   https://developers.google.com/workspace/calendar/api/guides/quota  
   用于：当前标准使用费用、配额与 2026 后续收费预告。

9. Google Cloud — OAuth app verification  
   https://support.google.com/cloud/answer/13463073  
   用于：OAuth verification 基本要求。

10. Apple Developer — Accessing the event store  
    https://developer.apple.com/documentation/eventkit/accessing-the-event-store  
    用于：EventKit 原生权限与事件库边界。

11. Apple Support — Change Calendar settings on iPhone  
    https://support.apple.com/en-gb/guide/iphone/iphc37be2016/26/ios/26  
    用于：iPhone 日历账户与默认日历设置。

12. Apple Support — Third-party access / app-specific passwords  
    https://support.apple.com/en-us/121539  
    https://support.apple.com/en-la/102654  
    用于：第三方 iCloud 访问与凭据风险背景。

## 研究角色

- Researcher：官方 API、Apple/Google 架构、费用、权限与分阶段方案。
- Verifier：OAuth 安全、冲突/周期事件/时区、公开发行风险核查。
- Reviewer：Life Ledger 现有 Cloudflare/D1 架构适配与工程量审查。

## 说明

- 费用、配额与 OAuth 政策可能变化，实施前需再次核对官方页面。
- 工程量是基于当前 Life Ledger PWA/Cloudflare/D1 架构的单人估算，不是供应商承诺。
- “Apple Calendar 双向同步”在本报告中指 Apple Calendar 作为 Google Calendar 的客户端；不包含 iCloud-only 或 On My iPhone/Mac 日历。
