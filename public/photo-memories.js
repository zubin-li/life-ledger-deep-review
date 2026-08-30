(function attachPhotoMemories(root) {
  "use strict";

  const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
  const MAX_OUTPUT_BYTES = 1_200_000;
  const MAX_EDGE = 1600;
  const MAX_PER_DAY = 3;

  const copy = {
    en: {
      title: "Photo memories", help: "Up to three private photos for this day.", add: "Add photo", count: "{count} of 3",
      processing: "Preparing photo…", uploading: "Saving privately…", saved: "Photo saved", delete: "Remove photo", deleting: "Removing…",
      confirmDelete: "Remove this photo from the day?", unavailable: "Photo memories are available in the deployed Cloudflare app.",
      format: "Choose a JPEG, PNG, or WebP photo.", sourceLarge: "This original photo is too large to process.", outputLarge: "The photo could not be compressed enough.",
      dayLimit: "This day already has three photos.", libraryFull: "The private photo library has reached its storage limit.", generic: "The photo could not be saved. Try again.",
    },
    zh: {
      title: "照片记忆", help: "为这一天留下最多三张私人照片。", add: "添加照片", count: "{count} / 3",
      processing: "正在处理照片……", uploading: "正在私密保存……", saved: "照片已保存", delete: "删除照片", deleting: "正在删除……",
      confirmDelete: "从这一天删除这张照片吗？", unavailable: "照片记忆仅在已部署的 Cloudflare 版本中开放。",
      format: "请选择 JPEG、PNG 或 WebP 照片。", sourceLarge: "原始照片过大，无法安全处理。", outputLarge: "照片压缩后仍然过大。",
      dayLimit: "这一天已经保存了三张照片。", libraryFull: "私人照片库已达到存储上限。", generic: "照片未能保存，请重试。",
    },
    de: {
      title: "Fotoerinnerungen", help: "Bis zu drei private Fotos für diesen Tag.", add: "Foto hinzufügen", count: "{count} von 3",
      processing: "Foto wird vorbereitet …", uploading: "Wird privat gespeichert …", saved: "Foto gespeichert", delete: "Foto entfernen", deleting: "Wird entfernt …",
      confirmDelete: "Dieses Foto aus dem Tag entfernen?", unavailable: "Fotoerinnerungen sind in der bereitgestellten Cloudflare-App verfügbar.",
      format: "Wähle ein JPEG-, PNG- oder WebP-Foto.", sourceLarge: "Das Originalfoto ist zu groß für die Verarbeitung.", outputLarge: "Das Foto konnte nicht ausreichend komprimiert werden.",
      dayLimit: "Für diesen Tag sind bereits drei Fotos gespeichert.", libraryFull: "Der private Fotospeicher ist voll.", generic: "Das Foto konnte nicht gespeichert werden. Versuche es erneut.",
    },
  };

  function canvasBlob(canvas, type, quality) {
    return new Promise(resolve => canvas.toBlob(resolve, type, quality));
  }

  async function decodeImage(file) {
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

  async function compressPhoto(file) {
    if (!(file instanceof File)) throw Object.assign(new Error("Photo required"), { code: "PHOTO_FORMAT_UNSUPPORTED" });
    if (file.size > MAX_SOURCE_BYTES) throw Object.assign(new Error("Source photo too large"), { code: "PHOTO_SOURCE_TOO_LARGE" });
    if (!String(file.type).startsWith("image/")) throw Object.assign(new Error("Unsupported photo"), { code: "PHOTO_FORMAT_UNSUPPORTED" });
    const image = await decodeImage(file);
    const sourceWidth = image.width || image.naturalWidth;
    const sourceHeight = image.height || image.naturalHeight;
    if (!sourceWidth || !sourceHeight) throw Object.assign(new Error("Unreadable photo"), { code: "PHOTO_FORMAT_UNSUPPORTED" });
    const scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    image.close?.();

    let quality = .84;
    let blob = await canvasBlob(canvas, "image/webp", quality);
    if (!blob) blob = await canvasBlob(canvas, "image/jpeg", .84);
    while (blob && blob.size > MAX_OUTPUT_BYTES && quality > .5) {
      quality -= .08;
      blob = await canvasBlob(canvas, blob.type || "image/webp", quality);
    }
    if (!blob || blob.size > MAX_OUTPUT_BYTES) throw Object.assign(new Error("Compressed photo too large"), { code: "PHOTO_TOO_LARGE" });
    return { blob, width, height };
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
      if (error?.code === "PHOTO_SOURCE_TOO_LARGE") return t("sourceLarge");
      if (error?.code === "PHOTO_TOO_LARGE") return t("outputLarge");
      if (error?.code === "PHOTO_DAY_LIMIT") return t("dayLimit");
      if (error?.code === "PHOTO_LIBRARY_FULL") return t("libraryFull");
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

    add.addEventListener("click", () => input.click());
    input.addEventListener("change", () => input.files?.[0] && upload(input.files[0]));
    render();
    return {
      load,
      listRange,
      setLanguage(next) { language = copy[next] ? next : "en"; render(); },
      setEnabled(next) { enabled = Boolean(next); render(); },
      photos() { return [...photos]; },
    };
  }

  root.LifeLedgerPhotoMemories = { MAX_EDGE, MAX_OUTPUT_BYTES, MAX_PER_DAY, compressPhoto, create };
})(window);
