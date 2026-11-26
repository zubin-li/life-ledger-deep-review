#!/usr/bin/env node
/**
 * Android review pack: merge Maestro JUnit + per-flow gfx metrics → metrics.json + index.html
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { basename, join, relative } from "node:path";

export const DEFAULT_THRESHOLDS = {
  coldStartMs: 2000,
  jankyPctMax: 10,
  frozenFramesMax: 0,
  p90FrameMsMax: 32,
};

export const FLOW_META = [
  { id: "01-cold-start", file: "01-cold-start", nameZh: "冷启动 · 开机名言与欢迎页", junitName: "01-cold-start" },
  { id: "02-welcome-sample", file: "02-welcome-sample", nameZh: "欢迎页 · 看看示例", junitName: "02-welcome-sample" },
  { id: "03-welcome-empty", file: "03-welcome-empty", nameZh: "欢迎页 · 空白开始", junitName: "03-welcome-empty" },
  { id: "04-navigation-back", file: "04-navigation-back", nameZh: "底栏与系统返回", junitName: "04-navigation-back" },
  { id: "05-fab-expense", file: "05-fab-expense", nameZh: "FAB · 记账 4.80+7.70", junitName: "05-fab-expense" },
  { id: "06-habits-mood", file: "06-habits-mood", nameZh: "习惯打卡与心情", junitName: "06-habits-mood" },
  { id: "07-focus-settings", file: "07-focus-settings", nameZh: "专注计时与设置", junitName: "07-focus-settings" },
  { id: "08-process-death", file: "08-process-death", nameZh: "杀进程后数据仍在", junitName: "08-process-death" },
];

/**
 * Parse `adb shell dumpsys gfxinfo <pkg>` framestats block (post-reset cumulative).
 * @param {string} text
 * @returns {{ jankyPct: number|null, frozenFrames: number|null, p50FrameMs: number|null, p90FrameMs: number|null, p99FrameMs: number|null, totalFrames: number|null }}
 */
export function parseGfxInfo(text) {
  const raw = String(text || "");
  const out = {
    jankyPct: null,
    frozenFrames: null,
    p50FrameMs: null,
    p90FrameMs: null,
    p99FrameMs: null,
    totalFrames: null,
  };

  const jankyMatch =
    raw.match(/Janky frames:\s*(\d+)\s*\(([\d.]+)%\)/i) || raw.match(/Total frames rendered:\s*(\d+)[\s\S]*?Janky frames:\s*(\d+)\s*\(([\d.]+)%\)/i);
  if (jankyMatch) {
    if (jankyMatch.length === 3) {
      out.jankyPct = Number(jankyMatch[2]);
    } else if (jankyMatch.length === 4) {
      out.totalFrames = Number(jankyMatch[1]);
      out.jankyPct = Number(jankyMatch[3]);
    }
  }

  const frozenMatch = raw.match(/Number of frames\s*>\s*700ms:\s*(\d+)/i) || raw.match(/Frames\s*>\s*700ms:\s*(\d+)/i);
  if (frozenMatch) out.frozenFrames = Number(frozenMatch[1]);

  const p50 = raw.match(/50th percentile:\s*(\d+)ms/i);
  const p90 = raw.match(/90th percentile:\s*(\d+)ms/i);
  const p99 = raw.match(/99th percentile:\s*(\d+)ms/i);
  if (p50) out.p50FrameMs = Number(p50[1]);
  if (p90) out.p90FrameMs = Number(p90[1]);
  if (p99) out.p99FrameMs = Number(p99[1]);

  if (out.jankyPct == null) {
    const totalMatch = raw.match(/Total frames rendered:\s*(\d+)/i);
    const jankyOnly = raw.match(/Janky frames:\s*(\d+)/i);
    if (totalMatch && jankyOnly) {
      const total = Number(totalMatch[1]);
      const janky = Number(jankyOnly[1]);
      out.totalFrames = total;
      out.jankyPct = total > 0 ? (janky / total) * 100 : 0;
    }
  }

  return out;
}

/**
 * @param {string} junitXml
 * @returns {Map<string, { status: "pass"|"fail"|"skip", message?: string }>}
 */
