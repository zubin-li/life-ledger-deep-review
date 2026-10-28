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
    subtitle: "Your days, habits and reviews. Choose where they live.",
    localTitle: "Local on this Mac",
    localDesc: "Everything stays on this Mac. No account, works offline.",
    openLocal: "Open",
    cloudTitle: "Connected cloud",
    cloudDesc: "Open your own Life Ledger deployment. Sign in with your email and a one-time code.",
    cloudLabel: "Your deployment URL",
    openCloud: "Connect",
    forgetCloud: "Forget",
    setupGuide: "How to set up your own cloud",
    invalid: "Use HTTPS. HTTP is allowed only for localhost/127.0.0.1 development.",
  },
  zh: {
    languageLabel: "语言",
    subtitle: "你的每一天、习惯和复盘，选择保存在哪里。",
    localTitle: "本机模式",
    localDesc: "所有记录只保存在这台 Mac 上，无需账号，离线可用。",
    openLocal: "打开",
    cloudTitle: "连接云端",
    cloudDesc: "打开你自己部署的 Life Ledger。用邮箱收验证码登录。",
    cloudLabel: "你的部署 URL",
    openCloud: "连接",
    forgetCloud: "忘记地址",
    setupGuide: "怎样搭建自己的云端",
    invalid: "生产环境请使用 HTTPS。仅 localhost/127.0.0.1 开发地址可用 HTTP。",
  },
  de: {
    languageLabel: "Sprache",
    subtitle: "Deine Tage, Gewohnheiten und Rückblicke. Wähle, wo sie liegen.",
    localTitle: "Lokal auf diesem Mac",
    localDesc: "Alles bleibt auf diesem Mac. Kein Konto, auch offline.",
    openLocal: "Öffnen",
    cloudTitle: "Mit Cloud verbinden",
    cloudDesc: "Öffnet deine eigene Life-Ledger-Bereitstellung. Anmeldung per E-Mail-Code.",
    cloudLabel: "Deine Bereitstellungs-URL",
    openCloud: "Verbinden",
    forgetCloud: "Vergessen",
    setupGuide: "So richtest du deine eigene Cloud ein",
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
  void window.__TAURI__?.core?.invoke("forget_workspace").catch(() => {});
  localStorage.removeItem(STORAGE_KEY);
  cloudUrlInput.value = "";
  setCloudError("");
});

// the public setup guide opens in the default browser (the app has no browser window of its own)
document.getElementById("setupGuide").addEventListener("click", event => {
  event.preventDefault();
  void window.__TAURI__?.core?.invoke("open_setup_guide", { lang: document.documentElement.lang }).catch(() => {});
});
void window.__TAURI__?.app?.getVersion?.().then(v => { document.getElementById("appVersion").textContent = `Version ${v}`; }).catch(() => {});
