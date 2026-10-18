import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {startStaticServer} from './server.mjs';
import {applyFixture,createFictionalState} from './fixture.mjs';
const root=new URL('../../',import.meta.url).pathname,out=path.join(root,'docs/integrated-shell');
fs.mkdirSync(out,{recursive:true});
const server=await startStaticServer(path.join(root,'public')),browser=await chromium.launch({headless:true});
const checks=[],errors=[];
const views=['today','week','longrange','timeline','review','habits'];
function fixture(){const state=createFictionalState();state.planning={currentPhaseId:'phase-autumn',note:'Leave space for the ideas that matter.',phases:[{id:'phase-autumn',name:'给重要的事留出空间 · A steadier rhythm',focus:'健康、阅读，和一个值得完成的小作品。',startDate:'2026-10-01',endDate:'2026-12-31',status:'active',events:[],updatedAt:1}]};return state;}
async function open(p,lang='zh',theme='light',width=1440,desktop='tauri-local',extra=''){
 p.on('pageerror',e=>errors.push(e.message));
 await applyFixture(p,{language:lang,theme,state:fixture()});
 await p.goto(`${server.url}/index.html?mode=local&${width>700?`desktop=${desktop}&`:''}lang=${lang}${extra}`);
 await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);
}
async function bounds(p,label,desktop=true){
 const result=await p.evaluate(()=>{const shell=document.querySelector('#appShell'),bar=document.querySelector('#desktopWindowbar'),view=document.querySelector('.view.active');return {shell:{top:shell.getBoundingClientRect().top,bottom:shell.getBoundingClientRect().bottom,width:shell.clientWidth,scroll:shell.scrollWidth},bar:{top:bar.getBoundingClientRect().top,height:bar.getBoundingClientRect().height},overflow:view.scrollWidth-view.clientWidth,viewport:innerHeight,toggleParent:document.querySelector('#sidebarToggle').parentElement.id};});
 assert.ok(result.shell.scroll<=result.shell.width+2,label+' shell overflow');assert.ok(result.overflow<=2,label+' page overflow');
 if(desktop){assert.equal(result.bar.top,0);assert.equal(result.bar.height,52);assert.equal(result.shell.top,52);assert.ok(Math.abs(result.shell.bottom-(result.viewport-8))<2);assert.equal(result.toggleParent,'windowSidebarControl');}
 else assert.equal(result.bar.height,0);
 checks.push({label,...result});
}
const shot=async(p,name)=>{await p.waitForTimeout(140);await p.screenshot({path:path.join(out,name+'.png')});};
try {
 for(const lang of ['zh','en','de'])for(const theme of ['light','dark']){
  const p=await browser.newPage({viewport:{width:1440,height:1000}});await open(p,lang,theme);
  for(const view of views){await p.locator(`.nav-item[data-view="${view}"]`).click();await bounds(p,`${view}-${lang}-${theme}`);await shot(p,`${view}-${lang}-${theme}`);}
  await p.locator('#sidebarToggle').click();assert.equal(await p.locator('#sidebarToggle').getAttribute('aria-expanded'),'false');await bounds(p,`collapsed-${lang}-${theme}`);await shot(p,`collapsed-${lang}-${theme}`);await p.locator('#sidebarToggle').click();await p.close();
 }
 for(const width of [980,390])for(const lang of width===390?['zh','en','de']:['de']){
  const p=await browser.newPage({viewport:{width,height:900}});await open(p,lang,'dark',width);
  for(const view of views){await p.locator(`.nav-item[data-view="${view}"]`).click();await bounds(p,`${view}-${width}-${lang}`,width>700);}
  await shot(p,`habits-${width}-${lang}`);
  if(width===390){
    await p.evaluate(()=>{googleCalendarEvents.set('fictional-event',{id:'fictional-event',date:'2026-10-02',start:'12:00',end:'13:00',title:'A long fictional calendar title that must wrap without creating horizontal scrolling on a narrow screen',calendarName:'Fictional calendar'});openDayPlanDialog();});
    assert.equal(await p.locator('#dayPlanTimeline .day-schedule-event').count(),1);
    const overflow=await p.locator('#dayPlanDialog, .day-plan-dialog-body, #dayPlanTimeline, #dayPlanTimeline .day-schedule-event').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.id||e.className));
    assert.deepEqual(overflow,[],lang+': real mobile schedule wraps without horizontal overflow');await shot(p,`day-plan-390-${lang}`);
  }
  await p.close();
 }
 const testContext=await browser.newContext({viewport:{width:1440,height:1000}}),p=await testContext.newPage();await open(p);
 await p.evaluate(()=>{window.__nativeCalls=[];window.__TAURI__={core:{invoke:async c=>window.__nativeCalls.push(c)}};});
 await p.locator('#sidebarAccount').click();assert.deepEqual(await p.evaluate(()=>window.__nativeCalls),['open_settings_window']);
 // The real settings route, not an invented dialog, owns the profile controls locally.
 await p.goto(`${server.url}/index.html?mode=local&desktop=tauri-local&lang=zh&settings=1`);await p.waitForLoadState('networkidle');assert.equal(await p.locator('#settingsPane').isVisible(),true);assert.equal(await p.locator('#desktopWindowbar').isVisible(),true);assert.equal(await p.locator('#sidebarToggle').isVisible(),false);await shot(p,'settings-native-route-zh');
 await p.locator('#profileDisplayName').fill('晨光空间');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('life-ledger-device-profile')).name),'晨光空间');
 const picture=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=20;const ctx=c.getContext('2d');ctx.fillStyle='#77cbb6';ctx.fillRect(0,0,20,20);return c.toDataURL('image/png').split(',')[1];});
 await p.locator('#profilePhotoFile').setInputFiles({name:'fictional-avatar.png',mimeType:'image/png',buffer:Buffer.from(picture,'base64')});await p.waitForFunction(()=>!!JSON.parse(localStorage.getItem('life-ledger-device-profile')).avatar);assert.equal(await p.locator('#settingsAvatar img').count(),1);const avatar=await p.evaluate(()=>JSON.parse(localStorage.getItem('life-ledger-device-profile')).avatar);
 await p.locator('#profilePhotoFile').setInputFiles({name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('life-ledger-device-profile')).avatar),avatar);assert.ok(await p.locator('#profileFeedback').textContent());
 await p.reload();await p.waitForLoadState('networkidle');assert.equal(await p.locator('#profileDisplayName').inputValue(),'晨光空间');assert.equal(await p.locator('#settingsAvatar img').count(),1);await p.locator('#profileRemovePhoto').click();assert.equal(await p.locator('#settingsAvatar img').count(),0);
 // Same-origin settings-window propagation, without touching the user's browser/profile.
 const sibling=await p.context().newPage();await sibling.goto(`${server.url}/index.html?mode=local&desktop=tauri-local&lang=zh`);await sibling.waitForLoadState('networkidle');await p.locator('#profileDisplayName').fill('新的空间');await sibling.waitForFunction(()=>document.querySelector('#sidebarProfileName').textContent==='新的空间');
 await p.evaluate(()=>{window.__settingsClosed=false;window.__TAURI__={window:{getCurrentWindow:()=>({close:async()=>{window.__settingsClosed=true;}})}};});await p.locator('#closeSettingsPane').click();assert.equal(await p.evaluate(()=>window.__settingsClosed),true,'Standalone Settings close hands off to native close, not an unrelated dialog');await testContext.close();
 const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out,size:{width:1440,height:1000}}}),videoPage=await context.newPage();await open(videoPage,'zh','light',1440,'tauri-cloud');
 await shot(videoPage,'connected-zh-light');await videoPage.waitForTimeout(1300);await videoPage.locator('#sidebarToggle').click();await videoPage.waitForTimeout(1200);await videoPage.locator('.nav-item[data-view="week"]').click();await videoPage.waitForTimeout(1500);await videoPage.locator('#sidebarToggle').click();await videoPage.locator('#sidebarAccount').click();await videoPage.locator('#profileDisplayName').fill('我的生活手账');await videoPage.waitForTimeout(1600);await shot(videoPage,'profile-zh-light');await videoPage.locator('#themeSelect').selectOption('dark');await videoPage.waitForTimeout(1200);await shot(videoPage,'profile-zh-dark');await videoPage.locator('#closeSettingsPane').click();await videoPage.locator('.nav-item[data-view="longrange"]').click();await videoPage.waitForTimeout(1600);await shot(videoPage,'connected-horizon-zh-dark');
 const video=videoPage.video();await context.close();const original=await video.path();await video.saveAs(path.join(out,'integrated-shell.webm'));if(original!==path.join(out,'integrated-shell.webm'))fs.unlinkSync(original);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,profile:'name/photo persistence, invalid-image rejection, removal, settings-window propagation passed',localSettingsHandoff:'passed',runtimeErrors:errors,nativeControls:'OS-owned; not rendered or tested by Chromium',nativeWebKit:false},null,2));console.log(JSON.stringify({checks:checks.length,profile:'passed',runtimeErrors:errors}));
} finally {await browser.close();await server.close();}
