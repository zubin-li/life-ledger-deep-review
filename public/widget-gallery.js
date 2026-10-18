/* One catalog, one persisted layout. Hidden widgets never become edit-canvas placeholders. */
(function(root){
  const $=s=>document.querySelector(s);
  const words={
    en:{title:'Make room for your day',kicker:'WIDGET LIBRARY',hint:'Choose what belongs on your desk. Added widgets can be moved in Edit cards.',add:'Add',added:'Added',close:'Done',remove:'Remove'},
    zh:{title:'让日常，按你的方式展开',kicker:'组件库',hint:'只添加你需要的。添加后，可以在编辑卡片中调整位置。',add:'添加',added:'已添加',close:'完成',remove:'移除'},
    de:{title:'Dein Tag. Dein Platz.',kicker:'WIDGET-BIBLIOTHEK',hint:'Wähle, was auf deinen Schreibtisch gehört. Hinzugefügte Karten lassen sich im Bearbeitungsmodus bewegen.',add:'Hinzufügen',added:'Hinzugefügt',close:'Fertig',remove:'Entfernen'}
  };
  const descriptions={
    en:{summary:'A little perspective, progress and current weather.',habits:'Your familiar icons, a check-in at a time.',mood:'Notice how the day feels.',calendar:'A whole month, close at hand.',focus:'A quiet space for focused work.',photos:'Photo memories tied to each day.',reflection:'Keep the moments worth remembering.',context:'Your recent rhythm at a glance.',dayplan:'The selected day\'s schedule, a few days either side.',heatmap:'A month of habits, one day at a time.',wall:'Photos, GIFs and videos in your own window.',weather:'Explore the temperature from morning to midnight.'},
    zh:{summary:'一句寄语、今日进度与此刻天气。',habits:'熟悉的习惯图标，一次轻松的打卡。',mood:'留意今天的感受。',calendar:'把整个月，放在手边。',focus:'留一段时间，专心做一件事。',photos:'与每一天相连的照片记忆。',reflection:'把值得记住的片刻留下。',context:'看看最近的生活节奏。',dayplan:'所选日期的日程，前后几天一目了然。',heatmap:'完整月份，每一天都有位置。',wall:'照片、GIF 与视频，你自己的小窗。',weather:'从早晨到午夜，看温度如何变化。'},
    de:{summary:'Gedanke, Tagesfortschritt und aktuelles Wetter.',habits:'Vertraute Symbole, ein Häkchen nach dem anderen.',mood:'Wie fühlt sich dieser Tag an?',calendar:'Der ganze Monat griffbereit.',focus:'Raum für konzentrierte Arbeit.',photos:'Fotoerinnerungen zu jedem Tag.',reflection:'Festhalten, was bleibt.',context:'Dein Rhythmus der letzten Tage.',dayplan:'Termine des gewählten Tages, mit den Tagen davor und danach.',heatmap:'Ein Monat Gewohnheiten, Tag für Tag.',wall:'Fotos, GIFs und Videos in deinem Fenster.',weather:'Temperaturen vom Morgen bis Mitternacht erkunden.'}
  };
  const artwork={dayplan:'today-open',summary:'today-morning',habits:'empty-habits',mood:'today-evening',calendar:'calendar-empty-month',focus:'focus-idle',photos:'photos-day-empty',reflection:'journal-no-reflection',context:'focus-streak',heatmap:'insights-first-week',wall:'empty-photos',weather:'today-morning'};
  const names={
    zh:{dayplan:'每日日程',summary:'今日概览',habits:'习惯打卡',mood:'心情',calendar:'月历',focus:'专注计时',photos:'照片记忆',reflection:'每日复盘',context:'近期节律',heatmap:'习惯热力图',wall:'照片墙',weather:'天气'},
    en:{dayplan:'Daily calendar',summary:'Today',habits:'Habits',mood:'Mood',calendar:'Calendar',focus:'Focus',photos:'Photo memories',reflection:'Reflection',context:'Recent rhythm',heatmap:'Habit rhythm',wall:'Photo wall',weather:'Weather'},
    de:{dayplan:'Tagesplan',summary:'Tagesübersicht',habits:'Gewohnheiten',mood:'Stimmung',calendar:'Kalender',focus:'Fokus',photos:'Fotoerinnerungen',reflection:'Reflexion',context:'Rhythmus',heatmap:'Gewohnheitsrhythmus',wall:'Fotowand',weather:'Wetter'}
  };
  let language='en', source, lastAdded;
  const reduced=()=>document.documentElement.matches('.motion-reduced,.motion-off')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render(){
    const text=words[language],engine=root.LifeLedgerLayoutEngine;
    $('#widgetGalleryTitle').textContent=text.title;$('#widgetGalleryKicker').textContent=text.kicker;
    $('#widgetGalleryHint').textContent=text.hint;$('#widgetGalleryClose').textContent=text.close;
    const list=$('#widgetGalleryList');list.replaceChildren();
    for(const widget of engine.getLayout().widgets){
      const item=document.createElement('article');item.className='gallery-item';item.dataset.widget=widget.type;
      const preview=document.createElement('div');preview.className=`gallery-preview gallery-preview-${widget.type}`;preview.setAttribute('aria-hidden','true');
      const art=document.createElement('img');art.src=`./assets/hairline/${artwork[widget.type]||'empty-first-run'}.svg`;art.alt='';preview.append(art);
      if(widget.type==='weather'){const curve=document.createElementNS('http://www.w3.org/2000/svg','svg');curve.setAttribute('viewBox','0 0 180 48');const line=document.createElementNS(curve.namespaceURI,'path');line.setAttribute('d','M4 40 28 34 52 19 76 8 100 13 124 29 148 36 176 30');line.setAttribute('fill','none');line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','2');curve.append(line);preview.append(curve);}
      if(widget.type==='heatmap'){const dots=document.createElement('div');dots.className='gallery-mini-month';for(let i=0;i<35;i++){const dot=document.createElement('i');dot.style.opacity=String(.2+(i%8)/10);dots.append(dot);}preview.replaceChildren(dots);}
      const heading=document.createElement('h3');heading.textContent=names[language][widget.type]||widget.type;
      const desc=document.createElement('p');desc.textContent=descriptions[language][widget.type]||'';
      const add=document.createElement('button');add.type='button';add.dataset.addWidget=widget.id;add.textContent=widget.hidden?text.add:`✓ ${text.added}`;add.disabled=!widget.hidden;
      add.addEventListener('click',event=>{
        if(!engine.isEditMode())return;const layout=engine.getLayout(),record=layout.widgets.find(w=>w.id===widget.id);if(!record)return;
        const bounds=layout.widgets.filter(w=>w!==record&&!w.hidden).map(w=>({...w,...engine.getSizeDimensions(w.size,w.settings,w.type)}));
        const size=engine.getSizeDimensions(record.size,record.settings,record.type),lastRow=Math.max(0,...bounds.map(w=>w.y+w.h)),step=engine.getLaneStep?.()||4;
        outer:for(let y=0;y<=lastRow;y++)for(let x=0;x<=12-size.w;x+=step){if(bounds.every(w=>x+size.w<=w.x||x>=w.x+w.w||y+size.h<=w.y||y>=w.y+w.h)){record.x=x;record.y=y;break outer;}}
        record.hidden=false;lastAdded=record.type;engine.setLayout(layout);render();
        const card=document.querySelector(`[data-module="${record.type}"]`);
        if(event.detail!==0&&!reduced()&&root.LifeLedgerWidgetUI?.animate){root.LifeLedgerWidgetUI.animate(card,{opacity:[.25,1]},{duration:.18});}
        // The newly added button is disabled and cannot receive focus. Keep it
        // inside the modal so Escape closes the catalog, not the layout editor.
        $('#widgetGalleryClose').focus({preventScroll:true});
      });
      item.append(preview,heading,desc,add);list.append(item);
    }
  }
  root.LifeLedgerWidgetGallery={setLanguage(lang){language=words[lang]?lang:'en';if($('#widgetGallery').open)render();}};
  $('#addTodayWidget').addEventListener('click',()=>{if(!root.LifeLedgerLayoutEngine.isEditMode())return;source=document.activeElement;render();$('#widgetGallery').showModal();});
  $('#widgetGalleryClose').addEventListener('click',()=>$('#widgetGallery').close());
  $('#widgetGallery').addEventListener('keydown',event=>event.stopPropagation());
  $('#widgetGallery').addEventListener('close',()=>{source?.focus({preventScroll:true});if(lastAdded){document.querySelector(`[data-module="${lastAdded}"]`)?.scrollIntoView({block:'center',behavior:'instant'});lastAdded=null;}});
  new MutationObserver(()=>{if(!root.LifeLedgerLayoutEngine.isEditMode()&&$('#widgetGallery').open)$('#widgetGallery').close();}).observe($('#todayView'),{attributes:true,attributeFilter:['class']});
})(window);
