import { validateCloudUrl } from "./url-validation.js";
import {
  LAUNCHER_LANGUAGE_KEY,
  SUPPORTED_LAUNCHER_LANGUAGES,
  resolveLauncherLanguage,
} from "./launcher-i18n.js";

const STORAGE_KEY = "life-ledger-desktop-cloud-url";
const language = resolveLauncherLanguage({
  saved: localStorage.getItem(LAUNCHER_LANGUAGE_KEY),
  system: navigator.language,
});

const copy = {
  en: {
    languageLabel: "Language",
    subtitle: "Choose local-only mode or connect your own deployment.",
    localTitle: "Local on this Mac",
    localDesc: "Stored on this Mac. No account required.",
    openLocal: "Open local app",
    cloudTitle: "Connected cloud",
    cloudDesc: "Open your own deployed Life Ledger URL. Authentication is handled by your deployment.",
    cloudLabel: "Your deployment URL",
    openCloud: "Open connected app",
    forgetCloud: "Forget saved URL",
    invalid: "Use HTTPS. HTTP is allowed only for localhost/127.0.0.1 development.",
  },
  zh: {
    languageLabel: "语言",
    subtitle: "可选择仅本机模式，或连接你自己的部署。",
    localTitle: "本机模式",
    localDesc: "数据保存在这台 Mac，不需要账号。",
    openLocal: "打开本机应用",
    cloudTitle: "连接云端",
    cloudDesc: "打开你自己部署的 Life Ledger URL。登录由该部署负责。",
    cloudLabel: "你的部署 URL",
    openCloud: "打开云端应用",
    forgetCloud: "忘记已保存 URL",
    invalid: "生产环境请使用 HTTPS。仅 localhost/127.0.0.1 开发地址可用 HTTP。",
  },
  de: {
    languageLabel: "Sprache",
    subtitle: "Wahl zwischen lokalem Modus und eigener Cloud-Bereitstellung.",
    localTitle: "Lokal auf diesem Mac",
    localDesc: "Daten bleiben auf diesem Mac. Kein Konto erforderlich.",
    openLocal: "Lokale App öffnen",
    cloudTitle: "Mit Cloud verbinden",
    cloudDesc: "Öffnet deine eigene Life-Ledger-URL. Anmeldung läuft über deine Bereitstellung.",
    cloudLabel: "Deine Bereitstellungs-URL",
    openCloud: "Cloud-App öffnen",
    forgetCloud: "Gespeicherte URL vergessen",
    invalid: "Bitte HTTPS nutzen. HTTP ist nur für localhost/127.0.0.1 in Entwicklung erlaubt.",
  },
};

const languageSelect = document.getElementById("languageSelect");
languageSelect.value = SUPPORTED_LAUNCHER_LANGUAGES.includes(language) ? language : "en";
document.documentElement.lang = languageSelect.value;
let activeCopy = copy[languageSelect.value] || copy.en;

function applyLanguage(lang) {
  const t = copy[lang] || copy.en;
  activeCopy = t;
  document.documentElement.lang = lang;
  for (const [id, value] of Object.entries(t)) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }
}

applyLanguage(languageSelect.value);
languageSelect.addEventListener("change", () => {
  const lang = SUPPORTED_LAUNCHER_LANGUAGES.includes(languageSelect.value) ? languageSelect.value : "en";
  localStorage.setItem(LAUNCHER_LANGUAGE_KEY, lang);
  applyLanguage(lang);
});

const cloudUrlInput = document.getElementById("cloudUrl");
const cloudError = document.getElementById("cloudError");

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) cloudUrlInput.value = saved;

function setCloudError(message = "") {
  cloudError.textContent = message;
  cloudError.hidden = !message;
}

document.getElementById("openLocal").addEventListener("click", async () => {
  await window.__TAURI__.core.invoke("open_local_window");
});

document.getElementById("openCloud").addEventListener("click", async () => {
  const result = validateCloudUrl(cloudUrlInput.value);
  if (!result.ok) {
    setCloudError(activeCopy.invalid);
    return;
  }
  setCloudError("");
  localStorage.setItem(STORAGE_KEY, result.normalized);
  await window.__TAURI__.core.invoke("open_cloud_window", { rawUrl: result.normalized });
});

document.getElementById("forgetCloud").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  cloudUrlInput.value = "";
  setCloudError("");
});
