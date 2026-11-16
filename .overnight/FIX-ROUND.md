FOCUSED FIX ROUND (Hermes verification of 2.1.0 found these on the 记账 page; screenshot:
/Users/ashan/Documents/Codex/ll-mac-qa/overnight-check/webkit-ledger-full.png — look at it first). Read
`.overnight/BRIEF.md` hard rules; they still apply. Fix only these, verify each with headless WebKit + Chromium screenshots
(1440 and 390, light and dark, zh and de) that you look at, keep `npm test` and `npm run desktop:check` green, then add
a short section 「Hermes 复核后修复」 to `.overnight/CHANGES-zh.md` (plain Chinese, what the owner sees).

1. The month view's "daily strip" renders as a huge grid of ~110 px squares (≈630 px tall). It must be a slim strip:
   one thin bar or small cell per day, at most ~48 px tall, aligned with the panel width, with the day's amount on hover/focus.
2. Category donut: in the demo month one category (rent) dominates so it looks like a single green ring with no
   explanation. Add a compact legend (colour dot · name · amount · %) next to or under the donut, top 5 + 「其他」, and make
   small segments still visible (minimum arc). Keep the sweep-in animation.
3. Category icons show a capital letter ("H", "C", "S") instead of an icon, in the transaction list and in the Today
   quick sheet's recent list. Use the existing icon system (`renderIcon` / hairline icons / the category's `icon` key,
   e.g. coffee, home, cart) with the category colour.
4. A stray empty white box sits under the right side of the day-switcher header (near the ⋯ button) — probably a closed
   popover/menu that is still rendered. Hide it fully when closed (no layout, no paint).
5. The demo workspace has transactions dated after today (e.g. 11月18日 when today is 11月3日). Demo data must never be
   in the future relative to the real today; old real user data is untouched.
6. Regression guard for two bugs Hermes already fixed (commit 30c6acc, do not undo): the Today quick sheet must save
   before the 记账 page was ever opened, and "4,20 Kaffee" must infer 餐饮/Dining.
