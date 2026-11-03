import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DEMO_MEMORY_ASSETS } from "../public/demo-workspace.js";

const root = new URL("../", import.meta.url);
const swSource = readFileSync(new URL("public/sw.js", root), "utf8");
const indexHtml = readFileSync(new URL("public/index.html", root), "utf8");

function parseStringArray(source, name) {
  const match = source.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`));
  assert.ok(match, `${name} array missing from sw.js`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map(entry => entry[1]);
}

function allShellEntries(source) {
  return [
    ...parseStringArray(source, "HAIRLINE_ASSETS"),
    ...parseStringArray(source, "DEMO_MEMORY_ASSETS"),
    ...parseStringArray(source, "APP_SHELL"),
  ];
}

function shellPath(entry) {
  const stripped = entry.replace(/^\.\//, "").split("?")[0];
  if (stripped === "" || stripped === "index.html") return "public/index.html";
  return `public/${stripped}`;
}

function localScriptStyleRefs(html) {
  return [...html.matchAll(/(?:src|href)=["']\.\/([^"']+)["']/g)]
    .map(match => match[1])
    .filter(ref => /\.(?:js|css)$/.test(ref.split("?")[0]));
}

function loadWorkerHandlers() {
  const listeners = {};
  const navigated = [];
  let respondWithCalls = 0;

  const self = {
    location: { origin: "https://life.example" },
    skipWaiting() {},
    clients: {
      claim: async () => {},
      matchAll: async () => [{ url: "https://life.example/", focus: async () => {}, navigate(url) { navigated.push(url); } }],
      openWindow: async () => {},
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
  };

  const cacheStore = new Map();
  const caches = {
    async open(name) {
      if (!cacheStore.has(name)) cacheStore.set(name, new Map());
      const bucket = cacheStore.get(name);
      return {
        addAll(entries) {
          entries.forEach(entry => bucket.set(entry, entry));
          return Promise.resolve();
        },
        put(key, value) {
          bucket.set(typeof key === "string" ? key : key.url, value);
          return Promise.resolve();
        },
        match(key) {
          const lookup = typeof key === "string" ? key : key.url;
          return Promise.resolve(bucket.get(lookup));
        },
      };
    },
    async match(key) {
      for (const bucket of cacheStore.values()) {
        const lookup = typeof key === "string" ? key : key.url;
        if (bucket.has(lookup)) return bucket.get(lookup);
      }
      return undefined;
    },
    async keys() {
      return [...cacheStore.keys()];
    },
    async delete(name) {
      return cacheStore.delete(name);
    },
  };

  const context = {
    self,
    caches,
    clients: self.clients,
    fetch: async () => new Response("ok", { status: 200, headers: { "content-type": "text/plain" } }),
    Response,
    URL,
    Promise,
  };

  vm.createContext(context);
  vm.runInContext(swSource, context);

  const dispatchFetch = request => {
    respondWithCalls = 0;
    const event = {
      request,
      respondWith(promise) {
        respondWithCalls += 1;
        return promise;
      },
    };
    listeners.fetch?.(event);
    return respondWithCalls;
  };

  const dispatchActivate = async () => {
    navigated.length = 0;
    const waits = [];
    const event = {
      waitUntil(promise) {
        waits.push(promise);
      },
    };
    listeners.activate?.(event);
    await Promise.all(waits);
    return navigated.slice();
  };

  return { dispatchFetch, dispatchActivate, navigated };
}

test("service worker activation claims clients without reloading them", async () => {
  const { dispatchActivate, navigated } = loadWorkerHandlers();
  await dispatchActivate();
  assert.deepEqual(navigated, []);
  assert.doesNotMatch(swSource, /client\.navigate/);
});

test("NETWORK_FIRST_SUFFIXES includes ledger scripts for offline PWA", () => {
  const suffixes = parseStringArray(swSource, "NETWORK_FIRST_SUFFIXES");
  assert.ok(suffixes.includes("/ledger-core.js"), "ledger-core.js must be network-first managed");
  assert.ok(suffixes.includes("/ledger-ui.js"), "ledger-ui.js must be network-first managed");
});

test("service worker bypasses API, Cloudflare Access, and unrelated same-origin paths", () => {
  const { dispatchFetch } = loadWorkerHandlers();
  const origin = "https://life.example";

  assert.equal(dispatchFetch(new Request(`${origin}/api/state`)), 0);
  assert.equal(dispatchFetch(new Request(`${origin}/cdn-cgi/access/logout`)), 0);
  assert.equal(dispatchFetch(new Request(`${origin}/random/download.bin`)), 0);

  assert.equal(dispatchFetch(new Request(`${origin}/app.js?v=2.0.6`)), 1);
  assert.equal(dispatchFetch(new Request(`${origin}/ledger-core.js?v=2.1.0`)), 1);
  assert.equal(dispatchFetch(new Request(`${origin}/ledger-ui.js?v=2.1.0`)), 1);
  assert.equal(dispatchFetch(new Request(`${origin}/assets/hairline/empty-journal.svg`)), 1);
  assert.equal(dispatchFetch(new Request(`${origin}/life-ledger-deep-review/vendor/heic2any.min.js?v=0.0.4`)), 1);
  assert.equal(dispatchFetch(new Request(`${origin}/life-ledger-deep-review/assets/demo-memories/run-park.jpg`)), 1);
});

test("APP_SHELL entries resolve to tracked public files", () => {
  for (const entry of allShellEntries(swSource)) {
    const path = shellPath(entry);
    if (entry === "./") continue;
    assert.ok(existsSync(new URL(path, root)), `missing shell asset: ${entry}`);
  }
});

test("index.html local scripts and styles are represented in APP_SHELL", () => {
  const shell = allShellEntries(swSource).map(entry => entry.replace(/^\.\//, "").split("?")[0]);
  for (const ref of localScriptStyleRefs(indexHtml)) {
    const normalized = ref.split("?")[0];
    assert.ok(shell.includes(normalized), `index.html references ${ref} but APP_SHELL does not`);
  }
});

test("APP_SHELL covers HEIC converter, hairline art, and demo memory photos", () => {
  const shell = allShellEntries(swSource);
  assert.ok(shell.some(entry => entry.startsWith("./vendor/heic2any.min.js")));
  for (const name of readdirSync(new URL("../public/assets/hairline/", import.meta.url)).sort()) {
    assert.ok(shell.includes(`./assets/hairline/${name}`), `hairline asset missing: ${name}`);
  }
  for (const asset of DEMO_MEMORY_ASSETS) {
    assert.ok(shell.includes(`./assets/demo-memories/${asset.file}`), `demo memory missing: ${asset.file}`);
  }
});
