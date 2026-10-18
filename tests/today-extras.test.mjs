import test from 'node:test';
import assert from 'node:assert/strict';
// Browser tests skip where Playwright is not installed (CI runs npm ci without it), like today-layout-interaction.
const { chromium } = await import('playwright').catch(() => ({}));
const skip = !chromium;
import { startStaticServer } from '../scripts/evidence/server.mjs';
import { applyFixture, FIXTURE_DATE } from '../scripts/evidence/fixture.mjs';

const publicDir = new URL('../public', import.meta.url).pathname;
const forecast = {
  current:{time:'2026-10-02T10:30',temperature_2m:16,weather_code:1},
  hourly:{time:Array.from({length:48},(_,i)=>new Date(Date.UTC(2026,9,2,i)).toISOString().slice(0,16)),temperature_2m:Array.from({length:48},(_,i)=>12+i%12),precipitation_probability:Array.from({length:48},(_,i)=>i===14?80:0),precipitation:Array.from({length:48},(_,i)=>i===14?2:0),snowfall:Array.from({length:48},(_,i)=>i===18?1:0),weather_code:Array.from({length:48},(_,i)=>i===14?61:i===18?73:1)},
};
async function open(run) {
  const server=await startStaticServer(publicDir), browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}}), errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await applyFixture(page,{date:FIXTURE_DATE,language:'en'});
    await page.goto(`${server.url}/index.html?desktop=tauri-local&lang=en`);
    await page.waitForLoadState('networkidle');
    await run(page);
    assert.deepEqual(errors,[],'No page runtime errors');
  } finally {await browser.close();await server.close();}
}
async function show(page,...types) {
  await page.locator('#editLayoutToggle').click();
  for(const type of types){
    if(await page.locator(`[data-module="${type}"]`).isVisible()){
      await page.locator(`[data-module="${type}"] .widget-configure`).click();
      await page.locator('#widgetSettingsVisible').uncheck();await page.locator('#widgetSettingsClose').click();
    }
    else{await page.locator('#addTodayWidget').click();await page.locator(`[data-add-widget="today-${type}"]`).click();await page.locator('#widgetGalleryClose').click();}
  }
  await page.locator('#editLayoutToggle').click();
}
async function configure(page,type) {
  if(await page.locator('#editLayoutToggle').getAttribute('aria-pressed')!=='true')await page.locator('#editLayoutToggle').click();
  await page.locator(`[data-module="${type}"] .widget-configure`).click();
  await page.locator('#widgetSettings').waitFor({state:'visible'});
}

test('Content-specific sizing preserves the confirmed compact composition and stays editable', { skip },()=>open(async page=>{
  const heroWidth=await page.locator('[data-module="summary"]').evaluate(card=>({card:card.getBoundingClientRect().width,hero:card.querySelector('.today-summary-hero').getBoundingClientRect().width}));
  assert.ok(heroWidth.hero>=heroWidth.card-2,'Independent mood must not leave an empty half in the Large welcome card');
  const before=await page.locator('[data-module="mood"]').boundingBox();
  const focus=await page.locator('[data-module="focus"]').boundingBox();
  const reflection=await page.locator('[data-module="reflection"]').boundingBox();
  const habits=await page.locator('[data-module="habits"]').boundingBox();
  assert.ok(before.height<=181&&reflection.height<=181,'Mood and short writing must not become giant empty cards');
  assert.ok(Math.abs(focus.y-before.y-before.height-20)<2,'Mood and focus reproduce the confirmed vertical stack');
  assert.ok(Math.abs(reflection.y-habits.y)<2,'Compact reflection remains beside habits');
  await page.locator('#editLayoutToggle').click();
  assert.equal(await page.locator('[data-module="summary"] .widget-size-btn').count(),3);
  assert.equal(await page.locator('[data-module="mood"] .widget-size-btn').count(),2);
  assert.equal(await page.locator('[data-module="summary"] > .widget-resize-handle:visible').count(),1);
  assert.equal((await page.locator('[data-module="mood"]').boundingBox()).height,before.height,'Editing must not inflate the card');
  await page.locator('[data-module="mood"] .widget-size-btn[data-size="medium"]').click();
  const wider=await page.locator('[data-module="mood"]').boundingBox();
  assert.ok(wider.width>before.width+100,'M changes actual width, not only a stored label');
  assert.equal(wider.height,before.height,'A simple mood choice needs width, not an empty extra story');
  await page.locator('[data-module="summary"] .widget-size-btn[data-size="medium"]').click();
  assert.equal(await page.locator('[data-module="summary"]').getAttribute('data-widget-size'),'medium');
  await page.locator('#editLayoutToggle').click();
  assert.equal(await page.locator('#standaloneMood #quickMood').count(),1);
  await page.reload();await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('[data-module="mood"]').getAttribute('data-widget-size'),'medium');
  await show(page,'mood');
  assert.equal(await page.locator('[data-module="summary"] #quickMood').count(),0,'Hiding mood never puts it inside the fixed quote');
  assert.equal(await page.locator('#standaloneMood #quickMood').count(),1,'The original controls still exist without duplication');
}));

