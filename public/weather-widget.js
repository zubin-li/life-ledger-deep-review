/* Weather presentation: shared by the summary and optional card; data stays owned by TodayExtras. */
(function(root){
  if(!document.getElementById('weatherPlot'))return; // Today cards (web and Mac app)
  const $=s=>document.querySelector(s);
  let plot, model, signature='', resizePending, pointerActive=false;
  const symbols={clear:'☀',cloud:'☁',rain:'☂',snow:'❄',storm:'ϟ'};
  const icons={clear:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',cloud:'<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',rain:'<path d="M16 13V8.5A4.5 4.5 0 0 0 7.2 7 4 4 0 0 0 7 15h10a3 3 0 0 0 0-6"/><path d="M8 19v2M12 18v2M16 19v2"/>',snow:'<path d="M17.5 13A4.5 4.5 0 0 0 16 4.3 6 6 0 0 0 4 9a4 4 0 0 0 3 4"/><path d="M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01"/>',storm:'<path d="M6 16.3A4.5 4.5 0 0 1 7.5 7.6 6 6 0 0 1 19 9a4 4 0 0 1-1 7.6"/><path d="m13 12-3 5h4l-3 5"/>'};
  const locale=lang=>({en:'en-GB',zh:'zh-CN',de:'de-DE'}[lang]||'en-GB');
  // The city's own wall clock right now, "YYYY-MM-DDTHH:MM" (user 10/27): Open-Meteo gives the city's UTC offset.
  const cityNow=data=>Number.isFinite(data.utc_offset_seconds)?new Date(Date.now()+data.utc_offset_seconds*1000).toISOString().slice(0,16):data.current.time.slice(0,16);
  let last=null;
  function dataWindow(data,day){
    const times=data.hourly.time,today=cityNow(data).slice(0,10);
    const here=new Date(),deviceToday=`${here.getFullYear()}-${String(here.getMonth()+1).padStart(2,'0')}-${String(here.getDate()).padStart(2,'0')}`;
    if(day===deviceToday)day=today; // "today" means the city's today, even across the date line
    if(!day||!times.some(time=>time===`${day}T00:00`))day=today; // outside the forecast range: show today
    const start=times.findIndex(time=>time===`${day}T00:00`);
    const hours=times.slice(start,start+25).map((time,i)=>({time,temperature:data.hourly.temperature_2m[start+i],probability:data.hourly.precipitation_probability?.[start+i]??0,code:data.hourly.weather_code?.[start+i]??0})).filter(h=>Number.isFinite(h.temperature));
    const dayTemps=hours.filter(h=>h.time.startsWith(day)).map(h=>h.temperature);
    return {day,isToday:day===today,hours,high:dayTemps.length?Math.max(...dayTemps):null,low:dayTemps.length?Math.min(...dayTemps):null};
  }
  function timeLabel(time){
    const next=time.slice(0,10)!==model.day;
    return `${next?({zh:'次日 ',en:'Next ',de:'Morgen '}[model.language]):''}${time.slice(11,16)}`;
  }
  function showHour(index){
    if(!model)return;index=Math.max(0,Math.min(model.hours.length-1,index));model.index=index;
    const hour=model.hours[index];if(!hour)return;
    const kind=model.kind(hour.code),host=$('#weatherDetail');host.dataset.kind=kind;
    host.replaceChildren();
    for(const [cls,text] of [['weather-symbol',symbols[kind]],['weather-temp',`${Math.round(hour.temperature)}°`],['weather-time',`${model.isToday&&index===model.currentIndex?cityNow(model.data).slice(11,16):timeLabel(hour.time)} · ${model.t(kind)} · ${hour.probability}%`]]){const n=document.createElement('span');n.className=cls;n.textContent=text;host.append(n);}
    const sym=host.querySelector('.weather-symbol');if(sym)sym.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[kind]}</svg>`;
    const input=$('#weatherHour');input.value=String(index);input.setAttribute('aria-valuetext',`${timeLabel(hour.time)} · ${Math.round(hour.temperature)}° · ${hour.probability}%`);
    $('#weatherPlot').setAttribute('aria-label',`${model.city.name} · ${input.getAttribute('aria-valuetext')}`);
    $('#weatherPlot').dataset.hour=hour.time;
  }
  function paint(){
    if(!model||!root.LifeLedgerWidgetUI?.uPlot)return;
    const host=$('#weatherPlot'),card=host.closest('[data-module]');
    if(card.hidden){plot?.destroy();plot=null;signature='';return;}
    const width=Math.floor(host.clientWidth),height=Math.floor(host.clientHeight);
    if(width<100||height<44)return;
    const mini=width<260; // small card: no y axis, the curve gets the width
    const dark=document.documentElement.dataset.theme==='dark';
    const clock=model.isToday?cityNow(model.data):'';
    const key=JSON.stringify([width,height,dark,model.language,model.hours,clock]);
    if(key===signature)return;signature=key;
    plot?.destroy();host.replaceChildren();pointerActive=false;
    const ink=dark?'#9eafbe':'#738495',grid=dark?'rgba(200,220,235,.09)':'rgba(60,90,120,.09)';
    // x axis: the whole day in four quarters, 0 / 6 / 12 / 18 / 24 (user 10/22); a dashed line marks "now".
    const ticks=[0,6,12,18,24].filter(i=>i<model.hours.length);
    const nowAt=model.isToday?Math.min(model.hours.length-1,Number(clock.slice(11,13))+Number(clock.slice(14,16))/60):null;
    const accent=dark?'#72c7ff':'#339de1';
    plot=new root.LifeLedgerWidgetUI.uPlot({width,height,pxAlign:1,padding:[10,mini?12:14,0,mini?12:0],legend:{show:false},select:{show:false},
      cursor:{drag:{x:false,y:false},y:false,points:{size:7,fill:'#fff',stroke:'#249de8',width:2}},
      scales:{x:{time:false},y:{auto:true,range:(_u,min,max)=>[Math.floor(min-2),Math.ceil(max+2)]}},
      series:[{}, {label:'°C',stroke:dark?'#72c7ff':'#339de1',fill:dark?'rgba(83,175,241,.12)':'rgba(72,163,225,.10)',width:2,points:{show:false}}],
      axes:[{stroke:ink,font:'10px -apple-system, system-ui',size:20,grid:{stroke:grid,width:1},ticks:{show:false},splits:()=>ticks,values:(_u,values)=>values.map(i=>`${String(i).padStart(2,'0')}:00`)},
        mini?{show:false}:{stroke:ink,font:'10px -apple-system, system-ui',size:30,space:26,incrs:[1,2,5,10,20],grid:{show:false},ticks:{show:false},values:(_u,values)=>values.map(v=>`${Math.round(v)}°`)}],
      hooks:{draw:[u=>{if(nowAt==null)return;const ctx=u.ctx,x=Math.round(u.valToPos(nowAt,'x',true)),r=devicePixelRatio||1;ctx.save();ctx.strokeStyle=accent;ctx.globalAlpha=.75;ctx.lineWidth=r;ctx.setLineDash([3*r,3*r]);ctx.beginPath();ctx.moveTo(x,u.bbox.top);ctx.lineTo(x,u.bbox.top+u.bbox.height);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;const lo=Math.floor(nowAt),t=lo+1<model.hours.length?model.hours[lo].temperature+(model.hours[lo+1].temperature-model.hours[lo].temperature)*(nowAt-lo):model.hours[lo].temperature,y=u.valToPos(t,'y',true);ctx.fillStyle=accent;ctx.beginPath();ctx.arc(x,y,3.5*r,0,7);ctx.fill();ctx.restore();}],
        setCursor:[u=>{if(u.cursor.idx!=null){if(pointerActive)showHour(u.cursor.idx);else u.setCursor({left:u.valToPos(model.index,'x'),top:0},false);}}]}},
      [model.hours.map((_,i)=>i),model.hours.map(h=>h.temperature)],host);
    plot.over.addEventListener('pointermove',()=>{pointerActive=true;});
    plot.over.addEventListener('mouseleave',()=>{if(pointerActive){pointerActive=false;showHour(model.currentIndex);plot.setCursor({left:plot.valToPos(model.currentIndex,'x'),top:0},false);}});
    showHour(model.index);plot.setCursor({left:plot.valToPos(model.index,'x'),top:0},false);
  }
  root.LifeLedgerWeather={
    dataWindow,
    clear(){plot?.destroy();plot=null;model=null;signature='';$('#weatherPlot').replaceChildren();$('#weatherDetail').replaceChildren();$('#weatherDailyRange').textContent='';$('#heroWeather').hidden=true;},
    select(index){pointerActive=false;showHour(index);if(plot)plot.setCursor({left:plot.valToPos(model.index,'x'),top:0},false);},
    update(data,city,language,t,kind,day){
      last=[data,city,language,t,kind,day];
      const window=dataWindow(data,day),hours=window.hours;if(hours.length<2)return;
      const nowHour=cityNow(data).slice(0,13),same=model?.data===data&&model?.day===window.day,now=hours.findIndex(h=>h.time.slice(0,13)===nowHour),index=now>=0?now:12;
      const pinned=same&&model.index!==model.currentIndex; // the user picked another hour: keep it
      model={data,city,language,t,kind,...window,currentIndex:Math.max(0,index),index:pinned?model.index:Math.max(0,index)};
      const currentAt=data.hourly.time.findIndex(time=>time.slice(0,13)===data.current.time.slice(0,13));
      const temp=Number.isFinite(data.current.temperature_2m)?data.current.temperature_2m:data.hourly.temperature_2m[currentAt];
      const hero=$('#heroWeather');hero.hidden=!Number.isFinite(temp);
      hero.textContent=`${symbols[kind(data.current.weather_code??0)]} ${Math.round(temp)}° · ${city.name}`;
      hero.setAttribute('aria-label',`${city.name} · ${data.current.time} · ${t(kind(data.current.weather_code??0))} · ${Math.round(temp)}°`);
      const range=window.isToday?({zh:'今日',en:'Today',de:'Heute'}[language]||'Today'):new Intl.DateTimeFormat(locale(language),{month:'numeric',day:'numeric'}).format(new Date(`${window.day}T12:00`));
      $('#weatherCityName').textContent=city.name;
      $('#weatherDailyRange').textContent=window.high==null?'':`${range} ↑${Math.round(window.high)}° ↓${Math.round(window.low)}°`;
      const precip=hours.find(h=>(!window.isToday||h.time.slice(0,13)>=nowHour)&&(h.probability>=60||['rain','snow','storm'].includes(kind(h.code))));
      $('#weatherPrecipHint').textContent=precip?`${t(kind(precip.code)==='snow'?'snowSoon':'rainSoon')} · ${timeLabel(precip.time)}`:t('noRain');
      $('#weatherHour').max=String(hours.length-1);
      paint();showHour(model.index);
    }
  };
  $('#weatherPlot').addEventListener('keydown',event=>{
    if(!model||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();
    root.LifeLedgerWeather.select(event.key==='Home'?0:event.key==='End'?model.hours.length-1:model.index+(event.key==='ArrowLeft'?-1:1));
  });
  // Keep the clock, the dashed "now" line and the current hour live between forecast refreshes.
  setInterval(()=>{if(last&&!document.hidden&&!pointerActive)root.LifeLedgerWeather.update(...last);},30000);
  new ResizeObserver(()=>{cancelAnimationFrame(resizePending);resizePending=requestAnimationFrame(paint);}).observe($('#weatherPlot'));
  new MutationObserver(()=>{signature='';requestAnimationFrame(paint);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})(window);
