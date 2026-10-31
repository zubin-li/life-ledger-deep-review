import {
  APP_NAME,
  APP_VERSION,
  BACKUP_SCHEMA_VERSION,
  D1_SCHEMA_REVISION,
  DEPLOYMENT_MODE,
  SYNC_PROTOCOL_VERSION,
  defaultBuildSha,
} from "./release-metadata.js";

const VERSION_PATHS = new Set(["/api/version", "/api/health/version"]);

export function isVersionPath(pathname) {
  return VERSION_PATHS.has(pathname);
}

export function bindingFlags(env = {}) {
  const teamDomain = String(env.TEAM_DOMAIN || "").trim();
  const policyAud = String(env.POLICY_AUD || "").trim();
  return {
    d1Bound: Boolean(env.DB),
    r2Bound: Boolean(env.PHOTOS),
    workersAiBound: Boolean(env.AI),
    accessConfigured: Boolean(teamDomain && policyAud),
  };
}

export async function probeD1SchemaReadiness(db) {
  if (!db) {
    return { bindingPresent: false, revisionColumnReady: false, error: "D1 binding missing" };
  }
  try {
    const row = await db.prepare(
      "SELECT COUNT(*) AS column_count FROM pragma_table_info('states') WHERE name = 'revision'",
    ).bind().first();
    const columnCount = Number(row?.column_count ?? 0);
    return {
      bindingPresent: true,
      revisionColumnReady: columnCount === 1,
      d1SchemaRevision: columnCount === 1 ? D1_SCHEMA_REVISION : null,
    };
  } catch (error) {
    return {
      bindingPresent: true,
      revisionColumnReady: false,
      error: "Unable to inspect D1 schema",
    };
  }
}

export function versionPayload(env, d1Probe, buildSha = defaultBuildSha(env)) {
  const bindings = bindingFlags(env);
  const ready = bindings.d1Bound
    && bindings.r2Bound
    && bindings.workersAiBound
    && bindings.accessConfigured
    && d1Probe.bindingPresent
    && d1Probe.revisionColumnReady;

  return {
    app: APP_NAME,
    version: APP_VERSION,
    buildSha,
    deploymentMode: DEPLOYMENT_MODE,
    expected: {
      d1SchemaRevision: D1_SCHEMA_REVISION,
      backupSchemaVersion: BACKUP_SCHEMA_VERSION,
      syncProtocolVersion: SYNC_PROTOCOL_VERSION,
    },
    bindings,
    readiness: {
      ready,
      d1: {
        bound: d1Probe.bindingPresent,
        revisionColumnReady: d1Probe.revisionColumnReady,
        expectedSchemaRevision: D1_SCHEMA_REVISION,
      },
    },
  };
}

export function versionStatus(payload) {
  return payload.readiness.ready ? 200 : 503;
}

/**
 * @param {Request} request
 * @param {object} env
 * @param {{ identityOrResponse: Function, json: Function }} deps
 */
export async function handleVersionRequest(request, env, deps) {
  if (request.method !== "GET") {
    return deps.json({ error: "Method not allowed" }, 405, { Allow: "GET" });
  }

  const identity = await deps.identityOrResponse(request, env);
  if (identity.response) return identity.response;

  const d1Probe = await probeD1SchemaReadiness(env.DB);
  const payload = versionPayload(env, d1Probe);
  return deps.json(payload, versionStatus(payload));
}
