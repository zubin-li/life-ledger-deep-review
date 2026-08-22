(function attachVoiceCheckin(root) {
  "use strict";

  const MAX_DURATION_MS = 10 * 60 * 1000;
  const MIME_CANDIDATES = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];

  const copy = {
    en: {
      button: "Quick record", unavailable: "Voice reflection is available for today in the deployed Cloudflare app.",
      kicker: "VOICE REFLECTION", title: "Speak freely. Keep what matters.", close: "Close voice reflection",
      ready: "Ready when you are", readyHelp: "Up to 10 minutes. Your audio is discarded after processing.",
      record: "Start recording", recording: "Listening…", pause: "Pause", resume: "Resume", finish: "Finish & refine", cancel: "Cancel",
      paused: "Recording paused", pausedHelp: "Resume when you are ready, or refine what you already said.",
      transcribing: "Turning your voice into text", refining: "Shaping a clear daily reflection", processingHelp: "Keep this window open for a moment.",
      draftKicker: "YOUR DRAFT", draftTitle: "A clearer version of your day", transcript: "View original transcript",
      save: "Add to today’s reflection", saving: "Saving…", retry: "Try again", again: "Record again",
      saved: "Voice reflection added", noMic: "Microphone access is unavailable. Check your browser permission and try again.",
      interrupted: "Recording paused because the app moved to the background.", genericError: "Voice reflection could not be completed. Your existing journal was not changed.",
      authError: "Your Cloudflare session needs attention. Reload the app and sign in again.", dailyLimit: "Today’s voice allowance has been reached. Try again tomorrow.",
      serviceUnavailable: "Voice processing is temporarily unavailable. Try again in a moment.",
      noSpeech: "No clear speech was found. Try again a little closer to the microphone.", unsupported: "This browser cannot record audio for Life Ledger.",
      minutesLeft: "{minutes} min of today’s allowance remain", draftPlaceholder: "Your refined reflection will appear here.",
    },
    zh: {
      button: "快速记录", unavailable: "语音复盘仅在已部署的 Cloudflare 版本中对今天开放。",
      kicker: "语音复盘", title: "自在地说，留下真正重要的。", close: "关闭语音复盘",
      ready: "准备好就开始", readyHelp: "最长 10 分钟；处理完成后原始音频会立即删除。",
      record: "开始录音", recording: "正在聆听……", pause: "暂停", resume: "继续", finish: "结束并整理", cancel: "取消",
      paused: "录音已暂停", pausedHelp: "可以继续说，也可以直接整理已经记录的内容。",
      transcribing: "正在把语音转换成文字", refining: "正在整理成清晰的每日复盘", processingHelp: "请暂时保持此窗口打开。",
      draftKicker: "复盘草稿", draftTitle: "这一天，更清晰的表达", transcript: "查看原始转写",
      save: "添加到今日复盘", saving: "正在保存……", retry: "重试", again: "重新录制",
      saved: "语音复盘已添加", noMic: "无法使用麦克风，请检查浏览器权限后重试。",
      interrupted: "应用进入后台，录音已自动暂停。", genericError: "未能完成语音复盘，原有日记没有被修改。",
      authError: "Cloudflare 登录状态需要刷新，请重新载入并登录。", dailyLimit: "今天的免费语音额度已用完，请明天再试。",
      serviceUnavailable: "语音处理服务暂时不可用，请稍后重试。",
      noSpeech: "没有识别到清晰语音，请靠近麦克风后重试。", unsupported: "当前浏览器无法为 Life Ledger 录音。",
      minutesLeft: "今日还可使用约 {minutes} 分钟", draftPlaceholder: "整理后的复盘会显示在这里。",
    },
    de: {
      button: "Schnell aufnehmen", unavailable: "Die Sprachreflexion ist heute in der bereitgestellten Cloudflare-App verfügbar.",
      kicker: "SPRACHREFLEXION", title: "Sprich frei. Bewahre, was zählt.", close: "Sprachreflexion schließen",
      ready: "Beginne, wenn du bereit bist", readyHelp: "Bis zu 10 Minuten. Die Aufnahme wird nach der Verarbeitung gelöscht.",
      record: "Aufnahme starten", recording: "Ich höre zu …", pause: "Pause", resume: "Fortsetzen", finish: "Beenden & ordnen", cancel: "Abbrechen",
      paused: "Aufnahme pausiert", pausedHelp: "Sprich weiter oder ordne das bisher Gesagte.",
      transcribing: "Sprache wird in Text umgewandelt", refining: "Eine klare Tagesreflexion entsteht", processingHelp: "Lass dieses Fenster bitte kurz geöffnet.",
      draftKicker: "DEIN ENTWURF", draftTitle: "Dein Tag, klarer formuliert", transcript: "Originaltranskript anzeigen",
      save: "Zur heutigen Reflexion hinzufügen", saving: "Wird gespeichert …", retry: "Erneut versuchen", again: "Neu aufnehmen",
      saved: "Sprachreflexion hinzugefügt", noMic: "Das Mikrofon ist nicht verfügbar. Prüfe die Browserberechtigung.",
      interrupted: "Die Aufnahme wurde pausiert, weil die App in den Hintergrund wechselte.", genericError: "Die Sprachreflexion konnte nicht erstellt werden. Dein bestehender Eintrag blieb unverändert.",
      authError: "Deine Cloudflare-Sitzung muss erneuert werden. Lade die App neu und melde dich erneut an.", dailyLimit: "Das heutige Sprachkontingent ist erreicht. Versuche es morgen erneut.",
      serviceUnavailable: "Die Sprachverarbeitung ist vorübergehend nicht verfügbar. Versuche es gleich noch einmal.",
      noSpeech: "Es wurde keine klare Sprache erkannt. Sprich näher am Mikrofon und versuche es erneut.", unsupported: "Dieser Browser kann für Life Ledger kein Audio aufnehmen.",
      minutesLeft: "Heute bleiben etwa {minutes} Minuten", draftPlaceholder: "Deine überarbeitete Reflexion erscheint hier.",
    },
  };

  function chooseMimeType(MediaRecorderClass = root.MediaRecorder) {
    if (!MediaRecorderClass) return "";
    if (typeof MediaRecorderClass.isTypeSupported !== "function") return "";
    return MIME_CANDIDATES.find(type => MediaRecorderClass.isTypeSupported(type)) || "";
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function appendReflection(existing, draft) {
    const before = String(existing || "").trim();
    const next = String(draft || "").trim();
    return before && next ? `${before}\n\n${next}` : before || next;
  }

  function create(options) {
    const button = options.button;
    const dialog = options.dialog;
    if (!button || !dialog) return null;

    const elements = {
      kicker: dialog.querySelector("#voiceKicker"), title: dialog.querySelector("#voiceTitle"), close: dialog.querySelector("#voiceClose"),
      status: dialog.querySelector("#voiceStatus"), help: dialog.querySelector("#voiceHelp"), time: dialog.querySelector("#voiceTime"), orb: dialog.querySelector("#voiceOrb"),
      primary: dialog.querySelector("#voicePrimary"), pause: dialog.querySelector("#voicePause"), cancel: dialog.querySelector("#voiceCancel"),
      draftKicker: dialog.querySelector("#voiceDraftKicker"), draftTitle: dialog.querySelector("#voiceDraftTitle"), draft: dialog.querySelector("#voiceDraft"),
      transcript: dialog.querySelector("#voiceTranscript"), transcriptSummary: dialog.querySelector("#voiceTranscriptSummary"),
      retry: dialog.querySelector("#voiceRetry"), again: dialog.querySelector("#voiceAgain"), save: dialog.querySelector("#voiceSave"),
      error: dialog.querySelector("#voiceError"), allowance: dialog.querySelector("#voiceAllowance"),
    };

    let language = "en";
    let phase = "ready";
    let stream = null;
    let recorder = null;
    let chunks = [];
    let blob = null;
    let timer = null;
    let recordedMs = 0;
    let segmentStartedAt = 0;
    let abortController = null;
    let currentContext = { date: "", isToday: false, disabled: true };
    let stoppedByCancel = false;

    const t = (key, values = {}) => (copy[language]?.[key] || copy.en[key] || key)
      .replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");

    function elapsed() {
      return recordedMs + (segmentStartedAt ? Date.now() - segmentStartedAt : 0);
    }

    function stopTimer() {
      clearInterval(timer);
      timer = null;
    }

    function releaseMedia() {
      stopTimer();
      stream?.getTracks?.().forEach(track => track.stop());
      stream = null;
      recorder = null;
      segmentStartedAt = 0;
    }

    function discardAudio() {
      blob = null;
      chunks = [];
    }

    function setPhase(next) {
      phase = next;
      dialog.dataset.voicePhase = next;
      elements.error.hidden = true;
      elements.primary.hidden = !["ready", "recording"].includes(next);
      elements.pause.hidden = !["recording", "paused"].includes(next);
      elements.cancel.hidden = next === "draft";
      elements.retry.hidden = next !== "error" || !blob;
      elements.again.hidden = next !== "draft";
      elements.save.hidden = next !== "draft";
      elements.draft.parentElement.hidden = next !== "draft";
      elements.orb.classList.toggle("active", next === "recording");
      elements.orb.classList.toggle("processing", ["transcribing", "refining"].includes(next));

      if (next === "ready") {
        elements.status.textContent = t("ready"); elements.help.textContent = t("readyHelp");
        elements.primary.textContent = t("record"); elements.time.textContent = "00:00";
      } else if (next === "recording") {
        elements.status.textContent = t("recording"); elements.help.textContent = t("readyHelp");
        elements.primary.textContent = t("finish"); elements.pause.textContent = t("pause");
      } else if (next === "paused") {
        elements.status.textContent = t("paused"); elements.help.textContent = t("pausedHelp"); elements.pause.textContent = t("resume");
      } else if (next === "transcribing") {
        elements.status.textContent = t("transcribing"); elements.help.textContent = t("processingHelp");
      } else if (next === "refining") {
        elements.status.textContent = t("refining"); elements.help.textContent = t("processingHelp");
      }
    }

    function errorMessage(error) {
      if (["NotAllowedError", "NotFoundError", "NotReadableError", "SecurityError"].includes(error?.name)) return t("noMic");
      if (error?.code === "VOICE_DAILY_LIMIT") return t("dailyLimit");
      if (error?.code === "VOICE_NO_SPEECH") return t("noSpeech");
      if (["VOICE_AI_UNAVAILABLE", "VOICE_USAGE_UNAVAILABLE", "VOICE_PROCESSING_FAILED"].includes(error?.code)) return t("serviceUnavailable");
      if (["VOICE_FORMAT_UNSUPPORTED", "VOICE_TOO_LARGE", "VOICE_DURATION_INVALID"].includes(error?.code)) return error.message;
      if (error?.status === 401 || error?.status === 403 || error?.status === 503) return t("authError");
      return t("genericError");
    }

    function showError(error) {
      releaseMedia();
      setPhase("error");
      elements.status.textContent = t("genericError");
      elements.help.textContent = "";
      elements.error.textContent = errorMessage(error);
      elements.error.hidden = false;
    }

    function updateTimer() {
      const value = elapsed();
      elements.time.textContent = formatDuration(value);
      elements.orb.style.setProperty("--voice-progress", Math.min(1, value / MAX_DURATION_MS));
      if (value >= MAX_DURATION_MS && phase === "recording") finishRecording();
    }

    async function startRecording() {
      if (!root.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
        showError({ name: "UnsupportedError", message: t("unsupported") });
        elements.error.textContent = t("unsupported");
        return;
      }
      discardAudio();
      recordedMs = 0;
      stoppedByCancel = false;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        const mimeType = chooseMimeType();
        try { recorder = mimeType ? new root.MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 }) : new root.MediaRecorder(stream); }
        catch { recorder = new root.MediaRecorder(stream); }
        chunks = [];
        recorder.addEventListener("dataavailable", event => { if (event.data?.size) chunks.push(event.data); });
        recorder.addEventListener("stop", () => {
          const type = recorder?.mimeType || mimeType || "audio/webm";
          releaseMedia();
          if (stoppedByCancel) { discardAudio(); return; }
          blob = new Blob(chunks, { type });
          processRecording();
        }, { once: true });
        recorder.start(1000);
        segmentStartedAt = Date.now();
        setPhase("recording");
        timer = setInterval(updateTimer, 250);
        updateTimer();
      } catch (error) {
        showError(error);
      }
    }

    function togglePause() {
      if (!recorder) return;
      if (recorder.state === "recording") {
        recordedMs += Date.now() - segmentStartedAt;
        segmentStartedAt = 0;
        recorder.pause();
        setPhase("paused");
      } else if (recorder.state === "paused") {
        recorder.resume();
        segmentStartedAt = Date.now();
        setPhase("recording");
      }
      updateTimer();
    }

    function finishRecording() {
      if (!recorder || recorder.state === "inactive") return;
      if (segmentStartedAt) recordedMs += Date.now() - segmentStartedAt;
      segmentStartedAt = 0;
      setPhase("transcribing");
      recorder.stop();
    }

    async function processRecording() {
      if (!blob?.size) { showError({ code: "VOICE_NO_SPEECH" }); return; }
      setPhase("transcribing");
      abortController = new AbortController();
      let refinementTimer = null;
      const form = new FormData();
      const extension = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
      form.append("audio", blob, `reflection.${extension}`);
      form.append("durationMs", String(Math.max(1000, Math.min(recordedMs, MAX_DURATION_MS))));
      form.append("language", language);
      form.append("date", currentContext.date);
      try {
        refinementTimer = setTimeout(() => { if (phase === "transcribing") setPhase("refining"); }, 900);
        const response = await fetch(options.endpoint || "/api/voice-review", {
          method: "POST", body: form, credentials: "same-origin", signal: abortController.signal,
          headers: { accept: "application/json" },
        });
        let payload = null;
        try { payload = await response.json(); } catch { payload = {}; }
        if (!response.ok) {
          const error = new Error(payload?.error || `HTTP ${response.status}`);
          error.code = payload?.code;
          error.status = response.status;
          throw error;
        }
        discardAudio();
        elements.draft.value = String(payload.reflection || "").trim();
        elements.transcript.textContent = String(payload.transcript || "").trim();
        elements.allowance.textContent = Number.isFinite(payload?.allowance?.secondsRemaining)
          ? t("minutesLeft", { minutes: Math.floor(payload.allowance.secondsRemaining / 60) }) : "";
        setPhase("draft");
      } catch (error) {
        if (error?.name !== "AbortError") showError(error);
      } finally {
        clearTimeout(refinementTimer);
        abortController = null;
      }
    }

    function reset() {
      abortController?.abort();
      stoppedByCancel = true;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      releaseMedia();
      discardAudio();
      recordedMs = 0;
      elements.draft.value = "";
      elements.transcript.textContent = "";
      elements.transcript.parentElement.open = false;
      elements.allowance.textContent = "";
      setPhase("ready");
    }

    function close() {
      reset();
      dialog.close();
    }

    async function save() {
      const draft = elements.draft.value.trim();
      if (!draft) return;
      elements.save.disabled = true;
      elements.save.textContent = t("saving");
      try {
        await options.onSave?.({ date: currentContext.date, text: draft });
        options.onToast?.(t("saved"));
        close();
      } catch (error) {
        showError(error);
      } finally {
        elements.save.disabled = false;
        elements.save.textContent = t("save");
      }
    }

    function applyLanguage(nextLanguage) {
      language = copy[nextLanguage] ? nextLanguage : "en";
      button.querySelector("span").textContent = t("button");
      button.setAttribute("aria-label", t("button"));
      button.title = currentContext.isToday ? t("button") : t("unavailable");
      elements.kicker.textContent = t("kicker"); elements.title.textContent = t("title"); elements.close.setAttribute("aria-label", t("close"));
      elements.cancel.textContent = t("cancel"); elements.draftKicker.textContent = t("draftKicker"); elements.draftTitle.textContent = t("draftTitle");
      elements.transcriptSummary.textContent = t("transcript"); elements.retry.textContent = t("retry"); elements.again.textContent = t("again"); elements.save.textContent = t("save");
      elements.draft.placeholder = t("draftPlaceholder");
      if (["ready", "recording", "paused", "transcribing", "refining"].includes(phase)) setPhase(phase);
    }

    function setContext(context) {
      currentContext = { ...currentContext, ...context };
      const available = options.enabled !== false && currentContext.isToday && !currentContext.disabled;
      button.hidden = options.enabled === false;
      button.disabled = !available;
      button.title = available ? t("button") : t("unavailable");
    }

    button.addEventListener("click", () => {
      if (button.disabled) return;
      reset();
      dialog.showModal();
    });
    elements.primary.addEventListener("click", () => phase === "ready" ? startRecording() : finishRecording());
    elements.pause.addEventListener("click", togglePause);
    elements.cancel.addEventListener("click", close);
    elements.close.addEventListener("click", close);
    elements.retry.addEventListener("click", processRecording);
    elements.again.addEventListener("click", reset);
    elements.save.addEventListener("click", save);
    dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden || phase !== "recording") return;
      togglePause();
      elements.help.textContent = t("interrupted");
    });

    applyLanguage(options.language || "en");
    setContext(options.context || {});
    return { setLanguage: applyLanguage, setContext, reset, open: () => button.click() };
  }

  root.LifeLedgerVoiceCheckin = { MAX_DURATION_MS, appendReflection, chooseMimeType, create, formatDuration };
})(globalThis);
