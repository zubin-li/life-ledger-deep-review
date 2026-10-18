import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {startStaticServer} from './server.mjs';
import {applyFixture,createFictionalState,FIXTURE_DATE} from './fixture.mjs';
const root=new URL('../../',import.meta.url).pathname,out=path.join(root,'docs/week-reflection');fs.mkdirSync(out,{recursive:true});
const state=createFictionalState();
state.weeklyOutputs={
  '2026-W38':'Walked a little further. Read without checking the time.\nA small change made the whole week feel different.',
  '2026-W39':'Made room for mornings. Finished the chapter I had been postponing.\nNext week: fewer switches, more space.',
  '2026-W40':'This week, I found a steadier rhythm.\n\nWhat worked\nProtected quiet mornings and time for reading.\n\nWhat I want to change\nLess rushing between things. More room to finish.'
};
state.weeklyReviews={'2026-W39':'## What stayed with me\n\nOne long conversation. An afternoon with no agenda.\n\n## Carrying forward\n\nA little more attention, a little less noise.'};
state.weeklyGoals['2026-W40']=[{id:'g1',text:'Leave three mornings for focused work',done:true},{id:'g2',text:'Finish one chapter',done:false},{id:'g3',text:'Take a long walk without the phone',done:false}];
const landscape=(sky,hill)=>`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="${sky}"/><circle cx="420" cy="100" r="45" fill="#f9e4a9"/><path d="M0 290Q130 70 310 260T600 200V400H0Z" fill="${hill}"/><path d="M0 345Q190 190 370 320T600 275V400H0Z" fill="#34575c"/><text x="20" y="378" fill="#fff" font-size="16">Fictional illustration · not a personal photo</text></svg>`)}`;
const photos=[{id:'p1',date:'2026-10-01',url:landscape('#b8d7e8','#91b7aa'),width:600,height:400},{id:'p2',date:'2026-09-30',url:landscape('#ded4e8','#a4a2bf'),width:600,height:400},{id:'p3',date:'2026-09-23',url:landscape('#eed6bc','#b3b7a5'),width:600,height:400}];
const events=[
  {id:'event-1',date:'2026-09-28',start:'2026-09-28T09:00:00+02:00',end:'2026-09-28T10:00:00+02:00',title:'Weekly planning',calendarName:'Personal'},
  {id:'event-2',date:'2026-09-30',allDay:true,title:'Reading day',calendarName:'Personal'},
  {id:'event-3',date:'2026-10-01',start:'2026-10-01T15:00:00+02:00',end:'2026-10-01T16:00:00+02:00',title:'A conversation with a friend',calendarName:'Personal'},
  {id:'event-4',date:'2026-10-02',start:'2026-10-02T08:00:00+02:00',end:'2026-10-02T08:30:00+02:00',title:'Morning walk',calendarName:'Rhythm',recurring:true},
  {id:'event-5',date:'2026-10-03',start:'2026-10-03T12:00:00+02:00',end:'2026-10-03T13:00:00+02:00',title:'Lunch together',calendarName:'Personal'},
  {id:'event-6',date:'2026-10-04',start:'2026-10-04T17:00:00+02:00',end:'2026-10-04T17:30:00+02:00',title:'A moment to reflect',calendarName:'Personal'}
];
const server=await startStaticServer(path.join(root,'public')),browser=await chromium.launch({headless:true}),errors=[],checks=[],requests=[];
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});}
async function open(page,lang='zh',theme='light',connected=true,motion='full',desktop=true){
  page.on('pageerror',e=>errors.push(e.message));await applyFixture(page,{date:FIXTURE_DATE,language:lang,theme,motion,state});
  await page.route('**/api/**',async route=>{
    const url=new URL(route.request().url());requests.push({path:url.pathname,method:route.request().method(),query:url.search});
    if(url.pathname==='/api/state')return route.fulfill({json:{payload:state}});
    const accounts=connected?[{id:'fictional-calendar-account',connectionId:'fictional-calendar-account',label:'Example account',calendars:[{id:'personal',summary:'Personal',selected:true}],selectedCalendarIds:['personal']}]:[];
    if(url.pathname==='/api/calendar/status')return route.fulfill({json:{configured:true,connected,accounts,hideRecurring:false}});
    if(url.pathname==='/api/calendar/calendars')return route.fulfill({json:{connected,accounts,hideRecurring:false}});
    if(url.pathname==='/api/calendar/events')return route.fulfill({json:{events,syncedAt:Date.now(),hideRecurring:false}});
    if(url.pathname==='/api/photos'){const from=url.searchParams.get('from')||url.searchParams.get('date')||'',to=url.searchParams.get('to')||from;return route.fulfill({json:{photos:photos.filter(p=>p.date>=from&&p.date<=to)}});}
    return route.fulfill({json:{}});
  });
  await page.goto(`${server.url}/index.html?mode=${connected?'cloudflare':'local'}&${desktop?'desktop=tauri-local&':''}lang=${lang}`);await page.waitForLoadState('networkidle');await settle(page);
}
async function bounds(page,selector,label){
  const bad=await page.locator(selector).evaluate(root=>[...root.querySelectorAll('.module-card,.week-calendar-day,.archive-week,#weeklyTimelineDetail,.archive-writing,.archive-week-photos')].filter(e=>e.getClientRects().length).flatMap(e=>e.scrollWidth>e.clientWidth+2?[`${e.id||e.className}:${e.scrollWidth-e.clientWidth}`]:[]));
  assert.deepEqual(bad,[],`${label}: no horizontal overflow`);
  const overlap=await page.locator('#weekView.active > .module-card').evaluateAll(es=>{const a=es.filter(e=>e.getClientRects().length);return a.flatMap((e,i)=>a.slice(i+1).flatMap(b=>{const x=e.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.min(x.right,y.right)>Math.max(x.left,y.left)+2&&Math.min(x.bottom,y.bottom)>Math.max(x.top,y.top)+2?[e.dataset.module+'/'+b.dataset.module]:[];}));});assert.deepEqual(overlap,[],`${label}: no overlapping cards`);checks.push(label);
}
try{
  for(const lang of ['zh','en','de'])for(const theme of ['light','dark']){
    const page=await browser.newPage({viewport:{width:1440,height:1100}});await open(page,lang,theme);
    await page.screenshot({path:path.join(out,`today-${lang}-${theme}.png`)});
    await page.locator('.nav-item[data-view="week"]').click();await settle(page);await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.week-calendar-event').count(),6,JSON.stringify({errors,requests,calendar:await page.locator('#weekCalendarStatus').textContent()}));
    assert.equal(await page.locator('#weekDayDetail').isVisible(),false,'Week no longer displays daily habit detail');assert.equal(await page.locator('.week-calendar-day').count(),7);await bounds(page,'#weekView',`week-${lang}-${theme}`);
    await page.screenshot({path:path.join(out,`week-${lang}-${theme}.png`)});await page.locator('[data-module="goals"]').scrollIntoViewIfNeeded();await settle(page);await page.screenshot({path:path.join(out,`week-lower-${lang}-${theme}.png`)});
    await page.locator('.nav-item[data-view="timeline"]').click();await page.waitForSelector('.archive-photo');await settle(page);await bounds(page,'#timelineView',`timeline-${lang}-${theme}`);await page.screenshot({path:path.join(out,`timeline-${lang}-${theme}.png`)});await page.close();
  }
  for(const width of [1180,900,390]){
    const page=await browser.newPage({viewport:{width,height:1000}});await open(page,'de','dark',true,'reduced',width!==390);
    await page.locator('.nav-item[data-view="week"]').click();await settle(page);await bounds(page,'#weekView',`week-${width}`);await page.screenshot({path:path.join(out,`week-${width}-de.png`)});
    await page.locator('.nav-item[data-view="timeline"]').click();await page.waitForSelector('.archive-photo');await bounds(page,'#timelineView',`timeline-${width}`);await page.screenshot({path:path.join(out,`timeline-${width}-de.png`)});await page.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:1100},recordVideo:{dir:out,size:{width:1440,height:1100}}}),page=await context.newPage();await open(page);
  const mood=await page.locator('[data-module="mood"]').boundingBox();assert.ok(Math.abs(mood.width-mood.height)<2,'Mood is square');
  await page.locator('#editLayoutToggle').click();for(const type of ['summary','mood']){assert.equal(await page.locator(`[data-module="${type}"] .widget-size-btn`).count(),0);assert.equal(await page.locator(`[data-module="${type}"] > .widget-resize-handle:visible`).count(),0);}
  await page.locator('#editLayoutToggle').click();await page.locator('.nav-item[data-view="week"]').click();
  await page.locator('#weeklyOutputText').fill('A new weekly reflection, saved without changing daily notes.');await page.locator('#weekPageTitle').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('life-ledger-v1')).weeklyOutputs['2026-W40']),'A new weekly reflection, saved without changing daily notes.');
  await page.locator('#weekArchiveLink').click();await page.waitForSelector('.archive-photo');assert.match(await page.locator('.archive-writing').textContent(),/A new weekly reflection/);
  await page.locator('.archive-week[data-week="2026-W39"]').click();assert.match(await page.locator('.archive-writing').textContent(),/What stayed with me/);await page.waitForFunction(()=>document.querySelectorAll('.archive-photo').length===1);
  await page.locator('.archive-week[data-week="2026-W40"]').click();await page.waitForFunction(()=>document.querySelectorAll('.archive-photo').length===2);
  await page.locator('#archiveOpenWeek').click();assert.equal(await page.locator('body').getAttribute('data-active-view'),'week');assert.match(await page.locator('#weeklyOutputText').inputValue(),/A new weekly reflection/);
  assert.equal(await page.evaluate(()=>isoWeekKey(new Date(2027,0,1,12))),'2026-W53','ISO year must follow the week, not Jan 1 calendar year');
  await page.locator('.nav-item[data-view="timeline"]').click();await page.locator('#journalModePhotos').click();await page.locator('#journalPhotoLibrary .journal-library-card').first().waitFor({state:'visible'});assert.ok(await page.locator('#journalPhotoLibrary .journal-library-card').count()>0,'Existing photo library stays usable');
  await page.locator('#journalModeTimeline').click();assert.equal(await page.locator('#weeklyTimelinePane').isVisible(),false,'Daily notes remain a separate mode');await page.locator('#journalModeWeeks').click();
  await page.evaluate(()=>{const c=document.createElement('div');c.id='demoCaption';c.style.cssText='position:fixed;z-index:2147483647;bottom:18px;left:50%;transform:translateX(-50%);background:#18344aee;color:white;padding:10px 20px;border-radius:14px;pointer-events:none;font:14px system-ui';document.body.append(c);});
  const caption=async text=>{await page.locator('#demoCaption').evaluate((e,t)=>e.textContent='演示说明 · '+t,text);await page.waitForTimeout(1300);};
  await page.locator('.nav-item[data-view="week"]').click();await caption('本周聚焦这一周：复盘、周日历、洞察与目标');
  await page.locator('[data-module="completed"]').scrollIntoViewIfNeeded();await caption('七天日历复用现有只读连接；包括全天与重复日程');
  await page.locator('#weekArchiveLink').click();await caption('本周写下的复盘，自动出现在时间轴，不重复保存');
  await page.locator('.archive-week[data-week="2026-W39"]').click();await caption('选择不同周，文字和照片一起变化');await page.locator('.archive-week[data-week="2026-W40"]').click();await caption('每周一页，回看这一周留下的内容');
  await page.locator('.nav-item[data-view="today"]').click();await caption('寄语固定横向双格，心情固定小方格，不再强塞 S/M/L');
  const video=page.video();await context.close();const original=await video.path();await video.saveAs(path.join(out,'week-reflection.webm'));if(original!==path.join(out,'week-reflection.webm'))fs.unlinkSync(original);
  const local=await browser.newPage({viewport:{width:1440,height:1000}});await open(local,'zh','light',false);await local.locator('.nav-item[data-view="week"]').click();assert.equal(await local.locator('.week-calendar-event').count(),0);assert.match(await local.locator('#weekCalendarStatus').textContent(),/纯本地/);await local.screenshot({path:path.join(out,'week-local-unconnected.png')});await local.close();
  assert.deepEqual(errors,[]);assert.equal(requests.some(r=>r.path.startsWith('/api/calendar/')&&r.method!=='GET'),false,'Calendar access stays read only');
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,runtimeErrors:errors,interactions:'passed',calendar:'Mocked read-only existing API, not a real account',photos:'Fictional SVG illustration fixtures',nativeWebKit:false},null,2));console.log(JSON.stringify({scenarios:checks.length,interactions:'passed',video:'week-reflection.webm'}));
}finally{await browser.close();await server.close();}
