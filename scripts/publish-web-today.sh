#!/bin/sh
# One-step publish of the Web Today cards version, run ONLY after the user approved the local preview.
#   sh scripts/publish-web-today.sh
# 1. full test suite  2. commit on codex/web-today-cards-classic  3. fast-forward main  4. push
# GitHub Actions then republishes Pages (local version) automatically. Rollback: git revert the merge commit.
# The Cloudflare deployment is separate (npm run deploy) and is NOT touched here.
set -eu
cd "$(dirname "$0")/.."
BRANCH=codex/web-today-cards-classic
[ "$(git branch --show-current)" = "$BRANCH" ] || { echo "not on $BRANCH"; exit 1; }
npm test
git add public tests package.json CHANGELOG.md scripts/local-preview.mjs scripts/publish-web-today.sh
git commit -m "feat(web): Today cards — weather, rhythm, heatmap, photo wall, focus, card library, local demo data"
git fetch origin main
# Branch starts at 780b6a1; main = 780b6a1's tree plus a revert commit on top, so replay onto main.
git rebase origin/main
npm test
git push origin "$BRANCH"
git push origin "HEAD:main"   # plain fast-forward; refuses if main moved meanwhile
echo "Pushed. Pages workflow: https://github.com/zubin-li/life-ledger-deep-review/actions"
echo "Live: https://zubin-li.github.io/life-ledger-deep-review/"
