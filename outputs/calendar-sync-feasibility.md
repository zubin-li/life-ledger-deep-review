# Life Ledger 日历双向同步可行性研究

研究日期：2026-08-23

## 结论

该功能可行，但当前 PWA 不应直接连接 Apple Calendar。最稳妥的架构是把 Google Calendar 作为唯一权威数据源，Apple Calendar 继续作为 iPhone、iPad 和 Mac 上的系统客户端；Life Ledger 通过部署在 Cloudflare 的后端连接 Google Calendar API。

```text
Apple Calendar（客户端）
          ↕
Google Calendar（唯一权威源） ↔ Life Ledger Cloudflare 后端 ↔ Life Ledger UI / Review
```

用户在 Apple Calendar 中创建事件时，必须将事件保存到 Google 日历或专属的 “Life Ledger” Google 日历。保存到 iCloud 或“我的 iPhone/Mac”的事件不会进入 Life Ledger。Apple 官方允许用户在 iPhone 中添加日历账户并选择默认日历；Google Calendar API 则提供稳定的 OAuth、读取、写入和增量同步能力。[Apple Calendar 设置](https://support.apple.com/en-gb/guide/iphone/iphc37be2016/26/ios/26) [Google Calendar API scopes](https://developers.google.com/workspace/calendar/api/auth)

## 为什么不直接连接 Apple Calendar

Apple EventKit 是原生 iOS/macOS 框架，浏览器和 PWA 不能直接调用。若要使用它，Life Ledger 必须另做原生 App，并处理系统权限、设备本地事件库、发布和维护；这不适合当前 Cloudflare PWA 架构。[Apple EventKit](https://developer.apple.com/documentation/eventkit/accessing-the-event-store)

iCloud CalDAV 在协议层面可以实现，但需要维护凭据、发现流程、同步引擎、冲突与周期事件，且 Apple 没有为普通网页提供与 Google Calendar REST API 等价的直接授权路径。它会显著增加安全风险与维护成本，不建议作为首版。

## 推荐功能边界

日历事件只代表“安排过什么”，不代表“确实完成了什么”。因此：

- 日历事件可作为每日复盘、每周/月度时间分布和 AI 分析的背景证据。
- 不应自动勾选 Habit，也不应把已经过去的事件自动计为完成。
- 默认只读取用户主动勾选的日历。
- 默认不长期保存参与者邮箱、会议链接和详细地点；事件描述是否纳入 AI 应单独获得用户同意。

## 推荐分期

### P1：只读日历与复盘背景

- Google OAuth 连接与断开。
- 用户选择要显示的日历。
- 在 Today/日期抽屉中展示当天安排。
- 在 Review 中统计已安排时间、会议负载、Focus block 和类别分布。
- 打开 App 时增量同步，并提供手动刷新。

建议权限：`calendar.events.readonly` 与 `calendar.calendarlist.readonly`。Google 明确建议选择满足需求的最窄权限。[Calendar scopes](https://developers.google.com/workspace/calendar/api/auth)

### P2：安全的双向写入

- Life Ledger 创建专属的 “Life Ledger” Google secondary calendar。
- Life Ledger 可以创建、编辑和删除自己创建的事件。
- 用户在 Apple Calendar 里编辑该 Google 日历，Life Ledger 下次同步后读取变化。
- 不修改用户原有工作会议、邀请或其他日历事件。

建议写入权限：`calendar.app.created`。该 scope 只允许创建 secondary calendars，并管理应用创建日历中的事件，比全账户写权限安全。[Calendar scopes](https://developers.google.com/workspace/calendar/api/auth)

### P3：准实时同步

- Google push channel 通知 Life Ledger “有变化”。
- Worker 收到通知后再用增量同步读取具体变化。
- Cloudflare Cron 定期续订会过期的 channel，并做周期 reconciliation。

Google 的 push 通知不包含事件正文，channel 也不会自动续订，因此它不是“一次设置、永远实时”；仍必须保留增量拉取与补偿同步。[Push notifications](https://developers.google.com/workspace/calendar/api/guides/push)

### P4：编辑用户其他日历（可选）

只有经过实际使用验证后，再允许用户显式授权 Life Ledger 编辑其拥有的其他 Google 日历。需要处理邀请、重复事件、系列例外和冲突，不建议直接进入首版。

## 同步与冲突设计

初次连接做完整同步并保存 `nextSyncToken`；后续只拉增量变化。若 Google 返回 `410 Gone`，必须清空相应缓存并重新完整同步。[Incremental sync](https://developers.google.com/workspace/calendar/api/guides/sync)

更新和删除应保存事件 `etag`，通过 `If-Match` 进行条件写入；若远端已变化，则重新拉取并向用户显示冲突，不能静默覆盖。[ETags and conditional modification](https://developers.google.com/calendar/api/guides/version-resources)

必须正确区分：

- 全天事件与定时事件；全天事件的结束日期是 exclusive。
- IANA 时区与夏令时，不能只保存本地字符串。
- 单次事件与周期事件，以及“仅本次/整个系列/本次及以后”。
- `cancelled` 事件与真正不存在的事件。
- Google event ID、`iCalUID`、recurring event ID 与 occurrence start，不能按标题去重。

## 后端与数据安全

- OAuth authorization-code flow 在 Cloudflare Worker 完成；浏览器不得保存 client secret 或 refresh token。
- 使用 `access_type=offline` 获取 refresh token，以便用户离开页面后仍可同步。[Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- refresh token 以应用级 AES-GCM 密钥加密后存入单独的 D1 表；密钥放 Cloudflare Worker Secret。
- 日历连接、sync token、minimal event cache 和 pending mutation 应独立建表，不要塞进 Life Ledger 当前整包 state JSON。
- 每个开源自部署者使用自己的 Google Cloud OAuth client；项目作者不提供公共 client secret 或公共同步代理。
- local-only/GitHub Pages 版没有安全后端，应明确显示“日历同步仅云端部署版可用”。

## OAuth 审核现实

Calendar 事件权限属于需要谨慎处理的用户数据权限。公开 OAuth 应用需要 consent screen、已验证域名、隐私政策、scope justification，可能还要功能演示与 Google 验证。个人自用或少量测试用户可以先测试，但测试状态的长期 token 和未验证应用警告不适合作为正式产品体验。[OAuth verification](https://support.google.com/cloud/answer/13463073)

因此，开源项目最符合“数据归用户”的方式仍是：每位部署者创建自己的 OAuth client，并把 client ID/secret 配置为 Worker secrets。

## 成本

Google Calendar API 的标准使用目前不收额外费用；当前公布的配额远高于个人 Life Ledger 的用量。Google 同时说明，2026 年稍后可能对超过每日阈值的流量收费，并会提前通知。以个人每天几十次请求估算，API 成本近似为 0。[Google Calendar quotas](https://developers.google.com/workspace/calendar/api/guides/quota)

Cloudflare Worker/D1 增量开销也很小，不涉及音频或图片对象存储。真正的成本主要是开发、OAuth 配置和长期维护，而不是单人使用费。

## 工程量估算

结合 Life Ledger 当前“开源 Worker + 个人 Pages Functions”两套后端，以及中英德三语、手机 UI 和真实时区测试，保守估算如下：

- 技术验证与共享 Calendar Core：2–3 个工程日。
- OAuth、token 加密、撤权与权限安全：3–5 个工程日。
- 只读显示版：总计约 8–12 个工程日。
- 稳定的 on-view 双向 V1（读取、创建、编辑、删除、刷新、Drawer UI、Review 中性统计、双后端测试和文档）：总计约 18–28 个工程日，即约 3.5–5.5 周。
- P3 push channel、Cron 续订、incremental cache 与补偿同步：额外约 7–12 个工程日。
- 编辑任意原有日历和完整周期事件体验：额外 7–12 个工程日。
- 原生 Apple EventKit companion：约 3–6 周以上，不推荐当前开展。

这里真正费时的不是画一个日历卡片，而是 OAuth 安全、两套后端一致性、周期事件、时区/DST、撤权和防止静默覆盖。

## 最终建议

不要一开始承诺“所有 Apple/iCloud/Google 日历完全实时双向”。推荐产品承诺是：

> Life Ledger 连接用户选择的 Google Calendar；Apple Calendar 中保存到 Google/Life Ledger 日历的事件，会在各设备与 Life Ledger 间准实时同步。

实施顺序应为 P1 → P2 → P3。P1 先证明“日历背景是否真的提升复盘价值”；P2 再提供安全可控的双向编辑；P3 最后解决后台准实时性。这样不会为了一个看似简单的同步开关，先承担最危险的覆盖、重复和 OAuth 审核问题。
