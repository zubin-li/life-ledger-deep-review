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
export ANDROID_AVD_HOME="$HOME/.android/avd"   # pin it: avdmanager and emulator must agree (runner image sets ANDROID_USER_HOME elsewhere)
mkdir -p "$ANDROID_AVD_HOME"
echo no | "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" create avd -n "$AVD" -k "$IMG" -d pixel_6 --force
CFG="$ANDROID_AVD_HOME/$AVD.avd/config.ini"
test -f "$CFG" || { echo "AVD config missing; avdmanager list:"; "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" list avd; exit 1; }
printf 'hw.ramSize=4096\ndisk.dataPartition.size=6G\n' >> "$CFG"
"$ANDROID_HOME/emulator/emulator" -avd "$AVD" -no-snapshot -no-window -gpu swiftshader_indirect \
  -noaudio -no-boot-anim -change-locale zh-CN > android-review-pack/emulator.log 2>&1 &
adb wait-for-device

deadline=$((SECONDS + 600))
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
  [ $SECONDS -lt $deadline ] || { echo "emulator did not boot in 10 min"; exit 1; }
  sleep 3
done
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
adb shell input keyevent 82   # dismiss keyguard
adb shell settings put global window_animation_scale 1 >/dev/null 2>&1 || true
echo "emulator ready after ${SECONDS}s"
