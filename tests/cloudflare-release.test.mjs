import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  allowlistManifest,
  buildDeployWranglerArgs,
  buildMigrationApplyArgs,
  evaluateVersionResponse,
  extractPreviousDeployment,
  formatRollbackCommand,
  looksLikeHtml,
  parseCli,
  parseDeploymentsList,
  pickEffectiveDeploymentVersion,
  projectRemoteInventory,
  redactText,
  runDeploy,
  runPreflight,
  runRollbackCommand,
  runVerify,
} from "../scripts/cloudflare-release.mjs";

test("parseCli captures confirm, manifest, and url flags", () => {
  const parsed = parseCli(["deploy", "--confirm", "--url", "https://x", "--manifest", "m.json"]);
  assert.equal(parsed.command, "deploy");
  assert.equal(parsed.flags.confirm, true);
  assert.equal(parsed.flags.url, "https://x");
  assert.equal(parsed.flags.manifest, "m.json");
});

test("deploy refuses without --confirm", () => {
  const result = runDeploy({ confirm: false, skipRemote: true, runner: () => ({ status: 0, stdout: "", stderr: "" }) });
  assert.equal(result.ok, false);
  assert.match(result.error, /confirm/i);
});

test("deploy builds strict keep-vars wrangler args with BUILD_SHA", () => {
  const args = buildDeployWranglerArgs({ workerName: "life-ledger-deep-review", message: "Release 2.0.6", buildSha: "deadbeef" });
  assert.deepEqual(args, [
    "deploy",
    "--strict",
    "--keep-vars",
    "--message",
    "Release 2.0.6",
    "--var",
    "BUILD_SHA:deadbeef",
  ]);
});

test("deploy applies remote migrations before wrangler deploy", () => {
  const calls = [];
  const runner = (cmd, args) => {
    calls.push([cmd, ...args].join(" "));
    if (args.includes("deploy")) return { status: 0, stdout: "", stderr: "" };
    return { status: 0, stdout: "[]", stderr: "" };
  };
  const manifestDir = mkdtempSync(join(tmpdir(), "ll-deploy-manifest-"));
  const result = runDeploy({
    confirm: true,
    skipRemote: true,
    runner,
    buildSha: "sha1",
    manifestDir,
  });
  assert.equal(result.ok, true);
  const migrationIndex = calls.findIndex(line => line.includes("migrations") && line.includes("apply"));
  const deployIndex = calls.findIndex(line => line.includes("deploy") && line.includes("--strict"));
  assert.ok(migrationIndex >= 0 && deployIndex > migrationIndex);
});

test("migration apply targets canonical DB binding only", () => {
  assert.deepEqual(buildMigrationApplyArgs(), ["d1", "migrations", "apply", "DB", "--remote"]);
});

test("manifest allowlist drops unexpected secret fields", () => {
  const filtered = allowlistManifest({
    createdAt: "t",
    workerName: "life-ledger-deep-review",
    packageVersion: "2.0.6",
    gitCommit: "abc",
    secretToken: "must-drop",
    TEAM_DOMAIN: "drop",
  });
  assert.equal(filtered.secretToken, undefined);
  assert.equal(filtered.TEAM_DOMAIN, undefined);
  assert.equal(filtered.workerName, "life-ledger-deep-review");
});

test("redactText scrubs bearer tokens and authorization headers", () => {
  const redacted = redactText("Authorization: Bearer abc.def-ghi\nCookie: session=1");
  assert.doesNotMatch(redacted, /abc\.def-ghi/);
  assert.match(redacted, /\[redacted\]/);
});

test("redactText preserves Worker version UUIDs while scrubbing secrets", () => {
  const versionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const redacted = redactText(`version_id=${versionId} Authorization: Bearer secret-token`);
  assert.match(redacted, new RegExp(versionId));
  assert.doesNotMatch(redacted, /secret-token/);
});

const WRANGLER_CURRENT = "11111111-1111-4111-8111-111111111111";
const WRANGLER_OLD = "22222222-2222-4222-8222-222222222222";

test("extractPreviousDeployment picks newest created_on and highest traffic version", () => {
  const unsorted = [
    {
      id: "dep-old",
      created_on: "2026-10-28T10:00:00.000Z",
      author_email: "ops@example.com",
      versions: [{ version_id: WRANGLER_OLD, percentage: 100 }],
    },
    {
      id: "dep-new",
      created_on: "2026-10-30T12:00:00.000Z",
      author_email: "ops@example.com",
      versions: [
        { version_id: WRANGLER_CURRENT, percentage: 90 },
        { version_id: WRANGLER_OLD, percentage: 10 },
      ],
    },
  ];
  const picked = extractPreviousDeployment(unsorted);
  assert.deepEqual(picked, {
    id: "dep-new",
    versionId: WRANGLER_CURRENT,
    createdOn: "2026-10-30T12:00:00.000Z",
    trafficPercentage: 90,
  });
});

