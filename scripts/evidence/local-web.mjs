import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {applyFixture,createFictionalState,FIXTURE_DATE} from './fixture.mjs';
const out=new URL('../../docs/local-web/',import.meta.url).pathname;
fs.mkdirSync(out,{recursive:true});
const origin=process.env.LIFE_LEDGER_PREVIEW_URL||'http://127.0.0.1:43117';
const browser=await chromium.launch({headless:true}),errors=[],checks=[];
const views=['today','week','longrange','timeline','review','habits'];
function fixture(){const s=createFictionalState();s.planning={currentPhaseId:'autumn',note:'先记录，再慢慢整理。',phases:[{id:'autumn',name:'给重要的事留出空间',focus:'规律散步，认真读书，完成一个小作品。',startDate:'2026-10-01',endDate:'2026-12-31',status:'active',events:[],updatedAt:1}]};return s;}
async function open(page,lang='zh',theme='light',native=false){
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__previousLedger=localStorage.getItem('life-ledger-v1');});
 await applyFixture(page,{state:fixture(),date:FIXTURE_DATE,language:lang,theme});
 await page.addInitScript(()=>{if(window.__previousLedger)localStorage.setItem('life-ledger-v1',window.__previousLedger);});
 await page.goto(`${origin}/?mode=local&lang=${lang}&preview=local${native?'&desktop=tauri-local':''}`);await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
}
async function bounds(page,label){
 const result=await page.evaluate(()=>{const root=document.documentElement,view=document.querySelector('.view.active'),shell=document.querySelector('#appShell');return{native:root.hasAttribute('data-desktop'),workspace:root.hasAttribute('data-workspace'),overflow:view.scrollWidth-view.clientWidth,bodyOverflow:root.scrollWidth-innerWidth,shellTop:shell.getBoundingClientRect().top,view:document.body.dataset.activeView};});
 assert.equal(result.native,false,label+': web must not pretend to be Tauri');assert.equal(result.workspace,page.viewportSize().width>=761,label+': shared layout breakpoint');assert.ok(result.overflow<=2,label+': page horizontal overflow');assert.ok(result.bodyOverflow<=2,label+': window overflow');assert.equal(await page.locator('#desktopWindowbar').isVisible(),false);checks.push({label,...result});
 if(result.workspace)assert.ok(await page.evaluate(()=>Math.abs(document.querySelector('.workspace-pane').getBoundingClientRect().top-document.querySelector('#appShell').getBoundingClientRect().top)<1),label+': workspace must not stack below sidebar');
}
const shot=async(p,name)=>{await p.waitForTimeout(130);await p.screenshot({path:path.join(out,name+'.png')});};
try {
 if(!process.argv.includes('--interactions-only')) {
 for(const lang of ['zh','en','de'])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2});await open(page,lang,theme);
  for(const view of views){await page.locator(`.nav-item[data-view="${view}"]`).click();await bounds(page,`${view}-${lang}-${theme}`);if(lang==='zh'||view==='today')await shot(page,`${view}-${lang}-${theme}`);}
  await page.close();
 }
 for(const width of [761,800,900,979,980,390,320])for(const lang of ['zh','en','de']){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:2});await open(page,lang,'dark');
  for(const view of views){await page.locator(`.nav-item[data-view="${view}"]`).click();await bounds(page,`${view}-${width}-${lang}`);}
  await shot(page,`habits-${width}-${lang}`);
  if(width<761){await page.locator('#mobileSettingsButton').click();assert.equal(await page.locator('#settingsDialog').isVisible(),true);const size=await page.locator('#mobileSettingsButton').boundingBox();assert.ok(size.width>=44&&size.height>=44);await page.locator('#closeSettingsPane').click();}
  await page.close();
 }
 }
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2}),page=await context.newPage();await open(page);
 const webStyle=await page.locator('[data-module="summary"]').evaluate(e=>{const s=getComputedStyle(e);return{background:s.backgroundImage,radius:s.borderRadius,color:s.color};});
 const native=await context.newPage();await open(native,'zh','light',true);const nativeStyle=await native.locator('[data-module="summary"]').evaluate(e=>{const s=getComputedStyle(e);return{background:s.backgroundImage,radius:s.borderRadius,color:s.color};});assert.deepEqual(webStyle,nativeStyle,'Web/App share the exact card styling');assert.equal(await native.locator('#desktopWindowbar').isVisible(),true);await native.close();
 // Track actual DOM retention: a Today click must not rebuild inactive analytics/editor.
 await page.evaluate(()=>{window.__keptInsight=document.querySelector('#reviewView .insight-metrics');window.__keptEditor=document.querySelector('#habitInspectorForm');window.__hiddenRenders=0;const review=renderReview,habits=renderHabitSettings;window.renderReview=(...a)=>{window.__hiddenRenders++;return review(...a);};window.renderHabitSettings=(...a)=>{window.__hiddenRenders++;return habits(...a);};});
 const check=page.locator('#todayHabitList .today-habit-check').first(),id=await check.locator('..').getAttribute('data-id');await check.click();
 assert.equal(await page.evaluate(id=>state.logs['2026-10-02'].completed.includes(id),id),true);assert.equal(await page.evaluate(()=>window.__keptInsight.isConnected&&window.__keptEditor.isConnected),true,'Inactive content retained');assert.equal(await page.evaluate(()=>document.activeElement.closest('.today-habit-row')?.dataset.id),id,'Pointer completion focus retained');
 const last=await page.locator('#todayCompletedList .today-habit-row').last().getAttribute('data-id');assert.equal(last,id,'Completed icon moves to the logical end of the horizontal rail');
 assert.equal(await page.evaluate(()=>window.__hiddenRenders),0,'Today click does not rerender inactive insights or habit editor');
 await page.locator('#homeDayNote').fill('本地网页的记录，刷新之后仍然在。');await page.locator('#homeDayNote').blur();await page.reload();await page.waitForLoadState('networkidle');assert.equal(await page.locator('#homeDayNote').inputValue(),'本地网页的记录，刷新之后仍然在。');assert.equal(await page.evaluate(id=>state.logs['2026-10-02'].completed.includes(id),id),true);
 await page.locator('#editLayoutToggle').click();await page.locator('[data-module="habits"] .module-title').click();await page.locator('#widgetSettingsSize').selectOption('medium');await page.locator('#widgetSettingsClose').click();await shot(page,'habits-medium-zh');
 const card=page.locator('[data-module="habits"]');assert.equal(await card.getAttribute('data-widget-size'),'medium');assert.ok(await card.locator('.today-habit-icon svg').count()>0,'Original SVG icons retained');
 await page.locator('[data-module="focus"] .widget-drag-handle').scrollIntoViewIfNeeded();const handle=await page.locator('[data-module="focus"] .widget-drag-handle').boundingBox(),before=await page.evaluate(()=>JSON.stringify(LifeLedgerLayoutEngine.getLayout().widgets.find(w=>w.type==='focus')));
 await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2+220,handle.y+handle.height/2+210,{steps:20});await page.mouse.up();await page.waitForTimeout(350);assert.notEqual(await page.evaluate(()=>JSON.stringify(LifeLedgerLayoutEngine.getLayout().widgets.find(w=>w.type==='focus'))),before,'Real web pointer drag changes layout');
 const savedLayout=await page.evaluate(()=>JSON.stringify(LifeLedgerLayoutEngine.getLayout()));await page.locator('#editLayoutToggle').click();await page.reload();await page.waitForLoadState('networkidle');assert.equal(await page.evaluate(()=>JSON.stringify(LifeLedgerLayoutEngine.getLayout())),savedLayout,'Web layout persists after reload');
 await page.locator('#sidebarAccount').click();assert.equal(await page.locator('#settingsDialog').isVisible(),true);assert.equal(await page.locator('#desktopModeBadge').isVisible(),false);await page.locator('#profileDisplayName').fill('我的生活手账');await page.locator('#themeSelect').selectOption('dark');await shot(page,'settings-zh-dark');await page.locator('#closeSettingsPane').click();assert.equal(await page.locator('#settingsDialog').isVisible(),false);
 // Crossing the responsive boundary must preserve an unsaved habit-editor draft.
 await page.locator('.nav-item[data-view="habits"]').click();await page.locator('#habitInspectorForm [name="name"]').fill('尚未提交的编辑');await page.setViewportSize({width:390,height:900});await page.waitForTimeout(150);assert.equal(await page.locator('#habitInspectorForm [name="name"]').inputValue(),'尚未提交的编辑');await bounds(page,'live-resize-mobile');await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(150);assert.equal(await page.locator('#habitInspectorForm [name="name"]').inputValue(),'尚未提交的编辑');await bounds(page,'live-resize-desktop');
 assert.equal(await page.evaluate(async()=> (await navigator.serviceWorker.getRegistrations()).length),0,'Dedicated preview does not retain a stale service worker');await context.close();
 // Short recording of the actual interactive page, not a screenshot-gallery animation.
 const recording=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out,size:{width:1440,height:1000}}}),p=await recording.newPage();await open(p);await p.waitForTimeout(900);await p.locator('#todayHabitList .today-habit-check').first().click();await p.waitForTimeout(1100);await p.locator('#editLayoutToggle').click();await p.locator('[data-module="habits"] .module-title').click();await p.locator('#widgetSettingsSize').selectOption('medium');await p.waitForTimeout(1300);await p.locator('#widgetSettingsClose').click();await p.locator('#editLayoutToggle').click();await p.locator('.nav-item[data-view="week"]').click();await p.waitForTimeout(1100);await p.locator('.nav-item[data-view="longrange"]').click();await p.waitForTimeout(1100);await p.locator('#sidebarAccount').click();await p.locator('#themeSelect').selectOption('dark');await p.waitForTimeout(1100);await p.locator('#closeSettingsPane').click();await p.locator('.nav-item[data-view="timeline"]').click();await p.waitForTimeout(1100);
 const video=p.video();await recording.close();const original=await video.path();await video.saveAs(path.join(out,'local-web.webm'));if(original!==path.join(out,'local-web.webm'))fs.unlinkSync(original);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,interactions:'passed',sharedCardStyles:'identical',runtimeErrors:errors,deviceScaleFactor:2,fixture:'Fictional data in isolated headless contexts; user browser/storage untouched',nativeAcceptance:false},null,2));console.log(JSON.stringify({layouts:checks.length,interactions:'passed',runtimeErrors:errors}));
}finally{await browser.close();}
