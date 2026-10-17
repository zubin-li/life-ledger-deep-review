import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { startStaticServer } from './server.mjs';
import { applyFixture, createFictionalState, FIXTURE_DATE } from './fixture.mjs';

const root=new URL('../../',import.meta.url).pathname, output=path.join(root,'docs/today-widgets');
fs.mkdirSync(output,{recursive:true});
const state=createFictionalState(FIXTURE_DATE);
state.habits=Array.from({length:8},(_,i)=>({...structuredClone(state.habits[i%4]),id:`example-${i}`,name:['Reading','Walking','Writing','Sleep','Meditation','Hydration','Language','Strength'][i],icon:['book','running','pen','bed','brain','droplets','sunrise','dumbbell'][i]}));
for(let i=0;i<84;i++){const date=new Date(Date.UTC(2026,9,2-i)).toISOString().slice(0,10);state.logs[date]={completed:state.habits.slice(0,i%9).map(h=>h.id),mood:'很好',note:''};}
const forecast={current:{time:'2026-10-02T10:30',weather_code:1},hourly:{time:Array.from({length:48},(_,i)=>new Date(Date.UTC(2026,9,2,i)).toISOString().slice(0,16)),temperature_2m:Array.from({length:48},(_,i)=>14+i%8),precipitation_probability:Array.from({length:48},(_,i)=>i===14?85:0),precipitation:Array.from({length:48},(_,i)=>i===14?1.5:0),snowfall:Array(48).fill(0),weather_code:Array.from({length:48},(_,i)=>i===14?61:1)}};
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});}
async function arrange(page,positions){await page.evaluate(positions=>{const e=window.LifeLedgerLayoutEngine,l=e.getLayout();for(const w of l.widgets){const p=positions[w.type];w.hidden=!p;if(p)Object.assign(w,{size:p[0],x:p[1],y:p[2],settings:{...w.settings,shape:p[3]||'wide'}});}e.setLayout(l);},positions);await settle(page);}
const server=await startStaticServer(path.join(root,'public')), browser=await chromium.launch({headless:true});
const measurements=[];
try{
  for(const language of ['zh','en','de']) for(const theme of ['light','dark']){
    const page=await browser.newPage({viewport:{width:1440,height:1100}});
    await applyFixture(page,{date:FIXTURE_DATE,theme,language,state});
    await page.addInitScript(()=>localStorage.setItem('life-ledger-weather-city',JSON.stringify({name:'Berlin',latitude:52.52,longitude:13.41})));
    await page.route('https://api.open-meteo.com/**',route=>route.fulfill({json:forecast}));
    await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=${language}`);await page.waitForLoadState('networkidle');
    await arrange(page,{summary:['small',0,0],mood:['small',4,0],focus:['small',8,0],habits:['medium',0,1],context:['small',8,1],weather:['medium',0,2],heatmap:['small',8,2],wall:['large',0,3,'square'],reflection:['small',8,3]});
    await page.waitForFunction(()=>document.querySelectorAll('#weatherHours button').length===24);
    await page.locator('#wallFiles').setInputFiles(path.join(root,'public/assets/weekly-minimal-still-life-v2.jpg'));
    await page.waitForFunction(()=>document.querySelector('#wallCount').textContent==='1 / 1');
    await page.locator('#todayView').evaluate(e=>e.scrollTop=0);await settle(page);
    await page.screenshot({path:path.join(output,`widgets-${language==='zh'?'':language+'-'}${theme}.png`)});
    if(language==='zh')await page.locator('[data-module="wall"]').screenshot({path:path.join(output,`photo-wall-${theme}.png`)});
    if(theme==='light'&&language==='zh'){
      for(const [name,size,shape] of [['S','small','wide'],['M','medium','wide'],['L-wide','large','wide'],['L-square','large','square']]){
        await arrange(page,{summary:[size,0,0,shape],mood:[size,size==='small'?4:0,size==='small'?0:shape==='square'?4:size==='medium'?1:2,shape],habits:['small',8,6]});
        const sizes=[];
        for(const type of ['summary','mood']){
          const card=page.locator(`[data-module="${type}"]`), box=await card.boundingBox();sizes.push(box);
          await card.screenshot({path:path.join(output,`${name}-${type}.png`)});
        }
        assert.ok(Math.abs(sizes[0].width-sizes[1].width)<2&&Math.abs(sizes[0].height-sizes[1].height)<2,`${name}: welcome and mood outer sizes match`);
        if(shape==='square')assert.ok(Math.abs(sizes[0].width-sizes[0].height)<2);
        measurements.push({preset:name,width:Math.round(sizes[0].width),height:Math.round(sizes[0].height)});
      }
    }
    await page.close();
  }
  fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify({fictionalData:true,weather:'mocked for repeatable evidence',sizes:measurements},null,2));
  console.log(JSON.stringify({screenshots:16,sizes:measurements}));
}finally{await browser.close();await server.close();}
