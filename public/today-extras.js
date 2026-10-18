/* Optional Today widgets. No framework; reuse the existing registry and media store. */
(function (root) {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const copy = {
    en: { mood: "Mood", heatmap: "Habit rhythm", green: "Emerald", spectrum: "Red to blue", wall: "Photo wall", addMedia: "Add media", wallEmpty: "Your own little window. Add photos, GIFs or a video.", play: "Play", pause: "Pause", remove: "Remove", weather: "Weather", location: "Location", city: "City", search: "Search", loading: "Loading…", unavailable: "Could not refresh. Check your connection and try again.", chooseCity: "Choose a city to show its weather.", noCity: "No matching city found.", clear: "Clear", cloud: "Cloudy", rain: "Rain", snow: "Snow", storm: "Thunderstorm", rainSoon: "Rain expected", snowSoon: "Snow expected", noRain: "No precipitation forecast in the next 24 hours", less: "Less", more: "More", local: "Stored on this device; not included in daily-photo backups.", invalidMedia: "Use JPEG, PNG, WebP, GIF or a playable video, up to 50 MB each (20 items / 250 MB total).", storageError: "Could not save media. Storage may be full or unavailable.", removeConfirm: "Remove this item from the photo wall?", cached: "Saved forecast · offline", updated: "Updated", prev: "Previous media", next: "Next media", hour: "Forecast hour", palette: "Heatmap palette" },
    zh: { mood: "心情", heatmap: "习惯热力图", green: "翡翠绿", spectrum: "红到蓝", wall: "照片墙", addMedia: "添加媒体", wallEmpty: "留一扇自己的小窗：放入照片、GIF 或视频。", play: "循环播放", pause: "暂停", remove: "移除", weather: "天气", location: "设置地点", city: "城市", search: "搜索", loading: "正在加载……", unavailable: "刷新失败，请检查网络后重试。", chooseCity: "选择城市后显示当地天气。", noCity: "未找到匹配的城市。", clear: "晴", cloud: "多云", rain: "下雨", snow: "下雪", storm: "雷雨", rainSoon: "预计降雨", snowSoon: "预计降雪", noRain: "未来 24 小时暂未预报降水", less: "少", more: "多", local: "保存在本机；暂不包含在每日照片备份中。", invalidMedia: "支持 JPEG、PNG、WebP、GIF 和可播放视频；每个不超过 50 MB，共 20 项 / 250 MB。", storageError: "媒体保存失败，存储空间可能已满或不可用。", removeConfirm: "从照片墙移除这项媒体？", cached: "已保存预报 · 离线", updated: "更新于", prev: "上一项媒体", next: "下一项媒体", hour: "预报时间", palette: "热力图配色" },
    de: { mood: "Stimmung", heatmap: "Gewohnheitsrhythmus", green: "Smaragd", spectrum: "Rot bis Blau", wall: "Fotowand", addMedia: "Medien hinzufügen", wallEmpty: "Dein eigenes Fenster: Fotos, GIFs oder Videos hinzufügen.", play: "Abspielen", pause: "Pause", remove: "Entfernen", weather: "Wetter", location: "Ort wählen", city: "Stadt", search: "Suchen", loading: "Wird geladen…", unavailable: "Aktualisierung fehlgeschlagen. Verbindung prüfen und erneut versuchen.", chooseCity: "Wähle eine Stadt für die Wettervorhersage.", noCity: "Keine passende Stadt gefunden.", clear: "Klar", cloud: "Bewölkt", rain: "Regen", snow: "Schnee", storm: "Gewitter", rainSoon: "Regen erwartet", snowSoon: "Schnee erwartet", noRain: "Kein Niederschlag in den nächsten 24 Stunden vorhergesagt", less: "Weniger", more: "Mehr", local: "Nur auf diesem Gerät; nicht in täglichen Foto-Backups enthalten.", invalidMedia: "JPEG, PNG, WebP, GIF oder abspielbare Videos; bis 50 MB je Datei (20 Dateien / 250 MB insgesamt).", storageError: "Speichern fehlgeschlagen. Speicher voll oder nicht verfügbar.", removeConfirm: "Dieses Medium aus der Fotowand entfernen?", cached: "Gespeicherte Prognose · offline", updated: "Aktualisiert", prev: "Vorheriges Medium", next: "Nächstes Medium", hour: "Vorhersagezeit", palette: "Heatmap-Farben" },
  };
  Object.assign(copy.en,{blue:'Ocean blue',cardSettings:'Card settings',done:'Done',size:'Size',showCard:'Show card',settingsHint:'Changes save automatically. Cards only move in edit mode.',settingsAction:'Press to configure this card',editWeather:'Edit cards → Weather to choose a city.'});
  Object.assign(copy.zh,{blue:'海洋蓝',cardSettings:'卡片设置',done:'完成',size:'卡片尺寸',showCard:'显示卡片',settingsHint:'设置自动保存。仅在编辑卡片时可以移动和配置。',settingsAction:'点按设置这张卡片',editWeather:'进入「编辑卡片」，点按天气卡片设置城市。'});
  Object.assign(copy.de,{blue:'Ozeanblau',cardSettings:'Karteneinstellungen',done:'Fertig',size:'Größe',showCard:'Karte anzeigen',settingsHint:'Wird automatisch gespeichert. Karten lassen sich nur im Bearbeitungsmodus bewegen und konfigurieren.',settingsAction:'Drücken, um diese Karte einzustellen',editWeather:'Karten bearbeiten → Wetter: Stadt auswählen.'});
  let language = "en", days = [], selectedDate = "", wallRows = [], wallIndex = 0;
  let wallTimer, wallVisible = false, wallPlaying = false, wallUrl, wallLoaded = false, lastReduced = false;
  let city, forecast, weatherBusy = false, weatherStamp = 0, searchAbort, pickerSignature = '';
  let settingsId = '', settingsSource;
  let ignoreSettingsClick = false, cardPointerStart;
  const t = key => (copy[language] || copy.en)[key] || key;
  const reduced = () => document.documentElement.matches('.motion-reduced,.motion-off') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visible = card => card && !card.hidden && !card.classList.contains('is-widget-hidden');
  const editing = () => root.LifeLedgerLayoutEngine.isEditMode();
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  async function publicJson(url, signal) {
    const controller=new AbortController(), abort=()=>controller.abort();
    signal?.addEventListener('abort',abort,{once:true});
    const timeout=setTimeout(abort,12000);
    try {
      const response=await fetch(url,{signal:controller.signal,credentials:'omit'});
      if(!response.ok)throw new Error(`Weather ${response.status}`);
      return await response.json();
    } finally {clearTimeout(timeout);signal?.removeEventListener('abort',abort);}
  }
  const wallStore = root.LifeLedgerPhotoMemories.createBlobStore("life-ledger-wall");
  city = read("life-ledger-weather-city");
  if (city && (!Number.isFinite(city.latitude) || !Number.isFinite(city.longitude))) city = null;

  function labels() {
    document.querySelectorAll('[data-extra-label]').forEach(node => { node.textContent = t(node.dataset.extraLabel); });
    const moodTitle=$('[data-module="mood"] .module-title'),question=$('#todayMoodHeading');
    if(moodTitle&&question)moodTitle.textContent=question.textContent;
    $('#wallPlay').textContent = t(wallPlaying ? 'pause' : 'play');
    for (const [id, key] of [['wallPrev','prev'],['wallNext','next'],['weatherHour','hour'],['heatmapPalette','palette']]) $(`#${id}`).setAttribute('aria-label', t(key));
    const picker=$('#addTodayWidget'), text={en:'Add widget',zh:'添加组件',de:'Widget hinzufügen'}[language];
    picker.setAttribute('aria-label',text);picker.hidden=document.body.dataset.activeView!=='today'||!editing();
    picker.textContent=`＋ ${text}`;
    root.LifeLedgerWidgetGallery.setLanguage(language);
  }
  function heatmap(card) {
    const month=selectedDate.slice(0,7);
    const monthDays=days.filter(day=>day.date.startsWith(month));
    const widget=root.LifeLedgerLayoutEngine.getLayout().widgets.find(w=>w.type==='heatmap');
    const palette=widget?.settings.palette||read('life-ledger-heatmap-palette')||'green';
    const host = $('#habitHeatmap'); host.replaceChildren();
    const locale={en:'en-GB',zh:'zh-CN',de:'de-DE'}[language];
    $('#heatmapMonth').textContent=month?new Intl.DateTimeFormat(locale,{year:'numeric',month:'short'}).format(new Date(`${month}-01T12:00:00`)):'';
    const weekdays={en:['M','T','W','T','F','S','S'],zh:['一','二','三','四','五','六','日'],de:['M','D','M','D','F','S','S']}[language];
    $('#heatmapWeekdays').replaceChildren(...weekdays.map(day=>{const s=document.createElement('span');s.textContent=day;return s;}));
    const offset=month?(new Date(`${month}-01T12:00:00`).getDay()+6)%7:0;
    for(let i=0;i<offset;i++){const blank=document.createElement('span');blank.className='heatmap-spacer';blank.setAttribute('aria-hidden','true');host.append(blank);}
    for (const day of monthDays) {
      const ratio = day.total && !day.future ? Math.min(1, Math.max(0, day.done / day.total)) : 0;
      const level = ratio ? Math.ceil(ratio * 8) : 0;
      const cell = document.createElement('span');
      cell.className = 'heatmap-day'; cell.dataset.level = String(level); cell.dataset.date = day.date;
      const color = palette === 'spectrum' ? `hsl(${8 + level * 26} 75% 53%)` : palette==='blue'?'#258fe5':'#00ad7c';
      cell.style.background = level ? `color-mix(in srgb, ${color} ${20 + level * 10}%, var(--desk-surface))` : 'var(--heatmap-empty)';
      cell.title = `${day.date} · ${day.done}/${day.total} · ${Math.round(ratio*100)}%`;
      cell.setAttribute('role','listitem'); cell.setAttribute('aria-label',cell.title); cell.tabIndex = 0;
      if (day.date === selectedDate) cell.classList.add('is-today');
      if(day.future){cell.classList.add('is-future');cell.title=`${day.date} · —`;cell.setAttribute('aria-label',cell.title);}
      host.append(cell);
    }
    // Legend uses the same colours as the cells (text block glyphs rendered as garbled boxes).
    const swatch=level=>{const c=palette==='spectrum'?`hsl(${8+level*26} 75% 53%)`:palette==='blue'?'#258fe5':'#00ad7c';const s=document.createElement('i');s.className='heatmap-swatch';s.style.background=level?`color-mix(in srgb, ${c} ${20+level*10}%, var(--desk-surface))`:'var(--heatmap-empty)';return s;};
    const label=text=>{const s=document.createElement('span');s.textContent=text;return s;};
    $('#heatmapDescription').replaceChildren(label(t('less')),...[0,2,4,6,8].map(swatch),label(t('more')));
  }
  function closeSettings(){const dialog=$('#widgetSettings');if(dialog.open)dialog.close();}
  function openSettings(card){
    if(!editing())return;
    const widget=root.LifeLedgerLayoutEngine.getLayout().widgets.find(w=>w.type===card.dataset.module);
    if(!widget)return;settingsId=widget.id;settingsSource=card;
    $('#widgetSettingsTitle').textContent=copy[language][widget.type]||card.querySelector('.module-title')?.textContent||widget.type;
    const allowed=root.LifeLedgerLayoutEngine._allowedWidgetSizes(widget);
    for(const option of $('#widgetSettingsSize').options){option.hidden=!allowed.includes(option.value);option.disabled=option.hidden;}
    $('#widgetSettingsSize').disabled=allowed.length===1;
    $('#widgetSettingsSize').value=widget.size==='large'&&widget.settings.shape==='square'?'square':widget.size;
    $('#widgetSettingsVisible').checked=!widget.hidden;$('#widgetSettingsVisible').disabled=widget.type==='habits';
    $('#heatmapSettings').hidden=widget.type!=='heatmap';$('#weatherSettings').hidden=!['weather','summary'].includes(widget.type);
    $('#heatmapPalette').value=widget.settings.palette||read('life-ledger-heatmap-palette')||'green';
    $('#weatherCity').value=city?.name||'';$('#weatherSearchStatus').textContent='';
    $('#weatherCities').replaceChildren();
    $('#widgetSettings').showModal();
  }
  function changeCard(change){
    if(!editing()||!$('#widgetSettings').open)return;
    const layout=root.LifeLedgerLayoutEngine.getLayout(),widget=layout.widgets.find(w=>w.id===settingsId);
    if(!widget)return;change(widget);root.LifeLedgerLayoutEngine.setLayout(layout,widget.id);heatmap($('[data-module="heatmap"]'));
  }
  function syncEditing(){
    if(!editing())closeSettings();labels();
    $('#todayView').querySelectorAll(':scope > [data-module]').forEach(card=>{
      if(editing()){card.tabIndex=0;card.setAttribute('aria-haspopup','dialog');card.setAttribute('aria-label',`${card.querySelector('.module-title')?.textContent||card.dataset.module} · ${t('settingsAction')}`);}
      else{card.removeAttribute('tabindex');card.removeAttribute('aria-haspopup');card.removeAttribute('aria-label');}
    });
  }
  function mood(card) {
    const meta = $('.today-stage-meta'); if (!meta) return;
    const standalone = visible(card);
    const independent=document.documentElement.hasAttribute('data-workspace');
    const destination = standalone || independent ? $('#standaloneMood') : $('[data-module="summary"] .today-stage-header');
    if (meta.parentElement !== destination) {
      if (standalone || independent) destination.append(meta);
      else destination.insertBefore(meta, destination.querySelector('.module-collapse-toggle'));
    }
    $('[data-module="summary"]').classList.toggle('has-standalone-mood', standalone || independent);
    if(independent && !standalone)meta.hidden=true;
    if (!standalone) {
      const summary = $('[data-module="summary"]');
      root.LifeLedgerWidgetRegistry.get('summary').render({element:summary,size:summary.dataset.widgetSize});
    }
    if (standalone) {
      meta.hidden = false; meta.classList.remove('is-web-mood');
      $('#quickMood').hidden = false;
      $('.today-mood-heading').hidden = true;
      card.querySelector('.module-title').textContent=$('#todayMoodHeading').textContent;
      $('#inspectorMoodReason').hidden = card.dataset.widgetSize === 'small' || !$('#inspectorMoodReason').textContent.trim();
    }
    const review=$('#openDayDetail'),header=$('[data-module="reflection"] .module-header');
    if(review&&header&&review.parentElement!==header)header.append(review);
    if(review)review.hidden=false;
  }
  function renderWall() {
    const stage = $('#wallStage'); stage.querySelector('video')?.pause(); stage.replaceChildren();
    if (wallUrl) { URL.revokeObjectURL(wallUrl); wallUrl = null; }
    const row = wallRows[wallIndex];
    if (row) {
      const isVideo = row.type.startsWith('video/');
      const media = document.createElement(isVideo ? 'video' : 'img');
      const blob = reduced() && row.poster ? row.poster : row.blob;
      wallUrl = URL.createObjectURL(blob); media.src = wallUrl;
      if (isVideo) {
        media.muted = true; media.loop = true; media.playsInline = true; media.controls = true; media.preload = 'metadata';
        if (wallPlaying && wallVisible && !reduced()) media.play().catch(() => {});
      } else media.alt = row.name;
      stage.append(media);
    } else { const empty = document.createElement('p'); empty.textContent = t('wallEmpty'); stage.append(empty); }
    $('#wallCount').textContent = wallRows.length ? `${wallIndex + 1} / ${wallRows.length}` : '0 / 0';
    $('#wallPrev').disabled = $('#wallNext').disabled = wallRows.length < 2;
    $('#wallRemove').disabled = !row;
    $('#wallPlay').disabled = !row || reduced();
    $('#wallPlay').textContent = t(wallPlaying ? 'pause' : 'play');
    syncWallTimer();
  }
  function syncWallTimer() {
    clearTimeout(wallTimer);
    if (!wallPlaying || !wallVisible || document.hidden || reduced()) { $('#wallStage video')?.pause(); return; }
    $('#wallStage video')?.play().catch(() => {});
    if (wallRows.length > 1) wallTimer = setTimeout(() => { wallIndex = (wallIndex + 1) % wallRows.length; renderWall(); }, 8000);
  }
  async function addFiles(files) {
    $('#wallStatus').textContent = t('loading');
    try {
      if (wallRows.length + files.length > 20 || wallRows.reduce((sum,r) => sum+r.blob.size,0) + files.reduce((sum,f) => sum+f.size,0) > 250*1024*1024) throw new Error(t('invalidMedia'));
      // Validate the whole selection first; unsupported files do not silently enter the library.
      const prepared = [];
      for (const file of files) {
        const image = /^image\/(jpeg|png|webp|gif)$/.test(file.type);
        const video = /^video\/(mp4|webm|quicktime)$/.test(file.type) && document.createElement('video').canPlayType(file.type);
        if ((!image && !video) || !file.size || file.size > 50*1024*1024) throw new Error(t('invalidMedia'));
        let poster = null;
        if (image) {
          let bitmap;
          try { bitmap = await createImageBitmap(file); } catch { throw new Error(t('invalidMedia')); }
          if (file.type === 'image/gif') {
          const canvas = document.createElement('canvas'); const scale = Math.min(1, 1200/bitmap.width, 1200/bitmap.height);
          canvas.width = bitmap.width*scale; canvas.height = bitmap.height*scale;
          canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
          poster = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
          }
          bitmap.close();
        }
        prepared.push({ id: crypto.randomUUID(), name: file.name, type: file.type, blob: file, poster, created: Date.now() });
      }
      for (const row of prepared) {
        await wallStore.put(row); wallRows.push(row);
      }
      wallIndex = Math.max(0, wallRows.length-files.length); renderWall(); $('#wallStatus').textContent = t('local');
    } catch (error) { renderWall(); $('#wallStatus').textContent = error.message === t('invalidMedia') ? error.message : t('storageError'); }
    finally { $('#wallFiles').value = ''; }
  }
  function weatherKind(code) {
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code >= 95) return 'storm';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    return code > 1 ? 'cloud' : 'clear';
  }
  function hourlyData(data) {
    if (!data?.current?.time || !Array.isArray(data.hourly?.time)) throw new Error('Invalid forecast');
    const start = Math.max(0, data.hourly.time.findIndex(time => time >= data.current.time.slice(0,13)+':00'));
    return data.hourly.time.slice(start,start+24).map((time,i) => {
      const at = start+i; const temp = data.hourly.temperature_2m?.[at];
      if (!Number.isFinite(temp)) throw new Error('Invalid temperature');
      return { time, temperature: temp, probability: Number(data.hourly.precipitation_probability?.[at] || 0), rain: Number(data.hourly.precipitation?.[at] || 0), snow: Number(data.hourly.snowfall?.[at] || 0), code: Number(data.hourly.weather_code?.[at] || 0) };
    });
  }
  function renderWeather() {
    if (!forecast) return;
    root.LifeLedgerWeather.update(forecast,city,language,t,weatherKind);
  }
  function renderWeatherDetailOnly(index) {
    root.LifeLedgerWeather.select(index);
  }
  function weatherStatus(text, attention=false) {
    const status=$('#weatherStatus');status.textContent=text;
    // Freshness is available on demand; stale/offline/error notices stay visible.
    status.hidden=!attention;
    $('#weatherPlot').title=text;
  }
  async function loadWeather(force=false) {
    if (!city || weatherBusy || (!visible($('[data-module="weather"]'))&&!visible($('[data-module="summary"]')))) return;
    const cache=read('life-ledger-weather-cache');
    if (!force && cache?.city===`${city.latitude},${city.longitude}` && Date.now()-cache.stamp<30*60*1000) { try { hourlyData(cache.data); forecast=cache.data; weatherStamp=cache.stamp; renderWeather(); weatherStatus(`${t('updated')} ${forecast.current.time.slice(11,16)}`); return; } catch {} }
    if (!forecast && cache?.city===`${city.latitude},${city.longitude}`) { try { hourlyData(cache.data);forecast=cache.data;weatherStamp=cache.stamp; } catch {} }
    if (!force && forecast && Date.now()-weatherStamp<30*60*1000) return;
    const requestedCity=city;
    weatherBusy=true; weatherStatus(t('loading'),true);
    try {
      const url=new URL('https://api.open-meteo.com/v1/forecast');
      url.search=new URLSearchParams({latitude:city.latitude,longitude:city.longitude,current:'temperature_2m,weather_code',hourly:'temperature_2m,precipitation_probability,precipitation,snowfall,weather_code',forecast_days:'2',timezone:'auto'});
      const data=await publicJson(url);hourlyData(data);if(city!==requestedCity)return;forecast=data;weatherStamp=Date.now();
      try{save('life-ledger-weather-cache',{city:`${city.latitude},${city.longitude}`,stamp:weatherStamp,data});}catch{}
      $('#weatherHour').value='0'; renderWeather(); weatherStatus(`${t('updated')} ${data.current.time.slice(11,16)}`);
    } catch { if(forecast) {renderWeather();weatherStatus(t('cached'),true);}else weatherStatus(t('unavailable'),true); }
    finally { weatherBusy=false; if(city!==requestedCity)void loadWeather(true); }
  }
  async function searchCities(event) {
    event.preventDefault();if(!editing()||!$('#widgetSettings').open)return;const name=$('#weatherCity').value.trim();if(name.length<2)return;
    searchAbort?.abort();searchAbort=new AbortController();$('#weatherSearchStatus').textContent=t('loading');
    try {
      const data=await publicJson(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({name,count:'5',language,format:'json'})}`,searchAbort.signal);$('#weatherCities').replaceChildren();
      const places=(data.results||[]).filter(place=>Number.isFinite(place.latitude)&&Number.isFinite(place.longitude));
      if(places.length){
      const select=document.createElement('select');select.setAttribute('aria-label',t('city'));
      select.append(new Option(t('chooseCity'),''));
      for(const [index,place] of places.entries()) {
        if(!Number.isFinite(place.latitude)||!Number.isFinite(place.longitude))continue;
        select.append(new Option([place.name,place.admin1,place.country].filter(Boolean).join(' · '),String(index)));
      }
      select.addEventListener('change',()=>{if(!editing()||!$('#widgetSettings').open||select.value==='')return;const place=places[Number(select.value)];city={name:place.name,latitude:place.latitude,longitude:place.longitude};try{save('life-ledger-weather-city',city);}catch{}weatherEmpty($('[data-module="weather"]'));forecast=null;root.LifeLedgerWeather.clear();$('#weatherCities').replaceChildren();$('#weatherCity').value=city.name;$('#weatherSearchStatus').textContent=city.name;void loadWeather(true);});
      $('#weatherCities').append(select);
      }
      $('#weatherSearchStatus').textContent=places.length?'':t('noCity');
    } catch(error) {if(error.name!=='AbortError')$('#weatherSearchStatus').textContent=t('unavailable');}
  }
  // No city yet: one centred prompt with a direct action instead of a blank sky panel.
  function weatherEmpty(element) {
    let box=element.querySelector('.weather-empty');
    if(!box){
      box=document.createElement('div');box.className='weather-empty';
      box.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.4-6-10a6 6 0 1 1 12 0c0 4.6-6 10-6 10Z"/><circle cx="12" cy="11" r="2.2"/></svg><p></p><button type="button" class="weather-empty-action"></button>';
      box.querySelector('button').addEventListener('click',()=>{
        if(!editing())$('#editLayoutToggle')?.click();
        requestAnimationFrame(()=>openSettings(element));
      });
      element.querySelector('.module-body').prepend(box);
    }
    box.querySelector('p').textContent=t('chooseCity');
    box.querySelector('button').textContent=t('location');
    box.hidden=Boolean(city);element.classList.toggle('has-weather-empty',!city);
    if(!city)$('#weatherStatus').textContent='';
  }
  function register() {
    for(const type of ['mood','heatmap','wall','weather'])root.LifeLedgerWidgetRegistry.register({
      id:`today-${type}`,type,allowedSizes:type==='mood'?['small','medium']:['small','medium','large'],fixedShape:type==='mood'?'wide':null,defaultSize:['wall','weather'].includes(type)?'large':type==='mood'?'small':'medium',defaultPlacement:{x:0,y:7},
      render({element,size}) {
        element.dataset.widgetSize=size;
        if(type==='mood')mood(element);
        if(type==='heatmap')heatmap(element);
        if(type==='weather'&&visible(element)) {weatherEmpty(element);if(city)void loadWeather();}
        if(type==='wall'&&visible(element)&&!wallLoaded){wallLoaded=true;wallStore.all().then(rows=>{wallRows=rows.sort((a,b)=>a.created-b.created);renderWall();$('#wallStatus').textContent=t('local');}).catch(()=>{wallLoaded=false;$('#wallStatus').textContent=t('storageError');});}
      },
    });
  }
  root.LifeLedgerTodayExtras={
    update(data){language=copy[data.language]?data.language:'en';days=data.days;selectedDate=data.selectedDate;labels();heatmap($('[data-module="heatmap"]'));if(forecast)renderWeather();else if(city)void loadWeather();const motion=reduced();if(motion!==lastReduced){if(motion)wallPlaying=false;lastReduced=motion;renderWall();}},
    weatherKind,hourlyData,
  };
  $('#heatmapPalette').value=read('life-ledger-heatmap-palette')||'green';
  $('#heatmapPalette').addEventListener('change',()=>changeCard(widget=>{widget.settings={...widget.settings,palette:$('#heatmapPalette').value};}));
  $('#widgetSettingsSize').addEventListener('change',()=>changeCard(widget=>{const size=$('#widgetSettingsSize').value;widget.size=size==='square'?'large':size;widget.settings={...widget.settings,shape:size==='square'?'square':'wide'};}));
  $('#widgetSettingsVisible').addEventListener('change',()=>changeCard(widget=>{if(widget.type!=='habits')widget.hidden=!$('#widgetSettingsVisible').checked;}));
  $('#widgetSettingsClose').addEventListener('click',closeSettings);
  $('#widgetSettings').addEventListener('keydown',event=>event.stopPropagation());
  $('#widgetSettings').addEventListener('close',()=>{searchAbort?.abort();(settingsSource&&!settingsSource.hidden?settingsSource:$('#addTodayWidget'))?.focus({preventScroll:true});settingsId='';});
  $('#todayView').addEventListener('pointerdown',event=>{
    cardPointerStart={x:event.clientX,y:event.clientY};
    ignoreSettingsClick=Boolean(event.target.closest('.widget-edit-bar,.widget-resize-handle,.widget-remove'));
  },true);
  $('#todayView').addEventListener('widget-configure',event=>{
    if(editing())openSettings(event.target.closest('[data-module]'));
  });
  $('#todayView').addEventListener('pointerup',event=>{
    if(cardPointerStart&&Math.hypot(event.clientX-cardPointerStart.x,event.clientY-cardPointerStart.y)>4)ignoreSettingsClick=true;
    cardPointerStart=null;
  },true);
  $('#todayView').addEventListener('click',event=>{
    if(!editing()||ignoreSettingsClick||event.target.closest('.widget-edit-bar,.widget-resize-handle,.widget-remove'))return;
    const card=event.target.closest('[data-module]');
    if(!card||card.parentElement!==$('#todayView'))return;
    event.preventDefault();event.stopImmediatePropagation();openSettings(card);
  },true);
  $('#todayView').addEventListener('keydown',event=>{
    if(editing()&&event.target.matches('#todayView > [data-module]')&&['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();openSettings(event.target);}
  },true);
  new MutationObserver(syncEditing).observe($('#todayView'),{attributes:true,attributeFilter:['class']});
  root.LifeLedgerLayoutEngine.onLayoutChange(labels);
  $('#wallFiles').addEventListener('change',e=>void addFiles([...e.target.files]));
  $('#wallAdd').addEventListener('click',()=>$('#wallFiles').click());
  $('#wallPrev').addEventListener('click',()=>{wallIndex=(wallIndex-1+wallRows.length)%wallRows.length;renderWall();});
  $('#wallNext').addEventListener('click',()=>{wallIndex=(wallIndex+1)%wallRows.length;renderWall();});
  $('#wallPlay').addEventListener('click',()=>{wallPlaying=!wallPlaying;renderWall();});
  $('#wallRemove').addEventListener('click',async()=>{const row=wallRows[wallIndex];if(!row||!confirm(t('removeConfirm')))return;try{await wallStore.delete(row.id);wallRows.splice(wallIndex,1);wallIndex=Math.max(0,Math.min(wallIndex,wallRows.length-1));renderWall();}catch{$('#wallStatus').textContent=t('storageError');}});
  $('#weatherSearch').addEventListener('submit',searchCities);
  $('#weatherHour').addEventListener('input',()=>{if(forecast)renderWeatherDetailOnly(Number($('#weatherHour').value));});
  const observer=new IntersectionObserver(entries=>{wallVisible=entries[0].isIntersecting&&visible($('[data-module="wall"]'));if(wallVisible&&wallPlaying&&!reduced())$('#wallStage video')?.play().catch(()=>{});syncWallTimer();});observer.observe($('[data-module="wall"]'));
  document.addEventListener('visibilitychange',syncWallTimer);
  setInterval(()=>{if(!document.hidden)void loadWeather();},30*60*1000);
  register();labels();
})(window);
