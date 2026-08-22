import { Buffer } from "node:buffer";

const TRANSCRIPTION_MODEL = "@cf/openai/whisper-large-v3-turbo";
const REFINEMENT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const MAX_RECORDING_SECONDS = 10 * 60;
const DAILY_RECORDING_SECONDS = 20 * 60;
const DAILY_REQUESTS = 3;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
]);

class VoiceRequestError extends Error {
  constructor(message, status = 400, code = "VOICE_REQUEST_INVALID") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function normalizedLanguage(value) {
  return ["zh", "en", "de"].includes(value) ? value : "en";
}

function contentTypeBase(value) {
  return String(value || "").toLowerCase().split(";", 1)[0].trim();
}

function validateVoiceForm(form) {
  const audio = form.get("audio");
  if (!(audio instanceof File)) throw new VoiceRequestError("Audio file is required");
  const contentType = contentTypeBase(audio.type);
  if (!ALLOWED_AUDIO_TYPES.has(contentType)) {
    throw new VoiceRequestError("Unsupported audio format", 415, "VOICE_FORMAT_UNSUPPORTED");
  }
  if (!audio.size || audio.size > MAX_AUDIO_BYTES) {
    throw new VoiceRequestError("Recording is too large", 413, "VOICE_TOO_LARGE");
  }

  const durationSeconds = Math.ceil(Number(form.get("durationMs")) / 1000);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > MAX_RECORDING_SECONDS) {
    throw new VoiceRequestError("Recording must be between 1 second and 10 minutes", 400, "VOICE_DURATION_INVALID");
  }

  return {
    audio,
    contentType,
    durationSeconds,
    language: normalizedLanguage(String(form.get("language") || "")),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(form.get("date") || "")) ? String(form.get("date")) : "",
  };
}

function languageInstruction(language) {
  if (language === "zh") return "Write in natural Simplified Chinese.";
  if (language === "de") return "Write in natural German.";
  return "Write in natural English.";
}

function buildRefinementMessages({ transcript, language, date }) {
  const system = [
    "You edit a private spoken daily reflection into a faithful written journal entry.",
    languageInstruction(language),
    "Keep the first-person voice and every material fact, uncertainty, emotion, decision, and lesson the speaker expressed.",
    "Remove filler words, false starts, repetition, and verbal clutter. Reorder ideas only when it improves clarity.",
    "Do not invent events, motives, achievements, emotions, advice, or conclusions. Do not intensify the tone.",
    "Produce two to five concise paragraphs. Use short bullet points only when the speaker clearly listed several distinct items.",
    "Do not add a title, date, greeting, preface, motivational ending, or commentary about the editing process.",
    "If the transcript is already concise, make only light edits.",
  ].join(" ");
  const context = date ? `Reflection date: ${date}.\n\n` : "";
  return [
    { role: "system", content: system },
    { role: "user", content: `${context}Spoken transcript:\n${transcript}` },
  ];
}

function responseText(result) {
  if (typeof result === "string") return result.trim();
  if (typeof result?.response === "string") return result.response.trim();
  if (typeof result?.result?.response === "string") return result.result.response.trim();
  if (typeof result?.response?.reflection === "string") return result.response.reflection.trim();
  if (typeof result?.reflection === "string") return result.reflection.trim();
  return "";
}

function parseReflection(result) {
  if (typeof result?.response === "object" && typeof result.response?.reflection === "string") {
    return result.response.reflection.trim();
  }
  if (typeof result?.reflection === "string") return result.reflection.trim();
  const raw = responseText(result);
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/\s*```$/, ""));
    return typeof parsed?.reflection === "string" ? parsed.reflection.trim() : "";
  } catch {
    return raw.replace(/^```(?:markdown|text)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
}

