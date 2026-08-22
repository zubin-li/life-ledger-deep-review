import test from "node:test";
import assert from "node:assert/strict";

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