test("extractPreviousDeployment rejects ambiguous equal traffic splits", () => {
  const ambiguous = [{
    id: "dep-split",
    created_on: "2026-10-30T12:00:00.000Z",
    versions: [
      { version_id: WRANGLER_CURRENT, percentage: 50 },
      { version_id: WRANGLER_OLD, percentage: 50 },
    ],
  }];
  assert.equal(extractPreviousDeployment(ambiguous), null);
});

test("extractPreviousDeployment rejects missing or invalid version ids", () => {
  assert.equal(extractPreviousDeployment([{
    created_on: "2026-10-30T12:00:00.000Z",
    versions: [{ version_id: "not-a-uuid", percentage: 100 }],
  }]), null);
  assert.equal(extractPreviousDeployment([{
    created_on: "2026-10-30T12:00:00.000Z",
    versions: [],
  }]), null);
});

test("parseDeploymentsList accepts raw wrangler arrays and envelopes", () => {
  const row = { created_on: "2026-10-30T12:00:00.000Z", versions: [] };
  assert.deepEqual(parseDeploymentsList([row]), [row]);
  assert.deepEqual(parseDeploymentsList({ deployments: [row] }), [row]);
  assert.deepEqual(parseDeploymentsList({ result: [row] }), [row]);
});

test("pickEffectiveDeploymentVersion prefers the highest percentage", () => {
  assert.deepEqual(
    pickEffectiveDeploymentVersion([
      { version_id: WRANGLER_OLD, percentage: 5 },
      { version_id: WRANGLER_CURRENT, percentage: 95 },
    ]),
    { versionId: WRANGLER_CURRENT, percentage: 95 },
  );
});

test("projectRemoteInventory keeps rollback evidence only and redacts nested secrets", () => {
  const projected = projectRemoteInventory({
    ok: true,
    errors: [],
    deployments: [{
      id: "dep-new",
      created_on: "2026-10-30T12:00:00.000Z",
      author_email: "ops@example.com",
      source: "wrangler",
      versions: [{ version_id: WRANGLER_CURRENT, percentage: 100, api_token: "SECRET" }],
    }],
    pendingMigrations: {
      exitCode: 0,
      stdout: `pending Authorization: Bearer nested-secret\nversion ${WRANGLER_CURRENT}`,
      stderr: "",
    },
  });
  assert.equal(projected.deployments[0].author_email, undefined);
  assert.equal(projected.deployments[0].source, undefined);
  assert.equal(projected.deployments[0].versions[0].api_token, undefined);
  assert.equal(projected.deployments[0].versions[0].version_id, WRANGLER_CURRENT);
  assert.match(projected.pendingMigrations.stdout, new RegExp(WRANGLER_CURRENT));
  assert.doesNotMatch(projected.pendingMigrations.stdout, /nested-secret/);
});

test("projectRemoteInventory keeps the five newest deployments regardless of input order", () => {
  const deployments = Array.from({ length: 7 }, (_, index) => ({
    id: `dep-${index}`,
    created_on: `2026-10-${String(20 + index).padStart(2, "0")}T12:00:00.000Z`,
    versions: [{ version_id: WRANGLER_CURRENT, percentage: 100 }],
  }));
  const projected = projectRemoteInventory({ ok: true, errors: [], deployments });
  assert.deepEqual(projected.deployments.map(item => item.id), ["dep-6", "dep-5", "dep-4", "dep-3", "dep-2"]);
});

