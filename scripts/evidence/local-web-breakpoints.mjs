import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyFixture,createFictionalState,FIXTURE_DATE} from './fixture.mjs';

const out=new URL('../../docs/local-web/breakpoints/',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
const origin=process.env.LIFE_LEDGER_PREVIEW_URL||'http://127.0.0.1:43117';
async function reachable(page,selector){
 const element=page.locator(selector);
 const label=`${page.viewportSize().width}px ${await page.locator('html').getAttribute('lang')} ${await page.evaluate(()=>document.body.dataset.activeView)} ${selector}`;
 assert.ok(await element.isVisible(),`${selector} visible`);
 assert.ok(await element.evaluate(e=>{
  const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return !!hit&&(e===hit||e.contains(hit));
 }),`${label} pointer target not covered`);
 return element;
}
async function geometry(page,width){
 const g=await page.evaluate(()=>{
  const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
  return {shell:box('#appShell'),sidebar:box('#sidebar'),pane:box('.workspace-pane'),overflow:document.documentElement.scrollWidth-innerWidth};
 });
 assert.ok(g.overflow<=2,'no window overflow');
 if(width>=761){
  assert.ok(Math.abs(g.pane.y-g.shell.y)<1,'workspace must stay beside, not below, sidebar');
  assert.ok(g.pane.x>=g.sidebar.x+g.sidebar.w-1,'sidebar must not cover workspace');
  assert.ok(Math.abs(g.pane.h-g.shell.h)<1,'workspace fills available height');
 }
 return g;
}
try{
 for(const width of [760,761,800,900,979,980])for(const lang of ['zh','en','de'])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:2});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await applyFixture(page,{state:createFictionalState(),date:FIXTURE_DATE,language:lang,theme});
  await page.goto(`${origin}/?mode=local&lang=${lang}&preview=local`);await page.waitForLoadState('networkidle');
  for(const view of ['today','week','longrange','timeline','review','habits']){
   await (await reachable(page,`.nav-item[data-view="${view}"]`)).click();
   assert.equal(await page.evaluate(()=>document.body.dataset.activeView),view);
   const g=await geometry(page,width);
   for(const selector of ['#sidebarToggle','#dateNavPrev','#dateNavLabel','#dateNavNext','#addTodayWidget','#editLayoutToggle','#toolbarSearchToggle']){
    if(await page.locator(selector).isVisible())await reachable(page,selector);
   }
   results.push({width,lang,theme,view,...g});
  }
  await page.locator('.nav-item[data-view="today"]').click();
  if(width>=761){
   await (await reachable(page,'#sidebarToggle')).click();await geometry(page,width);
   await (await reachable(page,'#sidebarToggle')).click();await geometry(page,width);
   await (await reachable(page,'#editLayoutToggle')).click();
   assert.equal(await page.locator('#editLayoutToggle').getAttribute('aria-pressed'),'true');
   await (await reachable(page,'#editLayoutToggle')).click();
   assert.equal(await page.locator('#editLayoutToggle').getAttribute('aria-pressed'),'false');
  }
  await (await reachable(page,width>=761?'#sidebarAccount':'#mobileSettingsButton')).click();
  assert.ok(await page.locator('#settingsDialog').isVisible());
  await (await reachable(page,'#closeSettingsPane')).click();assert.equal(await page.locator('#settingsDialog').isVisible(),false);
  if(width===800||width===760){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:new URL(`today-${width}-${lang}-${theme}.png`,out).pathname});}
  await context.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(new URL('results.json',out),JSON.stringify({cases:results.length,checks:results,runtimeErrors:errors,isolatedFictionalData:true},null,2));
 console.log(JSON.stringify({cases:results.length,runtimeErrors:errors}));
}finally{await browser.close();}
