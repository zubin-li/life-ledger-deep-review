import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/long-range.js';
const api=globalThis.LifeLedgerLongRange;
const phase=(id,updatedAt=1)=>({id,name:'A focus',focus:'Small steps',startDate:'2026-09-01',endDate:'2026-10-31',status:'active',events:[],updatedAt});
test('planning validates identity, real dates, ranges and pinned status',()=>{
  const data={...api.empty(),phases:[phase('a')],currentPhaseId:'a'};
  assert.ok(api.valid(data));assert.equal(api.valid({...data,phases:[{...phase('a'),startDate:'2026-02-30'}]}),false);
  assert.equal(api.valid({...data,phases:[{...phase('a'),endDate:'2026-08-01'}]}),false);
  assert.equal(api.valid({...data,phases:[phase('a'),phase('a')]}),false);
  assert.equal(api.valid({...data,phases:[{...phase('a'),status:'closed'}]}),false);
  assert.equal(api.valid({...data,phases:[{...phase('a'),events:[null]}]}),false);
});
test('partial merge preserves legacy/current metadata and picks newer phase records',()=>{
  const a={...api.empty(),phases:[phase('a',5)],currentPhaseId:'a',note:'Keep me',updatedAt:10};
  const b={...api.empty(),phases:[{...phase('a',2),name:'Older'},phase('b',6)],currentPhaseId:'b',updatedAt:6};
  const merged=api.merge(a,b);assert.equal(merged.phases.length,2);assert.equal(merged.phases[0].name,'A focus');assert.equal(merged.currentPhaseId,'a');assert.equal(merged.note,'Keep me');
  assert.deepEqual(api.merge(a,undefined),a);
  const legacy={...a,updatedAt:0};assert.equal(api.merge(legacy,api.empty()).currentPhaseId,'a');
});
test('carry forward copies unfinished plans without editing the prior phase',()=>{
  const goals=[{id:'one',phaseId:'a',name:'Learn',status:'active',steps:[{id:'s1',text:'Done',done:true},{id:'s2',text:'Next',done:false}]},{id:'two',phaseId:'a',status:'completed'},{id:'global',name:'Tax filing',status:'active'}];
  const original=JSON.stringify(goals);let n=0;const next={...phase('b'),startDate:'2026-11-01',endDate:'2026-12-31'};
  const copied=api.carry(goals,'a',next,()=>`new-${++n}`,'2026-11-01T12:00:00Z');
  assert.equal(copied.length,1);assert.equal(copied[0].phaseId,'b');assert.equal(copied[0].carriedFrom,'one');assert.equal(copied[0].steps.length,1);assert.equal(copied[0].steps[0].text,'Next');assert.equal(copied[0].reviewDate,'2026-12-31');assert.equal(JSON.stringify(goals),original);
});
