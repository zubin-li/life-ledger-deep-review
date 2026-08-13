# 自托管说明

Life Ledger 支持两条互相独立的私有云路线：

- **Cloudflare Workers + D1**，步骤见下文；
- **腾讯云 CloudBase**，更适合中国大陆，完整步骤见[国内 CloudBase 部署指南](cloudbase-china.zh-CN.md)。

## 推荐方式：Deploy to Cloudflare

README 中的一键部署按钮会让 Cloudflare 把本仓库复制到你的 GitHub 账户，在你的 Cloudflare 账户中创建 Worker 与 D1 数据库，执行迁移并发布应用。部署配置中保留自动识别的 `npm run deploy` 命令即可。

第一次部署之后，应先使用 Cloudflare Access 保护 Worker，再正式依赖云同步。在 Access 尚未启用时，网页仍然可以本地使用，云端 API 会有意返回 `401`。

## 手动部署

```bash
npm install
npx wrangler login
npx wrangler d1 create life-ledger-deep-review-db
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

Cloudflare 免费方案达到额度后，API 可能暂时拒绝同步请求，但浏览器本地保存仍然可用。只有在明确接受费用规则时才主动升级 Cloudflare 方案。

CloudBase 当前的免费体验环境不能开启按量付费。个人自用可使用系统分配的默认域名，不必购买域名；但腾讯云把默认域名定位为开发/测试用途。费用、续期和正式运营域名的边界见[国内方案费用说明](cloudbase-china.zh-CN.md#费用与域名决策)。
