import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

const appJs = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "public", "app.js"), "utf8");

const LANG_INIT_SNIPPET = `
const LANGUAGE_KEY = "life-ledger-language";
const LANGUAGE_PREFERENCE_KEY = "life-ledger-language-preference-set";
${appJs.slice(appJs.indexOf("const supportedLanguages"), appJs.indexOf("const cloneData")).replace("let currentLang", "var currentLang")}
`;

function resolveInitialLang(storage, search = "") {
  const context = {
    localStorage: {
      getItem(key) {
        return storage[key] ?? null;
      },
    },
    location: { search },
    URLSearchParams,
  };
  vm.createContext(context);
  vm.runInContext(`${LANG_INIT_SNIPPET}; currentLang;`, context);
  return context.currentLang;
}

test("app.js keeps stored-language init aligned with backup restore", () => {
  assert.match(appJs, /explicitLanguagePreference !== "false" && supportedLanguages\.includes\(storedLanguage\)/);
});

test("stored language applies without explicit preference flag (Playwright / deep links)", () => {
  assert.equal(resolveInitialLang({ "life-ledger-language": "zh" }), "zh");
  assert.equal(resolveInitialLang({ "life-ledger-language": "de" }), "de");
});

test("explicit preference false keeps English when URL has no lang", () => {
  assert.equal(
    resolveInitialLang({
      "life-ledger-language": "zh",
      "life-ledger-language-preference-set": "false",
    }),
    "en",
  );
});

test("URL lang param wins over stored language", () => {
  assert.equal(
    resolveInitialLang({ "life-ledger-language": "zh" }, "?lang=de"),
    "de",
  );
});
