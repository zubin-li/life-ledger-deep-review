import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { startStaticServer } from './server.mjs';
import { applyFixture, createFictionalState, FIXTURE_DATE } from './fixture.mjs';
const root = new URL('../../', import.meta.url).pathname;
const out = path.join(root, 'docs/week-polish');fs.mkdirSync(out, { recursive: true });
const state = createFictionalState();
state.weeklyGoals['2026-W40'] = [
  {id:'goal-1',text:'Make time for three quiet mornings',done:false},
  {id:'goal-2',text:'Finish the first chapter',done:true},
  {id:'goal-3',text:'Take a long walk, without the phone',done:false}
];
state.weeklyOutputs['2026-W40'] = 'Made room for what matters. Less switching, more attention.\nNext week: protect a little space for reading.';
for (let d=28;d<=30;d++) state.logs[`2026-09-${d}`] = {completed:state.habits.slice(0,d-27).map(h=>h.id),mood:'平静',note:'A little progress, a little more space.'};
const server = await startStaticServer(path.join(root,'public')), browser = await chromium.launch({headless:true});
const errors=[],checks=[];
async function settle(page){ await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));}); }
async function open(page,lang,theme,motion='full',desktop=true){
  page.on('pageerror',e=>errors.push(e.message));await applyFixture(page,{date:FIXTURE_DATE,state,language:lang,theme,motion});
  await page.goto(`${server.url}/index.html?${desktop?'desktop=tauri-local&':''}lang=${lang}`);await page.waitForLoadState('networkidle');
  await page.locator('.nav-item[data-view="week"]').click();await settle(page);
}
async function bounds(page,label){
  const bad = await page.locator('#weekView').evaluate(board=>{
    const boxes=[...board.querySelectorAll('.module-card,.week-insight-card,.week-agenda-row,.week-habit-row,.module-header,.week-review-content')].filter(e=>e.getClientRects().length);
    return boxes.flatMap(e=>e.scrollWidth>e.clientWidth+2?[`${e.className}:${e.scrollWidth-e.clientWidth}`]:[]);
  });
  assert.deepEqual(bad,[],`${label}: no horizontal content overflow`);
  const escapes=await page.locator('#weekView > .module-card').evaluateAll(cards=>cards.filter(e=>e.getClientRects().length).flatMap(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('.week-habit-row,.week-insight-card,.weekly-goal,.week-review-content')].filter(c=>c.getClientRects().length).flatMap(c=>{const b=c.getBoundingClientRect();return b.bottom>r.bottom+2||b.right>r.right+2?[`${e.dataset.module}:${c.className}`]:[];});}));
  assert.deepEqual(escapes,[],`${label}: content stays inside its card`);
  const overlaps=await page.locator('#weekView > .module-card').evaluateAll(cards=>{const visible=cards.filter(c=>c.getClientRects().length);return visible.flatMap((a,i)=>visible.slice(i+1).flatMap(b=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.min(x.right,y.right)-Math.max(x.left,y.left)>2&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>2?[`${a.dataset.module}/${b.dataset.module}`]:[];}));});
  assert.deepEqual(overlaps,[],`${label}: cards do not overlap`);
  const nested=await page.locator('#weekView').evaluate(board=>[...board.querySelectorAll('.module-card,.module-body,.week-agenda,.week-day-detail,#weeklyGoalList,#weeklyOutputText')].filter(e=>e.getClientRects().length&&['auto','scroll'].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+2).map(e=>e.id||e.className));
  assert.deepEqual(nested,[],`${label}: one page scroll, no nested vertical scroll traps`);
  checks.push(label);
}
try {
  for(const lang of ['zh','en','de'])for(const theme of ['light','dark']){
    const page=await browser.newPage({viewport:{width:1440,height:1100}});await open(page,lang,theme);
    await bounds(page,`1440-${lang}-${theme}`);await page.screenshot({path:path.join(out,`week-${lang}-${theme}.png`)});
    await page.locator('[data-module="goals"]').scrollIntoViewIfNeeded();await settle(page);await page.screenshot({path:path.join(out,`week-lower-${lang}-${theme}.png`)});
    await page.locator('.nav-item[data-view="today"]').click();await settle(page);await page.screenshot({path:path.join(out,`today-${lang}-${theme}.png`)});
    await page.close();
  }
  for(const width of [1180,900,650]){
    const page=await browser.newPage({viewport:{width,height:1000}});await open(page,'de','dark','reduced');await bounds(page,`${width}-de-dark-reduced`);await page.screenshot({path:path.join(out,`week-${width}-de-dark.png`)});await page.close();
  }
  for(const lang of ['en','zh','de']){
    const page=await browser.newPage({viewport:{width:390,height:844}});await open(page,lang,'light','off',false);await bounds(page,`390-${lang}-light-web`);await page.screenshot({path:path.join(out,`week-mobile-${lang}.png`)});await page.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:1100},recordVideo:{dir:out,size:{width:1440,height:1100}}}),page=await context.newPage();await open(page,'zh','light');
  const selected=page.locator('.week-agenda-row[aria-pressed="true"]');await selected.focus();await page.keyboard.press('Home');assert.equal(await page.locator('.week-agenda-row[aria-pressed="true"]').getAttribute('data-date'),'2026-09-28');
  for(let i=0;i<3;i++)await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.week-agenda-row[aria-pressed="true"]').getAttribute('data-date'),'2026-10-01');
  assert.equal(await page.locator('.week-agenda-row[aria-pressed="true"]').evaluate(e=>e===document.activeElement),true);
  await bounds(page,'1440-zh-selected-history');
  await page.keyboard.press('Enter');assert.equal(await page.locator('body').getAttribute('data-active-view'),'week','Enter selects rather than unexpectedly opening Today');
  await page.locator('.week-agenda-row[data-date="2026-10-02"]').click();
  const habit=page.locator('#weekDayDetail .week-habit-check:not([disabled])').first(),id=await habit.evaluate(e=>e.closest('[data-id]').dataset.id),before=await habit.getAttribute('aria-pressed');
  await habit.click();const afterHabit=page.locator(`#weekDayDetail [data-id="${id}"] .week-habit-check`);assert.notEqual(await afterHabit.getAttribute('aria-pressed'),before);assert.equal(await afterHabit.evaluate(e=>e===document.activeElement),true);
  assert.ok(await page.locator('.week-habit-icon svg').count()>0,'Reuse actual habit icons');
  await page.locator('#weeklyGoalInput').fill('A small new intention');await page.keyboard.press('Enter');assert.equal(await page.locator('.weekly-goal-text').last().textContent(),'A small new intention');
  await page.locator('.weekly-goal-check').last().click();
  await page.locator('#weeklyOutputText').fill('A week worth remembering.');await page.locator('#weekPageTitle').click();
  const storage=await page.evaluate(()=>JSON.parse(localStorage.getItem('life-ledger-v1')));assert.equal(storage.weeklyOutputs['2026-W40'],'A week worth remembering.');assert.equal(storage.weeklyGoals['2026-W40'].at(-1).done,true);
  await page.locator('#dateNavNext').click();assert.match(await page.locator('#weekStreak').textContent(),/^0/,'Future week has no inherited current streak');await bounds(page,'1440-zh-future-week');await page.locator('#dateNavPrev').click();
  await page.locator('#dateNavPrev').click();assert.match(await page.locator('#weekStreak').textContent(),/^0/,'Historical week uses its own end date, not today');await page.locator('#dateNavNext').click();
  await page.locator('.module-collapse-toggle[aria-controls="module-body-completed"]').click();assert.equal(await page.locator('#module-body-completed').isVisible(),false);await bounds(page,'1440-zh-collapsed');await page.locator('.module-collapse-toggle[aria-controls="module-body-completed"]').click();
  await page.locator('#editLayoutToggle').click();assert.ok(await page.locator('#weekView.is-editing-layout').count());await bounds(page,'1440-zh-edit');await page.locator('#editLayoutToggle').click();
  // Assertions above use real controls. Caption and cursor below are recording-only annotations.
  await page.evaluate(()=>{const c=document.createElement('div');c.id='demoCaption';c.style.cssText='position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#18344aee;color:white;padding:10px 20px;border-radius:14px;z-index:2147483647;pointer-events:none;font:14px system-ui';document.body.append(c);const p=document.createElement('i');p.style.cssText='position:fixed;width:17px;height:17px;border:2px solid #309de1;border-radius:50%;z-index:2147483647;pointer-events:none;transform:translate(-50%,-50%)';document.body.append(p);document.addEventListener('mousemove',e=>{p.style.left=e.clientX+'px';p.style.top=e.clientY+'px';});});
  const caption=async text=>{await page.locator('#demoCaption').evaluate((e,text)=>e.textContent='演示说明 · '+text,text);await page.waitForTimeout(1000);};
  async function click(locator){await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2,{steps:18});await page.mouse.click(r.x+r.width/2,r.y+r.height/2);await settle(page);}
  await page.locator('#weekView').evaluate(e=>e.scrollTop=0);await caption('本周：七天在上，选中日期的详情在下');
  await click(page.locator('.week-agenda-row[data-date="2026-09-30"]'));await caption('点击切换日期，保留原有习惯图标与当天记录');
  await click(page.locator('.week-agenda-row[data-date="2026-10-02"]'));await click(page.locator('#weekDayDetail .week-habit-check').first());await caption('当天习惯可直接打卡，反馈不再是一个空圆圈');
  await page.locator('[data-module="goals"]').scrollIntoViewIfNeeded();await caption('继续整页下滚：目标与复盘，不再嵌套滚动');
  await click(page.locator('.weekly-goal-check').first());await caption('目标和复盘均沿用真实保存逻辑');
  await click(page.locator('.nav-item[data-view="today"]'));await caption('今日同步更新外框、青蓝光影与悬停反馈');
  const card=page.locator('#todayView > [data-module="summary"]'),r=await card.boundingBox();await page.mouse.move(r.x+r.width*.25,r.y+r.height*.4,{steps:20});await page.mouse.move(r.x+r.width*.8,r.y+r.height*.6,{steps:30});await page.waitForTimeout(1200);
  const video=page.video();await context.close();const original=await video.path();await video.saveAs(path.join(out,'week-polish.webm'));if(original!==path.join(out,'week-polish.webm'))fs.unlinkSync(original);
  // Reduced motion keeps data-bearing meter transforms; only decorative movement is disabled.
  const reduced=await browser.newPage({viewport:{width:1440,height:1000}});await open(reduced,'en','dark','reduced');await reduced.locator('.week-agenda-row').first().hover();
  assert.equal(await reduced.locator('.week-agenda-row').first().evaluate(e=>getComputedStyle(e).transform),'none');
  const meter=await reduced.locator('.week-agenda-meter i').first().evaluate(e=>getComputedStyle(e).transform);assert.notEqual(meter,'none');await reduced.close();
  assert.deepEqual(errors,[],'No runtime errors');fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,interactions:'passed',runtimeErrors:errors,fictionalData:true,nativeWebKit:false},null,2));
  console.log(JSON.stringify({geometry:checks.length,interactions:'passed',video:'week-polish.webm'}));
} finally {await browser.close();await server.close();}