test('Habit heatmap uses eight real completion levels and persists its palette', { skip },()=>open(async page=>{
  await show(page,'heatmap');
  const before=await page.locator(`.heatmap-day[data-date="${FIXTURE_DATE}"]`).getAttribute('data-level');
  assert.equal(before,'2','One of four completed maps to level 2/8');
  await page.locator('.today-habit-row[data-id="habit-read"] .today-habit-check').click();
  assert.equal(await page.locator(`.heatmap-day[data-date="${FIXTURE_DATE}"]`).getAttribute('data-level'),'4');
  assert.equal(await page.locator('.heatmap-day').count(),31,'Every size shows the entire calendar month');
  assert.equal(await page.locator('.heatmap-spacer').count(),3,'October 2026 begins on Thursday in the Monday-first calendar');
  assert.equal(await page.locator('[data-module="heatmap"] select').count(),0,'Palette is not on the everyday card');
  await configure(page,'heatmap');
  await page.locator('#heatmapPalette').selectOption('spectrum');
  await page.locator('#widgetSettingsClose').click();await page.locator('#editLayoutToggle').click();
  await page.reload();await page.waitForLoadState('networkidle');
  await configure(page,'heatmap');
  assert.equal(await page.locator('#heatmapPalette').inputValue(),'spectrum');
}));

test('Card configuration and movement are edit-only; Escape closes only the settings sheet', { skip },()=>open(async page=>{
  await show(page,'heatmap');
  const card=page.locator('[data-module="heatmap"]');
  const before=await page.evaluate(()=>JSON.stringify(window.LifeLedgerLayoutEngine.getLayout()));
  await card.locator('.module-title').click();
  assert.equal(await page.locator('#widgetSettings').isVisible(),false,'Normal card clicks do not open settings');
  assert.equal(await page.locator('#addTodayWidget').isVisible(),false,'Adding widgets is also edit-only');
  const r=await card.boundingBox();await page.mouse.move(r.x+30,r.y+30);await page.mouse.down();await page.mouse.move(r.x+130,r.y+80,{steps:5});await page.mouse.up();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.LifeLedgerLayoutEngine.getLayout())),before,'Normal mode drag cannot move a card');
  await configure(page,'heatmap');
  await page.locator('#heatmapPalette').selectOption('blue');
  await page.locator('#widgetSettingsSize').selectOption('small');
  assert.equal(await card.getAttribute('data-widget-size'),'small');
  assert.equal(await page.locator('.heatmap-day').count(),31,'S retains the complete month');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#widgetSettings').isVisible(),false);
  assert.equal(await page.locator('#editLayoutToggle').getAttribute('aria-pressed'),'true','Escape from the sheet must not cancel the edit session');
  assert.equal(await card.evaluate(e=>e===document.activeElement),true,'Closing settings restores card focus');
  await page.keyboard.press('Enter');await page.locator('#widgetSettings').waitFor({state:'visible'});
  assert.equal(await page.locator('#heatmapPalette').inputValue(),'blue');
  await page.locator('#widgetSettingsClose').click();await page.locator('#editLayoutToggle').click();
  assert.equal(await card.getAttribute('tabindex'),null);
  await page.reload();await page.waitForLoadState('networkidle');
  assert.equal(await card.getAttribute('data-widget-size'),'small');
  assert.equal(await page.evaluate(()=>window.LifeLedgerLayoutEngine.getLayout().widgets.find(w=>w.type==='heatmap').settings.palette),'blue');
}));

