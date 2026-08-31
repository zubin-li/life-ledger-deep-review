import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

await import("../public/voice-checkin.js");

const voice = globalThis.LifeLedgerVoiceCheckin;

test("voice helper chooses the first supported recording format", () => {
  const supported = new Set(["audio/mp4", "audio/webm"]);
  const Recorder = { isTypeSupported: type => supported.has(type) };
  assert.equal(voice.chooseMimeType(Recorder), "audio/mp4");
});

test("voice duration and journal append stay deterministic", () => {
  assert.equal(voice.formatDuration(0), "00:00");
  assert.equal(voice.formatDuration(65_900), "01:05");
  assert.equal(voice.appendReflection("Earlier note", "Voice draft"), "Earlier note\n\nVoice draft");
  assert.equal(voice.appendReflection("", "Voice draft"), "Voice draft");
});

test("voice entry is not restricted to today", () => {
  const voiceSource = readFileSync(new URL("../public/voice-checkin.js", import.meta.url), "utf8");
  const appSource = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const stylesSource = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
  assert.match(voiceSource, /options\.enabled !== false && !currentContext\.disabled/);
  assert.doesNotMatch(voiceSource, /currentContext\.isToday &&/);
  assert.match(appSource, /Voice reflection cannot be saved to a future date/);
  assert.match(appSource, /button\.hidden = !hostedCloudMode/);
  assert.match(stylesSource, /\.daily-journal-card \.daily-goals-heading \{ width: 100%; align-items: stretch; flex-direction: column/);
  assert.match(stylesSource, /\.journal-heading-actions \{ width: 100%; flex-direction: row; align-items: center; justify-content: space-between/);
});
