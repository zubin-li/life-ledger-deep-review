#!/usr/bin/env node
// A deliberately modest, non-authoritative sanity pass over every .swift file in
// src-tauri/widget/, run because no Swift/Xcode toolchain is available in this environment (no
// `swift`/`swiftc`/`xcodebuild`, and installing one is blocked — see docs/macos-widget.md).
//
// This is NOT a compiler and proves nothing about type-correctness, API availability, or
// whether the code actually builds. It only catches the crudest mechanical mistakes: unbalanced
// braces/brackets/parens, unterminated string literals, and a few structural expectations (every
// file parses as balanced, `import` statements look sane). Treat a pass here as "not obviously
// broken", never as "compiles".
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function findSwiftFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === ".build" || entry === ".swiftpm" || entry === "build") continue;
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) results.push(...findSwiftFiles(path));
    else if (entry.endsWith(".swift")) results.push(path);
  }
  return results;
}

function checkBalance(source, path) {
  const pairs = { "{": "}", "(": ")", "[": "]" };
  const closers = new Set(Object.values(pairs));
  const stack = [];
  let inString = false;
  let inLineComment = false;
  let inBlockComment = 0;
  let escaped = false;

  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    const next = source[i + 1];
    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment > 0) {
      if (c === "/" && next === "*") { inBlockComment++; i++; }
      else if (c === "*" && next === "/") { inBlockComment--; i++; }
      continue;
    }
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === "/" && next === "/") { inLineComment = true; i++; continue; }
    if (c === "/" && next === "*") { inBlockComment = 1; i++; continue; }
    if (c === '"') { inString = true; continue; }
    if (c in pairs) { stack.push(pairs[c]); continue; }
    if (closers.has(c)) {
      const expected = stack.pop();
      if (expected !== c) {
        return `${path}: mismatched '${c}' (expected '${expected ?? "nothing"}') near byte ${i}`;
      }
    }
  }
  if (inString) return `${path}: unterminated string literal`;
  if (inBlockComment > 0) return `${path}: unterminated block comment`;
  if (stack.length > 0) return `${path}: unclosed '${stack[stack.length - 1] === "}" ? "{" : stack[stack.length - 1] === ")" ? "(" : "["}' at end of file`;
  return null;
}

const root = new URL("../src-tauri/widget", import.meta.url).pathname;
const files = findSwiftFiles(root);
if (files.length === 0) {
  console.error("swift-static-sanity-check: no .swift files found under src-tauri/widget");
  process.exit(1);
}

let failed = false;
for (const path of files) {
  const source = readFileSync(path, "utf8");
  if (!/^import\s+\w+/m.test(source)) {
    console.error(`FAIL ${path}: no top-level 'import' statement found`);
    failed = true;
    continue;
  }
  const error = checkBalance(source, path);
  if (error) {
    console.error(`FAIL ${error}`);
    failed = true;
  } else {
    console.log(`ok   ${path}`);
  }
}

console.log(`\n${files.length} Swift file(s) checked for balance only — this is not a compiler.`);
process.exit(failed ? 1 : 0);
