You are reviewing the overnight work in this repository (read-only, do NOT edit files, do not run git push/deploy).
Base: tag v2.0.10. Read `.overnight/BRIEF.md` (the current task: the owner's simplification feedback), `.overnight/PROGRESS-2.md`, `.overnight/LEDGER-DESIGN.md`,
then `git diff v2.0.10 --stat` and the important parts of the diff.

Check, with exact file:line evidence:
1. Data safety: old state without `ledger` loads unchanged; ledger survives local save, cloud merge
   (`mergeRemoteCloudPayload`, conflict copies, CAS), backup export/import, undo delete. Any path that can drop or
   corrupt user data is HIGH.
2. Money correctness: integer minor units, rounding, currency mixing, parsing of "12,50" / "3.2" / "-45" / "+2000",
   German CSV (`;`, decimal comma, DD.MM.YYYY), month boundaries/time zones.
3. Regressions: buttons/pickers inside `<label>`; translucent or covered popovers; focus/typing overwritten by
   re-renders; broken layouts in zh/en/de, dark mode, 390 px width; Mac shell (`desktop/mac/shell.*`).
4. Rule breaks: external network at runtime, new heavy dependencies, GPL code copied, secrets, changes to
   `functions/`, migrations, updater key/signing, missing translations, versions not bumped consistently.
5. Over-engineering and dead code.
6. Does the result follow the owner spec in BRIEF.md (sections A–D: Today quick-entry card, ledger page = statistics, motion system and smoothness numbers in MOTION-RESEARCH.md, minimal SVG illustrations): daily entry + automatic categorisation and statistics, week/month view, monthly subscriptions, slim list, design consistent with 本周/复盘, nav order 时间轴 → 记账 → 复盘, and the six known problems fixed? List each spec point as done / partly / missing.

Output (≤ 900 words): table `# | HIGH/MED/LOW | file:line | problem | concrete fix`, then a one-paragraph verdict:
is this safe for the owner to try locally tomorrow? Mark anything you could not verify as "unverified".
