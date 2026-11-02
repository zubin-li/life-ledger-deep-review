/**
 * Full visual regression for overnight builds.
 * Prerequisite: `python3 -m http.server 5291 --bind 127.0.0.1` from repo `public/`.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(here, script)], { stdio: "inherit" });
    child.on("exit", code => (code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`))));
  });
}

await run("capture-ledger.mjs");
console.log("capture-regression ok");
