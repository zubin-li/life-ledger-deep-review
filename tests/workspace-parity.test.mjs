import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const boot=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const desktopMode'));
function mode(search,width){const dataset={};vm.runInNewContext(boot,{URLSearchParams,location:{search},document:{documentElement:{dataset}},matchMedia:()=>({matches:width>=761})});return dataset;}
test('web and native share workspace presentation without sharing a false native identity',()=>{
 assert.equal(mode('?mode=local',1440).workspace,'true');assert.equal(mode('?mode=local',1440).desktop,undefined);
 assert.deepEqual(mode('?mode=local',390),{});
 assert.deepEqual(mode('?desktop=tauri-local',1440),{desktop:'tauri-local',workspace:'true'});
 assert.equal(mode('?desktop=tauri-cloud',1440).desktop,'tauri-cloud');
 assert.equal(mode('?desktop=not-a-runtime',1440).desktop,undefined);
});
test('web keeps its installation affordance and native settings routing remains native-only',()=>{
 const css=fs.readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
 assert.match(css,/html\[data-desktop\] \[data-install-app\] \{ display: none !important; \}/);
 assert.doesNotMatch(css,/html\[data-workspace\] \[data-install-app\]/);
 assert.match(html,/id="mobileSettingsButton"/);
 const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(app,/if \(desktopMode === "tauri-local"\) \{\s*void window\.__TAURI__\?\.core.invoke\("open_settings_window"\)/);
 const refresh=app.slice(app.indexOf('function refreshHabitViews()'),app.indexOf('function toggleHabit('));
 assert.doesNotMatch(refresh,/renderAll\(/);assert.match(refresh,/if \(view === "review"\) renderReview\(\)/);
});
