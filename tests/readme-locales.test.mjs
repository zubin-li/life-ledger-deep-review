import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docs = [
  { file: "README.md", lang: "en", showcase: "docs/SHOWCASE.md" },
  { file: "README.zh-CN.md", lang: "zh", showcase: "docs/SHOWCASE.zh-CN.md" },
  { file: "README.de-DE.md", lang: "de", showcase: "docs/SHOWCASE.de-DE.md" },
];

test("each README opens the local-only app in its own language", async () => {
  for (const { file, lang } of docs) {
    const source = await readFile(resolve(root, file), "utf8");
    const expected = `https://zubin-li.github.io/life-ledger-deep-review/?mode=local&lang=${lang}`;
    const escaped = expected.replace("&", "&amp;");
    assert.ok(source.includes(expected) || source.includes(escaped), `${file} must link to lang=${lang}`);
  }
});

test("all README language and showcase links exist", async () => {
  for (const { file, showcase } of docs) {
    const source = await readFile(resolve(root, file), "utf8");
    for (const languageReadme of docs.map((item) => item.file)) {
      assert.match(source, new RegExp(languageReadme.replaceAll(".", "\\.")));
    }
    assert.match(source, new RegExp(showcase.replaceAll(".", "\\.")));
    await access(resolve(root, showcase));
  }
});

test("every local screenshot referenced by multilingual docs exists", async () => {
  const files = [...docs.map((item) => item.file), ...docs.map((item) => item.showcase)];
  for (const file of files) {
    const source = await readFile(resolve(root, file), "utf8");
    const base = dirname(resolve(root, file));
    const paths = [...source.matchAll(/<img src="([^"\s]+\.png)"/g)].map((match) => match[1]);
    for (const path of paths) {
      await access(resolve(base, path));
    }
  }
});

test("each language document references only its own versioned screenshots", async () => {
  for (const { file, lang, showcase } of docs) {
    for (const document of [file, showcase]) {
      const source = await readFile(resolve(root, document), "utf8");
      const paths = [...source.matchAll(/<img src="([^"\s]+demo-preview[^"\s]+\.png)"/g)].map((match) => match[1]);
      assert.ok(paths.length > 0, `${document} must include product screenshots`);
      for (const path of paths) {
        assert.ok(path.includes(`/${lang}-desktop/${lang}-`) || path.includes(`/${lang}-mobile/${lang}-`), `${document} has a cross-language screenshot: ${path}`);
        assert.ok(path.endsWith("-v2.png"), `${document} must use cache-busted screenshots: ${path}`);
      }
    }
  }
});
