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
      sourceUnavailable: "macOS did not finish making this photo available. Wait for any iCloud download, then select it again.", processingFailed: "This browser could not prepare the photo. Try the original or export it as JPEG.", session: "Your session has expired. Refresh the page and sign in again.", service: "Private photo storage is temporarily unavailable. Try again shortly.", network: "The photo could not reach private storage. Check your connection and try again.",
      dayLimit: "This day already has three photos.", libraryFull: "The private photo library has reached its storage limit.", monthlyLimit: "The private photo allowance is paused until next month.", generic: "The photo could not be saved. Try again.",
      caption: "Caption", replace: "Replace photo", remove: "Remove photo", preview: "Preview photo", drop: "Drop a photo here, or choose a file.", empty: "No photo for this day yet.", undo: "Undo", removed: "Photo removed", loading: "Loading photos…", reorder: "Drag to reorder",
    },
    zh: {
      title: "照片记忆", help: "为这一天留下最多三张私人照片。", add: "添加照片", count: "{count} / 3",
      processing: "正在处理照片……", uploading: "正在私密保存……", saved: "照片已保存", delete: "删除照片", deleting: "正在删除……",
      confirmDelete: "从这一天删除这张照片吗？", unavailable: "照片记忆仅在已部署的 Cloudflare 版本中开放。",
      format: "请选择支持的照片，包括 JPEG、PNG、WebP、HEIC 或 HEIF。", heic: "这张 HEIC 照片未能解码，请重新选择原始照片。", sourceLarge: "原始照片过大，无法安全处理。", outputLarge: "照片压缩后仍然过大。",
      sourceUnavailable: "macOS 尚未完成照片准备；请等待 iCloud 下载完成后重新选择。", processingFailed: "当前浏览器未能处理这张照片，请尝试原图或先导出为 JPEG。", session: "登录状态已过期，请刷新页面并重新登录。", service: "私人照片存储暂时不可用，请稍后重试。", network: "照片未能连接到私人存储，请检查网络后重试。",
      dayLimit: "这一天已经保存了三张照片。", libraryFull: "私人照片库已达到存储上限。", monthlyLimit: "本月私人照片额度已暂停，下月自动恢复。", generic: "照片未能保存，请重试。",
      caption: "说明", replace: "替换照片", remove: "移除照片", preview: "预览照片", drop: "把照片拖到这里，或选择文件。", empty: "这一天还没有照片。", undo: "撤销", removed: "已移除照片", loading: "正在载入照片……", reorder: "拖动调整顺序",
    },
    de: {
      title: "Fotoerinnerungen", help: "Bis zu drei private Fotos für diesen Tag.", add: "Foto hinzufügen", count: "{count} von 3",
      processing: "Foto wird vorbereitet …", uploading: "Wird privat gespeichert …", saved: "Foto gespeichert", delete: "Foto entfernen", deleting: "Wird entfernt …",
      confirmDelete: "Dieses Foto aus dem Tag entfernen?", unavailable: "Fotoerinnerungen sind in der bereitgestellten Cloudflare-App verfügbar.",
      format: "Wähle ein unterstütztes Foto, einschließlich JPEG, PNG, WebP, HEIC oder HEIF.", heic: "Dieses HEIC-Foto konnte nicht dekodiert werden. Wähle die Originaldatei erneut.", sourceLarge: "Das Originalfoto ist zu groß für die Verarbeitung.", outputLarge: "Das Foto konnte nicht ausreichend komprimiert werden.",
      sourceUnavailable: "macOS hat das Foto noch nicht bereitgestellt. Warte auf den iCloud-Download und wähle es erneut aus.", processingFailed: "Der Browser konnte das Foto nicht vorbereiten. Versuche das Original oder exportiere es als JPEG.", session: "Deine Sitzung ist abgelaufen. Lade die Seite neu und melde dich erneut an.", service: "Der private Fotospeicher ist vorübergehend nicht verfügbar. Versuche es später erneut.", network: "Das Foto konnte den privaten Speicher nicht erreichen. Prüfe deine Verbindung und versuche es erneut.",
      dayLimit: "Für diesen Tag sind bereits drei Fotos gespeichert.", libraryFull: "Der private Fotospeicher ist voll.", monthlyLimit: "Das private Fotokontingent ist bis zum nächsten Monat pausiert.", generic: "Das Foto konnte nicht gespeichert werden. Versuche es erneut.",
      caption: "Bildtext", replace: "Foto ersetzen", remove: "Foto entfernen", preview: "Foto ansehen", drop: "Foto hierher ziehen oder eine Datei wählen.", empty: "Noch kein Foto für diesen Tag.", undo: "Widerrufen", removed: "Foto entfernt", loading: "Fotos werden geladen …", reorder: "Ziehen zum Sortieren",
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

  function inferredPhotoType(file) {
    const type = String(file?.type || "").toLowerCase();
    if (type.startsWith("image/")) return type;
    const name = String(file?.name || "").toLowerCase();
    if (/\.png$/i.test(name)) return "image/png";
    if (/\.webp$/i.test(name)) return "image/webp";
    if (/\.hei[cf]$/i.test(name)) return name.endsWith(".heif") ? "image/heif" : "image/heic";
    return "image/jpeg";
  }

  async function materializePhoto(file) {
    if (!file.size) throw Object.assign(new Error("Photo source unavailable"), { code: "PHOTO_SOURCE_UNAVAILABLE" });
    try {
      const bytes = await file.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength !== file.size) throw new Error("Incomplete photo source");
      return new File([bytes], file.name || "photo", {
        type: inferredPhotoType(file),
        lastModified: file.lastModified || Date.now(),
      });
    } catch (error) {
      throw Object.assign(new Error("Photo source unavailable"), { code: "PHOTO_SOURCE_UNAVAILABLE", cause: error });
    }
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
    const sourceFile = await materializePhoto(file);
    let image;
    try { image = await decodeImage(sourceFile); }
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

  const MAX_LIBRARY_PHOTOS = 2000;
  const CAPTION_LIMIT = 240;
  const objectUrls = new Map();

  function memoryStore() {
    const rows = new Map();
    return {
      async all() { return [...rows.values()].map(row => ({ ...row })); },
      async get(id) { return rows.has(id) ? { ...rows.get(id) } : null; },
      async put(row) { rows.set(row.id, { ...row }); },
      async delete(id) { rows.delete(id); },
    };
  }

  function idbStore() {
    let dbPromise;
    function open() {
      if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
          const request = indexedDB.open("life-ledger-photos", 1);
          request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains("photos")) database.createObjectStore("photos", { keyPath: "id" });
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
      return dbPromise;
    }
    function run(mode, fn) {
      return open().then(database => new Promise((resolve, reject) => {
        const transaction = database.transaction("photos", mode);
        const store = transaction.objectStore("photos");
        let request;
        try { request = fn(store); }
        catch (error) { reject(error); return; }
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }));
    }
    return {
      all: () => run("readonly", store => store.getAll()),
      get: id => run("readonly", store => store.get(id)),
      put: row => run("readwrite", store => store.put(row)),
      delete: id => run("readwrite", store => store.delete(id)),
    };
  }

  function rememberUrl(id, blob) {
    const existing = objectUrls.get(id);
    if (existing) return existing;
    const url = URL.createObjectURL(blob);
    objectUrls.set(id, url);
    return url;
  }

  function publicRecord(row) {
    const blob = row.blob instanceof Blob ? row.blob : new Blob([row.blob], { type: row.contentType || "image/jpeg" });
    return {
      id: row.id,
      backupId: row.backupId || row.id,
      date: row.date,
      contentType: row.contentType || blob.type,
      size: Number(row.size || blob.size),
      width: Number(row.width || 0),
      height: Number(row.height || 0),
      createdAt: Number(row.createdAt || 0),
      caption: String(row.caption || "").slice(0, CAPTION_LIMIT),
      order: Number(row.order || 0),
      url: rememberUrl(row.id, blob),
    };
  }

  function sortPhotos(rows) {
    return [...rows].sort((a, b) => (a.order - b.order) || (a.createdAt - b.createdAt));
  }

  function createLocalLibrary(store = typeof indexedDB === "undefined" ? memoryStore() : idbStore()) {
    async function rowsFor(date) {
      const rows = await store.all();
      return sortPhotos(rows.filter(row => row.date === date));
    }
    return {
      async listRange(from, to) {
        const rows = await store.all();
        return sortPhotos(rows.filter(row => row.date >= from && row.date <= to)).map(publicRecord);
      },
      async addPrepared(input) {
        const date = String(input.date || "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Object.assign(new Error("A valid entry date is required"), { code: "PHOTO_REQUEST_INVALID" });
        const existing = await rowsFor(date);
        if (existing.length >= MAX_PER_DAY) throw Object.assign(new Error("Day limit"), { code: "PHOTO_DAY_LIMIT" });
        const all = await store.all();
        if (all.length >= MAX_LIBRARY_PHOTOS) throw Object.assign(new Error("Library full"), { code: "PHOTO_LIBRARY_FULL" });
        const blob = input.blob;
        if (!(blob instanceof Blob) || !blob.size) throw Object.assign(new Error("Photo source unavailable"), { code: "PHOTO_SOURCE_UNAVAILABLE" });
        const id = input.id || (crypto.randomUUID?.() || `photo-${Date.now()}`);
        const row = {
          id,
          backupId: input.backupId || id,
          date,
          contentType: input.contentType || blob.type || "image/jpeg",
          size: blob.size,
          width: Number(input.width || 0),
          height: Number(input.height || 0),
          createdAt: Number(input.createdAt || Date.now()),
          caption: String(input.caption || "").slice(0, CAPTION_LIMIT),
          order: Number.isFinite(input.order) ? input.order : existing.length,
          blob,
        };
        await store.put(row);
        return publicRecord(row);
      },
      async addFile(file, date) {
        const compressed = await compressPhoto(file);
        return this.addPrepared({
          date,
          blob: compressed.blob,
          width: compressed.width,
          height: compressed.height,
          contentType: compressed.blob.type,
        });
      },
      async updateCaption(id, caption) {
        const row = await store.get(id);
        if (!row) return null;
        row.caption = String(caption || "").slice(0, CAPTION_LIMIT);
        await store.put(row);
        return publicRecord(row);
      },
      async reorder(date, ids) {
        const rows = await rowsFor(date);
        const rank = new Map(ids.map((id, index) => [id, index]));
        await Promise.all(rows.map(row => {
          row.order = rank.has(row.id) ? rank.get(row.id) : row.order;
          return store.put(row);
        }));
        return (await rowsFor(date)).map(publicRecord);
      },
      async remove(id) {
        const row = await store.get(id);
        if (!row) return null;
        await store.delete(id);
        const url = objectUrls.get(id);
        if (url) URL.revokeObjectURL(url);
        objectUrls.delete(id);
        return row;
      },
      async restoreRecord(row) {
        if (!row?.id || !row.date) throw Object.assign(new Error("Photo required"), { code: "PHOTO_REQUEST_INVALID" });
        const existing = await rowsFor(row.date);
        if (!existing.some(item => item.id === row.id) && existing.length >= MAX_PER_DAY) {
          throw Object.assign(new Error("Day limit"), { code: "PHOTO_DAY_LIMIT" });
        }
        await store.put(row);
        return publicRecord(row);
      },
      async replaceFile(id, file) {
        const row = await store.get(id);
        if (!row) return null;
        const compressed = await compressPhoto(file);
        row.blob = compressed.blob;
        row.contentType = compressed.blob.type;
        row.size = compressed.blob.size;
        row.width = compressed.width;
        row.height = compressed.height;
        const previous = objectUrls.get(id);
        if (previous) URL.revokeObjectURL(previous);
        objectUrls.delete(id);
        await store.put(row);
        return publicRecord(row);
      },
    };
  }

  function createCloudLibrary() {
    const captions = new Map();
    const orders = new Map();
    function decorate(photo, index) {
      return { ...photo, caption: captions.get(photo.id) || "", order: orders.get(photo.id) ?? index };
    }
    return {
      async listRange(from, to) {
        const data = await responseJson(await fetch(`/api/photos?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { credentials: "same-origin" }));
        return (data.photos || []).map(decorate);
      },
      async addFile(file, date) {
        const compressed = await compressPhoto(file);
        const form = new FormData();
        form.set("photo", compressed.blob, `life-ledger-${date}.${compressed.blob.type === "image/webp" ? "webp" : "jpg"}`);
        form.set("date", date);
        form.set("width", String(compressed.width));
        form.set("height", String(compressed.height));
        const data = await responseJson(await fetch("/api/photos", { method: "POST", body: form, credentials: "same-origin" }));
        return decorate(data.photo, 0);
      },
      async updateCaption(id, caption) {
        captions.set(id, String(caption || "").slice(0, CAPTION_LIMIT));
        return { id, caption: captions.get(id) };
      },
      async reorder(date, ids) {
        ids.forEach((id, index) => orders.set(id, index));
        const data = await responseJson(await fetch(`/api/photos?date=${encodeURIComponent(date)}`, { credentials: "same-origin" }));
        return (data.photos || []).map(decorate).sort((a, b) => a.order - b.order);
      },
      async remove(id) {
        await responseJson(await fetch(`/api/photos/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" }));
        captions.delete(id);
        return { id };
      },
      async restoreRecord() { return null; },
      async replaceFile(id, file, date) {
        await this.remove(id);
        return this.addFile(file, date);
      },
    };
  }

  function openLightbox(photo) {
    const dialog = document.getElementById("photoLightbox");
    const image = document.getElementById("photoLightboxImage");
    const caption = document.getElementById("photoLightboxCaption");
    if (!dialog || !image) return;
    image.src = photo.url;
    image.width = photo.width || 720;
    image.height = photo.height || 720;
    if (caption) caption.textContent = photo.caption || "";
    if (!dialog.open) dialog.showModal();
  }

  function create(options = {}) {
    const transport = options.transport || "local";
    const library = transport === "cloud" ? createCloudLibrary() : createLocalLibrary(options.store);
    let language = options.language || "en";
    let enabled = options.enabled !== false;
    const mounts = new Set();

    const t = (key, values = {}) => (copy[language]?.[key] || copy.en[key] || key)
      .replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");

    function errorText(error) {
      if (error?.code === "PHOTO_FORMAT_UNSUPPORTED" || error?.code === "PHOTO_SIGNATURE_INVALID") return t("format");
      if (error?.code === "PHOTO_HEIC_UNSUPPORTED") return t("heic");
      if (error?.code === "PHOTO_SOURCE_UNAVAILABLE") return t("sourceUnavailable");
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

    function mount(section) {
      if (!section) return null;
      const list = section.querySelector("[data-photo-list]");
      const input = section.querySelector("[data-photo-input]");
      const add = section.querySelector("[data-photo-add]");
      const title = section.querySelector("[data-photo-title]");
      const help = section.querySelector("[data-photo-help]");
      const count = section.querySelector("[data-photo-count]");
      const status = section.querySelector("[data-photo-status]");
      const empty = section.querySelector("[data-photo-empty]");
      const drop = section.querySelector("[data-photo-drop]");
      const replaceInput = section.querySelector("[data-photo-replace]");
      let date = "";
      let photos = [];
      let busy = false;
      let requestVersion = 0;
      let selectedId = "";
      let replaceId = "";

      function setStatus(message = "", error = false) {
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("error", error);
        status.hidden = !message;
      }

      function notify() {
        options.onChange?.({ date, photos: [...photos] });
        mounts.forEach(handle => {
          if (handle !== self && handle.currentDate() === date) handle.load(date, { force: true });
        });
      }

      function render() {
        section.hidden = !enabled;
        if (title) title.textContent = t("title");
        if (help) help.textContent = enabled ? t("help") : t("unavailable");
        if (add) {
          const label = add.querySelector("span");
          if (label) label.textContent = t("add");
          add.disabled = busy || photos.length >= MAX_PER_DAY || !date;
        }
        if (count) count.textContent = t("count", { count: photos.length });
        if (empty) {
          empty.hidden = photos.length > 0;
          empty.textContent = t("empty");
        }
        if (!list) return;
        list.innerHTML = photos.map(photo => `<figure class="photo-thumb mood-photo-thumb ${photo.id === selectedId ? "is-selected" : ""}" data-photo-id="${photo.id}" draggable="true" tabindex="0">
          <button type="button" class="photo-thumb-open" aria-label="${t("preview")}"><img src="${photo.url}" alt="${escapeAttr(photo.caption)}" width="${photo.width || 720}" height="${photo.height || 720}" /></button>
          <input class="photo-caption" data-photo-caption maxlength="${CAPTION_LIMIT}" value="${escapeAttr(photo.caption)}" aria-label="${t("caption")}" placeholder="${t("caption")}" />
          <div class="photo-thumb-actions">
            <button type="button" data-photo-action="replace" aria-label="${t("replace")}">${t("replace")}</button>
            <button type="button" data-photo-action="remove" aria-label="${t("remove")}">${t("remove")}</button>
          </div>
        </figure>`).join("");
      }

      async function refresh() {
        const version = ++requestVersion;
        if (!enabled || !date) {
          photos = [];
          render();
          return [];
        }
        setStatus(t("loading"));
        try {
          photos = sortPhotos(await library.listRange(date, date));
          if (version !== requestVersion) return photos;
          setStatus("");
          render();
          return photos;
        } catch (error) {
          if (version === requestVersion) setStatus(errorText(error), true);
          return [];
        }
      }

      async function load(nextDate, { force = false } = {}) {
        if (!force && nextDate === date) return photos;
        date = nextDate;
        selectedId = "";
        return refresh();
      }

      async function upload(file, fromKeyboard = false) {
        if (!enabled || busy || !date || photos.length >= MAX_PER_DAY || !file) return;
        busy = true;
        setStatus(t("processing"));
        render();
        try {
          const photo = await library.addFile(file, date);
          photos = sortPhotos([...photos, photo]);
          setStatus(t("saved"));
          notify();
          options.onToast?.(t("saved"));
          if (!fromKeyboard) section.querySelector(`[data-photo-id="${photo.id}"]`)?.classList.add("photo-enter");
        } catch (error) {
          setStatus(errorText(error), true);
        } finally {
          busy = false;
          if (input) input.value = "";
          render();
        }
      }

      async function removePhoto(id, fromKeyboard = false) {
        if (busy || !id) return;
        const removed = photos.find(photo => photo.id === id);
        busy = true;
        setStatus(t("deleting"));
        try {
          const record = await library.remove(id);
          photos = photos.filter(photo => photo.id !== id);
          setStatus("");
          notify();
          if (record && transport === "local") {
            options.onUndo?.({
              message: t("removed"),
              label: t("undo"),
              restore: async () => {
                const restored = await library.restoreRecord(record);
                if (date === removed?.date) {
                  photos = sortPhotos([...photos.filter(photo => photo.id !== restored.id), restored]);
                  render();
                  notify();
                }
              },
            });
          }
          if (fromKeyboard) selectedId = photos[0]?.id || "";
        } catch (error) {
          setStatus(errorText(error), true);
        } finally {
          busy = false;
          render();
        }
      }

      function bind() {
        add?.addEventListener("click", event => {
          if (event.detail === 0) section.classList.add("photo-from-keyboard");
          input?.click();
        });
        input?.addEventListener("change", () => upload(input.files?.[0], section.classList.contains("photo-from-keyboard")));
        replaceInput?.addEventListener("change", async () => {
          const file = replaceInput.files?.[0];
          const id = replaceId;
          replaceInput.value = "";
          if (!file || !id) return;
          busy = true;
          setStatus(t("processing"));
          try {
            const photo = await library.replaceFile(id, file, date);
            photos = photos.map(item => item.id === id ? photo : item).filter(Boolean);
            if (photo && photo.id !== id) photos = sortPhotos(photos.filter(item => item.id !== id).concat(photo));
            setStatus(t("saved"));
            notify();
          } catch (error) {
            setStatus(errorText(error), true);
          } finally {
            busy = false;
            render();
          }
        });
        drop?.addEventListener("dragover", event => {
          event.preventDefault();
          drop.classList.add("is-dropping");
        });
        drop?.addEventListener("dragleave", () => drop.classList.remove("is-dropping"));
        drop?.addEventListener("drop", event => {
          event.preventDefault();
          drop.classList.remove("is-dropping");
          const file = [...(event.dataTransfer?.files || [])].find(isPhotoFile);
          if (!file) {
            setStatus(t("format"), true);
            return;
          }
          upload(file);
        });
        list?.addEventListener("click", event => {
          const figure = event.target.closest("[data-photo-id]");
          if (!figure) return;
          selectedId = figure.dataset.photoId;
          const action = event.target.closest("[data-photo-action]")?.dataset.photoAction;
          if (action === "remove") removePhoto(selectedId, event.detail === 0);
          else if (action === "replace") {
            replaceId = selectedId;
            replaceInput?.click();
          } else if (event.target.closest(".photo-thumb-open")) {
            const photo = photos.find(item => item.id === selectedId);
            if (photo) openLightbox(photo);
          }
        });
        list?.addEventListener("change", event => {
          const caption = event.target.closest("[data-photo-caption]");
          const figure = caption?.closest("[data-photo-id]");
          if (!caption || !figure) return;
          const photo = photos.find(item => item.id === figure.dataset.photoId);
          if (!photo) return;
          photo.caption = caption.value.slice(0, CAPTION_LIMIT);
          library.updateCaption(photo.id, photo.caption).catch(error => setStatus(errorText(error), true));
        });
        list?.addEventListener("dragstart", event => {
          const figure = event.target.closest("[data-photo-id]");
          if (!figure) return;
          event.dataTransfer?.setData("text/plain", figure.dataset.photoId);
        });
        list?.addEventListener("dragover", event => event.preventDefault());
        list?.addEventListener("drop", async event => {
          const target = event.target.closest("[data-photo-id]");
          const sourceId = event.dataTransfer?.getData("text/plain");
          if (!target || !sourceId || target.dataset.photoId === sourceId) return;
          event.preventDefault();
          event.stopPropagation();
          const ids = photos.map(photo => photo.id);
          const from = ids.indexOf(sourceId);
          const to = ids.indexOf(target.dataset.photoId);
          if (from < 0 || to < 0) return;
          ids.splice(to, 0, ids.splice(from, 1)[0]);
          photos = await library.reorder(date, ids);
          render();
          notify();
        });
        list?.addEventListener("keydown", event => {
          const figures = [...list.querySelectorAll("[data-photo-id]")];
          if (!figures.length) return;
          const current = figures.findIndex(figure => figure.dataset.photoId === selectedId);
          if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            const next = current < 0 ? 0 : current + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1);
            const figure = figures[(next + figures.length) % figures.length];
            selectedId = figure.dataset.photoId;
            render();
            list.querySelector(`[data-photo-id="${selectedId}"]`)?.focus();
          } else if (event.key === "Enter") {
            const photo = photos.find(item => item.id === selectedId);
            if (photo) openLightbox(photo);
          } else if (event.key === "Backspace" || event.key === "Delete") {
            if (event.target.matches("input, textarea")) return;
            event.preventDefault();
            removePhoto(selectedId, true);
          }
        });
        render();
      }

      const handle = { load, photos: () => [...photos], render, section, currentDate: () => date };
      const self = handle;
      mounts.add(handle);
      bind();
      return handle;
    }

    const primary = options.section ? mount(options.section) : null;
    return {
      load: date => primary ? primary.load(date) : Promise.resolve([]),
      listRange: (from, to) => enabled ? library.listRange(from, to) : Promise.resolve([]),
      async restorePhoto(photo, blob) {
        if (!enabled) throw new Error(t("unavailable"));
        if (transport === "cloud") {
          const form = new FormData();
          form.set("photo", blob, `life-ledger-${photo.date}.${blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg"}`);
          form.set("date", photo.date);
          form.set("width", String(photo.width || 1));
          form.set("height", String(photo.height || 1));
          form.set("sourceId", photo.backupId || photo.id);
          const data = await responseJson(await fetch("/api/photos", { method: "POST", body: form, credentials: "same-origin" }));
          return data.photo;
        }
        const restored = await library.addPrepared({
          id: photo.backupId || photo.id,
          backupId: photo.backupId || photo.id,
          date: photo.date,
          blob,
          width: photo.width,
          height: photo.height,
          contentType: photo.contentType || blob.type,
          caption: photo.caption,
          order: photo.order,
          createdAt: photo.createdAt,
        });
        mounts.forEach(handle => { if (handle.section.isConnected && handle.currentDate()) handle.load(handle.currentDate()); });
        return restored;
      },
      setLanguage(next) { language = copy[next] ? next : "en"; mounts.forEach(handle => handle.render()); },
      setEnabled(next) { enabled = Boolean(next); mounts.forEach(handle => handle.render()); },
      photos: () => primary?.photos() || [],
      mount,
    };
  }

  function escapeAttr(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  root.LifeLedgerPhotoMemories = {
    MAX_EDGE, MAX_OUTPUT_BYTES, MAX_PER_DAY, compressPhoto, create, isHeicFile, isPhotoFile,
    createLocalLibrary, memoryStore,
  };
})(window);
