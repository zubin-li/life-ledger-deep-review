import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/habit-analytics.js';
const api=globalThis.LifeLedgerAnalytics;

test('daily insight totals use effective opportunities, not duplicates, unknown IDs or periodic targets',()=>{
  const habits=[{id:'a',active:true},{id:'b',active:true},{id:'weekly',active:true},{id:'archived',active:false}];
  const dates=['2026-09-28','2026-09-29','2026-09-30'];
  const logs={'2026-09-28':{completed:['a','a','unknown','weekly']},'2026-09-30':{completed:['b'],note:'A note'}};
  const before=JSON.stringify(logs);
  const eligible=(h,date)=>h.id==='a' || h.id==='b' && date>='2026-09-30';
  const result=api.dailySummary(dates,habits,logs,eligible);
  assert.equal(result.completed,2);assert.equal(result.eligible,4);assert.equal(result.percent,50);
  assert.equal(result.recordedDays,2);assert.equal(result.points[1].recorded,false);
  assert.equal(result.rows.length,2);assert.equal(JSON.stringify(logs),before,'Reading never writes notes or completions');
});

test('empty/no-plan insight is undefined, not a zero-percent failure',()=>{
  const result=api.dailySummary(['2026-10-01'],[{id:'future',active:true}],{},()=>false);
  assert.equal(result.percent,null);assert.equal(result.points[0].percent,null);
  assert.equal(result.eligibleDays,0);assert.equal(result.recordedDays,0);
  assert.ok(result.weekdays.every(day=>day.percent===null));
});

test('weekday rates are weighted by opportunities, not the average of daily percentages',()=>{
  const result=api.dailySummary(['2026-09-21','2026-09-28'],[{id:'a',active:true},{id:'b',active:true}],{'2026-09-21':{completed:['a']}},(h,d)=>h.id==='a'||d==='2026-09-28');
  assert.equal(result.weekdays[0].completed,1);assert.equal(result.weekdays[0].eligible,3);
  assert.equal(result.weekdays[0].percent,33);
});
