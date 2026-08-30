# Backup and restore

Life Ledger saves local-only records automatically in the current browser profile. A complete backup lets you move those records to another phone, computer, browser, or installed PWA without creating an account.

## Create a complete backup

1. Open **Backup & restore** from the Personal Ledger area.
2. Keep **All history** selected.
3. Choose **Export backup**.
4. Save the `.json` file somewhere private and durable.

The file contains habits and their historical versions, check-ins, moods, journals, daily goals, weekly goals and outputs, and monthly reflections. It is readable JSON for portability, so anyone who receives the file can read its contents. Do not attach it to public issues or store it in an unencrypted public folder.

Day, week, and month exports remain available for analysis or selective transfer. They are partial backups rather than a complete replacement for your history.

### Back up photo memories

Photo memories exist only in the self-hosted Cloudflare edition. Choose **One month**, enable **Include photos**, and export a `.llmedia` file. It contains that month's normal records plus the already-compressed private photos. Repeat for each month that contains photos; the ordinary **All history** JSON remains the complete backup for non-media records.

Keep `.llmedia` files private. They are portable and intentionally readable by Life Ledger without a cloud-account dependency.

## Restore on another device

1. Open Life Ledger on the new device. If you plan to install it as a PWA, install it first and then open the installed app.
2. Open **Backup & restore** and choose **Choose backup file**.
3. Select the Life Ledger `.json` file.
4. Check the preview: backup type, number of habits, recorded days, and export time.
5. Choose **Restore this backup** and confirm.

A complete backup replaces the records in the current browser. A day, week, or month backup merges its records into the current history. Before either operation, Life Ledger keeps the previous state as a safety copy in the same browser; **Undo last restore** restores it.

The importer validates the structure before changing anything and accepts both the current versioned backup format and JSON files exported by earlier beta releases. Files larger than 10 MB are rejected in the browser as a safety limit.

For a `.llmedia` restore, use the same Import tab in a Cloudflare deployment. Life Ledger restores the month's records and then uploads the compressed photos into your own private R2 bucket. Re-importing the same media backup is idempotent and does not duplicate photos. Media bundles larger than 160 MB are rejected.

## What local-only means

- Records are separate for each device, browser, and browser profile.
- Opening the same URL on a phone and a computer does not synchronize them.
- Clearing site data, using private browsing, or losing the device can remove local records.
- Life Ledger asks supported browsers for persistent storage, but the browser makes the final decision.
- Keep more than one dated complete backup for important long-term records.

For live cross-device synchronization, deploy Life Ledger to your own Cloudflare or CloudBase account instead. Local backup and restore remains available in those deployments as an additional safeguard.
