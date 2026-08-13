import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";

const output = new URL("../public/vendor/cloudbase-sdk.js", import.meta.url);

await build({
  entryPoints: [new URL("./cloudbase-sdk-entry.js", import.meta.url).pathname],
  bundle: true,
  platform: "browser",
  format: "iife",
  minify: true,
  legalComments: "external",
  outfile: output.pathname,
});

const legalNotice = new URL(`${output.href}.LEGAL.txt`);
const normalized = (await readFile(legalNotice, "utf8"))
  .split("\n")
  .map(line => line.trimEnd())
  .join("\n");
await writeFile(legalNotice, normalized, "utf8");
