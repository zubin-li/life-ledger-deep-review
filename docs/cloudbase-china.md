# Mainland China deployment: Tencent CloudBase

The CloudBase build is for people who want reliable access from mainland China while keeping all synchronized data inside their own Tencent Cloud account. It uses the same interface as the Cloudflare build, but replaces the sync layer with CloudBase Authentication and a private document collection.

## What it costs

- Personal evaluation can start at **CNY 0** with one CloudBase Free environment and its assigned `*.tcloudbaseapp.com` address. No domain purchase is required.
- As of August 2026, the Free environment includes 3,000 resource points per month and cannot enable pay-as-you-go billing. It must be renewed manually every six months.
- Tencent documents the assigned domain as development/testing infrastructure. A public production service needs a custom domain, ICP filing, and a qualifying paid environment.

Check the current [CloudBase pricing rules](https://cloud.tencent.com/document/product/876/127357), [static-hosting domain policy](https://cloud.tencent.com/document/product/876/46900), and [ICP requirements](https://cloud.tencent.com/document/product/876/128405) before deploying.

## One-time environment setup

1. Create a Free CloudBase environment at the [CloudBase console](https://tcb.cloud.tencent.com/). Choose the document database and preferably the Shanghai region. Copy its full environment ID.
2. Under **Authentication → Sign-in methods**, enable email OTP and the built-in email delivery service. Copy the Web **Publishable Key / Access Key**. This is a browser-safe public key; never expose a Tencent Cloud API `SecretKey`.
3. Under **Document Database → Collections**, create `life_ledger_states` and select **Only the creator can read and write**.

CloudBase automatically records `_openid` on browser writes, so the collection permission isolates every account. See the official [security-rule examples](https://docs.cloudbase.net/rule/rule-example).

## Option A: deploy from Git (recommended)

CloudBase Static Hosting supports GitHub, GitLab, Gitee, and public Git URLs. If GitHub connectivity is inconvenient, import this repository into Gitee first.

Use these settings in **Static Hosting → New application → Git repository deployment**:

| Setting | Value |
|---|---|
| Repository | `https://github.com/zubin-li/life-ledger-deep-review` |
| Branch | `main` |
| Node.js | 20 or newer |
| Install command | `npm ci` |
| Build command | `npm run build:cloudbase` |
| Output directory | `dist/cloudbase` |
| Deploy path | `/` |

Add three build variables:

```text
TCB_ENV_ID=<full environment ID>
TCB_ACCESS_KEY=<publishable key>
TCB_REGION=ap-shanghai
```

Start the deployment. The maintained `cloudbaserc.json` describes the static application; the build writes only public client configuration into the artifact. See the current [CloudBase hosting quick start](https://docs.cloudbase.net/hosting/quick-start).

## Option B: one-command CLI deployment

```bash
git clone https://github.com/zubin-li/life-ledger-deep-review.git
cd life-ledger-deep-review
npm ci
npx --yes --package @cloudbase/cli@3.7.3 tcb login

export TCB_ENV_ID="your-environment-id"
export TCB_ACCESS_KEY="your-publishable-key"
export TCB_REGION="ap-shanghai"
npm run deploy:cloudbase
```

The command builds a clean CloudBase artifact, injects that deployer's public environment configuration, and uploads only the app files. Browser `localStorage` and demo data are never part of the deployment.

`.env.example` is provided as a field checklist. Real `.env` files are Git-ignored. If CloudBase reports an untrusted origin after deployment, add only the deployed HTTPS address to the environment's allowed Web origins/security domains.

## Architecture and privacy

```text
Browser / installed PWA
   ├── localStorage             immediate local save
   ├── JSON export             user-controlled backup
   └── CloudBase Web SDK v3    authenticated device sync
             ↓
      Your CloudBase environment
      ├── email OTP authentication
      └── life_ledger_states
          creator-only access
```

There is no shared Life Ledger backend. The owner of a CloudBase environment can inspect its records, because application-layer end-to-end encryption is not currently provided.

For a detailed Chinese walkthrough, cost table, update flow, and troubleshooting, read [中国大陆 CloudBase 部署指南](cloudbase-china.zh-CN.md).
