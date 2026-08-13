import { spawnSync } from "node:child_process";
import { buildCloudBase } from "./build-cloudbase.mjs";

const { envId, outputDir } = await buildCloudBase();
const result = spawnSync(
  "npx",
  ["--yes", "--package", "@cloudbase/cli@3.7.3", "tcb", "hosting", "deploy", outputDir, "/", "--env-id", envId],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
