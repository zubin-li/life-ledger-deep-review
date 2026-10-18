import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyFixture,createFictionalState,FIXTURE_DATE} from './fixture.mjs';
const out=new URL('../../docs/local-web/today-repair/',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const origin=process.env.LIFE_LEDGER_PREVIEW_URL||'http://127.0.0.1:43117';
const browser=await chromium.launch({headless:true}),errors=[],results=[];
async function geometry(page){
 const result=await page.evaluate(()=>{
  const board=document.querySelector('#todayView'),style=getComputedStyle(board),br=board.getBoundingClientRect();
  const cols=style.gridTemplateColumns.split(' ').map(parseFloat),rows=style.gridTemplateRows.split(' ').map(parseFloat);
  const gapX=parseFloat(style.columnGap),gapY=parseFloat(style.rowGap),sum=(a,n)=>a.slice(0,n).reduce((x,y)=>x+y,0);
  const issues=[],rects=[],layout=LifeLedgerLayoutEngine.getLayout();
  for(const w of layout.widgets.filter(w=>!w.hidden)){
   const e=board.querySelector(`[data-module="${w.type}"]`),r=e.getBoundingClientRect();
   if(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)issues.push(`${w.type}: content overflow ${e.scrollWidth-e.clientWidth}/${e.scrollHeight-e.clientHeight}`);
   const contentParts='.module-title,.today-mood-heading h3,.today-focus-actions'+(w.size==='large'?'':',.today-habit-icon,.today-habit-copy,.today-habit-time');
   for(const part of e.querySelectorAll(contentParts)){
    const pr=part.getBoundingClientRect();if(!pr.width||!pr.height)continue;
    if(pr.left<r.left-2||pr.right>r.right+2||pr.top<r.top-2||pr.bottom>r.bottom+2)issues.push(`${w.type}: internal content outside card (${part.className||part.tagName})`);
   }
   if(style.display==='grid'){
    const x=br.left+parseFloat(style.paddingLeft)+sum(cols,w.x)+gapX*w.x;
    const y=br.top+parseFloat(style.paddingTop)+sum(rows,w.y)+gapY*w.y-board.scrollTop;
    if(Math.abs(r.x-x)>2||Math.abs(r.y-y)>2)issues.push(`${w.type}: stored/rendered slot mismatch`);
   }
   for(const other of rects)if(r.left<other.right-1&&r.right>other.left+1&&r.top<other.bottom-1&&r.bottom>other.top+1)issues.push(`${w.type}: overlapping card`);
   rects.push({left:r.left,right:r.right,top:r.top,bottom:r.bottom});
  }
  if(document.documentElement.scrollWidth>innerWidth+2)issues.push('window overflow');
  return {issues,cards:rects.length,display:style.display};
 });
 assert.deepEqual(result.issues,[]);return result;
}
async function settings(page,type,size){
 await page.locator(`[data-module="${type}"] .widget-configure`).click();
 assert.ok(await page.locator('#widgetSettings').isVisible());
 await page.locator('#widgetSettingsSize').selectOption(size);await page.locator('#widgetSettingsClose').click();
 await page.waitForTimeout(70);
}
try{
 for(const [width,lang,theme] of [[1440,'zh','light'],[1440,'zh','dark'],[1920,'zh','light'],[1920,'zh','dark'],[1000,'zh','light'],[980,'zh','light'],[800,'zh','light'],[800,'zh','dark'],[761,'de','dark'],[1180,'de','light'],[1440,'en','light'],[1440,'en','dark'],[1440,'de','light'],[1440,'de','dark'],[390,'zh','light'],[390,'en','light'],[390,'de','light']]){
  if(process.argv.includes('--mobile-only')&&width>=761)continue;
  if(process.argv.includes('--record-only')&&!(width===1440&&lang==='zh'&&theme==='light'))continue;
  const record=width===1440&&lang==='zh'&&theme==='light'&&!process.argv.includes('--screens-only');
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:2,...(record?{recordVideo:{dir:out.pathname,size:{width,height:1000}}}:{})});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await applyFixture(page,{state:createFictionalState(),date:FIXTURE_DATE,language:lang,theme});
  await page.goto(`${origin}/?mode=local&lang=${lang}&preview=local`);await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
  const normal=await geometry(page);
  if(width>=761){
   const composition=await page.evaluate(()=>{
    const board=document.querySelector('#todayView'),rect=type=>board.querySelector(`[data-module="${type}"]`).getBoundingClientRect();
    const hero=rect('summary'),habits=rect('habits'),mood=rect('mood'),reflection=rect('reflection'),focus=rect('focus');
    return {canvas:board.clientWidth,heroHeight:hero.height,habitsHeight:habits.height,moodHeight:mood.height,reflectionHeight:reflection.height,moodFocusStack:Math.abs(focus.top-mood.bottom-20),primaryDistance:habits.top-hero.bottom,columns:LifeLedgerLayoutEngine._smallColumns,native:document.documentElement.hasAttribute('data-desktop')};
   });
   assert.equal(composition.native,false,'Verify ordinary web, not the native-only route');
   assert.ok(composition.canvas<=1236,'Extra-wide windows cannot inflate the canvas');
   assert.ok(composition.heroHeight<=381,'Greeting must stay within the approved 380px maximum');
   assert.ok(composition.habitsHeight<=181,'Default four-habit preview is compact, not an empty tower');
   assert.ok(composition.moodHeight<=181&&composition.reflectionHeight<=181,'Short mood/reflection content must stay compact');
   if(composition.columns===4)assert.ok(composition.moodFocusStack<2,'Restore the confirmed mood/focus stack');
   if(composition.columns===6)assert.ok(composition.primaryDistance<24,'On narrow canvases daily habits directly follow the greeting');
   normal.composition=composition;
  }
  await page.screenshot({path:new URL(`today-${width}-${lang}-${theme}.png`,out).pathname});
  const describe=async(text,delay=800)=>{
   if(!record)return;
   await page.evaluate(text=>{
    let caption=document.querySelector('#recordingCaption');
    if(!caption){caption=document.createElement('div');caption.id='recordingCaption';caption.style.cssText='position:fixed;z-index:2147483647;bottom:14px;left:50%;transform:translateX(-50%);padding:9px 16px;border-radius:12px;background:#18312eee;color:white;font:500 13px/1.5 system-ui;pointer-events:none;white-space:nowrap';document.body.append(caption);}
    caption.textContent=`实际操作演示 · ${text}`;
   },text);await page.waitForTimeout(delay);
  };
  await describe('默认结构：心情／专注上下，习惯／紧凑复盘并排',1400);
  if(width>=761&&!process.argv.includes('--screens-only')){
   const normalBounds=await page.locator('#todayView > [data-module]:not([hidden])').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [e.dataset.module,r.width,r.height]}));
   await page.locator('#editLayoutToggle').click();await geometry(page);
   await describe('进入编辑模式：卡片没有被撑高',1000);
   assert.deepEqual(await page.locator('#todayView > [data-module]:not([hidden])').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [e.dataset.module,r.width,r.height]})),normalBounds,'Edit mode must preserve actual card dimensions');
   {
    for(const [type,size] of [['mood','medium'],['summary','medium'],['summary','small']]){
     const original=await page.evaluate(()=>JSON.stringify(LifeLedgerLayoutEngine.getLayout()));
     const before=await page.locator(`[data-module="${type}"]`).boundingBox();
     await describe(`${type==='mood'?'心情横向加宽':'欢迎卡切换为'} ${size==='small'?'S':'M'}：直接点击卡片尺寸按钮`,500);
     await page.locator(`[data-module="${type}"] .widget-size-btn[data-size="${size}"]`).click();
     await page.waitForTimeout(180);await geometry(page);
     await describe('尺寸与展示实际变化；当前卡片保持位置，邻居让位',1200);
     const after=await page.locator(`[data-module="${type}"]`).boundingBox();
     if(type==='mood'){assert.ok(after.width>before.width+100);assert.equal(after.height,before.height);}
     if(record)await page.screenshot({path:new URL(`${type}-${size}.png`,out).pathname});
     await page.locator('#undoLayoutButton').click();await page.waitForTimeout(100);
     await describe('撤销：恢复之前的位置、大小和布局',700);
     assert.equal(await page.evaluate(()=>JSON.stringify(LifeLedgerLayoutEngine.getLayout())),original,'Undo restores the precise confirmed composition');
    }
   }
   const sizes={};
   for(const size of ['small','medium','large','square']){
    await settings(page,'habits',size);await geometry(page);
    await describe(`习惯组件：${{small:'S 紧凑摘要',medium:'M 四项预览',large:'L 横向完整轨道',square:'大方形展示'}[size]}`,700);
    const r=await page.locator('[data-module="habits"]').boundingBox();sizes[size]={w:r.width,h:r.height};
    if(record)await page.screenshot({path:new URL(`habits-${size}.png`,out).pathname});
   }
   assert.ok(sizes.medium.w>sizes.small.w+50,'M must actually be wider than S');
   assert.ok(sizes.large.h>sizes.medium.h+50,'L must actually be taller than M');
   await settings(page,'habits','large');
   const handle=page.locator('[data-module="focus"] .widget-drag-handle');await handle.scrollIntoViewIfNeeded();
   const before=await page.locator('[data-module="focus"]').boundingBox(),h=await handle.boundingBox();
   const direction=before.x>width/2?-1:1;
   const step=await page.evaluate(()=>{const e=LifeLedgerLayoutEngine;const c=document.querySelector('[data-module="focus"]');return c.getBoundingClientRect().width+20;});
   const old=await page.evaluate(()=>LifeLedgerLayoutEngine.getLayout().widgets.find(w=>w.type==='focus'));
   await describe('用拖动手柄实际移动专注卡片',800);
   await page.mouse.move(h.x+h.width/2,h.y+h.height/2);await page.mouse.down();
   await page.mouse.move(h.x+h.width/2+step*direction,h.y+h.height/2,{steps:18});
   assert.ok(await page.locator('[data-module="focus"]').evaluate(e=>e.classList.contains('is-dragging')),'real pointer owns the card');
   await page.mouse.up();await page.waitForTimeout(280);
   await describe('释放后落在新位置，不只是改了保存数据',900);
   const moved=await page.evaluate(()=>LifeLedgerLayoutEngine.getLayout().widgets.find(w=>w.type==='focus'));
   assert.notEqual(moved.x,old.x,'drag changes the intended lane');await geometry(page);
   const after=await page.locator('[data-module="focus"]').boundingBox();assert.ok(Math.abs(after.x-before.x)>50,'card visibly moves, not just stored data');
   await page.locator('#editLayoutToggle').click();await geometry(page);
   const saved=await page.evaluate(()=>JSON.stringify(LifeLedgerLayoutEngine.getLayout()));
   await page.reload();await page.waitForLoadState('networkidle');
   await describe('完成并刷新：尺寸和位置仍然保留',1200);
   assert.equal(await page.evaluate(()=>JSON.stringify(LifeLedgerLayoutEngine.getLayout())),saved,'reload retains actual layout');await geometry(page);
   const raw=await page.evaluate(()=>localStorage.getItem('life-ledger-layout-v2'));
   await page.setViewportSize({width:width>=1180?800:1440,height:1000});await page.waitForTimeout(100);await geometry(page);
   assert.equal(await page.evaluate(()=>localStorage.getItem('life-ledger-layout-v2')),raw,'responsive reflow never overwrites stored layout');
   await page.setViewportSize({width,height:1000});await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>JSON.stringify(LifeLedgerLayoutEngine.getLayout())),saved,'returning to original width restores saved slots');await geometry(page);
   results.push({width,lang,theme,normal,sizes,realPointerDrag:true,reload:true,reflowPreservesStorage:true});
  }else results.push({width,lang,theme,normal});
  const video=record?page.video():null;await context.close();
  if(video){const original=await video.path();await video.saveAs(new URL('interaction.webm',out).pathname);if(original!==new URL('interaction.webm',out).pathname)fs.unlinkSync(original);}
  console.log(`${width} ${lang} ${theme}: passed`);
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(new URL(process.argv.includes('--mobile-only')?'mobile-results.json':process.argv.includes('--screens-only')?'screen-results.json':process.argv.includes('--record-only')?'recording-results.json':'results.json',out),JSON.stringify({results,errors,fictionalData:true,defaultLayoutNotOverridden:true,nativeAcceptance:false},null,2));
}finally{await browser.close();}
