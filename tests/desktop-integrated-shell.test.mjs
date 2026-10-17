import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('integrated shell keeps native controls and scopes drag grants to the chosen window/origin',()=>{
  const rust=read('src-tauri/src/lib.rs');
  assert.match(rust,/title_bar_style\(tauri::TitleBarStyle::Overlay\)\.hidden_title\(true\)/);
  assert.match(rust,/CapabilityBuilder::new\("connected-window-chrome"\)[\s\S]*?\.local\(false\)[\s\S]*?\.window\("cloud"\)[\s\S]*?normalized.origin\(\).ascii_serialization\(\)/);
  for(const file of ['local-only.json','settings.json']){
    const cap=JSON.parse(read('src-tauri/capabilities/'+file));
    assert.ok(cap.permissions.includes('core:window:allow-start-dragging'));
    assert.ok(cap.permissions.includes('core:window:allow-internal-toggle-maximize'));
    assert.equal(cap.remote,undefined);
  }
  const html=read('public/index.html');
  assert.match(html,/id="desktopWindowbar" data-tauri-drag-region/);
  assert.doesNotMatch(html,/id="(?:windowClose|windowMinimize|windowMaximize)"/);
  assert.match(read('public/window-shell.js'),/append\(\$\('#sidebarToggle'\)\)/);
  assert.match(read('public/sw.js'),/"\.\/window-shell.js"/);
  assert.ok(JSON.parse(read('src-tauri/capabilities/settings.json')).permissions.includes('core:window:allow-close'));
  assert.match(read('public/app.js'),/const settingsWindow = window\.__TAURI__\?\.window\?\.getCurrentWindow\(\);/);
});
test('device profile stays separate from signed-in and synced records',()=>{
  const source=read('public/window-shell.js');
  assert.match(source,/life-ledger-device-profile/);
  assert.match(source,/file.size > 5\*1024\*1024/);
  assert.match(source,/canvas.width = canvas.height = 192/);
  assert.doesNotMatch(source,/saveState\(|fetch\(|innerHTML\s*=/);
});