test("preflight manifest stores projected remote inventory and rollback version", () => {
  const deployments = [{
    id: "dep-new",
    created_on: "2026-10-30T12:00:00.000Z",
    author_email: "ops@example.com",
    versions: [{ version_id: WRANGLER_CURRENT, percentage: 100 }],
  }];
  const runner = (cmd, args) => {
    if (args.includes("--dry-run")) return { status: 0, stdout: "", stderr: "" };
    if (args[0] === "--check") return { status: 0, stdout: "", stderr: "" };
    if (cmd === "git") return { status: 0, stdout: "deadbeef\n", stderr: "" };
    if (args.includes("deployments") && args.includes("--json")) {
      return { status: 0, stdout: JSON.stringify(deployments), stderr: "" };
    }
    return { status: 0, stdout: "", stderr: "" };
  };
  const manifestDir = mkdtempSync(join(tmpdir(), "ll-manifest-"));
  const result = runPreflight({ runner, manifestDir });
  assert.equal(result.manifest.previousDeployment?.versionId, WRANGLER_CURRENT);
  assert.equal(result.manifest.remoteInventory.deployments[0].author_email, undefined);
  const command = runRollbackCommand({ manifest: result.path });
  assert.equal(command.ok, true);
  assert.match(command.command, new RegExp(`wrangler rollback ${WRANGLER_CURRENT}`));
  assert.equal(command.execute, false);
});

test("rollback-command prints wrangler rollback only", () => {
  const command = formatRollbackCommand({ workerName: "life-ledger-deep-review", previousVersionId: "version-old" });
  assert.equal(command, "wrangler rollback version-old --name life-ledger-deep-review");
  assert.doesNotMatch(command, /DROP|ALTER/i);
});

test("rollback-command helper uses manifest previous version id", () => {
  const manifestPath = fileURLToPath(new URL("./fixtures/rollback-manifest.json", import.meta.url));
  const result = runRollbackCommand({ manifest: manifestPath });
  assert.equal(result.ok, true);
  assert.match(result.command, /wrangler rollback aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/);
});

test("rollback-command rejects deployment ids and invalid version ids", () => {
  const manifestDir = mkdtempSync(join(tmpdir(), "ll-invalid-rollback-"));
  const manifestPath = join(manifestDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify({
    workerName: "life-ledger-deep-review",
    previousDeployment: { id: "deployment-only" },
  }));
  const result = runRollbackCommand({ manifest: manifestPath });
  assert.equal(result.ok, false);
  assert.match(result.error, /valid.*version id/i);
});

test("verify rejects HTML Access login pages", async () => {
  const result = await runVerify({
    url: "https://ledger.example",
    fetchImpl: async () => ({
      status: 200,
      headers: { get: () => "text/html" },
      text: async () => "<!DOCTYPE html><html><title>Sign in</title>",
    }),
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /HTML/i);
});

test("verify flags mismatched version and readiness", async () => {
  const body = {
    app: "life-ledger-deep-review",
    version: "0.0.0",
    buildSha: "development",
    expected: { d1SchemaRevision: 6, backupSchemaVersion: 3, syncProtocolVersion: 2 },
    bindings: { d1Bound: true, r2Bound: true, workersAiBound: true, accessConfigured: true },
    readiness: { ready: false, d1: { revisionColumnReady: false } },
  };
  const failures = evaluateVersionResponse(body);
  assert.ok(failures.some(item => item.includes("version mismatch")));
  assert.ok(failures.some(item => item.includes("readiness.ready")));
});

test("looksLikeHtml detects doctype payloads", () => {
  assert.equal(looksLikeHtml("<!DOCTYPE html><html></html>"), true);
  assert.equal(looksLikeHtml('{"ok":true}'), false);
});

test("preflight local gates can run with injected runner", () => {
  const runner = (cmd, args) => {
    if (args.includes("--dry-run")) return { status: 0, stdout: "", stderr: "" };
    if (args[0] === "--check") return { status: 0, stdout: "", stderr: "" };
    if (cmd === "git") return { status: 0, stdout: "deadbeef\n", stderr: "" };
    return { status: 0, stdout: "[]", stderr: "" };
  };
  const manifestDir = mkdtempSync(join(tmpdir(), "ll-manifest-"));
  const result = runPreflight({ runner, skipRemote: true, manifestDir });
  assert.equal(result.ok, true);
  assert.match(result.path, /manifest-/);
});

test("CI workflow stays local-only", () => {
  const ci = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  assert.match(ci, /npm test/);
  assert.match(ci, /npm run test:browser/);
  assert.match(ci, /wrangler deploy --dry-run/);
  assert.doesNotMatch(ci, /migrations apply.*--remote/);
  assert.doesNotMatch(ci, /cloudflare-release\.mjs deploy/);
});

test("package deploy script routes through guarded release tool", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(pkg.scripts["deploy:cloudflare"], /cloudflare-release\.mjs deploy/);
  assert.match(pkg.scripts.deploy, /cloudflare-release\.mjs deploy/);
  assert.doesNotMatch(pkg.scripts.deploy, /wrangler deploy$/);
});
