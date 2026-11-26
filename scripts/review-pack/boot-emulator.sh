#!/usr/bin/env bash
# Boot the CI emulator ourselves instead of reactivecircus/android-emulator-runner: that action sends
# `input keyevent 82` as soon as sys.boot_completed=1, before system_server has registered its
# services, and intermittently dies with "Failure calling service input: Broken pipe" (upstream
# #432/#489; the proposed fix #495 waits for `service check input`). We wait for the core services
# to answer several times in a row, then hand over to run-flows.sh.
set -euo pipefail
IMG="system-images;android-34;google_apis;x86_64"
AVD=ci
mkdir -p android-review-pack
# The emulator action used to put these on PATH; later steps (run-flows.sh) need them too.
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
[ -n "${GITHUB_PATH:-}" ] && printf '%s\n%s\n' "$ANDROID_HOME/platform-tools" "$ANDROID_HOME/emulator" >> "$GITHUB_PATH"
command -v adb >/dev/null || { echo "adb not found under $ANDROID_HOME/platform-tools"; exit 1; }
adb start-server
export ANDROID_AVD_HOME="$HOME/.android/avd"   # pin it: avdmanager and emulator must agree (runner image sets ANDROID_USER_HOME elsewhere)
mkdir -p "$ANDROID_AVD_HOME"
echo no | "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" create avd -n "$AVD" -k "$IMG" -d pixel_6 --force
CFG="$ANDROID_AVD_HOME/$AVD.avd/config.ini"
test -f "$CFG" || { echo "AVD config missing; avdmanager list:"; "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" list avd; exit 1; }
printf 'hw.ramSize=4096\ndisk.dataPartition.size=6G\n' >> "$CFG"
"$ANDROID_HOME/emulator/emulator" -avd "$AVD" -no-snapshot -no-window -gpu swiftshader_indirect \
  -noaudio -no-boot-anim > android-review-pack/emulator.log 2>&1 &
adb wait-for-device

deadline=$((SECONDS + 600))
wait_boot() {
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    [ $SECONDS -lt $deadline ] || { echo "emulator did not boot in 10 min"; exit 1; }
    sleep 3
  done
}
wait_boot
# Switch to zh-CN ourselves. The emulator's -change-locale does it by restarting the framework *after*
# boot_completed=1, which is what kept breaking every readiness check ("Restarting framework" in the
# emulator log, then "Failure calling service input: Broken pipe"). Here the restart is ours, so we can
# clear the boot flag first and wait for the second boot deterministically.
adb root >/dev/null; adb wait-for-device
adb shell "setprop persist.sys.locale zh-CN; setprop sys.boot_completed 0; stop; start"
wait_boot
[ "$(adb shell getprop persist.sys.locale | tr -d '\r')" = "zh-CN" ] || { echo "locale not applied"; exit 1; }
services_up() {
  for s in input package activity window settings; do
    adb shell service check "$s" 2>/dev/null | grep -q ": found" || return 1
  done
  adb shell pm path android >/dev/null 2>&1
}
ok=0
until [ $ok -ge 3 ]; do  # 3 consecutive healthy checks, so a system_server restart is not mistaken for ready
  [ $SECONDS -lt $deadline ] || { echo "system services not ready in 10 min"; exit 1; }
  if services_up; then ok=$((ok + 1)); else ok=0; fi
  sleep 2
done
# Test devices suppress system ANR/crash dialogs (the setting CTS/Firebase Test Lab rely on): after the
# locale restart a software-GPU System UI is slow and its "System UI isn't responding" dialog covered
# the App in every flow of run 45905053009.
adb shell settings put global hide_error_dialogs 1
adb shell settings put secure anr_show_background 0 >/dev/null 2>&1 || true
# Then wait for System UI to settle: no ANR window and a focused window, three checks in a row.
calm=0
until [ $calm -ge 3 ]; do
  [ $SECONDS -lt $deadline ] || { echo "System UI did not settle"; exit 1; }
  focus="$(adb shell dumpsys window 2>/dev/null | grep -m1 mCurrentFocus || true)"
  if echo "$focus" | grep -qiE "not responding|Application Error|null"; then
    calm=0; adb shell input keyevent 4 >/dev/null 2>&1 || true
  else calm=$((calm + 1)); fi
  sleep 3
done
adb shell input keyevent 82   # dismiss keyguard
adb shell settings put global window_animation_scale 1 >/dev/null 2>&1 || true
echo "emulator ready after ${SECONDS}s"
