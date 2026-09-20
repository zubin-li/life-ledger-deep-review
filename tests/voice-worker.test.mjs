import test from "node:test";
import assert from "node:assert/strict";
import {
  VoiceRequestError,
  buildRefinementMessages,
  handleVoiceReview,
  normalizeVoiceContext,
  parseReflection,
  transcriptionPrompt,
  validateVoiceForm,
} from "../src/voice.js";

function audioForm({ type = "audio/webm", size = 32, durationMs = 60_000, language = "zh", contextTerms = ["抱石", "季度报告"] } = {}) {
  const form = new FormData();
  form.append("audio", new File([new Uint8Array(size)], "reflection.webm", { type }));
  form.append("durationMs", String(durationMs));
  form.append("language", language);
  form.append("date", "2026-08-22");
  form.append("contextTerms", JSON.stringify(contextTerms));
  return form;
}

test("voice request validation enforces format and ten-minute cap", () => {
  assert.equal(validateVoiceForm(audioForm()).durationSeconds, 60);
  assert.throws(() => validateVoiceForm(audioForm({ type: "text/plain" })), error => error instanceof VoiceRequestError && error.status === 415);
  assert.throws(() => validateVoiceForm(audioForm({ durationMs: 601_000 })), error => error instanceof VoiceRequestError && error.code === "VOICE_DURATION_INVALID");
});

test("refinement prompt preserves facts and forbids invention", () => {
  const messages = buildRefinementMessages({ transcript: "今天做完了报告。", language: "zh", date: "2026-08-22", contextTerms: ["抱石"] });
  assert.match(messages[0].content, /Do not invent/);
  assert.match(messages[0].content, /Simplified Chinese/);
  assert.match(messages[0].content, /homophone/);
  assert.match(messages[0].content, /rather than guessing/);
  assert.match(messages[1].content, /抱石/);
  assert.match(messages[1].content, /今天做完了报告/);
});

test("voice context is sanitized, deduplicated, and bounded", () => {
  const values = normalizeVoiceContext(JSON.stringify([" 抱石 ", "抱石", "Quarterly\u0000report", ...Array.from({ length: 30 }, (_, index) => `term-${index}`)]));
  assert.deepEqual(values.slice(0, 2), ["抱石", "Quarterly report"]);
  assert.equal(values.length, 16);
  assert.match(transcriptionPrompt("zh", values), /准确保留具体活动/);
  assert.match(transcriptionPrompt("zh", values), /抱石/);
});

test("reflection parser accepts structured and fenced JSON output", () => {
  assert.equal(parseReflection({ response: { reflection: "Clear day." } }), "Clear day.");
  assert.equal(parseReflection({ response: '```json\n{"reflection":"清晰的一天。"}\n```' }), "清晰的一天。");
});

test("voice review transcribes, refines, and never returns audio", async () => {
  const calls = [];
  const env = {
    DB: {
      prepare() {
        return {
          bind() {
            return {
              run: async () => ({ success: true, meta: { changes: 1 } }),
              first: async () => ({ request_count: 1, reserved_seconds: 60 }),
            };
          },
        };
      },
    },
    AI: {
      async run(model, input) {
        calls.push({ model, input });
        if (model.includes("whisper")) return { text: "嗯，今天我把报告做完了。", transcription_info: { language: "zh" } };
        return { response: { reflection: "今天完成了报告。" } };
      },
    },
  };
  const request = new Request("https://ledger.example/api/voice-review", { method: "POST", body: audioForm() });
  const result = await handleVoiceReview(request, env, "identity-hash");

  assert.equal(result.transcript, "嗯，今天我把报告做完了。");
  assert.equal(result.reflection, "今天完成了报告。");
  assert.equal(result.audioStored, false);
  assert.equal("audio" in result, false);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].input.beam_size, 8);
  assert.equal(calls[0].input.no_speech_threshold, 0.8);
  assert.match(calls[0].input.initial_prompt, /抱石/);
  assert.match(calls[1].input.messages[1].content, /季度报告/);
});
