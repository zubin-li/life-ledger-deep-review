#!/bin/bash
# Overnight driver (owner request 11/02: use up Cursor with its best model; Antigravity reviews; local only, no push).
# Loop: Cursor round (write) -> Hermes-free gate (npm test) -> local commit -> next round. At the end one read-only
# Antigravity review. Never opens windows; open/osascript are shimmed off; no remote, no deploy.
set -u
W=/Users/ashan/Documents/Codex/ll-overnight
L=$W/.overnight/logs
CR=/Users/ashan/.agents/skills/cursor-delegate/scripts/relay.mjs
AR=/Users/ashan/.agents/skills/agy-delegate/scripts/relay.mjs
MODEL=${MODEL:-composer-2.5}
FAILS=0; OK_ROUNDS=0
ROUNDS=${ROUNDS:-12}
DEADLINE=$(( $(date +%s) + ${HOURS:-10} * 3600 ))
export PATH="$W/.overnight/shim:$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$HOME/.cargo/bin:$PATH"
cd "$W"
test -z "$(git remote)" || { echo "refusing: repo has a remote"; exit 1; }
log() { echo "$(date '+%F %T') $*" | tee -a "$L/driver.log"; }
gate() { npm test > "$L/test-$1.log" 2>&1; grep -E "^ℹ (tests|pass|fail)" "$L/test-$1.log" | tr '\n' ' '; }

for i in $(seq 1 "$ROUNDS"); do
  [ "$(date +%s)" -lt "$DEADLINE" ] || { log "deadline reached"; break; }
  printf '%s\n\n---\nThis is round %s of up to %s. Read .overnight/PROGRESS.md first, continue where it stops, pick the most valuable next steps, verify them, update PROGRESS.md and REPORT.md before you finish. Last gate result: %s\n' \
    "$(cat .overnight/BRIEF.md)" "$i" "$ROUNDS" "$(tail -1 "$L/gates.txt" 2>/dev/null || echo none)" > "$L/brief-$i.md"
  log "round $i: cursor $MODEL"
  node "$CR" --brief "$L/brief-$i.md" --cd "$W" --model "$MODEL" --timeout 75m --out-dir "$L/round-$i" > "$L/round-$i.out" 2>&1
  st=$(python3 -c "import json;d=json.load(open('$L/round-$i/result.json'));print(d.get('status'),d.get('resolvedModel'),(d.get('usage') or {}))" 2>/dev/null)
  log "round $i: relay $st"
  pkill -f "http.server 529[0-9]" 2>/dev/null; pkill -f "pages dev . --port 5298" 2>/dev/null
  g=$(gate "$i"); log "round $i: gate $g"; echo "round $i: $g" >> "$L/gates.txt"
  printf '\n## Driver gate after round %s\n%s\n' "$i" "$g" >> .overnight/PROGRESS.md
  git add -A && git commit -q -m "overnight round $i (cursor $MODEL)" -m "gate: $g" && log "round $i: committed $(git rev-parse --short HEAD)"
  case "$st" in
    completed*) FAILS=0; OK_ROUNDS=$((OK_ROUNDS + 1)) ;;
    timeout*) FAILS=0; OK_ROUNDS=$((OK_ROUNDS + 1)) ;;   # watchdog: work may still be on disk, next round continues
    *) FAILS=$((FAILS + 1)); log "round $i: failure $FAILS ($(tail -1 "$L/round-$i/stderr.txt" 2>/dev/null | cut -c1-160))"; sleep 120 ;;
  esac
  [ "$FAILS" -lt 2 ] || { log "two failed rounds in a row - stopping"; break; }
done

[ "$OK_ROUNDS" -gt 0 ] || { log "no successful round - skipping review"; exit 1; }
log "review: antigravity read-only"
node "$AR" --brief .overnight/REVIEW-BRIEF.md --cd "$W" --model gemini-3.8-flash-high --read-only --timeout 40m --out-dir "$L/review" > "$L/review.out" 2>&1
python3 - "$L/review/result.json" "$W/.overnight/REVIEW.md" <<'EOF'
import json, sys
try: d = json.load(open(sys.argv[1]))
except Exception as e: d = {"status": f"no result ({e})"}
open(sys.argv[2], "w").write(f"# Antigravity review\n\nstatus: {d.get('status')}\n\n{d.get('finalMessage') or ''}\n")
EOF
git add -A && git commit -q -m "overnight: antigravity review notes" || true
log "done: $(git log --oneline | head -1)"
