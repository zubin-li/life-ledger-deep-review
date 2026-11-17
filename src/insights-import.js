import "../public/insights.js";

// Weekly screenshot-insights publisher (Mac cron → cloud). Merges one week into the signed-in
// user's synced state with the same rules the app uses (marks and deleted tombstones survive),
// then writes with compare-and-swap so a phone saving at the same moment is never overwritten.
// Images are uploaded first via PUT /api/wall/<id>; the body only carries their ids.
const insights = globalThis.LifeLedgerInsights;
const MAX_STATE = 2_000_000;

export async function importInsightsWeek(db, keyHash, body, { read, swap, now = Date.now() }) {
  const images = {};
  for (const item of Array.isArray(body?.items) ? body.items : []) {
    if (item && typeof item.id === "string") images[`${body.week}:${item.id}`] = item.images;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await read(db, keyHash);
    if (current.status !== 200) return { status: 409, body: { error: "Open Life Ledger once in the cloud edition first", code: "NO_STATE" } };
    const payload = current.body.payload;
    let result;
    try { result = insights.importInto(payload, body, now, images); }
    catch { return { status: 400, body: { error: "Invalid insights week", code: "INVALID_INSIGHTS" } }; }
    payload.meta = { ...(payload.meta || {}), updatedAt: now };
    const size = JSON.stringify(payload).length;
    if (size > MAX_STATE) return { status: 413, body: { error: "State is too large", code: "STATE_TOO_LARGE", size } };
    const written = await swap(db, keyHash, JSON.stringify(payload), now, current.body.revision);
    if (written.status === 200) return { status: 200, body: { ok: true, ...result, revision: written.body.revision, size } };
  }
  return { status: 409, body: { error: "Cloud state kept changing, try again", code: "STATE_BUSY" } };
}