async function reserveVoiceUsage(env, keyHash, durationSeconds, now = new Date()) {
  const usageDay = now.toISOString().slice(0, 10);
  const result = await env.DB.prepare(`
    INSERT INTO voice_usage (key_hash, usage_day, request_count, reserved_seconds, updated_at)
    VALUES (?, ?, 1, ?, ?)
    ON CONFLICT(key_hash, usage_day) DO UPDATE SET
      request_count = voice_usage.request_count + 1,
      reserved_seconds = voice_usage.reserved_seconds + excluded.reserved_seconds,
      updated_at = excluded.updated_at
    WHERE voice_usage.request_count < ?
      AND voice_usage.reserved_seconds + excluded.reserved_seconds <= ?
  `).bind(keyHash, usageDay, durationSeconds, now.getTime(), DAILY_REQUESTS, DAILY_RECORDING_SECONDS).run();

  if (!result.success) throw new VoiceRequestError("Unable to reserve voice allowance", 503, "VOICE_USAGE_UNAVAILABLE");
  if (!result.meta?.changes) {
    throw new VoiceRequestError("Daily voice allowance reached", 429, "VOICE_DAILY_LIMIT");
  }

  const row = await env.DB.prepare(
    "SELECT request_count, reserved_seconds FROM voice_usage WHERE key_hash = ? AND usage_day = ?",
  ).bind(keyHash, usageDay).first();
  return {
    requestsRemaining: Math.max(0, DAILY_REQUESTS - Number(row?.request_count || 0)),
    secondsRemaining: Math.max(0, DAILY_RECORDING_SECONDS - Number(row?.reserved_seconds || 0)),
  };
}

async function transcribe(env, audio, language) {
  const bytes = Buffer.from(await audio.arrayBuffer()).toString("base64");
  const result = await env.AI.run(TRANSCRIPTION_MODEL, {
    audio: bytes,
    task: "transcribe",
    language,
    vad_filter: true,
    condition_on_previous_text: true,
    hallucination_silence_threshold: 2,
    initial_prompt: "Life Ledger personal daily reflection. Preserve names, projects, decisions, emotions, and concrete details.",
  });
  const transcript = String(result?.text || "").trim();
  if (!transcript) throw new VoiceRequestError("No speech could be transcribed", 422, "VOICE_NO_SPEECH");
  if (transcript.length > 18_000) throw new VoiceRequestError("Transcript is too long", 413, "VOICE_TRANSCRIPT_TOO_LONG");
  return { transcript, detectedLanguage: result?.transcription_info?.language || language };
}

async function refine(env, context) {
  const messages = buildRefinementMessages(context);
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: { reflection: { type: "string", minLength: 1, maxLength: 12_000 } },
    required: ["reflection"],
  };

  try {
    const result = await env.AI.run(REFINEMENT_MODEL, {
      messages,
      temperature: 0.2,
      max_tokens: 1600,
      response_format: { type: "json_schema", json_schema: schema },
    });
    const reflection = parseReflection(result);
    if (reflection) return reflection;
  } catch {
    // Retry once without JSON mode. This still returns only an editable draft.
  }

  const fallback = await env.AI.run(REFINEMENT_MODEL, {
    messages,
    temperature: 0.2,
    max_tokens: 1600,
  });
  const reflection = parseReflection(fallback);
  if (!reflection) throw new VoiceRequestError("The reflection draft could not be created", 502, "VOICE_REFINEMENT_FAILED");
  return reflection;
}

async function handleVoiceReview(request, env, keyHash) {
  if (!env.AI) throw new VoiceRequestError("Workers AI binding is not configured", 503, "VOICE_AI_UNAVAILABLE");
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new VoiceRequestError("Invalid multipart form", 400, "VOICE_FORM_INVALID");
  }
  const input = validateVoiceForm(form);
  const allowance = await reserveVoiceUsage(env, keyHash, input.durationSeconds);
  const { transcript, detectedLanguage } = await transcribe(env, input.audio, input.language);
  const reflection = await refine(env, {
    transcript,
    language: input.language,
    date: input.date,
  });
  return {
    transcript,
    reflection,
    detectedLanguage,
    allowance,
    audioStored: false,
  };
}

export {
  ALLOWED_AUDIO_TYPES,
  DAILY_RECORDING_SECONDS,
  DAILY_REQUESTS,
  MAX_AUDIO_BYTES,
  MAX_RECORDING_SECONDS,
  VoiceRequestError,
  buildRefinementMessages,
  handleVoiceReview,
  normalizedLanguage,
  parseReflection,
  reserveVoiceUsage,
  validateVoiceForm,
};