test('Optional cards fit S, M, landscape L and square L at wide and narrow desktop widths', { skip },()=>open(async page=>{
  const types=['heatmap','wall','weather'];
  for(const width of [1440,1180]) {
    await page.setViewportSize({width,height:1000});
    for(const size of ['small','medium','large','square']) {
      await page.evaluate(({types,size})=>{
        const engine=window.LifeLedgerLayoutEngine,layout=engine.getLayout();
        for(const widget of layout.widgets) {
          widget.hidden=!types.includes(widget.type);
          if(types.includes(widget.type)){widget.size=size==='square'?'large':size;widget.settings={...widget.settings,shape:size==='square'?'square':'wide'};}
        }
        engine.setLayout(layout);
      },{types,size});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const cards=await page.evaluate(types=>types.map(type=>{
        const card=document.querySelector(`[data-module="${type}"]`),r=card.getBoundingClientRect();
        return {type,width:r.width,height:r.height,overflowX:card.scrollWidth-card.clientWidth,overflowY:card.scrollHeight-card.clientHeight};
      }),types);
      for(const card of cards){
        assert.ok(card.overflowX<=2&&card.overflowY<=2,`${width}px ${size} ${card.type}: content fits its frame: ${JSON.stringify(card)}`);
        assert.ok(Math.abs(card.width-cards[0].width)<2&&Math.abs(card.height-cards[0].height)<2,`${width}px ${size}: same preset means same outer dimensions`);
        if(size==='square')assert.ok(Math.abs(card.width-card.height)<2,`${width}px: square remains square`);
      }
    }
  }
}));

test('Weather city search, hourly scrubbing, rain/snow hint and offline cache', { skip },()=>open(async page=>{
  let weatherCalls=0;
  await page.route(/https:\/\/(geocoding-api|api)\.open-meteo\.com\//,route=>{
    const url=route.request().url();if(url.includes('/forecast'))weatherCalls++;
    return route.fulfill({json:url.includes('/search')?{results:[{name:'Berlin',country:'Germany',latitude:52.52,longitude:13.41}]}:forecast});
  });
  assert.equal(weatherCalls,0,'Weather does not request a location until enabled and selected');
  await show(page,'weather');
  await configure(page,'weather');
  await page.locator('#weatherCity').fill('Berlin');await page.locator('#weatherSearch button').click();
  await page.locator('#weatherCities select').selectOption('0');
  await page.locator('#widgetSettingsClose').click();await page.locator('#editLayoutToggle').click();
  await page.waitForFunction(()=>document.querySelector('#weatherPlot canvas'));
  assert.match(await page.locator('.weather-rain-hint').textContent(),/Rain expected.*14:00/);
  const heroBefore=await page.locator('#heroWeather').textContent();
  const steps=[];await page.locator('#weatherPlot').focus();await page.keyboard.press('Home');steps.push(await page.locator('.weather-time').textContent());for(let i=0;i<9;i++){await page.keyboard.press('ArrowRight');steps.push(await page.locator('.weather-time').textContent());}
  assert.match(await page.locator('.weather-time').textContent(),/18:00.*Snow/,JSON.stringify(steps));
  assert.equal(await page.locator('#weatherPlot').evaluate(e=>e===document.activeElement),true,'Exploring an hour keeps keyboard focus');
  assert.equal(await page.locator('#heroWeather').textContent(),heroBefore,'Chart exploration never changes the current-weather summary');
  await page.unrouteAll();await page.route('https://**/*',route=>route.abort());
  await page.reload();await page.waitForLoadState('networkidle');
  await page.waitForFunction(()=>document.querySelector('#weatherPlot canvas'));
  assert.equal(weatherCalls,1,'Reload reuses cached forecast and saved city');
  await page.setViewportSize({width:1180,height:1000});
  for(const preset of ['small','medium','large','square']){
    await page.evaluate(preset=>{const e=window.LifeLedgerLayoutEngine,l=e.getLayout(),w=l.widgets.find(w=>w.type==='weather');w.size=preset==='square'?'large':preset;w.settings={...w.settings,shape:preset==='square'?'square':'wide'};e.setLayout(l);},preset);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const overflow=await page.locator('[data-module="weather"]').evaluate(e=>({x:e.scrollWidth-e.clientWidth,y:e.scrollHeight-e.clientHeight}));
    assert.ok(overflow.x<=2&&overflow.y<=2,`Loaded ${preset} chart fits at 1180px: ${JSON.stringify(overflow)}`);
  }
}));

