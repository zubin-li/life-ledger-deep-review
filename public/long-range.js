/* Small, dependency-free horizon workspace. Goals and monthly reviews remain in
   their existing stores; planning only adds phase metadata and a durable note. */
(function(root){
  const copy=value=>JSON.parse(JSON.stringify(value));
  const empty=()=>({phases:[],currentPhaseId:'',note:'',updatedAt:0});
  function valid(data){
    if(!data || typeof data!=='object' || Array.isArray(data) || !Array.isArray(data.phases))return false;
    if(typeof data.note!=='string' || data.note.length>30000 || typeof data.currentPhaseId!=='string')return false;
    const ids=new Set();
    return data.phases.every(p=>{
      if(!p || typeof p.id!=='string' || !p.id || ids.has(p.id) || typeof p.name!=='string' || !p.name.trim() || p.name.length>160)return false;
      ids.add(p.id);
      const date=s=>typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
      return date(p.startDate) && date(p.endDate) && p.endDate>=p.startDate && ['active','closed'].includes(p.status) && typeof p.focus==='string' && p.focus.length<=10000 && Array.isArray(p.events) && p.events.every(event=>event && typeof event==='object' && typeof event.type==='string' && typeof event.date==='string' && (event.detail===undefined || typeof event.detail==='string'));
    }) && (!data.currentPhaseId || data.phases.some(p=>p.id===data.currentPhaseId && p.status!=='closed'));
  }
  function merge(current,incoming){
    const a=valid(current)?current:empty(),b=valid(incoming)?incoming:empty();
    const phases=new Map(a.phases.map(p=>[p.id,copy(p)]));
    b.phases.forEach(p=>{const old=phases.get(p.id);if(!old || Number(p.updatedAt||0)>=Number(old.updatedAt||0))phases.set(p.id,copy(p));});
    const latest=Number(b.updatedAt||0)>Number(a.updatedAt||0)?b:a;
    const result={...copy(latest),phases:[...phases.values()]};
    if(!result.phases.some(p=>p.id===result.currentPhaseId && p.status!=='closed'))result.currentPhaseId='';
    return result;
  }
  function carry(goals,fromId,toPhase,id,now){
    return goals.filter(g=>g.phaseId===fromId && (g.status||'active')!=='completed').map(g=>({
      ...copy(g),id:id(),phaseId:toPhase.id,carriedFrom:g.id,status:'active',startDate:toPhase.startDate,reviewDate:toPhase.endDate,
      steps:(g.steps||[]).filter(s=>!s.done).map(s=>({id:id(),text:s.text,done:false})),
      events:[{type:'carried',date:now,detail:fromId}],createdAt:now,updatedAt:now,
    }));
  }
  let ctx,selectedPhase,month='',dialog;
  const $=selector=>document.querySelector(selector);
  const t=(zh,en,de)=>ctx.text(zh,en,de),e=value=>ctx.escape(String(value??''));
  const state=()=>ctx.state(),plan=()=>valid(state().planning)?state().planning:empty();
  const today=()=>ctx.iso(new Date()),stamp=()=>new Date().toISOString(),id=()=>crypto.randomUUID();
  const areas=()=>({health:t('健康与能量','Health & energy','Gesundheit & Energie'),learning:t('学习与成长','Learning & growth','Lernen & Wachstum'),work:t('工作与创造','Work & craft','Arbeit & Gestalten'),life:t('生活与事务','Life & admin','Leben & Alltag')});
  const areaName=value=>areas()[value]||value||t('其他方向','Other directions','Weitere Bereiche');
  const areaIcon=value=>({health:'heart',learning:'book',work:'pen',life:'sunrise'})[value]||'target';
  const dateLabel=value=>!value?t('未设置','Not set','Nicht festgelegt'):typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))?ctx.date(value):String(value);
  const phaseById=value=>plan().phases.find(p=>p.id===value);
  const eventText=event=>({created:t('开始了这个阶段','Started this phase','Phase begonnen'),edited:t('调整了阶段','Updated the phase','Phase angepasst'),closed:t('完成阶段回看并归档','Reviewed and archived this phase','Phase reflektiert und archiviert'),pinned:t('置为当前阶段','Pinned as current phase','Als aktuelle Phase angeheftet'),completed:t('完成计划','Plan completed','Plan abgeschlossen'),reopened:t('重新推进','Plan reopened','Plan wieder aufgenommen'),step:t('记录一步进展','A step recorded','Fortschritt erfasst'),carried:t('从上一阶段带入','Carried from an earlier phase','Aus einer früheren Phase übernommen'),paused:t('暂停推进','Plan paused','Plan pausiert')})[event.type]||t('更新了计划','Plan updated','Plan aktualisiert');
  function save(){state().planning={...plan(),updatedAt:Date.now()};ctx.save();}
  function commit(){save();render();ctx.changed?.();}
  function closeDialog(){dialog?.close();}
  function showDialog(title,body,onSubmit){
    if(!dialog){dialog=document.createElement('dialog');dialog.className='horizon-dialog';dialog.id='horizonDialog';document.body.append(dialog);}
    dialog.innerHTML=`<form id="horizonForm"><header><h2 id="horizonDialogTitle">${e(title)}</h2><button type="button" class="icon-button" data-close aria-label="${e(t('关闭','Close','Schließen'))}">×</button></header>${body}<p id="horizonFormError" role="alert"></p><footer><button type="button" class="secondary-button" data-close>${e(t('取消','Cancel','Abbrechen'))}</button><button type="submit" class="primary-button">${e(t('保存','Save','Speichern'))}</button></footer></form>`;
    dialog.setAttribute('aria-labelledby','horizonDialogTitle');dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeDialog));
    const form=$('#horizonForm');form.addEventListener('input',()=>form.querySelectorAll('input,textarea').forEach(f=>f.setCustomValidity('')));
    form.addEventListener('submit',event=>{event.preventDefault();onSubmit(form);});dialog.showModal();
  }
  function editPhase(value){
    const p=phaseById(value),last=phaseById(selectedPhase),date=today(),pinned=plan().currentPhaseId===p?.id;
    showDialog(t(p?'编辑阶段':'开始一个新阶段',p?'Edit phase':'Start a new phase',p?'Phase bearbeiten':'Neue Phase beginnen'),`
      <label>${e(t('阶段名称','Phase name','Name der Phase'))}<input name="name" required maxlength="160" value="${e(p?.name)}" placeholder="${e(t('例如：把生活节奏找回来','e.g. Find a steadier rhythm','z. B. Einen ruhigeren Rhythmus finden'))}"></label>
      <div class="horizon-form-pair"><label>${e(t('开始日期','Start','Beginn'))}<input name="startDate" type="date" max="9999-12-31" required value="${e(p?.startDate||date)}"></label><label>${e(t('结束／回看日期','End / review date','Ende / Rückblick'))}<input name="endDate" type="date" max="9999-12-31" required value="${e(p?.endDate||date)}"></label></div>
      <label>${e(t('这一阶段，什么最重要？','What matters in this phase?','Was ist in dieser Phase wichtig?'))}<textarea name="focus" rows="3" maxlength="10000">${e(p?.focus)}</textarea></label>
      <label class="horizon-choice"><input name="pin" type="checkbox" ${!p||pinned?'checked':''} ${p?.status==='closed'?'disabled':''}><span>${e(t('置为当前阶段；不自动结束其他阶段','Pin as current; other phases are not automatically closed','Als aktuell anheften; andere Phasen nicht automatisch schließen'))}</span></label>
      ${!p && last?`<label class="horizon-choice"><input name="carry" type="checkbox"><span>${e(t('带入所看阶段未完成的计划，回看日改为新阶段结束日','Carry unfinished plans from the viewed phase; review dates become the new end date','Offene Pläne der angezeigten Phase übernehmen; Rückblickdatum wird das neue Enddatum'))}</span></label>`:''}`,form=>{
      const f=form.elements;if(f.endDate.value<f.startDate.value){f.endDate.setCustomValidity(t('结束日期不能早于开始日期','End must not precede start','Das Ende darf nicht vor dem Beginn liegen'));f.endDate.reportValidity();return;}
      const now=Date.now(),data={...(p||{}),id:p?.id||id(),name:f.name.value.trim(),focus:f.focus.value.trim(),startDate:f.startDate.value,endDate:f.endDate.value,status:p?.status||'active',updatedAt:now,createdAt:p?.createdAt||now,events:[...(p?.events||[]),{type:p?'edited':'created',date:stamp(),detail:p?`${p.startDate} → ${p.endDate} / ${f.startDate.value} → ${f.endDate.value}`:''}]};
      if(!data.name)return;
      const old=plan();state().planning={...old,phases:[...old.phases.filter(item=>item.id!==data.id),data],currentPhaseId:f.pin.checked && data.status!=='closed'?data.id:old.currentPhaseId===data.id?'':old.currentPhaseId};
      if(f.carry?.checked && last)state().longTermGoals=[...(state().longTermGoals||[]),...carry(state().longTermGoals||[],last.id,data,id,stamp())];
      selectedPhase=data.id;closeDialog();commit();
    });
  }
  function closePhase(p){
    showDialog(t('回看这一阶段','Review this phase','Diese Phase reflektieren'),`<p>${e(p.name)} · ${e(dateLabel(p.startDate))} — ${e(dateLabel(p.endDate))}</p><label>${e(t('留下什么？下一阶段想怎样？','What stays? What changes next?','Was bleibt? Was soll sich ändern?'))}<textarea name="review" rows="6" maxlength="10000"></textarea></label><p class="horizon-form-help">${e(t('归档会保存计划与步骤的当时快照。未完成的计划不会自动删除或顺延。','Archiving keeps a snapshot of plans and steps. Unfinished plans are not deleted or automatically extended.','Das Archiv speichert Pläne und Schritte als Momentaufnahme. Offenes wird nicht gelöscht oder automatisch verlängert.'))}</p>`,form=>{
      const now=stamp();p.status='closed';p.closedAt=now;p.review=form.elements.review.value.trim();p.snapshot=copy((state().longTermGoals||[]).filter(g=>g.phaseId===p.id));p.updatedAt=Date.now();p.events.push({type:'closed',date:now,detail:p.review});
      if(state().planning.currentPhaseId===p.id)state().planning.currentPhaseId='';closeDialog();commit();
    });
  }
  function editGoal(value,defaultArea='work',unbound=false){
    const goal=(state().longTermGoals||[]).find(g=>g.id===value),p=phaseById(selectedPhase);
    const phaseOptions=`<option value="">${e(t('长期事项 · 不绑阶段','Ongoing · no phase','Dauerhaft · ohne Phase'))}</option>`+plan().phases.filter(p=>p.status!=='closed'||p.id===goal?.phaseId).map(p=>`<option value="${e(p.id)}" ${p.id===(goal?(goal.phaseId||''):(unbound?'':selectedPhase))?'selected':''}>${e(p.name)}</option>`).join('');
    showDialog(t(goal?'编辑计划':'添加计划',goal?'Edit plan':'Add a plan',goal?'Plan bearbeiten':'Plan hinzufügen'),`
      <label>${e(t('我想做到什么？','What would you like to do?','Was möchtest du erreichen?'))}<input name="name" required maxlength="160" value="${e(goal?.name)}"></label>
      <div class="horizon-form-pair"><label>${e(t('所属阶段','Phase','Phase'))}<select name="phaseId">${phaseOptions}</select></label><label>${e(t('领域（也可自定义）','Area (or your own)','Bereich (auch eigene möglich)'))}<input name="area" list="horizonAreas" maxlength="80" value="${e(areaName(goal?.area||defaultArea))}"><datalist id="horizonAreas">${Object.values(areas()).map(a=>`<option value="${e(a)}"></option>`).join('')}</datalist></label></div>
      <label>${e(t('下一小步','Next small step','Der nächste kleine Schritt'))}<textarea name="nextAction" rows="2" maxlength="2000">${e(goal?.nextAction)}</textarea></label>
      <label>${e(t('步骤 · 每行一个，最多 20 项','Steps · one per line, up to 20','Schritte · einer je Zeile, bis zu 20'))}<textarea name="steps" rows="4" maxlength="8000">${e((goal?.steps||[]).map(s=>s.text).join('\n'))}</textarea></label>
      <div class="horizon-form-pair"><label>${e(t('开始日期','Start','Beginn'))}<input name="startDate" type="date" value="${e(goal?(goal.startDate||''):unbound?today():(p?.startDate||today()))}"></label><label>${e(t('回看／截止日期','Review / due date','Rückblick / Fälligkeit'))}<input name="reviewDate" type="date" value="${e(goal?(goal.reviewDate||''):unbound?'':(p?.endDate||''))}"></label></div>
      <label>${e(t('状态','Status','Status'))}<select name="status">${['active','paused','completed'].map(status=>`<option value="${status}" ${status===(goal?.status||'active')?'selected':''}>${e(ctx.status(status))}</option>`).join('')}</select></label>`,form=>{
      const f=form.elements,lines=f.steps.value.split('\n').map(s=>s.trim()).filter(Boolean);
      if(lines.length>20){f.steps.setCustomValidity(t('最多 20 个步骤','Up to 20 steps','Bis zu 20 Schritte'));f.steps.reportValidity();return;}
      if(f.startDate.value && f.reviewDate.value && f.reviewDate.value<f.startDate.value){f.reviewDate.setCustomValidity(t('回看日期不能早于开始日期','Review date must not precede start','Rückblickdatum darf nicht vor dem Beginn liegen'));f.reviewDate.reportValidity();return;}
      const area=Object.entries(areas()).find(([,label])=>label===f.area.value)?.[0]||f.area.value.trim()||'life',used=new Set();
      const steps=lines.map(text=>{const old=(goal?.steps||[]).find(s=>s.text===text&&!used.has(s.id));if(old){used.add(old.id);return old;}return {id:id(),text,done:false};});
      const now=stamp(),status=f.status.value,data={...(goal||{}),id:goal?.id||id(),name:f.name.value.trim(),area,phaseId:f.phaseId.value,nextAction:f.nextAction.value.trim(),startDate:f.startDate.value,reviewDate:f.reviewDate.value,status,steps,createdAt:goal?.createdAt||Date.now(),updatedAt:Date.now(),completedAt:status==='completed'?(goal?.completedAt||now):'',events:[...(goal?.events||[]),{type:!goal?'created':status==='completed'&&goal.status!=='completed'?'completed':status==='paused'?'paused':goal.status==='completed'&&status==='active'?'reopened':'edited',date:now,detail:''}]};
      if(!data.name)return;state().longTermGoals=[...(state().longTermGoals||[]).filter(g=>g.id!==data.id),data];closeDialog();commit();
    });
  }
  function goalCard(goal,readOnly=false){
    const steps=Array.isArray(goal.steps)?goal.steps:[],done=steps.filter(s=>s.done).length,overdue=goal.reviewDate && goal.reviewDate<today() && (goal.status||'active')==='active';
    return `<article class="horizon-goal ${goal.status==='completed'?'is-complete':''}" data-goal="${e(goal.id)}"><header><span class="horizon-area-icon">${ctx.icon(areaIcon(goal.area))}</span><div><span class="horizon-area-label">${e(areaName(goal.area))}</span><h3>${e(goal.name)}</h3></div><span class="horizon-status">${e(ctx.status(goal.status||'active'))}</span></header>${goal.nextAction?`<p class="horizon-next"><span>${e(t('下一小步','NEXT SMALL STEP','NÄCHSTER KLEINER SCHRITT'))}</span>${e(goal.nextAction)}</p>`:''}${steps.length?`<div class="horizon-step-progress"><span>${done} / ${steps.length} ${e(t('步','steps','Schritte'))}</span><div aria-hidden="true"><i style="width:${done/steps.length*100}%"></i></div></div><ul class="horizon-steps">${steps.map(s=>`<li><button type="button" data-step="${e(s.id)}" aria-pressed="${Boolean(s.done)}" ${readOnly?'disabled':''}><span class="horizon-step-check" aria-hidden="true">${s.done?'✓':''}</span><span>${e(s.text)}</span>${s.doneAt?`<time>${e(dateLabel(s.doneAt.slice(0,10)))}</time>`:''}</button></li>`).join('')}</ul>`:''}<footer><span class="${overdue?'is-due':''}">${overdue?e(t('该回看一下了 · ','Time to review · ','Zeit für einen Rückblick · ')):''}${e(goal.reviewDate?dateLabel(goal.reviewDate):t('按自己的节奏推进','At your own pace','Im eigenen Tempo'))}</span>${readOnly?'':`<button type="button" class="text-button" data-edit-goal="${e(goal.id)}">${e(t('编辑','Edit','Bearbeiten'))}</button>`}</footer>${(goal.events||[]).length?`<details class="horizon-goal-history"><summary>${e(t('推进记录','Progress history','Fortschrittsverlauf'))}</summary>${[...goal.events].reverse().map(event=>`<p><time>${e(dateLabel(String(event.date).slice(0,10)))}</time> · ${e(eventText(event))}${event.detail?` · ${e(event.detail)}`:''}</p>`).join('')}</details>`:''}</article>`;
  }
  function render(options){
    if(options)ctx=options;if(!ctx)return;const host=$('#longRangeWorkspace');if(!host)return;
    const data=plan();if(selectedPhase===undefined || selectedPhase && !phaseById(selectedPhase))selectedPhase=data.currentPhaseId||data.phases.at(-1)?.id||'';
    if(!month)month=today().slice(0,7);
    const current=phaseById(data.currentPhaseId),p=phaseById(selectedPhase),closed=p?.status==='closed';
    const phaseGoals=closed && Array.isArray(p.snapshot)?copy(p.snapshot):(state().longTermGoals||[]).filter(g=>g.phaseId && g.phaseId===p?.id);
    const ongoing=(state().longTermGoals||[]).filter(g=>!g.phaseId || !phaseById(g.phaseId)),completed=phaseGoals.filter(g=>g.status==='completed').length;
    const end=p?.endDate||'',due=p && !closed && end<today();
    const phaseState=closed?t('归档时的快照','Snapshot at archive','Momentaufnahme beim Archivieren'):due?t('已到回看日期','Review date reached','Rückblickdatum erreicht'):p?.startDate>today()?t('尚未开始','Upcoming','Noch nicht begonnen'):t('推进中','In progress','In Arbeit');
    host.innerHTML=`<div class="horizon-pin"><span class="horizon-pin-icon">${ctx.icon('target')}</span><span><small>${e(t('当前阶段 · 始终置顶','CURRENT PHASE · PINNED','AKTUELLE PHASE · ANGEHEFTET'))}</small><strong>${e(current?.name||t('先确定这一阶段的重点','Choose the focus for this phase','Den Fokus für diese Phase wählen'))}</strong></span>${current?`<button class="text-button" id="horizonBackCurrent" type="button">${e(t('查看','View','Ansehen'))}</button>`:''}</div>
      <header class="horizon-heading"><div><span class="kicker">${e(t('把目光放远，也把下一步放近','A LONG VIEW. A SMALL NEXT STEP.','WEITER DENKEN. KLEIN ANFANGEN.'))}</span><h2>${e(t('这一阶段，为重要的事留位置。','Make room for what matters.','Raum für das Wesentliche.'))}</h2><p>${e(t('不必一次完成。知道重点，然后慢慢靠近。','Not all at once. Know your focus, then move towards it.','Nicht alles auf einmal. Den Fokus kennen und ihm näherkommen.'))}</p></div><button type="button" class="primary-button" id="horizonNewPhase">${e(t('＋ 新阶段','＋ New phase','＋ Neue Phase'))}</button></header>
      <section class="horizon-phase-card"><div class="horizon-phase-top"><span class="horizon-eyebrow">${e(closed?t('已归档阶段','ARCHIVED PHASE','ARCHIVIERTE PHASE'):t('阶段方向','PHASE FOCUS','PHASENFOKUS'))}</span><label class="horizon-phase-select"><span class="sr-only">${e(t('选择阶段','Choose phase','Phase wählen'))}</span><select id="horizonPhaseSelect"><option value="" ${!p?'selected':''}>${e(t('选择阶段','Choose phase','Phase wählen'))}</option>${data.phases.map(phase=>`<option value="${e(phase.id)}" ${p?.id===phase.id?'selected':''}>${e(phase.name)}${phase.status==='closed'?' · '+e(t('已归档','Archived','Archiviert')):''}</option>`).join('')}</select></label></div>
      ${p?`<h3>${e(p.name)}</h3><p class="horizon-phase-focus">${e(p.focus||t('把这个阶段最想推进的事情写下来。','Write down what matters in this phase.','Festhalten, was in dieser Phase zählt.'))}</p>
      <div class="horizon-phase-meta"><span>${e(dateLabel(p.startDate))} — ${e(dateLabel(p.endDate))}</span><span>${completed} / ${phaseGoals.length} ${e(t('计划已完成','plans completed','Pläne abgeschlossen'))}</span><span>${e(phaseState)}</span></div>
      <div class="horizon-phase-actions">${!closed?`<button type="button" class="secondary-button" id="horizonEditPhase">${e(due?t('调整／延长阶段','Adjust / extend phase','Phase anpassen / verlängern'):t('编辑阶段','Edit phase','Phase bearbeiten'))}</button><button type="button" class="text-button" id="horizonClosePhase">${e(t('阶段回看与归档','Review & archive phase','Phase reflektieren und archivieren'))}</button>${data.currentPhaseId!==p.id?`<button type="button" class="text-button" id="horizonPinPhase">${e(t('置为当前阶段','Pin as current','Als aktuell anheften'))}</button>`:''}`:''}</div>
      ${closed?`<div class="horizon-phase-review"><strong>${e(t('阶段回看','Phase reflection','Phasenrückblick'))}</strong><p>${e(p.review||t('没有额外文字。','No additional writing.','Kein zusätzlicher Text.'))}</p><button type="button" class="secondary-button" id="horizonNextPhase">${e(t('开始下一阶段','Start the next phase','Nächste Phase beginnen'))}</button></div>`:''}`
      :`<div class="horizon-phase-empty">${ctx.icon('sunrise')}<h3>${e(t('接下来几个月，你想靠近什么？','What would you like to move towards?','Was möchtest du in den nächsten Monaten erreichen?'))}</h3><p>${e(t('定一个有起止日期的阶段，再把方向拆成几张计划卡。原有长期事项都保留在下面。','Set a dated phase, then give each direction a plan card. Existing ongoing plans are kept below.','Eine Phase mit Anfang und Ende festlegen, dann Richtungen als Plankarten gestalten. Vorhandene Pläne bleiben unten erhalten.'))}</p></div>`}</section>
      <section class="horizon-section"><header><div><span class="kicker">${e(t('几条方向，慢慢推进','A FEW DIRECTIONS, SMALL STEPS','WENIGE RICHTUNGEN, KLEINE SCHRITTE'))}</span><h3>${e(t('阶段计划','Plans for this phase','Pläne für diese Phase'))}</h3></div>${!closed?`<button type="button" class="secondary-button" id="horizonAddPlan">${e(t('＋ 添加计划','＋ Add plan','＋ Plan hinzufügen'))}</button>`:''}</header><div class="horizon-goal-grid">${phaseGoals.length?phaseGoals.sort((a,b)=>areaName(a.area).localeCompare(areaName(b.area))).map(g=>goalCard(g,closed)).join(''):`<p class="horizon-quiet-empty">${e(t('可以从健康、学习、工作或生活中的一件小事开始。','Start with something in health, learning, work or life.','Mit etwas für Gesundheit, Lernen, Arbeit oder Alltag beginnen.'))}</p>`}</div></section>
      <section class="horizon-section horizon-ongoing"><header><div><span class="kicker">${e(t('不绑阶段，也不会忘','BEYOND A SINGLE PHASE','ÜBER EINE PHASE HINAUS'))}</span><h3>${e(t('长期事项','Ongoing plans','Dauerhafte Vorhaben'))}</h3></div><button type="button" class="text-button" id="horizonAddOngoing">${e(t('＋ 添加事项','＋ Add item','＋ Vorhaben hinzufügen'))}</button></header><div class="horizon-goal-grid">${ongoing.length?ongoing.map(g=>goalCard(g)).join(''):`<p class="horizon-quiet-empty">${e(t('报税、未来安排或暂时不属于某个阶段的计划，可以放在这里。','Tax filing, future dates or plans not tied to a phase belong here.','Steuererklärung, spätere Termine oder Pläne ohne feste Phase finden hier Platz.'))}</p>`}</div></section>
      <div class="horizon-writing-grid"><section class="horizon-monthly"><header><div><span class="kicker">${e(t('一个月，一次回看','ONE MONTH, ONE REFLECTION','EIN MONAT, EIN RÜCKBLICK'))}</span><h3>${e(t('月度复盘','Monthly reflection','Monatsrückblick'))}</h3></div><label><span class="sr-only">${e(t('选择复盘月份','Choose review month','Rückblickmonat wählen'))}</span><input id="horizonReviewMonth" type="month" value="${e(month)}" required></label></header><label class="sr-only" for="horizonMonthlyText">${e(t('月度复盘正文','Monthly reflection text','Text des Monatsrückblicks'))}</label><textarea id="horizonMonthlyText" rows="9" placeholder="${e(t('这个月，什么值得继续？什么需要改变？','What deserves to continue? What needs to change?','Was darf bleiben? Was soll sich ändern?'))}">${e(state().reviews?.[month]||'')}</textarea><footer><span id="horizonMonthlyStatus" role="status">${e(t('自动保存 · 与时间轴共用一份记录','Autosaved · shared with Timeline','Automatisch gespeichert · derselbe Eintrag in der Zeitleiste'))}</span><button type="button" class="text-button" id="horizonMonthTimeline">${e(t('在时间轴回看 →','View in Timeline →','In der Zeitleiste ansehen →'))}</button></footer></section>
      <section class="horizon-note"><header><span class="kicker">${e(t('随手放在这里','KEEP IT HERE','HIER FESTHALTEN'))}</span><h3>${e(t('长期便笺','A longer-term note','Eine längerfristige Notiz'))}</h3></header><label class="sr-only" for="horizonNoteText">${e(t('长期便笺正文','Long-term note text','Text der langfristigen Notiz'))}</label><textarea id="horizonNoteText" maxlength="30000" rows="7" placeholder="${e(t('未来想做的事、还没成形的念头……','Future ideas, things not quite formed yet…','Ideen für später, noch unfertige Gedanken …'))}">${e(data.note)}</textarea><small id="horizonNoteStatus" role="status">${e(t('跨阶段保留 · 自动保存','Kept across phases · autosaved','Bleibt über Phasen hinweg · automatisch gespeichert'))}</small></section></div>
      <details class="horizon-phase-history"><summary>${e(t('阶段推进记录','Phase history','Phasenverlauf'))}</summary>${p?[...p.events].reverse().map(event=>`<p><time>${e(dateLabel(String(event.date).slice(0,10)))}</time><strong>${e(eventText(event))}</strong><span>${e(event.detail)}</span></p>`).join(''):e(t('开始阶段后，这里会留下日期与调整记录。','Dates and changes appear here once you start a phase.','Nach dem Start erscheinen hier Daten und Änderungen.'))}</details>`;
    $('#horizonNewPhase').onclick=()=>editPhase();$('#horizonPhaseSelect').onchange=event=>{selectedPhase=event.target.value;render();};
    $('#horizonBackCurrent')?.addEventListener('click',()=>{selectedPhase=data.currentPhaseId;render();});
    $('#horizonEditPhase')?.addEventListener('click',()=>editPhase(p.id));$('#horizonNextPhase')?.addEventListener('click',()=>editPhase());
    $('#horizonClosePhase')?.addEventListener('click',()=>closePhase(p));$('#horizonPinPhase')?.addEventListener('click',()=>{state().planning.currentPhaseId=p.id;p.events.push({type:'pinned',date:stamp(),detail:''});p.updatedAt=Date.now();commit();});
    $('#horizonAddPlan')?.addEventListener('click',()=>p?editGoal():editPhase());$('#horizonAddOngoing').onclick=()=>editGoal(null,'life',true);
    host.querySelectorAll('[data-edit-goal]').forEach(button=>button.onclick=()=>editGoal(button.dataset.editGoal));
    host.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{
      const goal=(state().longTermGoals||[]).find(g=>g.id===button.closest('[data-goal]').dataset.goal),step=goal?.steps?.find(s=>s.id===button.dataset.step);if(!step)return;
      step.done=!step.done;step.doneAt=step.done?stamp():'';goal.updatedAt=Date.now();goal.events=[...(goal.events||[]),{type:'step',date:stamp(),detail:`${step.done?'✓':'↩'} ${step.text}`}];const stepId=step.id;commit();host.querySelector(`[data-step="${CSS.escape(stepId)}"]`)?.focus({preventScroll:true});
    });
    $('#horizonReviewMonth').onchange=event=>{if(!event.target.value)return;month=event.target.value;$('#horizonMonthlyText').value=state().reviews?.[month]||'';};
    $('#horizonMonthlyText').oninput=event=>{state().reviews[month]=event.target.value;ctx.save();};
    $('#horizonNoteText').oninput=event=>{state().planning={...plan(),note:event.target.value,updatedAt:Date.now()};ctx.save();};
    $('#horizonMonthTimeline').onclick=()=>ctx.openMonth(month);
  }
  root.LifeLedgerLongRange={empty,valid,merge,carry,render};
})(globalThis);
