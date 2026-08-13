import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const outputDir = resolve(projectRoot, "dist/cloudbase");

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : "";
}

function readConfig() {
  const envId = argument("env-id") || process.env.TCB_ENV_ID || "";
  const accessKey = argument("access-key") || process.env.TCB_ACCESS_KEY || "";
  const region = argument("region") || process.env.TCB_REGION || "ap-shanghai";
  if (!envId) throw new Error("Missing CloudBase environment ID. Set TCB_ENV_ID or pass --env-id.");
  if (!accessKey) throw new Error("Missing CloudBase publishable key. Set TCB_ACCESS_KEY or pass --access-key.");
  if (!/^ap-(shanghai|guangzhou)$/.test(region)) throw new Error("TCB_REGION must be ap-shanghai or ap-guangzhou.");
  return { envId, accessKey, region };
}

export async function buildCloudBase() {
  const config = readConfig();
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await cp(resolve(projectRoot, "public"), outputDir, { recursive: true });
  const injected = {
    TCB_ENV_ID: config.envId,
    TCB_ACCESS_KEY: config.accessKey,
    LIFE_LEDGER_SYNC_PROVIDER: "cloudbase",
    LIFE_LEDGER_CLOUDBASE_REGION: config.region,
  };
  await writeFile(
    resolve(outputDir, "_init_tcb-env.js"),
    `window._tcbEnv = ${JSON.stringify(injected, null, 2)};\n`,
    "utf8",
  );
  console.log(`CloudBase build ready: ${outputDir}`);
  return { ...config, outputDir };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildCloudBase();
}