test('Widget library contains all existing widgets without hidden edit-grid placeholders', { skip },()=>open(async page=>{
  await page.locator('#editLayoutToggle').click();
  assert.equal(await page.locator('#todayView > [data-module]:not([hidden])').count(),8);
  assert.equal(await page.locator('#todayView .is-widget-hidden').count(),0);
  await page.locator('#addTodayWidget').click();
  assert.equal(await page.locator('#widgetGalleryList .gallery-item').count(),11);
  assert.equal(await page.locator('.gallery-item[data-widget="calendar"] h3').textContent(),'Calendar','Catalog names must not become a dynamic month/date');
  await page.locator('[data-add-widget="today-wall"]').click();
  assert.equal(await page.locator('[data-add-widget="today-wall"]').isDisabled(),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#editLayoutToggle').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#todayView > [data-module]:not([hidden])').count(),9);
  await page.locator('[data-module="wall"] .widget-configure').click();
  await page.locator('#widgetSettingsVisible').uncheck();await page.locator('#widgetSettingsClose').click();
  assert.equal(await page.locator('[data-module="wall"]').isVisible(),false);
  assert.equal(await page.locator('#todayView .is-widget-hidden').count(),0,'Removing leaves no ghost slot');
  await page.locator('#editLayoutToggle').click();await page.reload();await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('[data-module="wall"]').isVisible(),false,'Removal is persisted');
}));

test('Weather chart uses city-local day labels and never mixes next-day temperatures into today’s range', { skip },()=>open(async page=>{
  const result=await page.evaluate(forecast=>{
    const data=structuredClone(forecast);data.current.time='2026-10-02T00:30';
    data.hourly.temperature_2m=data.hourly.temperature_2m.map((temp,i)=>i>=24?70:temp);
    return window.LifeLedgerWeather.dataWindow(data);
  },forecast);
  assert.equal(result.high,23);assert.equal(result.low,12);
  assert.equal(result.hours.length,25);
  assert.equal(result.hours[0].time,'2026-10-02T00:00');
  assert.equal(result.hours.at(-1).time,'2026-10-03T00:00');
}));

test('Photo wall persists images, GIFs and playable video; reduced motion stops playback', { skip },()=>open(async page=>{
  await show(page,'wall');await page.locator('#wallCount').filter({hasText:'0 / 0'}).waitFor();
  await page.locator('#wallFiles').setInputFiles(new URL('../public/assets/weekly-minimal-still-life-v2.jpg',import.meta.url).pathname);
  await page.waitForFunction(()=>document.querySelector('#wallCount').textContent==='1 / 1');
  assert.equal(await page.locator('#wallStage img').evaluate(e=>e.complete&&e.naturalWidth>0),true);
  await page.locator('#wallFiles').setInputFiles({name:'motion.gif',mimeType:'image/gif',buffer:Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64')});
  await page.waitForFunction(()=>document.querySelector('#wallCount').textContent==='2 / 2');
  const encoded=await page.evaluate(async()=>{
    const canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;
    const stream=canvas.captureStream(0), recorder=new MediaRecorder(stream,{mimeType:'video/webm'}),parts=[];
    recorder.ondataavailable=e=>parts.push(e.data);
    const result=new Promise(resolve=>{recorder.onstop=async()=>{const blob=new Blob(parts,{type:'video/webm'});const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);stream.getTracks().forEach(t=>t.stop());};});
    recorder.start();
    for(let frame=0;frame<3;frame++){canvas.getContext('2d').fillStyle=frame%2?'#258fe5':'#00ad7c';canvas.getContext('2d').fillRect(0,0,160,90);stream.getVideoTracks()[0].requestFrame();await new Promise(resolve=>setTimeout(resolve,150));}
    recorder.stop();return result;
  });
  await page.locator('#wallFiles').setInputFiles({name:'clip.webm',mimeType:'video/webm',buffer:Buffer.from(encoded,'base64')});
  await page.waitForFunction(()=>document.querySelector('#wallCount').textContent==='3 / 3');
  await page.locator('#wallPlay').click();
  await page.waitForFunction(()=>!document.querySelector('#wallStage video').paused);
  await page.evaluate(date=>{document.documentElement.classList.add('motion-reduced');window.LifeLedgerTodayExtras.update({language:'en',days:[],selectedDate:date});},FIXTURE_DATE);
  assert.equal(await page.locator('#wallStage video').evaluate(e=>e.paused),true);
  assert.equal(await page.locator('#wallPlay').isDisabled(),true);
  await page.reload();await page.waitForLoadState('networkidle');
  await page.waitForFunction(()=>document.querySelector('#wallCount').textContent.endsWith('/ 3'));
  await page.locator('#wallFiles').setInputFiles({name:'unsafe.html',mimeType:'text/html',buffer:Buffer.from('<script>bad()</script>')});
  await page.waitForFunction(()=>document.querySelector('#wallStatus').textContent.includes('Use JPEG'));
  assert.match(await page.locator('#wallCount').textContent(),/\/ 3$/,'Rejected media does not change storage');
}));
