import test from "node:test";
import assert from "node:assert/strict";
import "../public/insights.js";

const insights = globalThis.LifeLedgerInsights;

const file = (items, week = "2026-W46") => ({ format: "life-ledger-insights", version: 1, week, items });
const item = (id, extra = {}) => ({ id, title: `T ${id}`, core: "c", ...extra });

test("parse rejects foreign files and keeps only safe fields", () => {
  assert.throws(() => insights.parse({ week: "2026-W46", items: [item("a")] }));
  assert.throws(() => insights.parse(file([item("a")], "46")));
  const { items } = insights.parse(file([item("a", { fact_check: { status: "ok", url: "javascript:alert(1)" }, files: ["x.jpg"] }), { title: "no id" }]));
  assert.equal(items.length, 1);
  assert.equal(items[0].id, "2026-W46:a");
  assert.equal(items[0].fact.url, "");
  assert.equal(items[0].files, undefined);
});

test("re-importing a week replaces its items but keeps the user's marks", () => {
  const state = {};
  insights.importInto(state, file([item("a"), item("b", { top: true })]), 1);
  state.insights.marks["2026-W46:a"] = { mark: "agree", updatedAt: 2 };
  insights.importInto(state, file([item("a", { title: "edited" })]), 3);
  assert.equal(state.insights.weeks["2026-W46"].items.length, 1);
  assert.equal(state.insights.weeks["2026-W46"].items[0].title, "edited");
  assert.equal(state.insights.marks["2026-W46:a"].mark, "agree");
  assert.deepEqual(insights.top(state, "2026-W46"), []);
});

test("merge keeps newer weeks and newer marks from either side", () => {
  const a = { weeks: { "2026-W45": { importedAt: 1, items: [] }, "2026-W46": { importedAt: 5, items: [] } }, marks: { x: { mark: "agree", updatedAt: 9 }, y: { mark: "doubt", updatedAt: 1 } } };
  const b = { weeks: { "2026-W46": { importedAt: 4, items: [1] }, "2026-W47": { importedAt: 2, items: [] } }, marks: { x: { mark: "doubt", updatedAt: 3 }, y: { mark: "acted", updatedAt: 2 } } };
  const m = insights.merge(a, b);
  assert.deepEqual(Object.keys(m.weeks).sort(), ["2026-W45", "2026-W46", "2026-W47"]);
  assert.equal(m.weeks["2026-W46"].importedAt, 5);
  assert.equal(m.marks.x.mark, "agree");
  assert.equal(m.marks.y.mark, "acted");
  assert.deepEqual(insights.merge(undefined, undefined), { weeks: {}, marks: {}, deleted: {} });
});

test("image references survive parsing only as stored media ids", () => {
  const id = "0123abcd-0123-4123-a123-0123456789ab";
  const { items } = insights.parse(file([item("a"), item("b")]), { "2026-W46:a": [{ id, type: "image/png", size: 9, w: 3, h: 4, thumb: id }, { id, thumb: "../x" }, { id: "../etc", size: 1 }] });
  assert.deepEqual(items[0].images[0], { id, type: "image/png", size: 9, w: 3, h: 4, thumb: id, shrunk: false, original: 0 });
  assert.equal(items[0].images[1].thumb, "");
  assert.equal(items[0].images.length, 2);
  assert.deepEqual(items[1].images, []);
});

test("weekRange gives ISO Monday to Sunday", () => {
  const [mon, sun] = insights.weekRange("2026-W46");
  assert.equal(mon.toDateString(), new Date(2026, 10, 9).toDateString());
  assert.equal(sun.toDateString(), new Date(2026, 10, 15).toDateString());
  assert.equal(insights.weekRange("2026-W01")[0].toDateString(), new Date(2025, 11, 29).toDateString());
});

test("deleting hides an insight everywhere, survives re-import and sync, and can be undone", () => {
  const state = {};
  insights.importInto(state, file([item("a", { top: true }), item("b")]), 1);
  insights.remove(state, "2026-W46:a", 5);
  assert.deepEqual(insights.top(state, "2026-W46").map(i => i.id), []);
  insights.importInto(state, file([item("a", { top: true }), item("b")]), 9);
  assert.equal(insights.data(state).deleted["2026-W46:a"], 5);
  const other = { weeks: {}, marks: {} };
  assert.equal(insights.merge(other, state.insights).deleted["2026-W46:a"], 5);
  insights.restore(state, "2026-W46:a");
  assert.deepEqual(insights.top(state, "2026-W46").map(i => i.id), ["2026-W46:a"]);
});
