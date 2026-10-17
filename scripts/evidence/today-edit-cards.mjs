import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { startStaticServer } from './server.mjs';
import { applyFixture, createFictionalState } from './fixture.mjs';

const root=new URL('../../',import.meta.url).pathname;
const output=path.join(root,'docs/today-widgets/edit-cards');
fs.mkdirSync(output,{recursive:true});
const date='2026-10-24', state=createFictionalState(date);
state.habits=Array.from({length:8},(_,i)=>({...structuredClone(state.habits[i%4]),id:`demo-${i}`,name:['阅读','散步','写作','睡眠','冥想','饮水','语言','运动'][i],icon:['book','running','pen','bed','brain','droplets','sunrise','dumbbell'][i]}));
for(let i=1;i<=24;i++)state.logs[`2026-10-${String(i).padStart(2,'0')}`]={completed:state.habits.slice(0,i%9).map(h=>h.id),mood:'很好',note:''};
const forecast={current:{time:`${date}T10:30`,weather_code:1},hourly:{time:Array.from({length:48},(_,i)=>new Date(Date.UTC(2026,9,24,i)).toISOString().slice(0,16)),temperature_2m:Array.from({length:48},(_,i)=>14+i%8),precipitation_probability:Array.from({length:48},(_,i)=>i===14?85:0),precipitation:Array.from({length:48},(_,i)=>i===14?1.5:0),snowfall:Array(48).fill(0),weather_code:Array.from({length:48},(_,i)=>i===14?61:1)}};
const positions={summary:['large',0,0],mood:['small',8,0],focus:['small',8,1],habits:['medium',0,2],heatmap:['small',8,2],weather:['medium',0,3],wall:['large',0,4,'square'],reflection:['small',8,4]};
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});}
async function prepare(page,language,theme){
  await applyFixture(page,{date,theme,language,state});
  await page.addInitScript(()=>localStorage.setItem('life-ledger-weather-city',JSON.stringify({name:'Berlin',latitude:52.52,longitude:13.41})));
  await page.route('https://api.open-meteo.com/**',r=>r.fulfill({json:forecast}));
  await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=${language}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(positions=>{const e=window.LifeLedgerLayoutEngine,l=e.getLayout();for(const w of l.widgets){const p=positions[w.type];w.hidden=!p;if(p)Object.assign(w,{size:p[0],x:p[1],y:p[2],settings:{...w.settings,shape:p[3]||'wide'}});}e.setLayout(l);},positions);
  await settle(page);
  assert.equal(await page.locator('.heatmap-day').count(),31);
}
const server=await startStaticServer(path.join(root,'public')), browser=await chromium.launch({headless:true});
try{
  for(const language of ['zh','en','de'])for(const theme of ['light','dark']){
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    await prepare(page,language,theme);
    await page.screenshot({path:path.join(output,`normal-${language}-${theme}.png`)});
    await page.locator('#editLayoutToggle').click();
    await page.locator('[data-module="heatmap"] .module-title').click();await settle(page);
    await page.screenshot({path:path.join(output,`settings-${language}-${theme}.png`)});
    await page.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:output,size:{width:1440,height:1000}}});
  const page=await context.newPage();await prepare(page,'zh','light');
  // Video-only annotations, not product UI. Actual interactions use the real controls.
  await page.evaluate(()=>{
    const caption=document.createElement('div');caption.id='demoCaption';caption.style.cssText='position:fixed;z-index:2147483647;bottom:18px;left:50%;transform:translateX(-50%);padding:12px 22px;border-radius:16px;background:#142b3be8;color:white;pointer-events:none;font:500 15px/1.5 system-ui;box-shadow:0 8px 30px #1233;white-space:nowrap';document.body.append(caption);
    const pointer=document.createElement('div');pointer.id='demoPointer';pointer.style.cssText='position:fixed;z-index:2147483647;width:22px;height:22px;border:2px solid #168be2;background:#168be21a;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);left:0;top:0';document.body.append(pointer);
    document.addEventListener('mousemove',e=>{pointer.style.left=`${e.clientX}px`;pointer.style.top=`${e.clientY}px`;});
  });
  async function caption(text,delay=1200){await page.locator('#demoCaption').evaluate((e,text)=>e.textContent=`演示说明 · ${text}`,text);await page.waitForTimeout(delay);}
  async function click(locator){await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2,{steps:16});await page.waitForTimeout(250);await page.mouse.click(r.x+r.width/2,r.y+r.height/2);await settle(page);}
  await caption('普通模式：卡片固定，月度热力图不放设置按钮',2000);
  const before=await page.evaluate(()=>JSON.stringify(window.LifeLedgerLayoutEngine.getLayout()));
  await click(page.locator('[data-module="heatmap"] .module-title'));
  assert.equal(await page.locator('#widgetSettings').isVisible(),false);
  await caption('进入「编辑卡片」，才可以拖动和配置');await click(page.locator('#editLayoutToggle'));
  await page.screenshot({path:path.join(output,'editing-zh-light.png')});
  await caption('点按热力图 → 只显示这张卡片的设置');await click(page.locator('[data-module="heatmap"] .module-title'));
  await caption('翡翠绿、海洋蓝、红到蓝，统一在设置里选择');
  await page.locator('#heatmapPalette').selectOption('blue');
  await page.screenshot({path:path.join(output,'settings-blue-zh-light.png')});await page.waitForTimeout(1500);
  await caption('切换为 M：外框变宽，仍显示完整的 31 天');await page.locator('#widgetSettingsSize').selectOption('medium');
  await click(page.locator('#widgetSettingsClose'));
  await page.locator('[data-module="heatmap"]').scrollIntoViewIfNeeded();await caption('配色和尺寸已自动保存',1700);
  await click(page.locator('[data-module="heatmap"] .module-title'));await page.locator('#widgetSettingsSize').selectOption('small');await click(page.locator('#widgetSettingsClose'));
  await caption('撤销尺寸试验，回到原排版；海洋蓝设置保留');
  await click(page.locator('#undoLayoutButton'));await click(page.locator('#undoLayoutButton'));
  await caption('仅编辑模式可拖动：把热力图拖到天气旁的空位');
  const slotBefore=await page.evaluate(()=>{const w=window.LifeLedgerLayoutEngine.getLayout().widgets.find(w=>w.type==='heatmap');return {x:w.x,y:w.y};});
  const dragDistance=await page.evaluate(()=>{const e=window.LifeLedgerLayoutEngine,w=e.getLayout().widgets.find(w=>w.type==='heatmap'),m=e._measureGridMetrics();return (m.rowStarts[w.y+1]-m.rowStarts[w.y]||m.rowTracks[w.y]+m.rowGap)+4;});
  const handle=page.locator('[data-module="heatmap"] .widget-drag-handle');await handle.scrollIntoViewIfNeeded();const box=await handle.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:16});await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+box.height/2+dragDistance,{steps:32});await page.mouse.up();await settle(page);
  const moved=await page.evaluate(()=>JSON.stringify(window.LifeLedgerLayoutEngine.getLayout()));assert.notEqual(moved,before);
  const slotAfter=await page.evaluate(()=>{const w=window.LifeLedgerLayoutEngine.getLayout().widgets.find(w=>w.type==='heatmap');return {x:w.x,y:w.y};});assert.notDeepEqual(slotAfter,slotBefore,'Real pointer drag must change the persisted heatmap slot');
  await caption('点击「完成」：收起设置，卡片重新固定');await click(page.locator('#editLayoutToggle'));
  await page.locator('#todayView').evaluate(e=>e.scrollTop=0);await settle(page);
  assert.equal(await page.locator('#addTodayWidget').isVisible(),false);
  await page.screenshot({path:path.join(output,'final-zh-light.png')});await caption('设置已保存；普通模式继续打卡、看天气和记录',2200);
  const video=page.video();await context.close();const original=await video.path();await video.saveAs(path.join(output,'edit-cards.webm'));if(original!==path.join(output,'edit-cards.webm'))fs.unlinkSync(original);
  console.log(JSON.stringify({screenshots:15,video:'docs/today-widgets/edit-cards/edit-cards.webm',fictionalData:true,mockedWeather:true}));
}finally{await browser.close();await server.close();}
