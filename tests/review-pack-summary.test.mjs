import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  DEFAULT_THRESHOLDS,
  buildReviewPack,
  parseGfxInfo,
  parseJUnit,
} from "../scripts/review-pack/summarize.mjs";

test("parseGfxInfo extracts janky, frozen, and percentiles", () => {
  const sample = `
Applications Graphics Acceleration Info:
Uptime: 12345 Realtime: 67890

** Graphics info for pid 9999 [app.zubinli.lifeledger.androidtest] **

Stats since: 1000000
Total frames rendered: 80
Janky frames: 4 (5.00%)
Janky frames (legacy): 4
50th percentile: 12ms
90th percentile: 28ms
99th percentile: 95ms
Number of frames > 700ms: 0
`;
  const p = parseGfxInfo(sample);
  assert.equal(p.jankyPct, 5);
  assert.equal(p.frozenFrames, 0);
  assert.equal(p.p90FrameMs, 28);
  assert.equal(p.p50FrameMs, 12);
});

test("parseJUnit maps pass and fail cases", () => {
  const xml = `<?xml version="1.0"?>
<testsuites>
  <testsuite name="flow">
    <testcase name="01-cold-start" classname="flow" time="12"/>
    <testcase name="05-fab-expense" classname="flow" time="30">
      <failure>assertion failed</failure>
    </testcase>
  </testsuite>
</testsuites>`;
  const map = parseJUnit(xml);
  assert.equal(map.get("01-cold-start")?.status, "pass");
  assert.equal(map.get("05-fab-expense")?.status, "fail");
});

test("buildReviewPack applies thresholds to PASS/FAIL", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ll-review-pack-"));
  const metricsDir = join(dir, "metrics-raw");
  await mkdir(metricsDir, { recursive: true });

  const junit = `<?xml version="1.0"?><testsuites><testsuite>
    <testcase name="01-cold-start"/>
    <testcase name="02-welcome-sample"/>
    <testcase name="03-welcome-empty"/>
    <testcase name="04-navigation-back"/>
    <testcase name="05-fab-expense"><failure>broken</failure></testcase>
    <testcase name="06-habits-mood"/>
    <testcase name="07-focus-settings"/>
    <testcase name="08-process-death"/>
  </testsuite></testsuites>`;
  await writeFile(join(dir, "junit.xml"), junit, "utf8");

  await writeFile(
    join(metricsDir, "01-cold-start.json"),
    JSON.stringify({ coldStartMs: 1500, jankyPct: 4, frozenFrames: 0, p90FrameMs: 20 }),
    "utf8",
  );
  await writeFile(
    join(metricsDir, "05-fab-expense.json"),
    JSON.stringify({ jankyPct: 15, frozenFrames: 1, p90FrameMs: 40 }),
    "utf8",
  );
  for (const id of ["02-welcome-sample", "03-welcome-empty", "04-navigation-back", "06-habits-mood", "07-focus-settings", "08-process-death"]) {
    await writeFile(join(metricsDir, `${id}.json`), JSON.stringify({ jankyPct: 2, frozenFrames: 0, p90FrameMs: 16 }), "utf8");
  }

  const out = await buildReviewPack({ packDir: dir, thresholds: DEFAULT_THRESHOLDS });
  const f01 = out.flows.find(f => f.id === "01-cold-start");
  const f05 = out.flows.find(f => f.id === "05-fab-expense");
  assert.equal(f01?.pass, true);
  assert.equal(f05?.pass, false);
  assert.equal(out.overallPass, false);

  const metricsDisk = JSON.parse(await readFile(join(dir, "metrics.json"), "utf8"));
  assert.equal(metricsDisk.flows.length, 8);
  assert.match(await readFile(join(dir, "index.html"), "utf8"), /Android 审阅包/);
});