export async function mergeJUnitReports(paths, outPath) {
  const parts = [];
  for (const p of paths) {
    try {
      const xml = await readFile(p, "utf8");
      // Same one-pass pattern as parseJUnit: attributes may contain "/" (file=".maestro/x.yaml"), so [^/>]* missed every passing (self-closing) case.
      const cases = [...xml.matchAll(/<testcase\b[^>]*?(?:\/>|>[\s\S]*?<\/testcase>)/g)].map(m => m[0]);
      parts.push(...cases);
    } catch {
      /* skip */
    }
  }
  const merged = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n<testsuite name="android-review-pack">\n${parts.join("\n")}\n</testsuite>\n</testsuites>\n`;
  await writeFile(outPath, merged, "utf8");
  return merged;
}

export function parseJUnit(junitXml) {
  const results = new Map();
  const raw = String(junitXml || "");
  // One pass: self-closing (`/>`) or with a body; the old two-branch regex let a self-closing case swallow the next one.
  const caseRe = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
  let m;
  while ((m = caseRe.exec(raw))) {
    const name = (/\bname="([^"]*)"/.exec(m[1]) || [])[1] || "";
    const body = m[2] || "";
    let status = "pass";
    let message = "";
    if (/<failure[\s>]/i.test(body)) {
      status = "fail";
      const fm = body.match(/<failure[^>]*>([\s\S]*?)<\/failure>/i);
      message = fm ? fm[1].trim().slice(0, 500) : "failure";
    } else if (/<error[\s>]/i.test(body)) {
      status = "fail";
      const em = body.match(/<error[^>]*>([\s\S]*?)<\/error>/i);
      message = em ? em[1].trim().slice(0, 500) : "error";
    } else if (/<skipped[\s>]/i.test(body)) {
      status = "skip";
    }
    results.set(name, { status, message });
  }
  return results;
}

function pickJUnitStatus(junitMap, flow) {
  for (const [name, st] of junitMap) {
    if (name.includes(flow.junitName) || name === flow.file) return st;
  }
  return { status: "fail", message: "未在 JUnit 中找到该流程" };
}

function evaluateFlow(flow, junit, metrics, thresholds) {
  const reasons = [];
  const junitOk = junit.status === "pass";
  if (!junitOk) reasons.push(`Maestro：${junit.message || junit.status}`);

  const coldStartMs = metrics.coldStartMs ?? null;
  const jankyPct = metrics.jankyPct ?? null;
  const frozenFrames = metrics.frozenFrames ?? null;
  const p90FrameMs = metrics.p90FrameMs ?? null;

  if (flow.id === "01-cold-start" && coldStartMs != null && coldStartMs > thresholds.coldStartMs) {
    reasons.push(`冷启动 ${coldStartMs}ms 超过 ${thresholds.coldStartMs}ms（模拟器阈值）`);
  }
  // Frame stats from a software-rendered CI emulator (swiftshader) measure the rasterizer, not the App:
  // there they are shown as advisory and do not decide pass/fail. Real-device frame pacing is judged on hardware.
  const frameIssues = [];
  if (jankyPct != null && jankyPct > thresholds.jankyPctMax) {
    frameIssues.push(`卡顿帧占比 ${jankyPct.toFixed(1)}% 超过 ${thresholds.jankyPctMax}%`);
  }
  if (frozenFrames != null && frozenFrames > thresholds.frozenFramesMax) {
    frameIssues.push(`>700ms 冻结帧 ${frozenFrames}，要求为 ${thresholds.frozenFramesMax}`);
  }
  if (p90FrameMs != null && p90FrameMs > thresholds.p90FrameMsMax) {
    frameIssues.push(`p90 帧时 ${p90FrameMs}ms 超过 ${thresholds.p90FrameMsMax}ms`);
  }

  const softwareGpu = process.env.REVIEW_PACK_SOFTWARE_GPU === "1";
  if (softwareGpu) reasons.push(...frameIssues.map(r => `${r}（软件渲染模拟器，仅供参考）`));
  const hardReasons = softwareGpu ? reasons.filter(r => !r.endsWith("（软件渲染模拟器，仅供参考）")) : [...reasons, ...frameIssues];
  if (!softwareGpu) reasons.push(...frameIssues);
  const pass = junitOk && hardReasons.length === 0;
  return {
    id: flow.id,
    nameZh: flow.nameZh,
    junitStatus: junit.status,
    junitMessage: junit.message || "",
    coldStartMs,
    jankyPct,
    frozenFrames,
    p50FrameMs: metrics.p50FrameMs ?? null,
    p90FrameMs,
    p99FrameMs: metrics.p99FrameMs ?? null,
    screenshot: metrics.screenshot || null,
    video: metrics.video || null,
    pass,
    reasons,
  };
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml({ flows, thresholds, generatedAt, packDir }) {
  const passCount = flows.filter(f => f.pass).length;
  const overallPass = passCount === flows.length && flows.every(f => f.junitStatus === "pass");

  const rows = flows
    .map(f => {
      const badge = f.pass ? '<span class="ok">通过</span>' : '<span class="bad">未通过</span>';
      const why = f.reasons.length ? `<ul class="why">${f.reasons.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : "";
      const shot = f.screenshot ? `<a href="${esc(relative(packDir, f.screenshot))}"><img src="${esc(relative(packDir, f.screenshot))}" alt="" loading="lazy"/></a>` : "";
      const vid = f.video ? `<video controls preload="metadata" src="${esc(relative(packDir, f.video))}"></video>` : "";
      const nums = [
        f.coldStartMs != null ? `冷启动 ${f.coldStartMs}ms` : null,
        f.jankyPct != null ? `卡顿 ${f.jankyPct.toFixed(1)}%` : null,
        f.frozenFrames != null ? `冻结帧 ${f.frozenFrames}` : null,
        f.p90FrameMs != null ? `p90 ${f.p90FrameMs}ms` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return `<article class="flow ${f.pass ? "pass" : "fail"}">
        <header><h2>${esc(f.nameZh)} ${badge}</h2><p class="nums">${esc(nums)}</p></header>
        ${why}
        <div class="media">${shot}${vid}</div>
        <p class="tech">JUnit：${esc(f.junitStatus)}${f.junitMessage ? ` — ${esc(f.junitMessage)}` : ""}</p>
      </article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Life Ledger Android 审阅包</title>
  <style>
    :root { font-family: system-ui, "PingFang SC", sans-serif; color: #15241f; background: #f4f6f4; }
    body { margin: 0 auto; max-width: 920px; padding: 1.25rem 1rem 3rem; }
    h1 { font-size: 1.35rem; margin: 0 0 .35rem; }
    .meta { color: #5b6560; font-size: .9rem; margin-bottom: 1.25rem; }
    .score { display: flex; gap: .75rem; flex-wrap: wrap; margin: 1rem 0 1.5rem; }
  .score div { background: #fff; border-radius: 12px; padding: .75rem 1rem; box-shadow: 0 1px 0 rgba(0,0,0,.06); }
    .score strong { display: block; font-size: 1.1rem; }
    .flow { background: #fff; border-radius: 14px; padding: 1rem 1.1rem; margin-bottom: 1rem; box-shadow: 0 1px 0 rgba(0,0,0,.06); border-left: 4px solid #c8d5cf; }
    .flow.pass { border-left-color: #2d8f62; }
    .flow.fail { border-left-color: #c74444; }
    .ok { color: #1a7a52; font-weight: 600; }
    .bad { color: #b33; font-weight: 600; }
    .nums { margin: .2rem 0 0; color: #3d4a44; }
    .tech { font-size: .75rem; color: #7a8580; margin: .6rem 0 0; }
    .why { margin: .5rem 0; padding-left: 1.2rem; color: #8b3a3a; font-size: .88rem; }
    .media img { max-width: 100%; border-radius: 10px; margin-top: .5rem; }
    .media video { width: 100%; max-height: 420px; margin-top: .5rem; border-radius: 10px; background: #111; }
    .thresh { font-size: .78rem; color: #6a756f; line-height: 1.5; }
  </style>
</head>
<body>
  <h1>Android 审阅包</h1>
  <p class="meta">生成于 ${esc(generatedAt)}（Europe/Berlin）· 流程 ${passCount}/${flows.length} 通过阈值</p>
  <div class="score">
    <div><strong>${overallPass ? "整体通过" : "需要修复"}</strong>模拟器质量门禁</div>
    <div><strong>≤ ${thresholds.coldStartMs}ms</strong>冷启动至可用欢迎页</div>
    <div><strong>≤ ${thresholds.jankyPctMax}%</strong>卡顿帧</div>
    <div><strong>p90 ≤ ${thresholds.p90FrameMsMax}ms</strong> · 冻结帧 = ${thresholds.frozenFramesMax}</div>
  </motionregion>
  <p class="thresh">阈值参考 Android Vitals / Core App Quality；模拟器上冷启动仅作回归对比，真机可能更快。</p>
  ${rows}
</body>
</html>`;
}

/**
 * @param {{ packDir: string, junitPath?: string, metricsDir?: string, thresholds?: typeof DEFAULT_THRESHOLDS }} opts
 */
export async function buildReviewPack(opts) {
  const packDir = opts.packDir;
  const junitPath = opts.junitPath || join(packDir, "junit.xml");
  const metricsDir = opts.metricsDir || join(packDir, "metrics-raw");
  const thresholds = { ...DEFAULT_THRESHOLDS, ...opts.thresholds };

  let junitXml = "";
  try {
    junitXml = await readFile(junitPath, "utf8");
  } catch {
    junitXml = '<?xml version="1.0"?><testsuites></testsuites>';
  }
  const junitMap = parseJUnit(junitXml);

  const rawMetrics = {};
  try {
    for (const name of await readdir(metricsDir)) {
      if (!name.endsWith(".json")) continue;
      const id = basename(name, ".json");
      rawMetrics[id] = JSON.parse(await readFile(join(metricsDir, name), "utf8"));
    }
  } catch {
    /* empty metrics dir */
  }

  const flows = FLOW_META.map(flow => {
    const junit = pickJUnitStatus(junitMap, flow);
    const metrics = rawMetrics[flow.id] || rawMetrics[flow.file] || {};
    return evaluateFlow(flow, junit, metrics, thresholds);
  });

  const generatedAt = new Date().toISOString();
  const overallPass = flows.every(f => f.pass);

  const metricsJson = {
    generatedAt,
    timezone: "Europe/Berlin",
    thresholds,
    overallPass,
    flows,
  };

  await writeFile(join(packDir, "metrics.json"), `${JSON.stringify(metricsJson, null, 2)}\n`, "utf8");
  await writeFile(join(packDir, "index.html"), buildHtml({ flows, thresholds, generatedAt, packDir }), "utf8");

  return metricsJson;
}

const isMain = process.argv[1] && process.argv[1].endsWith("summarize.mjs");
if (isMain) {
  const packDir = process.argv[2] || "android-review-pack";
  const junitPath = process.argv[3];
  await buildReviewPack({ packDir, junitPath: junitPath || join(packDir, "junit.xml") });
}