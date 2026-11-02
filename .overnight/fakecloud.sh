#!/bin/bash
# Local Cloudflare Pages stand-in for this overnight clone (no remote D1/R2).
# usage: .overnight/fakecloud.sh [port]   (default 5298)
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=${1:-5298}
DIR="${ROOT}/.overnight/scratch/fakecloud"
rm -rf "$DIR"
mkdir -p "$DIR"
rsync -a "$ROOT/public/" "$DIR/"
STUB="${ROOT}/.overnight/fakecloud-stub"
if [ -d "$ROOT/functions" ] && [ -f "$ROOT/schema.sql" ]; then
  rsync -a "$ROOT/functions" "$ROOT/schema.sql" "$DIR/"
else
  rsync -a "$STUB/functions/" "$DIR/functions/"
  cp "$STUB/schema-qa.sql" "$DIR/schema.sql"
fi
printf 'window.LIFE_LEDGER_DEPLOYMENT_MODE = window.LIFE_LEDGER_DEPLOYMENT_MODE || "cloudflare";\n' > "$DIR/deployment-mode.js"
cat > "$DIR/wrangler.toml" <<'EOF'
name = "life-ledger-overnight-qa"
compatibility_date = "2026-06-28"
pages_build_output_dir = "."

[[d1_databases]]
binding = "DB"
database_name = "overnight-qa-db"
database_id = "00000000-0000-4000-8000-000000000001"

[[r2_buckets]]
binding = "PHOTOS"
bucket_name = "overnight-qa-photos"
EOF
cat > "$DIR/functions/_middleware.js" <<'EOF'
export async function onRequest({ request, next }) {
  const signedIn = new Request(request);
  signedIn.headers.set("CF-Access-Authenticated-User-Email", "qa@example.invalid");
  return next(signedIn);
}
EOF
cd "$DIR"
npx --yes wrangler@4 d1 execute overnight-qa-db --local --file schema.sql 2>&1 | tail -2
exec npx wrangler@4 pages dev . --port "$PORT" --ip 127.0.0.1
