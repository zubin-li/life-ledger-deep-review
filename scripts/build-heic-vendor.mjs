import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(projectRoot, "node_modules/heic2any/dist/heic2any.min.js");
const destination = resolve(process.argv[2] || resolve(projectRoot, "public/vendor/heic2any.min.js"));

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
console.log(`Bundled HEIC fallback: ${destination}`);
