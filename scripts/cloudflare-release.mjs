#!/usr/bin/env node
/**
 * Cloudflare Worker + Assets release phases (preflight, deploy, verify, rollback-command).
 * Remote commands run only when an operator invokes this script; CI tests inject mocks.
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  APP_VERSION,
  APP_NAME,
  D1_SCHEMA_REVISION,
  BACKUP_SCHEMA_VERSION,
  SYNC_PROTOCOL_VERSION,
  WORKER_TOPOLOGY,
} from "../src/release-metadata.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_DIR = join(ROOT, ".life-ledger-deployments");

const WRANGLER_CONFIG = join(ROOT, "wrangler.jsonc");
const PACKAGE_JSON = join(ROOT, "package.json");

export const REDACT_PATTERNS = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]"],
  [/authorization:\s*[^\s]+/gi, "authorization: [redacted]"],
  [/cf-access-client-secret:\s*[^\s]+/gi, "cf-access-client-secret: [redacted]"],
  [/cf-access-jwt-assertion:\s*[^\s]+/gi, "cf-access-jwt-assertion: [redacted]"],
  [/cookie:\s*[^\n]+/gi, "cookie: [redacted]"],
  [/api[_-]?token[=:\s]+[^\s]+/gi, "api_token=[redacted]"],
];

export function redactText(text, maxLength = 32_000) {
  let value = String(text ?? "").slice(0, maxLength);
  for (const [pattern, replacement] of REDACT_PATTERNS) {
    value = value.replace(pattern, replacement);
  }
  return value;
}

export function stripJsonComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

export function readWranglerName(configPath = WRANGLER_CONFIG) {
  const raw = readFileSync(configPath, "utf8");
  const parsed = JSON.parse(stripJsonComments(raw));
  if (!parsed.name) throw new Error("wrangler.jsonc is missing name");
  return parsed.name;
}

export function readPackageVersion(path = PACKAGE_JSON) {
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  return pkg.version;
}

export function gitCommitSha(runner = defaultRunner) {
  const result = runner("git", ["rev-parse", "HEAD"], { cwd: ROOT });
  if (result.status !== 0) return "unknown";
  return result.stdout.trim() || "unknown";
}

export function manifestTimestamp(now = new Date()) {
  return now.toISOString().replace(/[:.]/g, "-");
}

export function allowlistManifest(raw) {
  const allowedTop = new Set([
    "createdAt",
    "workerName",
    "app",
    "packageVersion",
    "gitCommit",
    "topology",
    "previousDeployment",
    "localGates",
    "remoteInventory",
  ]);
  const out = {};
  for (const key of Object.keys(raw)) {
    if (allowedTop.has(key)) out[key] = raw[key];
  }
  return out;
}

export function buildDeployWranglerArgs({ workerName, message, buildSha }) {
  return [
    "deploy",
    "--strict",
    "--keep-vars",
    "--message",
    message,
    "--var",
    `BUILD_SHA:${buildSha}`,
  ];
}

export function buildMigrationApplyArgs() {
  return ["d1", "migrations", "apply", WORKER_TOPOLOGY.bindings.d1, "--remote"];
}

export function buildRollbackWranglerArgs({ workerName, previousVersionId }) {
  return ["rollback", previousVersionId, "--name", workerName];
}

export function formatRollbackCommand({ workerName, previousVersionId }) {
  const args = ["wrangler", ...buildRollbackWranglerArgs({ workerName, previousVersionId })];
  return args.join(" ");
}

export function parseCli(argv) {
  const args = [...argv];
  const command = args.shift() || "";
  const flags = {
    confirm: false,
    manifest: "",
    url: "",
  };
  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--confirm") flags.confirm = true;
    else if (token === "--manifest") flags.manifest = args[++i] || "";
    else if (token === "--url") flags.url = args[++i] || "";
    else positional.push(token);
  }
  return { command, flags, positional };
}

function defaultRunner(cmd, cmdArgs, options = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: options.cwd || ROOT,
    encoding: "utf8",
    env: options.env || process.env,
    maxBuffer: 512_000,
  });
  return {
    status: result.status ?? 1,
    stdout: redactText(result.stdout || ""),
    stderr: redactText(result.stderr || ""),
  };
}

export function runLocalGates(runner = defaultRunner) {
  const gates = [];
  const dryRun = runner("npx", ["wrangler", "deploy", "--dry-run"], { cwd: ROOT });
  gates.push({
    name: "wrangler-deploy-dry-run",
    ok: dryRun.status === 0,
    exitCode: dryRun.status,
    stderr: dryRun.stderr.slice(0, 4000),
  });
  const syntax = runner(process.execPath, ["--check", join(ROOT, "src/index.js")], { cwd: ROOT });
  gates.push({
    name: "worker-syntax-check",
    ok: syntax.status === 0,
    exitCode: syntax.status,
  });
  return { ok: gates.every(g => g.ok), gates };
}

export function runRemoteInventory(runner = defaultRunner) {
  const inventory = { ok: true, deployments: null, pendingMigrations: null, errors: [] };
  const deployments = runner("npx", ["wrangler", "deployments", "list", "--json"], { cwd: ROOT });
  if (deployments.status === 0) {
    try {
      inventory.deployments = JSON.parse(deployments.stdout);
    } catch {
      inventory.errors.push("Unable to parse deployments list JSON");
      inventory.ok = false;
    }
  } else {
    inventory.errors.push("deployments list failed");
    inventory.ok = false;
  }

  const migrations = runner(
    "npx",
    ["wrangler", "d1", "migrations", "list", WORKER_TOPOLOGY.bindings.d1, "--remote"],
    { cwd: ROOT },
  );
  inventory.pendingMigrations = {
    exitCode: migrations.status,
    stdout: migrations.stdout.slice(0, 8000),
    stderr: migrations.stderr.slice(0, 4000),
  };
  if (migrations.status !== 0) {
    inventory.ok = false;
    inventory.errors.push("d1 migrations list failed");
  }
  return inventory;
}

const WORKER_VERSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseDeploymentsList(deploymentsJson) {
  if (!deploymentsJson) return [];
  if (Array.isArray(deploymentsJson)) return deploymentsJson;
  if (Array.isArray(deploymentsJson.deployments)) return deploymentsJson.deployments;
  if (Array.isArray(deploymentsJson.result)) return deploymentsJson.result;
  return [];
}

export function pickEffectiveDeploymentVersion(versions) {
  if (!Array.isArray(versions) || versions.length === 0) return null;
  const candidates = versions
    .map(entry => ({
      versionId: typeof entry?.version_id === "string" ? entry.version_id.trim() : "",
      percentage: Number(entry?.percentage),
    }))
    .filter(entry => WORKER_VERSION_ID.test(entry.versionId));
  if (!candidates.length) return null;
  const maxPercentage = Math.max(...candidates.map(entry => (Number.isFinite(entry.percentage) ? entry.percentage : 0)));
  const winners = candidates.filter(entry => (Number.isFinite(entry.percentage) ? entry.percentage : 0) === maxPercentage);
  if (winners.length !== 1) return null;
  return {
    versionId: winners[0].versionId,
    percentage: Number.isFinite(winners[0].percentage) ? winners[0].percentage : null,
  };
}

export function extractPreviousDeployment(deploymentsJson) {
  const list = parseDeploymentsList(deploymentsJson);
  if (!list.length) return null;
  const sorted = [...list].sort((left, right) => {
    const leftTime = Date.parse(left?.created_on || left?.created || "");
    const rightTime = Date.parse(right?.created_on || right?.created || "");
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) return rightTime - leftTime;
    if (Number.isFinite(leftTime) && !Number.isFinite(rightTime)) return -1;
    if (!Number.isFinite(leftTime) && Number.isFinite(rightTime)) return 1;
    return 0;
  });
  const latest = sorted[0];
  const version = pickEffectiveDeploymentVersion(latest?.versions);
  if (!version) return null;
  return {
    id: latest?.id || latest?.deployment_id || null,
    versionId: version.versionId,
    createdOn: latest?.created_on || latest?.created || null,
    trafficPercentage: version.percentage,
  };
}

export function projectRemoteInventory(rawInventory) {
  const out = {
    ok: Boolean(rawInventory?.ok),
    errors: Array.isArray(rawInventory?.errors) ? rawInventory.errors.slice(0, 20) : [],
  };
  if (rawInventory?.skipped) {
    out.skipped = true;
    return out;
  }
  out.deployments = [...parseDeploymentsList(rawInventory?.deployments)]
    .sort((left, right) => {
      const leftTime = Date.parse(left?.created_on || left?.created || "");
      const rightTime = Date.parse(right?.created_on || right?.created || "");
      if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return rightTime - leftTime;
      if (Number.isFinite(leftTime)) return -1;
      if (Number.isFinite(rightTime)) return 1;
      return 0;
    })
    .slice(0, 5)
    .map(deployment => ({
    id: deployment?.id || deployment?.deployment_id || null,
    created_on: deployment?.created_on || deployment?.created || null,
    versions: Array.isArray(deployment?.versions)
      ? deployment.versions.map(entry => ({
          version_id: typeof entry?.version_id === "string" ? entry.version_id : null,
          percentage: Number.isFinite(Number(entry?.percentage)) ? Number(entry.percentage) : null,
        }))
      : [],
    }));
  const pending = rawInventory?.pendingMigrations;
  if (pending) {
    out.pendingMigrations = {
      exitCode: pending.exitCode ?? null,
      stdout: redactText(String(pending.stdout || "").slice(0, 2000)),
      stderr: redactText(String(pending.stderr || "").slice(0, 1000)),
    };
  }
  return out;
}

export function writeManifest(manifest, dir = MANIFEST_DIR) {
  mkdirSync(dir, { recursive: true });
  const safe = allowlistManifest(manifest);
  const fileName = `manifest-${manifestTimestamp(new Date(manifest.createdAt || Date.now()))}.json`;
  const path = join(dir, fileName);
  writeFileSync(path, `${JSON.stringify(safe, null, 2)}\n`, "utf8");
  return path;
}

export function runPreflight(deps = {}) {
  const runner = deps.runner || defaultRunner;
  const localGates = runLocalGates(runner);
  const remoteInventoryRaw = deps.skipRemote ? { ok: true, skipped: true } : runRemoteInventory(runner);
  const remoteInventory = projectRemoteInventory(remoteInventoryRaw);
  const workerName = readWranglerName(deps.wranglerConfig || WRANGLER_CONFIG);
  const manifest = {
    createdAt: new Date().toISOString(),
    workerName,
    app: APP_NAME,
    packageVersion: readPackageVersion(deps.packageJson || PACKAGE_JSON),
    gitCommit: gitCommitSha(runner),
    topology: WORKER_TOPOLOGY,
    previousDeployment: extractPreviousDeployment(remoteInventoryRaw.deployments),
    localGates,
    remoteInventory,
  };
  const path = writeManifest(manifest, deps.manifestDir || MANIFEST_DIR);
  const ok = localGates.ok && (remoteInventory.ok || remoteInventory.skipped);
  return { ok, path, manifest: allowlistManifest(manifest) };
}

export function runDeploy(options = {}) {
  if (!options.confirm) {
    return { ok: false, error: "Deploy requires --confirm" };
  }
  const runner = options.runner || defaultRunner;
  const preflight = runPreflight({ ...options, runner, skipRemote: options.skipRemote });
  if (!preflight.ok) {
    return { ok: false, error: "Preflight failed", preflightPath: preflight.path };
  }
  const buildSha = options.buildSha || gitCommitSha(runner);
  const message = options.message || `Release ${APP_VERSION}`;
  const workerName = readWranglerName(options.wranglerConfig || WRANGLER_CONFIG);

  const migration = runner("npx", ["wrangler", ...buildMigrationApplyArgs()], {
    cwd: ROOT,
    env: { ...process.env, BUILD_SHA: buildSha },
  });
  if (migration.status !== 0) {
    return {
      ok: false,
      error: "D1 migration apply failed",
      preflightPath: preflight.path,
      migration: { exitCode: migration.status, stderr: migration.stderr.slice(0, 4000) },
    };
  }

  const deployArgs = buildDeployWranglerArgs({ workerName, message, buildSha });
  const deploy = runner("npx", ["wrangler", ...deployArgs], {
    cwd: ROOT,
    env: { ...process.env, BUILD_SHA: buildSha },
  });
  if (deploy.status !== 0) {
    return {
      ok: false,
      error: "Wrangler deploy failed",
      preflightPath: preflight.path,
      deploy: { exitCode: deploy.status, stderr: deploy.stderr.slice(0, 4000) },
    };
  }
  return { ok: true, preflightPath: preflight.path, buildSha, deployArgs: ["wrangler", ...deployArgs] };
}

export function verifyAccessHeadersFromEnv(env = process.env) {
  const headers = {};
  const clientId = env.CF_ACCESS_CLIENT_ID || env["CF-ACCESS-CLIENT-ID"];
  const clientSecret = env.CF_ACCESS_CLIENT_SECRET || env["CF-ACCESS-CLIENT-SECRET"];
  if (clientId) headers["CF-Access-Client-Id"] = clientId;
  if (clientSecret) headers["CF-Access-Client-Secret"] = clientSecret;
  return headers;
}

export function looksLikeHtml(body, contentType = "") {
  const type = String(contentType).toLowerCase();
  if (type.includes("text/html")) return true;
  const trimmed = String(body).trimStart().slice(0, 256).toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

export function evaluateVersionResponse(body, expected = {}) {
  const failures = [];
  const version = expected.version ?? APP_VERSION;
  const buildSha = expected.buildSha;
  const d1Schema = expected.d1SchemaRevision ?? D1_SCHEMA_REVISION;
  const backupSchema = expected.backupSchemaVersion ?? BACKUP_SCHEMA_VERSION;
  const syncProtocol = expected.syncProtocolVersion ?? SYNC_PROTOCOL_VERSION;

  if (body.app !== APP_NAME) failures.push(`app mismatch: ${body.app}`);
  if (body.version !== version) failures.push(`version mismatch: ${body.version}`);
  if (buildSha && body.buildSha !== buildSha) failures.push(`buildSha mismatch: ${body.buildSha}`);
  if (body.expected?.d1SchemaRevision !== d1Schema) failures.push("d1SchemaRevision mismatch");
  if (body.expected?.backupSchemaVersion !== backupSchema) failures.push("backupSchemaVersion mismatch");
  if (body.expected?.syncProtocolVersion !== syncProtocol) failures.push("syncProtocolVersion mismatch");

  const bindings = body.bindings || {};
  for (const key of ["d1Bound", "r2Bound", "workersAiBound", "accessConfigured"]) {
    if (bindings[key] !== true) failures.push(`bindings.${key} not true`);
  }
  if (body.readiness?.ready !== true) failures.push("readiness.ready not true");
  if (body.readiness?.d1?.revisionColumnReady !== true) failures.push("D1 revision column not ready");

  return failures;
}

export async function runVerify(options = {}) {
  const url = (options.url || options.env?.LIFE_LEDGER_DEPLOY_URL || "").replace(/\/$/, "");
  if (!url) return { ok: false, error: "Verify requires --url or LIFE_LEDGER_DEPLOY_URL" };

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const headers = {
    accept: "application/json",
    ...verifyAccessHeadersFromEnv(options.env || process.env),
  };
  let response;
  try {
    response = await fetchImpl(`${url}/api/version`, { method: "GET", headers });
  } catch (error) {
    return { ok: false, error: redactText(error.message) };
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (looksLikeHtml(text, contentType)) {
    return { ok: false, error: "Received HTML (likely Access login), not JSON version payload" };
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, error: "Response is not JSON" };
  }

  const failures = evaluateVersionResponse(body, options.expected || {});
  if (response.status !== 200) failures.push(`HTTP status ${response.status}`);
  if (failures.length) return { ok: false, failures, status: response.status, body };

  return { ok: true, status: response.status, body };
}

export function runRollbackCommand(options = {}) {
  const manifestPath = options.manifest;
  if (!manifestPath || !existsSync(manifestPath)) {
    return { ok: false, error: "rollback-command requires --manifest pointing to a preflight file" };
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const versionId = manifest.previousDeployment?.versionId;
  if (!WORKER_VERSION_ID.test(String(versionId || ""))) {
    return { ok: false, error: "Manifest has no valid previousDeployment version id" };
  }
  const workerName = manifest.workerName || readWranglerName();
  const command = formatRollbackCommand({ workerName, previousVersionId: versionId });
  return { ok: true, command, execute: false };
}

function printUsage() {
  console.log(`Usage:
  node scripts/cloudflare-release.mjs preflight
  node scripts/cloudflare-release.mjs deploy --confirm
  node scripts/cloudflare-release.mjs verify --url https://<worker-host>
  node scripts/cloudflare-release.mjs rollback-command --manifest .life-ledger-deployments/manifest-....json

Environment (verify): LIFE_LEDGER_DEPLOY_URL, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET
Topology: Worker ${WORKER_TOPOLOGY.workerEntry}, assets ${WORKER_TOPOLOGY.assetsDirectory},
  bindings DB/PHOTOS/AI, migration ${D1_SCHEMA_REVISION}, sync protocol ${SYNC_PROTOCOL_VERSION}.`);
}

async function main(argv = process.argv.slice(2)) {
  const { command, flags } = parseCli(argv);
  if (!command || command === "help" || command === "--help") {
    printUsage();
    process.exit(command ? 0 : 1);
  }

  if (command === "preflight") {
    const result = runPreflight();
    console.log(result.path);
    process.exit(result.ok ? 0 : 2);
  }

  if (command === "deploy") {
    const result = runDeploy({ confirm: flags.confirm });
    if (!result.ok) {
      console.error(redactText(result.error || "deploy failed"));
      process.exit(2);
    }
    console.log(result.preflightPath);
    process.exit(0);
  }

  if (command === "verify") {
    const result = await runVerify({ url: flags.url, env: process.env });
    if (!result.ok) {
      console.error(redactText(JSON.stringify(result.failures || result.error)));
      process.exit(2);
    }
    console.log("verify ok");
    process.exit(0);
  }

  if (command === "rollback-command") {
    const result = runRollbackCommand({ manifest: flags.manifest });
    if (!result.ok) {
      console.error(result.error);
      process.exit(2);
    }
    console.log(result.command);
    process.exit(0);
  }

  printUsage();
  process.exit(1);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch(error => {
    console.error(redactText(error.message));
    process.exit(2);
  });
}
