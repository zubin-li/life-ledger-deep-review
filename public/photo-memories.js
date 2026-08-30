(function attachPhotoMemories(root) {
  "use strict";

  const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
  const MAX_OUTPUT_BYTES = 1_200_000;
  const MAX_EDGE = 1600;
  const MAX_PER_DAY = 3;
  const HEIC_CONVERTER_URL = "./vendor/heic2any.min.js?v=0.0.4";
  let heicConverterPromise = null;

  const copy = {
    en: {
      title: "Photo memories", help: "Up to three private photos for this day.", add: "Add photo", count: "{count} of 3",
      processing: "Preparing photo…", uploading: "Saving privately…", saved: "Photo saved", delete: "Remove photo", deleting: "Removing…",
      confirmDelete: "Remove this photo from the day?", unavailable: "Photo memories are available in the deployed Cloudflare app.",
      format: "Choose a supported photo, including JPEG, PNG, WebP, HEIC, or HEIF.", heic: "This HEIC photo could not be decoded. Try the original file again.", sourceLarge: "This original photo is too large to process.", outputLarge: "The photo could not be compressed enough.",
      processingFailed: "This browser could not prepare the photo. Try the original or export it as JPEG.", session: "Your session has expired. Refresh the page and sign in again.", service: "Private photo storage is temporarily unavailable. Try again shortly.", network: "The photo could not reach private storage. Check your connection and try again.",
      dayLimit: "This day already has three photos.", libraryFull: "The private photo library has reached its storage limit.", monthlyLimit: "The private photo allowance is paused until next month.", generic: "The photo could not be saved. Try again.",
    },
    zh: {
      title: "照片记忆", help: "为这一天留下最多三张私人照片。", add: "添加照片", count: "{count} / 3",
      processing: "正在处理照片……", uploading: "正在私密保存……", saved: "照片已保存", delete: "删除照片", deleting: "正在删除……",
      confirmDelete: "从这一天删除这张照片吗？", unavailable: "照片记忆仅在已部署的 Cloudflare 版本中开放。",
      format: "请选择支持的照片，包括 JPEG、PNG、WebP、HEIC 或 HEIF。", heic: "这张 HEIC 照片未能解码，请重新选择原始照片。", sourceLarge: "原始照片过大，无法安全处理。", outputLarge: "照片压缩后仍然过大。",
      processingFailed: "当前浏览器未能处理这张照片，请尝试原图或先导出为 JPEG。", session: "登录状态已过期，请刷新页面并重新登录。", service: "私人照片存储暂时不可用，请稍后重试。", network: "照片未能连接到私人存储，请检查网络后重试。",
      dayLimit: "这一天已经保存了三张照片。", libraryFull: "私人照片库已达到存储上限。", monthlyLimit: "本月私人照片额度已暂停，下月自动恢复。", generic: "照片未能保存，请重试。",
    },
    de: {
      title: "Fotoerinnerungen", help: "Bis zu drei private Fotos für diesen Tag.", add: "Foto hinzufügen", count: "{count} von 3",
      processing: "Foto wird vorbereitet …", uploading: "Wird privat gespeichert …", saved: "Foto gespeichert", delete: "Foto entfernen", deleting: "Wird entfernt …",
      confirmDelete: "Dieses Foto aus dem Tag entfernen?", unavailable: "Fotoerinnerungen sind in der bereitgestellten Cloudflare-App verfügbar.",
      format: "Wähle ein unterstütztes Foto, einschließlich JPEG, PNG, WebP, HEIC oder HEIF.", heic: "Dieses HEIC-Foto konnte nicht dekodiert werden. Wähle die Originaldatei erneut.", sourceLarge: "Das Originalfoto ist zu groß für die Verarbeitung.", outputLarge: "Das Foto konnte nicht ausreichend komprimiert werden.",
      processingFailed: "Der Browser konnte das Foto nicht vorbereiten. Versuche das Original oder exportiere es als JPEG.", session: "Deine Sitzung ist abgelaufen. Lade die Seite neu und melde dich erneut an.", service: "Der private Fotospeicher ist vorübergehend nicht verfügbar. Versuche es später erneut.", network: "Das Foto konnte den privaten Speicher nicht erreichen. Prüfe deine Verbindung und versuche es erneut.",
      dayLimit: "Für diesen Tag sind bereits drei Fotos gespeichert.", libraryFull: "Der private Fotospeicher ist voll.", monthlyLimit: "Das private Fotokontingent ist bis zum nächsten Monat pausiert.", generic: "Das Foto konnte nicht gespeichert werden. Versuche es erneut.",
    },
  };

  function canvasBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      try { canvas.toBlob(resolve, type, quality); }
      catch (error) { reject(error); }
    });
  }

  function smallerCanvas(source) {
    const scale = 0.78;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw Object.assign(new Error("Photo canvas unavailable"), { code: "PHOTO_PROCESSING_FAILED" });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function encodePhoto(canvas, type, quality) {
    if (type) return canvasBlob(canvas, type, quality);
    const webp = await canvasBlob(canvas, "image/webp", quality);
    if (webp?.type === "image/webp") return webp;
    return canvasBlob(canvas, "image/jpeg", quality);
  }

  function isHeicFile(file) {
    const type = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();
    return type === "image/heic" || type === "image/heif" || type === "image/heic-sequence" || type === "image/heif-sequence"
      || /\.(heic|heif)$/i.test(name);
  }

  function isPhotoFile(file) {
    return String(file?.type || "").startsWith("image/") || /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(String(file?.name || ""));
  }

  function loadHeicConverter() {
    if (typeof root.heic2any === "function") return Promise.resolve(root.heic2any);
    if (heicConverterPromise) return heicConverterPromise;
    heicConverterPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = HEIC_CONVERTER_URL;
      script.async = true;
      script.onload = () => typeof root.heic2any === "function" ? resolve(root.heic2any) : reject(new Error("HEIC converter unavailable"));
      script.onerror = () => reject(new Error("HEIC converter unavailable"));
      document.head.append(script);
    }).catch(error => {
      heicConverterPromise = null;
      throw error;
    });
    return heicConverterPromise;
  }

  async function decodeBrowserImage(file) {
    if (root.createImageBitmap) {
      try { return await root.createImageBitmap(file, { imageOrientation: "from-image" }); }
      catch { /* Fall through to the image element for broader Safari compatibility. */ }
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      await image.decode();
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function decodeImage(file) {
    try {
      return await decodeBrowserImage(file);
    } catch (nativeError) {
      if (!isHeicFile(file)) throw nativeError;
      try {
        const convert = await loadHeicConverter();
        const result = await convert({ blob: file, toType: "image/jpeg", quality: .9, multiple: false });
        const converted = Array.isArray(result) ? result[0] : result;
        if (!(converted instanceof Blob)) throw new Error("HEIC conversion failed");
        return await decodeBrowserImage(converted);
      } catch {
        throw Object.assign(new Error("HEIC photo could not be decoded"), { code: "PHOTO_HEIC_UNSUPPORTED" });
      }
    }
  }

  async function compressPhoto(file) {
    if (!(file instanceof File)) throw Object.assign(new Error("Photo required"), { code: "PHOTO_FORMAT_UNSUPPORTED" });
    if (file.size > MAX_SOURCE_BYTES) throw Object.assign(new Error("Source photo too large"), { code: "PHOTO_SOURCE_TOO_LARGE" });
    if (!isPhotoFile(file)) throw Object.assign(new Error("Unsupported photo"), { code: "PHOTO_FORMAT_UNSUPPORTED" });
    let image;
    try { image = await decodeImage(file); }
    catch (error) {
      if (error?.code === "PHOTO_HEIC_UNSUPPORTED") throw error;
      throw Object.assign(new Error("Unreadable photo"), { code: "PHOTO_FORMAT_UNSUPPORTED" });
    }
    const sourceWidth = image.width || image.naturalWidth;
    const sourceHeight = image.height || image.naturalHeight;
    if (!sourceWidth || !sourceHeight) throw Object.assign(new Error("Unreadable photo"), { code: "PHOTO_FORMAT_UNSUPPORTED" });
    const scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    let canvas = document.createElement("canvas");
    try {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Photo canvas unavailable");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
    } catch (error) {
      throw Object.assign(new Error("Photo processing failed"), { code: "PHOTO_PROCESSING_FAILED", cause: error });
    } finally {
      image.close?.();
    }

    let blob = null;
    let outputType = "";
    try {
      for (let resizePass = 0; resizePass < 5; resizePass += 1) {
        for (const quality of [.84, .74, .64, .54, .44]) {
          blob = await encodePhoto(canvas, outputType, quality);
          if (!blob) continue;
          outputType = blob.type === "image/webp" ? "image/webp" : "image/jpeg";
          if (blob.size <= MAX_OUTPUT_BYTES) break;
        }
        if (blob?.size <= MAX_OUTPUT_BYTES || Math.max(canvas.width, canvas.height) <= 720) break;
        canvas = smallerCanvas(canvas);
      }
    } catch (error) {
      throw Object.assign(new Error("Photo processing failed"), { code: "PHOTO_PROCESSING_FAILED", cause: error });
    }
    if (!blob || blob.size > MAX_OUTPUT_BYTES) throw Object.assign(new Error("Compressed photo too large"), { code: "PHOTO_TOO_LARGE" });
    return { blob, width: canvas.width, height: canvas.height };
  }

  async function responseJson(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || "Photo request failed"), { status: response.status, code: data.code });
    return data;
  }

  function create(options) {
    const section = options.section;
    if (!section) return null;
    const list = section.querySelector("#moodPhotoList");
    const input = section.querySelector("#moodPhotoInput");
    const add = section.querySelector("#moodPhotoAdd");
    const title = section.querySelector("#moodPhotoTitle");
    const help = section.querySelector("#moodPhotoHelp");
    const count = section.querySelector("#moodPhotoCount");
    const status = section.querySelector("#moodPhotoStatus");
    let language = options.language || "en";
    let enabled = Boolean(options.enabled);
    let date = "";
    let photos = [];
    let busy = false;
    let requestVersion = 0;

    const t = (key, values = {}) => (copy[language]?.[key] || copy.en[key] || key)
      .replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");

    function setStatus(message = "", error = false) {
      status.textContent = message;
      status.classList.toggle("error", error);
      status.hidden = !message;
    }

    function render() {
      section.hidden = !enabled;
      title.textContent = t("title");
      help.textContent = enabled ? t("help") : t("unavailable");
      add.querySelector("span").textContent = t("add");
      add.disabled = busy || photos.length >= MAX_PER_DAY;
      count.textContent = t("count", { count: photos.length });
      list.innerHTML = photos.map(photo => `<figure class="mood-photo-thumb" data-photo-id="${photo.id}">
        <img src="${photo.url}" alt="" width="${photo.width || 720}" height="${photo.height || 720}" loading="lazy" />
        <button type="button" aria-label="${t("delete")}" title="${t("delete")}">×</button>
      </figure>`).join("");
      list.querySelectorAll("button").forEach(button => button.addEventListener("click", () => removePhoto(button.closest("figure").dataset.photoId)));
    }

    function errorText(error) {
      if (error?.code === "PHOTO_FORMAT_UNSUPPORTED" || error?.code === "PHOTO_SIGNATURE_INVALID") return t("format");
      if (error?.code === "PHOTO_HEIC_UNSUPPORTED") return t("heic");
      if (error?.code === "PHOTO_PROCESSING_FAILED") return t("processingFailed");
      if (error?.code === "PHOTO_SOURCE_TOO_LARGE") return t("sourceLarge");
      if (error?.code === "PHOTO_TOO_LARGE") return t("outputLarge");
      if (error?.code === "PHOTO_DAY_LIMIT") return t("dayLimit");
      if (error?.code === "PHOTO_LIBRARY_FULL") return t("libraryFull");
      if (error?.code === "PHOTO_MONTHLY_LIMIT") return t("monthlyLimit");
      if (error?.status === 401 || error?.status === 403) return t("session");
      if (error?.code === "PHOTO_STORAGE_UNAVAILABLE" || error?.code === "PHOTO_FAILED" || error?.status >= 500) return t("service");
      if (error instanceof TypeError) return t("network");
      return t("generic");
    }

    async function load(nextDate) {
      date = nextDate;
      const version = ++requestVersion;
      photos = [];
      setStatus("");
      render();
      if (!enabled || !date) return [];
      try {
        const data = await responseJson(await fetch(`/api/photos?date=${encodeURIComponent(date)}`, { credentials: "same-origin" }));
        if (version !== requestVersion) return photos;
        photos = data.photos || [];
        render();
        return photos;
      } catch (error) {
        if (version === requestVersion) setStatus(errorText(error), true);
        return [];
      }
    }

    async function upload(file) {
      if (!enabled || busy || !date || photos.length >= MAX_PER_DAY) return;
      busy = true;
      setStatus(t("processing"));
      render();
      try {
        const compressed = await compressPhoto(file);
        setStatus(t("uploading"));
        const form = new FormData();
        form.set("photo", compressed.blob, `life-ledger-${date}.${compressed.blob.type === "image/webp" ? "webp" : "jpg"}`);
        form.set("date", date);
        form.set("width", String(compressed.width));
        form.set("height", String(compressed.height));
        const data = await responseJson(await fetch("/api/photos", { method: "POST", body: form, credentials: "same-origin" }));
        photos.push(data.photo);
        setStatus(t("saved"));
        options.onChange?.({ date, photos: [...photos] });
        options.onToast?.(t("saved"));
      } catch (error) {
        setStatus(errorText(error), true);
      } finally {
        busy = false;
        input.value = "";
        render();
      }
    }

    async function removePhoto(id) {
      if (busy || !root.confirm(t("confirmDelete"))) return;
      busy = true;
      setStatus(t("deleting"));
      render();
      try {
        await responseJson(await fetch(`/api/photos/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" }));
        photos = photos.filter(photo => photo.id !== id);
        setStatus("");
        options.onChange?.({ date, photos: [...photos] });
      } catch (error) {
        setStatus(errorText(error), true);
      } finally {
        busy = false;
        render();
      }
    }

    async function listRange(from, to) {
      if (!enabled) return [];
      const data = await responseJson(await fetch(`/api/photos?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { credentials: "same-origin" }));
      return data.photos || [];
    }

    async function restorePhoto(photo, blob) {
      if (!enabled) throw new Error(t("unavailable"));
      const form = new FormData();
      form.set("photo", blob, `life-ledger-${photo.date}.${blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg"}`);
      form.set("date", photo.date);
      form.set("width", String(photo.width || 1));
      form.set("height", String(photo.height || 1));
      form.set("sourceId", photo.backupId || photo.id);
      const data = await responseJson(await fetch("/api/photos", { method: "POST", body: form, credentials: "same-origin" }));
      if (date === photo.date && !photos.some(item => item.id === data.photo.id)) {
        photos.push(data.photo);
        render();
      }
      return data.photo;
    }

    add.addEventListener("click", () => input.click());
    input.addEventListener("change", () => input.files?.[0] && upload(input.files[0]));
    render();
    return {
      load,
      listRange,
      restorePhoto,
      setLanguage(next) { language = copy[next] ? next : "en"; render(); },
      setEnabled(next) { enabled = Boolean(next); render(); },
      photos() { return [...photos]; },
    };
  }

  root.LifeLedgerPhotoMemories = { MAX_EDGE, MAX_OUTPUT_BYTES, MAX_PER_DAY, compressPhoto, create, isHeicFile, isPhotoFile };
})(window);
