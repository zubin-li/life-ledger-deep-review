# Life Ledger for Mac — online edition setup

## The short version

**Use it on this Mac only (no setup)**

1. Download `Life-Ledger-3.0.0-mac-arm64.zip` from the [Mac 3.0.0 release](https://github.com/zubin-li/life-ledger-deep-review/releases/tag/mac-v3.0.0), unzip it and drag **Life Ledger** into Applications.
2. The first time, macOS says the app is not notarised: open **System Settings → Privacy & Security** and select **Open Anyway** (only once).
3. In the first window, select **Open local**. That's it.

**Sync across devices (phone, computer and Mac share the same records)**

1. Deploy Life Ledger to your own Cloudflare account with [Self-hosting](self-hosting.md), then turn on email-code sign-in with steps 1 and 2 below.
2. Open the Mac app, paste your deployment's address under **Connected cloud**, select **Connect**, and enter your email and the code you receive.

**Changing your mind later**: in the app, **Settings → Data → Switch to sync mode / Switch to local mode** brings back the first window. The browser has the same button. Local and cloud records are separate; to bring your records along, export a backup in **Settings → Import & export** and import it in the other mode.

## Step by step

The Mac app opens either **Local on this Mac** (no account, everything on this Mac) or **your own cloud**: your own Life Ledger deployment on Cloudflare, with sign-in by email and a one-time code. The cloud edition syncs your records, photos and Google Calendar across the Mac app, your browser and your phone.

There is no shared Life Ledger server. Your data stays in your own Cloudflare account.

## What you need

- A Cloudflare account (the free plan is enough).
- Your own Life Ledger deployment. Follow [Self-hosting](self-hosting.md) first, then come back here.
- About 10 minutes.

## 1. Turn on email codes (one-time PIN)

1. In the [Cloudflare dashboard](https://dash.cloudflare.com/), open **Zero Trust**. Pick any team name the first time; the free plan is enough.
2. Go to **Integrations → Identity providers**.
3. Select **Add new identity provider → One-time PIN**, then save.

## 2. Protect your deployment with Cloudflare Access

1. In **Zero Trust → Access controls → Applications**, select **Create new application → Self-hosted**.
2. Add your deployment's hostname, for example `your-life-ledger.pages.dev`. On Pages, add the preview hostnames as a second entry (`*.your-life-ledger.pages.dev`) so no deployment URL is left open.
3. Under **Access policies**, create an **Allow** policy with **Emails** set to your own email address (add family members here if they need their own space; each email gets separate data).
4. Under **Login methods**, keep **One-time PIN** enabled.
5. **Session duration**: how long the Mac app stays signed in. For your own Mac, 1 month is comfortable; on a shared computer, choose a few hours.
6. Select **Create**.

Check it: open your deployment in a private browser window. You should see the Cloudflare page asking for your email before Life Ledger appears.

## 3. Connect the Mac app

1. Open Life Ledger. In the first window, under **Connected cloud**, paste your deployment's address (it must start with `https://`) and select **Connect**.
2. Enter your email and select **Send login code**.
3. Type the code from the email (valid for 10 minutes) and select **Sign in**.

The app remembers the address and opens straight into your cloud next time. You stay signed in for the session duration you chose.

## Day to day

- **Switch between local and cloud**: **Settings → Data → Switch to sync mode / Switch to local mode**, or **File → Switch Workspace…**. Local and cloud data are kept apart; nothing is copied between them.
- **Name and photo**: in the online edition they sync with your records, so every device shows the same; in local mode they stay on this Mac.
- **Sign out**: **File → Sign Out of Cloud**. The next start asks for a new code.
- **Backups and photo exports** are saved to your **Downloads** folder.
- **Forget the address**: in the first window, **Forget**.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| "This One-Time PIN has already been used" | An email security scanner opened the link first. Select **Request new code**. |
| No email arrives | Check spam. The address must match the Allow policy exactly. |
| Life Ledger opens without asking for a code | Access is not protecting that hostname. Repeat step 2 for it. |
| "Cloud sync needs sign-in" inside Life Ledger | The sign-in expired. Click the message, enter a new code. If it keeps coming back, the deployment answers without an Access login: check step 2 and that the Access application covers `/api/*`. |
| macOS says the app cannot be opened | The app is not notarised. Open **System Settings → Privacy & Security** and select **Open Anyway** (only the first time). |

## Privacy

The Mac app adds no server of its own. It shows your deployment in a window, keeps your sign-in cookie in its own storage on this Mac, and never sees your one-time code beyond the sign-in page.
