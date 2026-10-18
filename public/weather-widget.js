/* Weather presentation: shared by the summary and optional card; data stays owned by TodayExtras. */
(function(root){
  const $=s=>document.querySelector(s);
  let plot, model, signature='', resizePending, pointerActive=false;
  const symbols={clear:'☀',cloud:'☁',rain:'☂',snow:'❄',storm:'ϟ'};
  const locale=lang=>({en:'en-GB',zh:'zh-CN',de:'de-DE'}[lang]||'en-GB');
  function dataWindow(data){
    const day=data.current.time.slice(0,10), times=data.hourly.time;
    const firstHour=Number(data.current.time.slice(11,13))<9?'00':'09';
    const start=Math.max(0,times.findIndex(time=>time===`${day}T${firstHour}:00`));
    const hours=times.slice(start,start+25).map((time,i)=>({time,temperature:data.hourly.temperature_2m[start+i],probability:data.hourly.precipitation_probability?.[start+i]??0,code:data.hourly.weather_code?.[start+i]??0}));
    const today=times.flatMap((time,i)=>time.startsWith(day)&&Number.isFinite(data.hourly.temperature_2m[i])?[data.hourly.temperature_2m[i]]:[]);
    return {hours,high:today.length?Math.max(...today):null,low:today.length?Math.min(...today):null};
  }
  function timeLabel(time){
    const next=time.slice(0,10)!==model.data.current.time.slice(0,10);
    return `${next?({zh:'次日 ',en:'Next ',de:'Morgen '}[model.language]):''}${time.slice(11,16)}`;
  }
  function showHour(index){
    if(!model)return;index=Math.max(0,Math.min(model.hours.length-1,index));model.index=index;
    const hour=model.hours[index];if(!hour)return;
    const kind=model.kind(hour.code),host=$('#weatherDetail');host.dataset.kind=kind;
    host.replaceChildren();
    for(const [cls,text] of [['weather-symbol',symbols[kind]],['weather-temp',`${Math.round(hour.temperature)}°`],['weather-time',`${timeLabel(hour.time)} · ${model.t(kind)} · ${hour.probability}%`]]){const n=document.createElement('span');n.className=cls;n.textContent=text;host.append(n);}
    const input=$('#weatherHour');input.value=String(index);input.setAttribute('aria-valuetext',`${timeLabel(hour.time)} · ${Math.round(hour.temperature)}° · ${hour.probability}%`);
    $('#weatherPlot').setAttribute('aria-label',`${model.city.name} · ${input.getAttribute('aria-valuetext')}`);
    $('#weatherPlot').dataset.hour=hour.time;
  }
  function paint(){
    if(!model||!root.LifeLedgerWidgetUI?.uPlot)return;
    const host=$('#weatherPlot'),card=host.closest('[data-module]');
    if(card.hidden){plot?.destroy();plot=null;signature='';return;}
    const width=Math.floor(host.clientWidth),height=Math.floor(host.clientHeight);
    if(width<100||height<50)return;
    const dark=document.documentElement.dataset.theme==='dark';
    const key=JSON.stringify([width,height,dark,model.language,model.hours]);
    if(key===signature)return;signature=key;
    plot?.destroy();host.replaceChildren();pointerActive=false;
    const ink=dark?'#9eafbe':'#738495',grid=dark?'rgba(200,220,235,.09)':'rgba(60,90,120,.09)';
    const ticks=model.hours.map((h,i)=>({h,i})).filter(({h})=>(width<420?['06','12','18']:['09','12','18','00']).includes(h.time.slice(11,13))).map(({i})=>i);
    plot=new root.LifeLedgerWidgetUI.uPlot({width,height,pxAlign:1,padding:[12,38,0,0],legend:{show:false},select:{show:false},
      cursor:{drag:{x:false,y:false},y:false,points:{size:7,fill:'#fff',stroke:'#249de8',width:2}},
      scales:{x:{time:false},y:{auto:true,range:(_u,min,max)=>[Math.floor(min-2),Math.ceil(max+2)]}},
      series:[{}, {label:'°C',stroke:dark?'#72c7ff':'#339de1',fill:dark?'rgba(83,175,241,.12)':'rgba(72,163,225,.10)',width:2,points:{show:false}}],
      axes:[{stroke:ink,font:'10px system-ui',size:23,grid:{show:false},ticks:{show:false},splits:()=>ticks,values:(_u,values)=>values.map(i=>model.hours[i]?timeLabel(model.hours[i].time):'')},
        {stroke:ink,font:'10px system-ui',size:32,space:30,grid:{stroke:grid,width:1},ticks:{show:false},values:(_u,values)=>values.map(v=>`${v}°`)}],
      hooks:{setCursor:[u=>{if(u.cursor.idx!=null){if(pointerActive)showHour(u.cursor.idx);else u.setCursor({left:u.valToPos(model.index,'x'),top:0},false);}}]}},
      [model.hours.map((_,i)=>i),model.hours.map(h=>h.temperature)],host);
    plot.over.addEventListener('pointermove',()=>{pointerActive=true;});
    plot.over.addEventListener('mouseleave',()=>{if(pointerActive){pointerActive=false;showHour(model.currentIndex);plot.setCursor({left:plot.valToPos(model.currentIndex,'x'),top:0},false);}});
    showHour(model.index);plot.setCursor({left:plot.valToPos(model.index,'x'),top:0},false);
  }
  root.LifeLedgerWeather={
    dataWindow,
    clear(){plot?.destroy();plot=null;model=null;signature='';$('#weatherPlot').replaceChildren();$('#weatherDetail').replaceChildren();$('#weatherDailyRange').textContent='';$('#heroWeather').hidden=true;},
    select(index){pointerActive=false;showHour(index);if(plot)plot.setCursor({left:plot.valToPos(model.index,'x'),top:0},false);},
    update(data,city,language,t,kind){
      const window=dataWindow(data),hours=window.hours;if(hours.length<2||hours.some(h=>!Number.isFinite(h.temperature)))return;
      const same=model?.data===data,index=hours.findIndex(h=>h.time.slice(0,13)===data.current.time.slice(0,13));
      model={data,city,language,t,kind,...window,currentIndex:Math.max(0,index),index:same?model.index:Math.max(0,index)};
      const currentAt=data.hourly.time.findIndex(time=>time.slice(0,13)===data.current.time.slice(0,13));
      const temp=Number.isFinite(data.current.temperature_2m)?data.current.temperature_2m:data.hourly.temperature_2m[currentAt];
      const hero=$('#heroWeather');hero.hidden=!Number.isFinite(temp);
      hero.textContent=`${symbols[kind(data.current.weather_code??0)]} ${Math.round(temp)}° · ${city.name}`;
      hero.setAttribute('aria-label',`${city.name} · ${data.current.time} · ${t(kind(data.current.weather_code??0))} · ${Math.round(temp)}°`);
      const range={zh:'今日',en:'Today',de:'Heute'}[language];
      $('#weatherCityName').textContent=city.name;
      $('#weatherDailyRange').textContent=window.high==null?'':`${range} ↑${Math.round(window.high)}° ↓${Math.round(window.low)}°`;
      const precip=hours.find(h=>h.time>=data.current.time&&(h.probability>=60||['rain','snow','storm'].includes(kind(h.code))));
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
  new ResizeObserver(()=>{cancelAnimationFrame(resizePending);resizePending=requestAnimationFrame(paint);}).observe($('#weatherPlot'));
  new MutationObserver(()=>{signature='';requestAnimationFrame(paint);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})(window);
