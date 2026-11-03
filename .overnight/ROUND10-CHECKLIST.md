# Batch 8 · Round 10 — 发布整理清单

- [ ] 将 `CHANGELOG.md` 的 `[Unreleased]` 并入新版本（或 owner 指定的 patch 号）并写 `.github/releases/` 若需要
- [ ] 核对 `package.json` / lock / `release-metadata.js` / `index.html` ?v= / `sw.js` / Tauri `Cargo.toml` 版本一致
- [ ] 跑 `npm test` + `npm run test:browser`（fakecloud 失败时 `pkill -f 'http.server 529'` 与 wrangler）
- [ ] 更新 `docs/SHOWCASE*` 与虚构截图（若 Unreleased 功能需展示）
- [ ] `.overnight/REPORT.md` 终稿 + PROGRESS 标记 Batch 8 完成
- [ ] `v210.css` reduced-motion 大合并仍可选留 2.2（非阻塞）
