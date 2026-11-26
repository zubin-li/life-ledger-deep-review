#!/usr/bin/env bash
# Called from android-emulator-runner, which runs `script:` via `sh -c` (dash): bash-only syntax must live here.
set -euo pipefail
adb wait-for-device
adb shell settings put global auto_time 1
adb shell settings put global auto_time_zone 1
adb shell service call alarm 3 s16 Europe/Berlin || adb shell setprop persist.sys.timezone Europe/Berlin
adb shell settings put system system_locales zh-CN
adb install -r "$SIGNED_APK"

PACK=android-review-pack
mkdir -p "$PACK/metrics-raw" "$PACK/recordings" "$PACK/screenshots" "$PACK/junit-parts"
cd "$GITHUB_WORKSPACE"
export MAESTRO_DRIVER_STARTUP_TIMEOUT=120000

FLOWS=(
  01-cold-start
  02-welcome-sample
  03-welcome-empty
  04-navigation-back
  05-fab-expense
  06-habits-mood
  07-focus-settings
  08-process-death
)

JUNIT_PARTS=()
FAIL=0
for flow in "${FLOWS[@]}"; do
  adb shell am force-stop "$ANDROID_PKG" || true
  adb shell dumpsys gfxinfo "$ANDROID_PKG" reset >/dev/null 2>&1 || true
  COLD_MS=""
  if [ "$flow" = "01-cold-start" ]; then
    adb shell pm clear "$ANDROID_PKG"
    START_OUT="$(adb shell am start -W -n "$ANDROID_ACTIVITY" 2>&1 || true)"
    COLD_MS="$(echo "$START_OUT" | awk '/TotalTime:/ {print $2; exit}')"
  fi

  set +e
  maestro test \
    --format junit \
    --output "$PACK/junit-parts/${flow}.xml" \
    -e TODAY_ZH="$TODAY_ZH" \
    -e TODAY_EN="$TODAY_EN" \
    -e TODAY_DE="$TODAY_DE" \
    ".maestro/${flow}.yaml"
  rc=$?
  set -e
  if [ "$rc" -ne 0 ]; then FAIL=1; fi
  JUNIT_PARTS+=("$PACK/junit-parts/${flow}.xml")

  GFX="$(adb shell dumpsys gfxinfo "$ANDROID_PKG" 2>/dev/null || true)"
  export GFX_SNAP="$GFX"
  export OUT_JSON="$PACK/metrics-raw/${flow}.json"
  export METRIC_EXTRA="{\"coldStartMs\":${COLD_MS:-null},\"video\":\"recordings/${flow}.mp4\"}"
  node --input-type=module -e "
    import { writeFile } from 'node:fs/promises';
    import { parseGfxInfo } from './scripts/review-pack/summarize.mjs';
    const gfx = process.env.GFX_SNAP || '';
    const extra = JSON.parse(process.env.METRIC_EXTRA || '{}');
    await writeFile(process.env.OUT_JSON, JSON.stringify({ ...parseGfxInfo(gfx), ...extra }, null, 2) + '\n');
  "

  if [ -d recordings ]; then cp -a recordings/* "$PACK/recordings/" 2>/dev/null || true; fi
  if [ -d screenshots ]; then cp -a screenshots/* "$PACK/screenshots/" 2>/dev/null || true; fi
done

node --input-type=module -e "
  import { mergeJUnitReports, buildReviewPack } from './scripts/review-pack/summarize.mjs';
  const parts = process.argv.slice(2);
  await mergeJUnitReports(parts, 'android-review-pack/junit.xml');
  await buildReviewPack({ packDir: 'android-review-pack' });
" "${JUNIT_PARTS[@]}"

if [ "$FAIL" -ne 0 ]; then
  echo "One or more Maestro flows failed (see junit.xml and index.html)"
  exit 1
fi

