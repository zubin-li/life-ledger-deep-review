import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = p => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), "utf8");

test("money page assets are loaded by index.html and precached by the service worker", () => {
  const html = read("index.html");
  const sw = read("sw.js");
  for (const asset of ["vendor/echarts.min.js", "money-ui.js", "money.css"]) {
    assert.ok(html.includes(`./${asset}`), `index.html loads ${asset}`);
    assert.ok(sw.includes(`./${asset}`), `sw.js precaches ${asset}`);
    assert.ok(fs.existsSync(new URL(`../public/${asset}`, import.meta.url)), `${asset} exists`);
  }
});

test("ledger-ui hands the page host to the Money UI when present", () => {
  const ui = read("ledger-ui.js");
  assert.match(ui, /root\.LifeLedgerMoneyUI\?\.render\(host, ctx/);
  const money = read("money-ui.js");
  assert.match(money, /root\.LifeLedgerMoneyUI = \{/);
  assert.match(money, /api\.frankfurter\.dev\/v1\//);
});

test("import wizard takes several files and pairs by source", () => {
  const money = read("money-ui.js");
  assert.match(money, /data-import-file multiple/);
  assert.match(money, /data-import-file-remove/);
  assert.match(money, /内部抵消/);
  assert.match(money, /Internal offsets/);
  assert.match(money, /Interne Verrechnung/);
  assert.match(money, /可能是自己账户转账/);
  assert.match(money, /Possibly own transfer/);
  assert.match(money, /data-setting="ownerNames"/);
  assert.match(money, /无法读取/);
  assert.match(money, /Unreadable/);
  assert.match(money, /Nicht lesbar/);
  assert.doesNotMatch(money, /data-import-next-account/);
  assert.doesNotMatch(money, /data-owner-names/);
  assert.doesNotMatch(money, /如果你也导入了这张卡的账单/);
  assert.doesNotMatch(money, /name="opening"/);
});

test("money-ui fxUrl asks ECB (frankfurter) for the previous business day, base = foreign currency", async () => {
  const vm = await import("node:vm");
  const sandbox = { globalThis: {} };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("ledger-core.js"), sandbox);
  vm.runInNewContext(read("money-ui.js"), sandbox);
  const { fxUrl } = sandbox.LifeLedgerMoneyUI;
  assert.equal(fxUrl("CNY", "2026-11-07"), "https://api.frankfurter.dev/v1/2026-11-06?base=CNY&symbols=EUR");
  assert.equal(fxUrl("USD", "2026-11-04", "EUR"), "https://api.frankfurter.dev/v1/2026-11-04?base=USD&symbols=EUR");
});
