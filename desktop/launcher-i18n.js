export const SUPPORTED_LAUNCHER_LANGUAGES = ["en", "zh", "de"];
export const LAUNCHER_LANGUAGE_KEY = "life-ledger-desktop-launcher-language";

function normalizeLanguage(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (text.startsWith("zh")) return "zh";
  if (text.startsWith("de")) return "de";
  if (text.startsWith("en")) return "en";
  return "";
}

export function resolveLauncherLanguage({ saved, system } = {}) {
  const fromSaved = normalizeLanguage(saved);
  if (fromSaved) return fromSaved;
  const fromSystem = normalizeLanguage(system);
  if (fromSystem) return fromSystem;
  return "en";
}
