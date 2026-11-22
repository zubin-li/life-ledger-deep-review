/* Insights: weekly cards distilled from screenshots/notes by any external pipeline.
   Text lives in state.insights so it rides the existing local/cloud sync; the user's marks live
   separately so a re-import never loses them. Original images go where the photo wall keeps media:
   the cloud edition → private R2 (/api/wall/<id>), local web + Mac app → this device's IndexedDB.
   Import format (generic, documented in README):
   {"format":"life-ledger-insights","version":1,"week":"2026-W46","items":[{id,title,core,category?,
    credibility?,top?,quote?,relevance?,review?:{verdict,flaws[],generalisation,boundary,meaning},fact_check?:{status,note,url},
    images?:[{name,data:"data:image/jpeg;base64,…"}]}]} */
(function(root){
  const BIG=1024*1024; // screenshots are tens to hundreds of KB; bigger files are likely photos
  const empty=()=>({weeks:{},marks:{},deleted:{}});
  const str=(v,max)=>typeof v==='string'?v.slice(0,max):'';
  const MEDIA_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function cleanImages(list){
    return (Array.isArray(list)?list:[]).filter(x=>x&&MEDIA_ID.test(x.id)).slice(0,12)
      .map(x=>({id:x.id.toLowerCase(),type:str(x.type,20)||'image/jpeg',size:Number(x.size)||0,w:Number(x.w)||0,h:Number(x.h)||0,thumb:MEDIA_ID.test(x.thumb||'')?x.thumb.toLowerCase():'',shrunk:x.shrunk===true,original:Number(x.original)||0}));
  }
  function cleanItem(raw,week,images){
    if(!raw||typeof raw!=='object'||!str(raw.id,80)||!str(raw.title,300))return null;
    const r=raw.review&&typeof raw.review==='object'?raw.review:null, f=raw.fact_check&&typeof raw.fact_check==='object'?raw.fact_check:null;
    const url=str(f?.url,500), id=`${week}:${str(raw.id,80)}`, cap=str(raw.capturedAt,10);
    return {id,title:str(raw.title,300),core:str(raw.core,2000),category:str(raw.category,40),
      credibility:str(raw.credibility,40),top:raw.top===true,quote:str(raw.quote,400),relevance:str(raw.relevance,1000),
      capturedAt:/^\d{4}-\d{2}-\d{2}$/.test(cap)?cap:'',
      review:r?{verdict:str(r.verdict,20),flaws:Array.isArray(r.flaws)?r.flaws.filter(x=>typeof x==='string').slice(0,5).map(x=>x.slice(0,20)):[],
        generalisation:str(r.generalisation,1000),boundary:str(r.boundary,1000),meaning:str(r.meaning,1500)}:null,
      fact:f?{status:str(f.status,20),note:str(f.note,1000),url:/^https?:\/\//.test(url)?url:''}:null,
      images:cleanImages(images?.[id])};
  }
  function parse(json,images){
    const week=str(json?.week,10);
    if(json?.format!=='life-ledger-insights'||!/^\d{4}-W\d{2}$/.test(week)||!Array.isArray(json.items))throw new Error('invalid-insights');
    const items=json.items.map(i=>cleanItem(i,week,images)).filter(Boolean);
    if(!items.length)throw new Error('invalid-insights');
    return {week,items};
  }
  function data(state){const d=state.insights;if(!(d&&typeof d==='object'&&d.weeks&&d.marks))return empty();if(!d.deleted||typeof d.deleted!=='object')d.deleted={};return d;}
  const live=(d,w)=>(d.weeks[w]?.items||[]).filter(i=>!d.deleted[i.id]);
  // ponytail: whole-week last-writer-wins and per-item marks by updatedAt; enough for one person on a few devices.
  function merge(a,b){
    a=a&&a.weeks?a:empty(); b=b&&b.weeks?b:empty();
    const weeks={...a.weeks}; Object.entries(b.weeks).forEach(([k,w])=>{if(!weeks[k]||Number(w.importedAt||0)>=Number(weeks[k].importedAt||0))weeks[k]=w;});
    const marks={...a.marks}; Object.entries(b.marks).forEach(([k,m])=>{if(!marks[k]||Number(m.updatedAt||0)>=Number(marks[k].updatedAt||0))marks[k]=m;});
    const deleted={...(a.deleted||{}),...(b.deleted||{})};
    return {weeks,marks,deleted};
  }
  function importInto(state,json,now=Date.now(),images){
    const {week,items}=parse(json,images), d=data(state);
    state.insights={weeks:{...d.weeks,[week]:{importedAt:now,items}},marks:{...d.marks},deleted:{...d.deleted}};
    return {week,count:items.length};
  }
  const top=(state,week)=>live(data(state),week).filter(i=>i.top).slice(0,3);
  function remove(state,id,now=Date.now()){const d=data(state);state.insights={weeks:d.weeks,marks:d.marks,deleted:{...d.deleted,[id]:now}};}
  function restore(state,id){const d=data(state),deleted={...d.deleted};delete deleted[id];state.insights={weeks:d.weeks,marks:d.marks,deleted};}

  // ---- weeks: ISO key → Monday..Sunday ----
  function weekRange(key){
    const [y,w]=key.split('-W').map(Number), jan4=new Date(y,0,4,12), mon=new Date(jan4);
    mon.setDate(jan4.getDate()-((jan4.getDay()+6)%7)+(w-1)*7);
    const sun=new Date(mon); sun.setDate(mon.getDate()+6); return [mon,sun];
  }
  const weeksBetween=(a,b)=>Math.round((weekRange(a)[0]-weekRange(b)[0])/(7*864e5));

  // ---- media: content-addressed ids, so re-importing a week stores nothing twice ----
  async function mediaId(blob){
    const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(b=>b.toString(16).padStart(2,'0')).join('');
    return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
  }
  async function shrink(blob){
    const bmp=await createImageBitmap(blob), size={w:bmp.width,h:bmp.height};
    if(blob.size<=BIG){bmp.close?.();return {blob,...size,shrunk:false};}
    // Keep full resolution (text must stay sharp on a computer screen); only cap huge photos at 4000px.
    // WebP q.9 keeps text crisp at ~1/3 of a PNG; browsers that can't encode WebP fall back to JPEG.
    const scale=Math.min(1,4000/Math.max(bmp.width,bmp.height)), c=document.createElement('canvas');
    c.width=Math.round(bmp.width*scale); c.height=Math.round(bmp.height*scale);
    const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); g.drawImage(bmp,0,0,c.width,c.height); bmp.close?.();
    let out=null;
    for(const q of [.9,.85,.8]){out=await new Promise(ok=>c.toBlob(ok,'image/webp',q)); if(!out||out.type!=='image/webp')break; if(out.size<=BIG)break;}
    if(!out||out.type!=='image/webp')out=await new Promise(ok=>c.toBlob(ok,'image/jpeg',.9));
    if(!out||out.size>=blob.size)return {blob,...size,shrunk:false}; // re-encoding didn't help: keep the original
    return {blob:out,w:c.width,h:c.height,shrunk:true};
  }
  const idb=(()=>{let db;const open=ns=>db||=new Promise((ok,no)=>{const r=indexedDB.open('life-ledger-insights'+ns,1);r.onupgradeneeded=()=>r.result.createObjectStore('images',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
    const run=(ns,mode,fn)=>open(ns).then(d=>new Promise((ok,no)=>{const tx=d.transaction('images',mode),q=fn(tx.objectStore('images'));tx.oncomplete=()=>ok(q.result);tx.onerror=tx.onabort=()=>no(tx.error);}));
    return {get:(ns,id)=>run(ns,'readonly',s=>s.get(id)).then(r=>r?.blob||null),put:(ns,id,blob)=>run(ns,'readwrite',s=>s.put({id,blob}))};})();
  const store={
    async put(id,blob){ if(ctx.cloud()){const r=await fetch(`/api/wall/${id}`,{method:'PUT',headers:{'content-type':blob.type||'image/jpeg'},body:blob,credentials:'same-origin'});if(!r.ok)throw new Error('upload '+r.status);} else await idb.put(ctx.ns(),id,blob); },
    async get(id){ if(ctx.cloud()){const r=await fetch(`/api/wall/${id}`,{credentials:'same-origin'});return r.ok?r.blob():null;} return idb.get(ctx.ns(),id); },
  };
  async function storeImages(json){
    const out={}; let big=0, failed=0;
    for(const raw of Array.isArray(json?.items)?json.items:[]){
      const key=`${str(json.week,10)}:${str(raw?.id,80)}`, list=[];
      for(const img of (Array.isArray(raw?.images)?raw.images:[]).slice(0,12)){
        try{
          if(!/^data:image\/(jpeg|png|webp|heic|heif);base64,/.test(img?.data||''))continue;
          const src=await (await fetch(img.data)).blob(), s=await shrink(src), id=await mediaId(s.blob);
          await store.put(id,s.blob); if(s.shrunk)big++;
          list.push({id,type:s.blob.type,size:s.blob.size,w:s.w,h:s.h,shrunk:s.shrunk,original:src.size});
        }catch{failed++;}
      }
      out[key]=list;
    }
    return {images:out,big,failed};
  }

  // ---- view ----
  let ctx, filter={cat:'',verdict:'',q:''};
  let layout=(()=>{try{return localStorage.getItem('life-ledger-insights-layout')==='flat'?'flat':'timeline';}catch{return 'timeline';}})();
  const urls=new Map();
  const t=(zh,en,de)=>ctx.text(zh,en,de), e=v=>ctx.escape(String(v??''));
  const svg=(p,c='')=>`<svg class="ins-ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const IC={
    all:'<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    career:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    people:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    life:'<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
    tips:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    society:'<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    tool:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
    quote:'<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 0-1 1v3c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
    other:'<path d="M12 3l1.9 5.8L20 10.7l-5.8 1.9L12 18.5l-1.9-5.9L4 10.7l6.1-1.9z"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    timeline:'<path d="M12 3v18"/><circle cx="12" cy="7" r="2"/><circle cx="12" cy="17" r="2"/><path d="M15 7h6M3 17h6"/>', grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    trash:'<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
  };
  // Category → icon/colour by common words in zh/en/de; any other category still gets a stable colour.
  const KINDS=[['career',/职业|工作|求职|career|job|work|beruf/i,'blue'],['people',/人际|关系|relation|people|bezieh/i,'coral'],['life',/人生|生活|life|leben|philos/i,'violet'],
    ['tips',/tips?|技巧|窍门|tipp/i,'amber'],['society',/社会|society|gesell|news/i,'sage'],['tool',/工具|tool|werkzeug/i,'blue'],['quote',/摘句|金句|quote|zitat/i,'violet']];
  const COLORS=['blue','sage','violet','amber','coral'];
  function kind(cat){const k=KINDS.find(([,re])=>re.test(cat||''));if(k)return {icon:k[0],color:k[2]};let h=0;for(const ch of cat||'')h=(h*31+ch.charCodeAt(0))|0;return {icon:'other',color:COLORS[Math.abs(h)%5]};}
  const VERDICT={'成立':'sage','部分成立':'amber','不成立':'coral','证据不足':'muted'};
  const fmt=d=>d.toLocaleDateString(ctx.lang(),{month:'short',day:'numeric'});
  function weekLabel(key){
    const n=weeksBetween(ctx.currentWeek(),key), [a,b]=weekRange(key);
    const rel=n===0?t('本周','This week','Diese Woche'):n===1?t('上周','Last week','Letzte Woche'):n>1?t(`${n} 周前`,`${n} weeks ago`,`vor ${n} Wochen`):key;
    return {rel,range:`${fmt(a)} – ${fmt(b)}`,current:n===0};
  }
  const hairline=`<div class="page-art"><div class="ll-art" data-art aria-hidden="true"></div></div>`;
  // Small line drawings, one per section: [ink strokes, tone strokes] on a 64×48 canvas.
  const ART={
    career:['<path d="M6 42h52"/><rect x="10" y="20" width="26" height="18" rx="3"/><path d="M18 20v-4h10v4M10 28h26"/>','<path d="M40 34l6-8 5 4 7-10"/><path d="M54 20h4v4"/>'],
    people:['<path d="M6 42h52"/><circle cx="18" cy="20" r="5"/><path d="M9 38a9 9 0 0 1 18 0"/><circle cx="36" cy="22" r="4.5"/><path d="M28 38a8 8 0 0 1 16 0"/>','<path d="M44 8h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-8l-4 3v-3h-2a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3z"/>'],
    life:['<path d="M4 42h56"/><path d="M8 42l14-20 8 10 6-6 16 16"/>','<circle cx="46" cy="14" r="5"/><path d="M46 4v3M56 14h-3M53 7l-2 2"/>'],
    tips:['<path d="M4 42h56"/><path d="M26 34h12M27 38h10"/><path d="M32 8a11 11 0 0 1 7 19.5c-1.5 1.3-2 2.6-2 4.5H27c0-1.9-.5-3.2-2-4.5A11 11 0 0 1 32 8z"/>','<path d="M12 12l3 3M52 12l-3 3M10 24h4M50 24h4M32 2v2"/>'],
    society:['<path d="M4 42h56"/><path d="M10 42V24h10v18M24 42V14h12v28M40 42V28h12v14"/><path d="M28 20h4M28 26h4M28 32h4"/>','<path d="M44 12a8 8 0 1 0 0-.1"/><path d="M36 12h16M44 4c3 4 3 12 0 16"/>'],
    tool:['<path d="M4 42h56"/><path d="M14 36l14-14"/><path d="M30 14a7 7 0 0 0 8 9l-2 2-6-1-1-6z"/><rect x="8" y="34" width="8" height="5" rx="1.5" transform="rotate(-45 12 36)"/>','<circle cx="46" cy="26" r="6"/><path d="M46 16v3M46 33v3M36 26h3M53 26h3M39 19l2 2M51 31l2 2M53 19l-2 2M41 31l-2 2"/>'],
    quote:['<path d="M4 42h56"/><path d="M32 16c-6-4-14-4-20-2v24c6-2 14-2 20 2 6-4 14-4 20-2V14c-6-2-14-2-20 2zM32 16v24"/>','<path d="M18 6c-2 1-3 3-3 5h3v3h-4v-3M28 6c-2 1-3 3-3 5h3v3h-4v-3"/>'],
    other:['<path d="M4 42h56"/><rect x="14" y="14" width="36" height="24" rx="4"/><path d="M20 22h16M20 28h22"/>','<path d="M50 6l1.5 4.5L56 12l-4.5 1.5L50 18l-1.5-4.5L44 12l4.5-1.5z"/>'],
    '成立':['<path d="M4 42h56"/><path d="M32 6l16 6v10c0 10-7 16-16 20-9-4-16-10-16-20V12z"/>','<path d="M25 23l5 5 9-10"/>'],
    '部分成立':['<path d="M4 42h56"/><path d="M32 8v32M22 40h20M14 14h36"/>','<path d="M14 14l-6 12h12zM50 14l-6 16h12z"/><path d="M8 26a6 3 0 0 0 12 0M44 30a6 3 0 0 0 12 0"/>'],
    '不成立':['<path d="M4 42h56"/><circle cx="26" cy="22" r="12"/><path d="M35 31l10 10"/>','<path d="M21 17l10 10M31 17L21 27"/>'],
    '证据不足':['<path d="M4 42h56"/><circle cx="32" cy="22" r="14" stroke-dasharray="3 4"/>','<path d="M27 18a5 5 0 0 1 10 1c0 3-5 4-5 7M32 31h.01"/>'],
  };
  const art=(key,cls='')=>{const a=ART[key]||ART.other;return `<svg class="ins-art ${cls}" viewBox="0 0 64 48" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g stroke="currentColor" stroke-width="1.3">${a[0]}</g><g stroke="var(--tone, var(--accent))" stroke-width="1.6">${a[1]}</g></svg>`;};
  const VNOTE={
    '成立':()=>t('核查后结论站得住，可以放心参考。','Checked and holds up.','Geprüft, hält stand.'),
    '部分成立':()=>t('有道理，但要注意适用边界。','Has a point, within limits.','Stimmt teilweise; Grenzen beachten.'),
    '不成立':()=>t('核查后不成立：有用的可以保留，误导的直接删掉。','Does not hold up: keep what is useful, delete what misleads.','Hält nicht stand: Nützliches behalten, Irreführendes löschen.'),
    '证据不足':()=>t('证据不够，暂不下结论。','Not enough evidence yet.','Zu wenig Belege.'),
  };
  const allLive=(d,weeks)=>weeks.flatMap(w=>live(d,w));

  function verdictBar(items){
    const counts=Object.keys(VERDICT).map(v=>[v,items.filter(i=>i.review?.verdict===v).length]).filter(x=>x[1]);
    const total=counts.reduce((s,x)=>s+x[1],0); if(!total)return '';
    return `<div class="ins-vbar">${counts.map(([v,n],i)=>`<button type="button" data-verdict="${e(v)}" style="--w:${n/total};--d:${i*80}ms" data-tone="${VERDICT[v]}" class="${filter.verdict===v?'is-active':''}" aria-label="${e(v)} ${n}"></button>`).join('')}</div>
      <div class="ins-vlegend" role="group" aria-label="${e(t('按结论筛选','Filter by verdict','Nach Urteil filtern'))}">${counts.map(([v,n])=>`<button type="button" data-verdict="${e(v)}" data-tone="${VERDICT[v]}" class="ins-vchip${filter.verdict===v?' is-active':''}" aria-pressed="${filter.verdict===v}"><b></b>${e(v)}<small>${n}</small></button>`).join('')}<span class="ins-vhint">${t('点一下只看这一类','Tap to show only these','Antippen zum Filtern')}</span></div>`;
  }
  function hero(d,weeks){
    const w=weeks[0], items=live(d,w), L=weekLabel(w);
    return `<header class="ins-hero">
      <div class="ins-hero-art">${hairline}</div>
      <div class="ins-hero-main">
        <span class="ins-kicker">${t('最新一周','Latest week','Neueste Woche')}</span>
        <h2>${e(L.rel)} <small>${e(L.range)}</small></h2>
        <div class="ins-signals">
          <span>${svg(IC.all)}<b>${items.length}</b>${t('条','items','Einträge')}</span>
          <span>${svg(IC.other)}<b>${items.filter(i=>i.top).length}</b>${t('条重点','top','Top')}</span>
          <span>${svg(IC.image)}<b>${items.reduce((s,i)=>s+(i.images?.length||0),0)}</b>${t('张原图','originals','Originale')}</span>
        </div>
        <div class="ins-verdicts">${verdictBar(allLive(d,weeks))}</div>
      </div></header>`;
  }
  function banner(d,weeks,shown){
    if(!filter.cat&&!filter.verdict)return '';
    const v=filter.verdict, k=filter.cat?kind(filter.cat):null;
    const tone=v?VERDICT[v]:k.color, key=v||(k&&k.icon);
    const title=[filter.cat,v].filter(Boolean).join(' · ');
    const note=v?VNOTE[v]?.()||'':t(`全部 ${allLive(d,weeks).filter(i=>i.category===filter.cat).length} 条，按周排列`,`${allLive(d,weeks).filter(i=>i.category===filter.cat).length} in total`,`${allLive(d,weeks).filter(i=>i.category===filter.cat).length} insgesamt`);
    const delAll=v==='不成立'&&shown.length>1?`<button type="button" class="ins-del-all" data-delete-all>${svg(IC.trash)}${t(`删除这 ${shown.length} 条`,`Delete these ${shown.length}`,`Diese ${shown.length} löschen`)}</button>`:'';
    return `<div class="ins-banner" data-tone="${tone}">${art(key,'ins-banner-art')}<div><strong>${e(title)}</strong><p>${e(note)}</p></div>${delAll}<button type="button" class="ins-banner-x" data-clear aria-label="${e(t('清除筛选','Clear filter','Filter löschen'))}">✕</button></div>`;
  }
  function card(i,n,kept){
    const r=i.review, f=i.fact, k=kind(i.category), bad=r?.verdict==='不成立';
    const rows=r?[[t('归纳是否成立','Does the conclusion follow','Folgt der Schluss'),r.generalisation],[t('适用边界','Where it applies','Gilt wann'),r.boundary],[t('背后反映','What it reveals','Was dahintersteckt'),r.meaning]].filter(x=>x[1]):[];
    const imgs=i.images||[];
    return `<article class="insight-card${i.top?' is-top':''}${bad?' is-false':''}" data-id="${e(i.id)}" data-tone="${k.color}" style="--i:${Math.min(n,10)}">
      ${art(k.icon,'insight-art')}
      <div class="insight-meta">${i.category?`<span class="insight-cat">${svg(IC[k.icon])}${e(i.category)}</span>`:''}${i.credibility?`<span>${e(i.credibility)}</span>`:''}${i.top?`<span class="insight-star">${svg(IC.other)}${t('重点','Top','Top')}</span>`:''}</div>
      <h3>${e(i.title)}</h3>${i.core?`<p class="insight-core">${e(i.core)}</p>`:''}${i.quote?`<blockquote>${e(i.quote)}</blockquote>`:''}
      ${imgs.length?`<div class="insight-shots">${imgs.map((m,j)=>`<button type="button" class="insight-shot" data-shot="${j}" style="aspect-ratio:${m.w&&m.h?`${m.w}/${m.h}`:'3/4'}" aria-label="${e(t('查看原图','View original','Original ansehen'))} ${j+1}"><img alt="" data-media="${e(m.thumb||m.id)}" data-full="${e(m.id)}">${m.shrunk?`<em title="${e(t(`原文件 ${Math.round(m.original/1024)} KB，可能是照片，已压缩`,`Original ${Math.round(m.original/1024)} KB, likely a photo; shrunk`,`Original ${Math.round(m.original/1024)} KB, wohl ein Foto; verkleinert`))}">${t('已压缩','shrunk','verkleinert')}</em>`:''}</button>`).join('')}</div>`:''}
      ${r?`<div class="insight-review"><div class="insight-review-head">${t('辨证分析','Critical check','Kritische Prüfung')}${r.verdict?`<button type="button" class="insight-verdict" data-verdict="${e(r.verdict)}" data-tone="${VERDICT[r.verdict]||'muted'}" title="${e(t('只看这一类','Show only these','Nur diese zeigen'))}">${e(r.verdict)}</button>`:''}${r.flaws.map(x=>`<span class="insight-flaw">${e(x)}</span>`).join('')}</div>${rows.map(([k2,v])=>`<p><b>${e(k2)}：</b>${e(v)}</p>`).join('')}</div>`:''}
      ${f?`<p class="insight-fact"><b>${t('核实','Fact check','Faktencheck')}：${e(f.status)}</b> ${e(f.note)}${f.url?` <a href="${e(f.url)}" target="_blank" rel="noopener noreferrer">${t('来源','Source','Quelle')}</a>`:''}</p>`:''}
      ${bad&&!kept?`<div class="insight-ask">${art('不成立','insight-ask-art')}<span>${t('这条核查后不成立，要删掉吗？','This did not hold up. Delete it?','Hält nicht stand. Löschen?')}</span><button type="button" class="is-danger" data-delete>${t('删除','Delete','Löschen')}</button><button type="button" data-keep>${t('保留','Keep','Behalten')}</button></div>`:''}
      <div class="insight-foot">${i.capturedAt?`<time class="insight-date" datetime="${e(i.capturedAt)}">${svg(IC.calendar)}${e(t(`截图于 ${i.capturedAt}`,`Captured ${i.capturedAt}`,`Aufgenommen ${i.capturedAt}`))}</time>`:''}<button type="button" class="insight-del" data-delete aria-label="${e(t('删除这条','Delete this insight','Diese Erkenntnis löschen'))}" title="${e(t('删除','Delete','Löschen'))}">${svg(IC.trash)}</button></div>
    </article>`;
  }
  const cardOf=(d,i,n)=>card(i,n,d.marks[i.id]?.kept);
  function body(d,weeks,shown){
    if(!shown.length)return `<div class="ins-none">${art(filter.verdict||'other','ins-none-art')}<p>${t('没有符合筛选的洞见','No insights match these filters','Keine passenden Erkenntnisse')}</p></div>`;
    if(layout==='flat')return `<div class="insights-grid">${shown.map((i,n)=>cardOf(d,i,n)).join('')}</div>`;
    return `<div class="ins-timeline">${weeks.map((w,wn)=>{
      const items=shown.filter(i=>i.id.startsWith(w+':')); if(!items.length)return '';
      const L=weekLabel(w);
      return `<section class="ins-week${L.current?' is-current':''}" style="--wi:${Math.min(wn,4)}"><header class="ins-week-head"><i class="ins-dot"></i><strong>${e(L.rel)}</strong><span>${e(L.range)}</span><span class="ins-week-count">${items.length} ${t('条','items','Einträge')}</span></header>
        <div class="insights-grid">${items.map((i,n)=>cardOf(d,i,n)).join('')}</div></section>`;}).join('')}</div>`;
  }
  const io=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){io.unobserve(en.target);loadImg(en.target);}}),{rootMargin:'400px'}):null;
  async function url(id){
    if(!urls.has(id))urls.set(id,store.get(id).then(b=>b?URL.createObjectURL(b):'').catch(()=>''));
    return urls.get(id);
  }
  async function loadImg(img){const u=await url(img.dataset.media);if(u){img.onload=()=>img.classList.add('is-loaded');img.src=u;}else img.closest('.insight-shot')?.classList.add('is-missing');}
  // Lightbox: fits the screen; click the image (or Z) for 1:1 pixels; click outside / Esc closes; ←/→ step.
  function lightbox(list,at){
    let dlg=document.getElementById('insightLightbox');
    if(!dlg){dlg=document.createElement('dialog');dlg.id='insightLightbox';dlg.className='insight-lightbox';document.body.append(dlg);
      dlg.addEventListener('click',ev=>{
        const img=ev.target.closest('.insight-lightbox-stage img'); if(img){zoom(img);return;}
        if(ev.target.closest('[data-lb-close]')||!ev.target.closest('.insight-lightbox-bar'))dlg.close();
      });
      // Keys on document: after a re-render the focused button is gone and dialog keydown would miss them.
      document.addEventListener('keydown',ev=>{if(!dlg.open||ev.metaKey||ev.ctrlKey||ev.altKey)return;
        if(ev.key==='ArrowRight'||ev.key==='ArrowLeft'){ev.preventDefault();dlg._step(ev.key==='ArrowRight'?1:-1);}
        else if(ev.key==='z')dlg._zoom();});}
    const zoom=img=>{const st=dlg.querySelector('.insight-lightbox-stage'), on=!st.classList.contains('is-zoomed');
      st.classList.toggle('is-zoomed',on); img.style.width=on?`${img.naturalWidth/(window.devicePixelRatio||1)}px`:'';
      dlg.querySelector('[data-lb-zoom]').textContent=on?t('适应屏幕','Fit','Einpassen'):t('原尺寸','1:1','1:1');};
    const show=async n=>{at=(n+list.length)%list.length;
      dlg.innerHTML=`<div class="insight-lightbox-stage"><img alt=""></div><div class="insight-lightbox-bar">${list.length>1?`<button type="button" data-lb="-1" aria-label="‹">‹</button>`:''}<span>${at+1} / ${list.length}</span>${list.length>1?`<button type="button" data-lb="1" aria-label="›">›</button>`:''}<button type="button" class="is-wide" data-lb-zoom>${t('原尺寸','1:1','1:1')}</button><button type="button" data-lb-close aria-label="${e(t('关闭','Close','Schließen'))}">✕</button></div>`;
      const img=dlg.querySelector('img'); img.decoding='sync'; img.src=await url(list[at].id);
      dlg.querySelector('[data-lb-zoom]').onclick=()=>zoom(img);
      dlg.querySelectorAll('[data-lb]').forEach(b=>b.onclick=()=>show(at+Number(b.dataset.lb)));};
    dlg._step=d=>show(at+d); dlg._zoom=()=>zoom(dlg.querySelector('.insight-lightbox-stage img'));
    show(at); if(!dlg.open)dlg.showModal();
  }
  function visible(d,weeks){
    const q=filter.q.toLowerCase();
    return weeks.flatMap(w=>live(d,w).slice().sort((a,b)=>(b.top-a.top)||String(b.capturedAt||'').localeCompare(String(a.capturedAt||'')))).filter(i=>(!filter.cat||i.category===filter.cat)&&(!filter.verdict||i.review?.verdict===filter.verdict)
      &&(!q||[i.title,i.core,i.quote,i.category,i.capturedAt,i.review?.generalisation,i.review?.boundary,i.review?.meaning].join(' ').toLowerCase().includes(q)));
  }
  function paintBody(host,animate){
    const d=data(ctx.state()), weeks=Object.keys(d.weeks).sort().reverse(), list=host.querySelector('.ins-body');
    if(!list)return;
    const shown=visible(d,weeks);
    list.innerHTML=`${banner(d,weeks,shown)}<p class="insights-count">${t(`${shown.length} 条`,`${shown.length} items`,`${shown.length} Einträge`)}</p>${body(d,weeks,shown)}`;
    list.classList.remove('is-animating'); if(animate){void list.offsetWidth; list.classList.add('is-animating');}
    list.querySelectorAll('img[data-media]').forEach(img=>io?io.observe(img):loadImg(img));
    host.querySelectorAll('[data-verdict]').forEach(b=>{const on=b.dataset.verdict===filter.verdict;b.classList.toggle('is-active',on);if(b.hasAttribute('aria-pressed'))b.setAttribute('aria-pressed',on);});
    host.querySelector('.ins-verdicts')?.classList.toggle('has-filter',!!filter.verdict);
  }
  function refreshCounts(host){
    const d=data(ctx.state()), weeks=Object.keys(d.weeks).sort().reverse();
    const v=host.querySelector('.ins-verdicts'); if(v)v.innerHTML=verdictBar(allLive(d,weeks));
    host.querySelectorAll('.ins-chip').forEach(b=>{const c=b.dataset.cat;b.querySelector('small').textContent=allLive(d,weeks).filter(i=>!c||i.category===c).length;});
    ctx.changed?.();
  }
  function deleteIds(host,ids){
    const s=ctx.state(); ids.forEach(id=>remove(s,id)); ctx.save();
    const cards=ids.map(id=>host.querySelector(`.insight-card[data-id="${CSS.escape(id)}"]`)).filter(Boolean);
    cards.forEach(c=>{c.style.height=c.offsetHeight+'px';void c.offsetWidth;c.classList.add('is-leaving');});
    setTimeout(()=>{paintBody(host,false);refreshCounts(host);},cards.length?380:0);
    ctx.toast(ids.length>1?t(`已删除 ${ids.length} 条`,`Deleted ${ids.length}`,`${ids.length} gelöscht`):t('已删除 1 条','Deleted 1 insight','1 gelöscht'),
      {actionLabel:t('撤销','Undo','Rückgängig'),onAction:()=>{const s2=ctx.state();ids.forEach(id=>restore(s2,id));ctx.save();paintBody(host,true);refreshCounts(host);}});
  }
  function render(c){
    ctx=c; const host=document.getElementById('insightsWorkspace'); if(!host)return;
    const d=data(ctx.state()), weeks=Object.keys(d.weeks).sort().reverse();
    const cats=[...new Set(allLive(d,weeks).map(i=>i.category).filter(Boolean))];
    if(filter.cat&&!cats.includes(filter.cat))filter.cat='';
    const count=c2=>allLive(d,weeks).filter(i=>!c2||i.category===c2).length;
    const importBtn=`<label class="ins-import">${svg(IC.upload)}<span>${t('导入','Import','Importieren')}</span><input type="file" accept="application/json,.json" hidden></label>`;
    host.innerHTML=weeks.length?`${hero(d,weeks)}
      <div class="insights-toolbar">
        <div class="insights-chips" role="tablist">${['',...cats].map(c3=>{const k=c3?kind(c3):{icon:'all',color:'ink'};return `<button type="button" role="tab" class="ins-chip${filter.cat===c3?' is-active':''}" data-cat="${e(c3)}" data-tone="${k.color}" aria-selected="${filter.cat===c3}">${svg(IC[k.icon])}<span>${c3?e(c3):t('全部','All','Alle')}</span><small>${count(c3)}</small></button>`;}).join('')}</div>
        <div class="insights-filters">
          <div class="ins-seg" role="group" aria-label="${e(t('排列','Layout','Anordnung'))}"><i class="ins-seg-thumb" data-pos="${layout==='flat'?1:0}"></i>
            <button type="button" data-layout="timeline" aria-pressed="${layout==='timeline'}">${svg(IC.timeline)}${t('时间轴','Timeline','Zeitachse')}</button>
            <button type="button" data-layout="flat" aria-pressed="${layout==='flat'}">${svg(IC.grid)}${t('不分周','All at once','Ohne Wochen')}</button></div>
          <label class="ins-search">${svg(IC.search)}<input type="search" data-f="q" value="${e(filter.q)}" placeholder="${e(t('搜索…','Search…','Suchen…'))}"></label>
          ${importBtn}
        </div></div><div class="ins-body"></div>`
      :`<div class="insights-empty"><div class="ins-hero-art">${hairline}</div><strong>${t('还没有洞见','No insights yet','Noch keine Einblicke')}</strong><p>${t('导入每周生成的 JSON 文件（格式见 README），原图会一起保存。','Import a weekly JSON file (format in README); original images are kept.','Wöchentliche JSON-Datei importieren (Format im README); Originalbilder bleiben erhalten.')}</p>${importBtn}</div>`;
    paintBody(host,true);
    host.onclick=ev=>{
      const cat=ev.target.closest('[data-cat]');
      if(cat){filter.cat=cat.dataset.cat;host.querySelectorAll('.ins-chip').forEach(b=>{const on=b===cat;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',on);});paintBody(host,true);return;}
      const vb=ev.target.closest('[data-verdict]');
      if(vb){filter.verdict=filter.verdict===vb.dataset.verdict?'':vb.dataset.verdict;paintBody(host,true);
        if(vb.closest('.insight-card'))host.querySelector('.ins-body')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
      if(ev.target.closest('[data-clear]')){filter.cat='';filter.verdict='';host.querySelectorAll('.ins-chip').forEach(b=>{const on=!b.dataset.cat;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',on);});paintBody(host,true);return;}
      if(ev.target.closest('[data-delete-all]')){deleteIds(host,visible(data(ctx.state()),Object.keys(data(ctx.state()).weeks).sort().reverse()).map(i=>i.id));return;}
      const lay=ev.target.closest('[data-layout]');
      if(lay){layout=lay.dataset.layout;try{localStorage.setItem('life-ledger-insights-layout',layout);}catch{}
        host.querySelector('.ins-seg-thumb').dataset.pos=layout==='flat'?1:0; host.querySelectorAll('[data-layout]').forEach(b=>b.setAttribute('aria-pressed',b===lay)); paintBody(host,true);return;}
      const shot=ev.target.closest('[data-shot]');
      // Gallery over every visible screenshot in page order, so ←/→ also cross cards (like Photos).
      if(shot){const all=[...host.querySelectorAll('.insight-shot')];lightbox(all.map(b=>({id:b.querySelector('img').dataset.full})),all.indexOf(shot));return;}
      const del=ev.target.closest('[data-delete]');
      if(del){deleteIds(host,[del.closest('.insight-card').dataset.id]);return;}
      const keep=ev.target.closest('[data-keep]');
      if(keep){const cardEl=keep.closest('.insight-card'),id=cardEl.dataset.id,s=ctx.state(),cur=data(s);
        s.insights={weeks:cur.weeks,marks:{...cur.marks,[id]:{...(cur.marks[id]||{mark:''}),kept:true,updatedAt:Date.now()}},deleted:cur.deleted};ctx.save();
        const ask=cardEl.querySelector('.insight-ask');ask.classList.add('is-leaving');setTimeout(()=>ask.remove(),300);return;}
    };
    let qTimer;
    host.querySelectorAll('[data-f]').forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',()=>{
      filter[el.dataset.f]=el.value; if(el.tagName==='INPUT'){clearTimeout(qTimer);qTimer=setTimeout(()=>paintBody(host,false),160);} else paintBody(host,true);
    }));
    host.querySelector('.ins-import input')?.addEventListener('change',async ev=>{
      const file=ev.target.files?.[0]; if(!file)return;
      try{await importJson(JSON.parse(await file.text()));}catch{ctx.toast(t('文件格式不对，需要 life-ledger-insights 格式','Not a life-ledger-insights file','Keine life-ledger-insights-Datei'));}
    });
    root.dispatchEvent(new Event("insights-rendered"));
  }
  async function importJson(json){
    parse(json); // validate before storing any image
    ctx.toast(t('正在导入，原图保存中…','Importing, saving originals…','Importiere, Originale werden gespeichert…'));
    const {images,big,failed}=await storeImages(json);
    const r=importInto(ctx.state(),json,Date.now(),images); ctx.save();
    const extra=[big?t(`${big} 张超过 1MB（可能是照片），已压缩`,`${big} over 1 MB (likely photos), shrunk`,`${big} über 1 MB (wohl Fotos), verkleinert`):'',failed?t(`${failed} 张没保存成功`,`${failed} could not be saved`,`${failed} nicht gespeichert`):''].filter(Boolean).join('；');
    ctx.toast(t(`已导入 ${r.week}：${r.count} 条`,`Imported ${r.week}: ${r.count} items`,`${r.week} importiert: ${r.count}`)+(extra?` · ${extra}`:''));
    render(ctx); ctx.changed?.();
    return {...r,big,failed};
  }
  const api={parse,merge,importInto,top,remove,restore,render,data,importJson,weekRange};
  root.LifeLedgerInsights=api;
})(typeof window!=='undefined'?window:globalThis);
