#!/bin/bash
# Sprint (owner 11/03): Cursor works continuously and reviews its own work every round; no per-batch Antigravity
# review. Once at the end: one Antigravity review, one Cursor round that fixes its HIGH/MED findings and writes the
# Chinese change summary. Headless only, no remote, no deploy.
set -u
W=/Users/ashan/Documents/Codex/ll-overnight
L=$W/.overnight/logs
CR=/Users/ashan/.agents/skills/cursor-delegate/scripts/relay.mjs
AR=/Users/ashan/.agents/skills/agy-delegate/scripts/relay.mjs
MODEL=${MODEL:-composer-2.5}
END=$(date -j -f "%H:%M" "${UNTIL:-15:30}" +%s)
export PATH="$W/.overnight/shim:$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$HOME/.cargo/bin:$PATH"
cd "$W"
test -z "$(git remote)" || { echo "refusing: repo has a remote"; exit 1; }
log() { echo "$(date '+%F %T') $*" | tee -a "$L/driver.log"; }
busy() { pgrep -f "relay.mjs.*--cd $W" > /dev/null; }
gate() { { npm test; npm run desktop:check; } > "$L/sprint-test-$1.log" 2>&1; grep -E "^ℹ (tests|pass|fail)" "$L/sprint-test-$1.log" | tr '\n' ' '; }
commit() { git add -A && git commit -q -m "$1" -m "gate: $2" && log "committed $(git rev-parse --short HEAD)"; }
cursor_round() {  # $1 = tag, $2 = extra instruction
  printf '%s\n\n---\n%s\nLast gate: %s\n' "$(cat .overnight/BRIEF.md)" "$2" "$(tail -1 "$L/gates.txt" 2>/dev/null || echo none)" > "$L/sprint-brief-$1.md"
  log "sprint $1: cursor $MODEL"
  node "$CR" --brief "$L/sprint-brief-$1.md" --cd "$W" --model "$MODEL" --timeout 60m --out-dir "$L/sprint-$1" > "$L/sprint-$1.out" 2>&1
  st=$(python3 -c "import json;d=json.load(open('$L/sprint-$1/result.json'));print(d.get('status'))" 2>/dev/null)
  pkill -f "http.server 529[1-9]" 2>/dev/null
  g=$(gate "$1"); echo "sprint $1: $g" >> "$L/gates.txt"; log "sprint $1: relay $st | gate $g"
  printf '\n## Driver gate after sprint %s\n%s\n' "$1" "$g" >> .overnight/PROGRESS-2.md
  commit "sprint $1 (cursor $MODEL)" "$g"
  [ "$st" = "completed" ] || [ "$st" = "timeout" ]
}

while busy; do sleep 30; done   # let the round that is already running finish
commit "batch 20 round 1 (cursor $MODEL)" "$(gate b20r1)"

ROUND=(
"SELF-REVIEW IS PART OF EVERY ROUND (no external reviewer until the very end). Before you finish this round, review your own
changes like a strict senior design engineer: (1) run the review checklists in .overnight/skills/ui-animation (its review
checklist), .overnight/skills/ui-ux-pro-max (UX + motion guidelines) and .overnight/skills/design-dna; (2) compare with
Rauno Freiberg's web-interface-guidelines and the GitHub projects listed in BRIEF.md D3 (search the web as needed); (3) look
at your headless screenshots in WebKit and Chromium, light/dark, zh/de, 1440/390; (4) re-run npm test. Write the findings
and what you fixed into PROGRESS-2.md under 'Self-review'. Fix every real problem before ending the round. Work fast:
prefer finishing whole features per round over many tiny edits."
)
i=0; FAILS=0
while [ "$(date +%s)" -lt "$END" ]; do
  i=$((i + 1))
  if cursor_round "$i" "This is sprint round $i (continuous; stop at $(date -r $END '+%H:%M')). Read .overnight/PROGRESS-2.md first, continue where it stops, pick the most valuable unfinished items of BRIEF.md (sections A–D first), verify, update PROGRESS-2.md and REPORT.md. ${ROUND[0]}"; then FAILS=0; else FAILS=$((FAILS + 1)); log "sprint $i failed ($FAILS)"; sleep 90; fi
  [ "$FAILS" -lt 2 ] || { log "two failed rounds in a row - going to final review"; break; }
done

log "final: antigravity review"
node "$AR" --brief .overnight/REVIEW-BRIEF.md --cd "$W" --model gemini-4-argon-high --read-only --timeout 45m --out-dir "$L/final-review" > "$L/final-review.out" 2>&1
python3 - "$L/final-review/result.json" "$W/.overnight/REVIEW.md" <<'EOF'
import json, sys
try: d = json.load(open(sys.argv[1]))
except Exception as e: d = {"status": f"no result ({e})"}
open(sys.argv[2], "w").write(f"# Antigravity final review\n\nstatus: {d.get('status')}\n\n{d.get('finalMessage') or ''}\n")
EOF
commit "final antigravity review notes" "(review only)"

cursor_round final "FINAL ROUND. 1) Read .overnight/REVIEW.md (Antigravity's final review) and fix every HIGH and MED finding you can reproduce; note any you could not reproduce and why. 2) Then write .overnight/CHANGES-zh.md for the owner, in plain Chinese, no code: everything that changed since tag v2.0.10, grouped as 新功能 / 记账 / 动效与交互 / 配图 / 细节打磨 / 修复的问题 / 已知限制. For each item: what the owner sees and where to click (page + element). Be specific and complete (use git log v2.0.10.. and git diff v2.0.10 --stat to make sure nothing is missing), but do not invent anything that is not in the code. 3) npm test must be green."
log "sprint finished: $(git log --oneline | head -1)"
