import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const start = app.indexOf("const i18n = {");
const end = app.indexOf("\n};\n", start);
const i18n = new Function(`${app.slice(start, end + 3)} return i18n;`)();
const resolve = (lang, key) => key.split(".").reduce((node, part) => node?.[part], i18n[lang]);

test("every literal tr() key exists in en, zh and de", () => {
  const keys = [...new Set([...app.matchAll(/\btr\("([a-zA-Z0-9_.]+)"/g)].map(match => match[1]))];
  assert.ok(keys.length > 100, `expected many tr() keys, found ${keys.length}`);
  const missing = [];
  for (const key of keys) {
    for (const lang of ["en", "zh", "de"]) {
      if (resolve(lang, key) === undefined) missing.push(`${lang}:${key}`);
    }
  }
  assert.deepEqual(missing, []);
});
