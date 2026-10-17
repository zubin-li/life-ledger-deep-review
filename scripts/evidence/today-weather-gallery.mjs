import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {startStaticServer} from './server.mjs';
import {applyFixture,createFictionalState} from './fixture.mjs';
const root=new URL('../../',import.meta.url).pathname,out=path.join(root,'docs/today-widgets/weather-gallery');
fs.mkdirSync(out,{recursive:true});
const date='2026-10-24',state=createFictionalState(date);
for(let i=1;i<=24;i++)state.logs[`2026-10-${String(i).padStart(2,'0')}`]={completed:state.habits.slice(0,i%5).map(h=>h.id),mood:'很好',note:''};
const temps=[11,10,9,9,9,10,11,12,14,16,18,20,21,22,21,20,19,18,17,16,15,14,13,12];
const forecast={current:{time:`${date}T10:30`,temperature_2m:18,weather_code:1},timezone:'Europe/Berlin',hourly:{time:Array.from({length:48},(_,i)=>new Date(Date.UTC(2026,9,24,i)).toISOString().slice(0,16)),temperature_2m:Array.from({length:48},(_,i)=>temps[i%24]),precipitation_probability:Array.from({length:48},(_,i)=>i===18?75:5),precipitation:Array.from({length:48},(_,i)=>i===18?1.5:0),snowfall:Array(48).fill(0),weather_code:Array.from({length:48},(_,i)=>i===18?61:1)}};
const positions={summary:['large',0,0],mood:['small',8,0],focus:['small',8,1],weather:['large',0,2],heatmap:['small',8,2],context:['small',8,3],habits:['medium',0,4],reflection:['small',8,4],photos:['medium',0,5],calendar:['large',0,6]};
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});}
async function open(page,language,theme){
  await applyFixture(page,{date,state,theme,language});
  await page.addInitScript(()=>localStorage.setItem('life-ledger-weather-city',JSON.stringify({name:'Berlin',latitude:52.52,longitude:13.41})));
  await page.route('https://api.open-meteo.com/**',r=>r.fulfill({json:forecast}));
  await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=${language}`);await page.waitForLoadState('networkidle');
  await page.evaluate(positions=>{const e=window.LifeLedgerLayoutEngine,l=e.getLayout();for(const w of l.widgets){const p=positions[w.type];w.hidden=!p;if(p)Object.assign(w,{size:p[0],x:p[1],y:p[2],settings:{...w.settings,shape:'wide'}});}e.setLayout(l);},positions);
  await page.waitForFunction(()=>document.querySelector('#weatherPlot canvas'));await settle(page);
  assert.equal(await page.locator('#heroWeather').textContent(),'☀ 18° · Berlin');
}
const server=await startStaticServer(path.join(root,'public')),browser=await chromium.launch({headless:true});
try{
  for(const lang of ['zh','en','de'])for(const theme of ['light','dark']){
    const page=await browser.newPage({viewport:{width:1440,height:1000}});await open(page,lang,theme);
    await page.screenshot({path:path.join(out,`today-${lang}-${theme}.png`)});
    await page.locator('[data-module="weather"]').screenshot({path:path.join(out,`weather-${lang}-${theme}.png`)});
    await page.locator('#editLayoutToggle').click();await page.locator('#addTodayWidget').click();await settle(page);
    await page.screenshot({path:path.join(out,`gallery-${lang}-${theme}.png`)});await page.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:out,size:{width:1440,height:1000}}});
  const page=await context.newPage();await open(page,'zh','light');
  await page.evaluate(()=>{
    const caption=document.createElement('div');caption.id='demoCaption';caption.style.cssText='position:fixed;z-index:2147483647;bottom:16px;left:50%;transform:translateX(-50%);background:#18344aea;color:white;padding:11px 20px;border-radius:14px;pointer-events:none;font:500 14px/1.5 system-ui;white-space:nowrap';document.body.append(caption);
    const pointer=document.createElement('div');pointer.style.cssText='position:fixed;width:18px;height:18px;border:2px solid #259fea;border-radius:50%;pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%)';document.body.append(pointer);document.addEventListener('mousemove',e=>{pointer.style.left=`${e.clientX}px`;pointer.style.top=`${e.clientY}px`;});
  });
  const caption=async(text,wait=1300)=>{await page.locator('#demoCaption').evaluate((e,text)=>e.textContent=`演示说明 · ${text}`,text);await page.waitForTimeout(wait);};
  async function click(locator){await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2,{steps:12});await page.mouse.click(r.x+r.width/2,r.y+r.height/2);await settle(page);}
  await caption('欢迎卡显示当前天气；天气组件展示今日温度曲线',1800);
  await caption('沿时间轴移动：蓝点、小时和温度跟随鼠标');
  const chart=page.locator('#weatherPlot .u-over'),rect=await chart.boundingBox();
  const hero=await page.locator('#heroWeather').textContent();
  await page.mouse.move(rect.x+rect.width*.10,rect.y+rect.height*.45,{steps:16});await page.waitForTimeout(600);
  const first=await page.locator('#weatherPlot').getAttribute('data-hour');
  await page.mouse.move(rect.x+rect.width*.72,rect.y+rect.height*.45,{steps:60});await page.waitForTimeout(800);
  assert.notEqual(await page.locator('#weatherPlot').getAttribute('data-hour'),first,'Real pointer movement changes the forecast readout');
  assert.equal(await page.locator('#heroWeather').textContent(),hero,'Current weather remains unchanged');
  await page.screenshot({path:path.join(out,'weather-hover-zh.png')});
  await caption('进入编辑卡片，再从组件库选择需要的内容');await click(page.locator('#editLayoutToggle'));await click(page.locator('#addTodayWidget'));
  await caption('所有现有组件都在这里；未添加项不会占据画布');await page.waitForTimeout(1000);
  await click(page.locator('[data-add-widget="today-wall"]'));
  assert.equal(await page.locator('[data-add-widget="today-wall"]').isDisabled(),true);
  await caption('添加照片墙：已有组件位置保留，新组件自动找空位');await click(page.locator('#widgetGalleryClose'));
  assert.equal(await page.locator('[data-module="wall"]').isVisible(),true);
  await page.waitForTimeout(1300);await click(page.locator('#editLayoutToggle'));
  await page.locator('#todayView').evaluate(e=>e.scrollTop=0);await settle(page);
  await caption('完成：卡片固定；添加和配置入口收起',1800);
  const video=page.video();await context.close();const original=await video.path();await video.saveAs(path.join(out,'weather-gallery.webm'));if(original!==path.join(out,'weather-gallery.webm'))fs.unlinkSync(original);
  console.log(JSON.stringify({screenshots:19,video:'weather-gallery.webm',fictionalData:true,weather:'mocked',pointerAndGalleryAssertions:'passed'}));
}finally{await browser.close();await server.close();}
