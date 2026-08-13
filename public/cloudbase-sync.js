(function attachCloudBaseSync(root) {
  "use strict";

  const SDK_URL = "./vendor/cloudbase-sdk.js";
  const COLLECTION = "life_ledger_states";

  class CloudBaseAuthRequiredError extends Error {
    constructor(message = "CloudBase sign-in required") {
      super(message);
      this.name = "CloudBaseAuthRequiredError";
    }
  }

  function deploymentConfig(source = root) {
    const injected = source?._tcbEnv || {};
    const provider = injected.LIFE_LEDGER_SYNC_PROVIDER || injected.lifeLedgerSyncProvider;
    const envId = injected.TCB_ENV_ID || injected.ENV_ID || injected.envId;
    const accessKey = injected.TCB_ACCESS_KEY || injected.accessKey;
    const region = injected.LIFE_LEDGER_CLOUDBASE_REGION || injected.region || "ap-shanghai";
    return {
      configured: provider === "cloudbase" && Boolean(envId && accessKey),
      envId: envId || "",
      accessKey: accessKey || "",
      region,
    };
  }

  function loadScript(documentRef, src = SDK_URL) {
    if (root.cloudbase) return Promise.resolve(root.cloudbase);
    const existing = documentRef.querySelector(`script[data-cloudbase-sdk="${src}"]`);
    if (existing?._ready) return existing._ready;

    const script = existing || documentRef.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.cloudbaseSdk = src;
    script._ready = new Promise((resolve, reject) => {
      script.addEventListener("load", () => root.cloudbase ? resolve(root.cloudbase) : reject(new Error("CloudBase SDK did not initialize")), { once: true });
      script.addEventListener("error", () => reject(new Error("Unable to load the CloudBase SDK")), { once: true });
    });
    if (!existing) documentRef.head.appendChild(script);
    return script._ready;
  }

  function createAdapter(options = {}) {
    const source = options.root || root;
    const config = options.config || deploymentConfig(source);
    const sdkLoader = options.sdkLoader || (() => loadScript(source.document));
    let app;
    let auth;
    let database;
    let documentId = "";
    let verifyOtp = null;

    function dataOrThrow(result, fallbackMessage) {
      if (result?.error) throw new Error(result.error.message || fallbackMessage);
      return result?.data;
    }

    async function initialize() {
      if (!config.configured) return false;
      if (app) return true;
      const cloudbase = await sdkLoader();
      app = cloudbase.init({
        env: config.envId,
        region: config.region,
        accessKey: config.accessKey,
        auth: { detectSessionInUrl: true },
      });
      auth = typeof app.auth === "function" ? app.auth() : app.auth;
      database = app.database();
      return true;
    }

    async function loginState() {
      await initialize();
      if (!auth) return null;
      const result = await auth.getSession();
      return dataOrThrow(result, "Unable to read the CloudBase session") || null;
    }

    async function requireLogin() {
      const state = await loginState();
      if (!state?.user) throw new CloudBaseAuthRequiredError();
      return state;
    }

    async function sendEmailCode(email) {
      await initialize();
      const result = await auth.signInWithOtp({
        email: String(email || "").trim().toLowerCase(),
        options: { shouldCreateUser: true },
      });
      const data = dataOrThrow(result, "Unable to send the verification code");
      if (typeof data?.verifyOtp !== "function") throw new Error("CloudBase did not return an OTP verifier");
      verifyOtp = data.verifyOtp;
      return true;
    }

    async function signInWithEmailCode(email, code) {
      await initialize();
      const verificationCode = String(code || "").trim();
      if (!verifyOtp) throw new Error("Request a verification code first");
      const result = await verifyOtp({ token: verificationCode });
      dataOrThrow(result, "The verification code is invalid or expired");
      verifyOtp = null;
      return loginState();
    }

    async function signOut() {
      await initialize();
      documentId = "";
      verifyOtp = null;
      const result = await auth.signOut();
      dataOrThrow(result, "Unable to sign out");
      return true;
    }

    async function findStateDocument() {
      const session = await requireLogin();
      const ownerId = session.user.id || session.user.uid;
      const result = await database.collection(COLLECTION).where({ ownerId }).limit(1).get();
      const document = result?.data?.[0] || null;
      if (document?._id) documentId = document._id;
      return document;
    }

    async function getState() {
      const document = await findStateDocument();
      if (!document) return null;
      return { payload: document.payload, updatedAt: document.updatedAt || 0 };
    }

    async function putState(payload) {
      const session = await requireLogin();
      const ownerId = session.user.id || session.user.uid;
      const serialized = JSON.stringify(payload);
      if (serialized.length > 2_000_000) throw new Error("State is too large");
      const updatedAt = Number(payload?.meta?.updatedAt) || Date.now();
      if (!documentId) await findStateDocument();

      const collection = database.collection(COLLECTION);
      if (documentId) {
        await collection.doc(documentId).update({ payload, updatedAt });
      } else {
        const result = await collection.add({ ownerId, payload, updatedAt });
        documentId = result?.id || result?._id || "";
      }
      return { ok: true, updatedAt };
    }

    return {
      config,
      initialize,
      loginState,
      sendEmailCode,
      signInWithEmailCode,
      signOut,
      getState,
      putState,
    };
  }

  const api = {
    SDK_URL,
    COLLECTION,
    CloudBaseAuthRequiredError,
    deploymentConfig,
    createAdapter,
  };

  root.LifeLedgerCloudBase = api;
})(globalThis);
