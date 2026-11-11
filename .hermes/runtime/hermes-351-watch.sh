#!/bin/zsh

set -u

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Users/ashan/.local/bin"

repo="/Users/ashan/Developer/ll-redesign"
worktree="/Users/ashan/Documents/Codex/ll-351"
runtime_dir="$repo/.hermes/runtime"
session_id="20261001_095006_4fcfb5"
baseline_sha="6279dcd6e3797465dda3086bb982a6102f9fa7f4"
done_marker="$runtime_dir/hermes-351.done"
blocked_marker="$runtime_dir/hermes-351.blocked"
attempts_file="$runtime_dir/hermes-351.restart-count"
watch_log="$runtime_dir/hermes-351-watch.log"
lock_dir="$runtime_dir/hermes-351-watch.lock"

mkdir -p "$runtime_dir"

log_line() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$*" >> "$watch_log"
}

if ! mkdir "$lock_dir" 2>/dev/null; then
  exit 0
fi
trap 'rmdir "$lock_dir" 2>/dev/null || true' EXIT

is_complete() {
  local remote_head version_ok ci_result mac_result
  remote_head="$(git -C "$repo" ls-remote origin refs/heads/codex/macos-3-wip 2>/dev/null | awk '{print $1}')"
  [[ -n "$remote_head" && "$remote_head" != "$baseline_sha" ]] || return 1

  version_ok="$(gh api "repos/zubin-li/life-ledger-deep-review/contents/package.json?ref=$remote_head" --jq '.content' 2>/dev/null | base64 --decode 2>/dev/null | grep -c '"version": "3.5.1"' || true)"
  [[ "$version_ok" -gt 0 ]] || return 1

  ci_result="$(gh run list --repo zubin-li/life-ledger-deep-review --commit "$remote_head" --workflow CI --limit 1 --json conclusion --jq '.[0].conclusion' 2>/dev/null || true)"
  mac_result="$(gh run list --repo zubin-li/life-ledger-deep-review --commit "$remote_head" --workflow 'macOS Desktop Verification' --limit 1 --json conclusion --jq '.[0].conclusion' 2>/dev/null || true)"
  [[ "$ci_result" == "success" && "$mac_result" == "success" ]]
}

if [[ -f "$done_marker" || -f "$blocked_marker" ]]; then
  exit 0
fi

if is_complete; then
  printf '%s\n' "completed" > "$done_marker"
  log_line "3.5.1 is complete on the remote branch; watcher is now inert."
  exit 0
fi

if pgrep -f "hermes .*--resume $session_id" >/dev/null 2>&1 \
  || pgrep -f 'relay\.mjs .*ll-351' >/dev/null 2>&1 \
  || pgrep -f 'agy .*ll-351' >/dev/null 2>&1; then
  log_line "Task is active; no recovery started."
  exit 0
fi

attempts=0
if [[ -f "$attempts_file" ]]; then
  attempts="$(cat "$attempts_file" 2>/dev/null || printf '0')"
fi
case "$attempts" in
  ''|*[!0-9]*) attempts=0 ;;
esac

if (( attempts >= 2 )); then
  printf '%s\n' "restart limit reached" > "$blocked_marker"
  log_line "Recovery stopped after two retries; manual inspection is required."
  exit 0
fi

attempts=$((attempts + 1))
printf '%s\n' "$attempts" > "$attempts_file"
log_line "Starting bounded Hermes recovery attempt $attempts."

recovery_prompt="Recover the interrupted Life Ledger 3.5.1 AntiGravity task only. Inspect the actual state in $worktree, including .agy/run2/result.json, staged/unstaged/untracked changes, and the remote branch. Continue from the existing work instead of restarting. AntiGravity remains the only writer; do not use Cursor. Do not run heavy builds, screenshots, browsers, npm/Rust suites, or macOS builds on this Mac; use GitHub Actions. Preserve the Cursor 3.5.0 commit and all installed comparison apps. If the task is already complete, verify the final SHA, both CI runs and the DMG, then exit. If it is blocked, report the exact blocker and stop."

cd "$repo" || exit 1
hermes --in "$repo" --resume "$session_id" --reasoning low -z "$recovery_prompt" >> "$runtime_dir/hermes-351-recovery.log" 2>&1
exit_code=$?
log_line "Hermes recovery attempt $attempts exited with code $exit_code."
exit "$exit_code"
