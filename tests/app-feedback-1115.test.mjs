import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(`../public/${path}`, import.meta.url), "utf8");
const app = read("app.js"), cards = read("today-cards.js"), html = read("index.html"), photos = read("photo-memories.js");

test("monthly review shows only what the user wrote (old machine drafts hidden)", () => {
  const start = app.indexOf("const GENERATED_REVIEW_TAILS");
  const end = app.indexOf("function photoFrameStyle");
  const writtenReview = new Function(`${app.slice(start, end)}; return writtenReview;`)();
  const old = "# October 2026 · Monthly Review\n\n## Facts\n- Recorded days: 3/27\n\n## Notes from the period\n- week text\n\n## My perspective\n- What deserves to continue?\n- What is draining energy?\n- What is the most important next step?\n";
  const oldZh = "# 2026年7月复盘\n\n## 基础目标\n- 早起：完成 2 次，月度覆盖率 6%。\n\n## 我的理解\n这个月哪些做法值得保留？哪些目标需要调整？\n\n## 下个月的一个关键改变\n";
  assert.equal(writtenReview(old), "");
  assert.equal(writtenReview(oldZh), "");
  assert.equal(writtenReview("我自己写的九月复盘"), "我自己写的九月复盘");
  assert.equal(writtenReview(oldZh + "我补了一段自己的想法"), oldZh + "我补了一段自己的想法");
  assert.equal(writtenReview(undefined), "");
  assert.match(app, /\$\("#reviewText"\)\.value = writtenReview\(state\.reviews\[key\]\)/);
});

test("first-run Today layout is the owner's arrangement", () => {
  assert.match(cards, /const ORDER = \["habits", "wall2", "rhythm", "dayplan", "calendar", "tools", "wall",/);
  assert.match(cards, /hidden: !START\[id\]/);
});

test("timeline opens on Daily and skips mood-only days", () => {
  assert.match(app, /let journalMode = "timeline";/);
  assert.match(html, /class="active" role="tab" data-journal-mode="timeline" aria-selected="true"/);
  assert.match(app, /filter\(\(\[,log\]\) => String\(log\.note \|\| log\.moodReason \|\| ''\)\.trim\(\)\)/);
});

test("day photos: paste, framing synced with view prefs", () => {
  assert.match(photos, /addEventListener\("paste"/);
  assert.match(photos, /FRAMES_KEY = "life-ledger-photo-frames"/);
  assert.match(app, /"life-ledger-photo-frames"\];/);
});
