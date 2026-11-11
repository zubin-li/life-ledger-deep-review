/* Web Today as a snap-to-grid of cards (approved 2026-10-18).
   Stored state = order + size only; the browser grid places cards in 4/2/1 columns.
   Drag reorders via SortableJS. Web only — the Mac app (data-desktop) keeps the
   layout engine's own board.
   ponytail: rides on the layout engine for hidden flags, the add-widget gallery,
   edit mode and card renderers, and overrides its x/y placement with CSS. Retire
   the engine's web geometry once Mac moves to the same model. */
(function (root) {
  'use strict';
  const KEY = 'life-ledger-today-cards-v1';
  // [size key, columns, rows] in the 4-column grid (row = 132px).
  const SIZES = {
    summary: [['std', 2, 2]], mood: [['std', 1, 2]],
    habits: [['h4', 2, 3], ['h8', 4, 3]],
    dayplan: [['std', 2, 3]], reflection: [['std', 2, 3]], focus: [['s', 2, 2], ['w', 4, 2]], photos: [['std', 2, 2]],
    calendar: [['cs', 2, 3], ['cl', 4, 4]], context: [['std', 2, 2]],
    weather: [['s', 1, 2], ['w', 2, 2]], heatmap: [['s', 1, 2], ['w', 2, 2]],
    wall: [['s', 1, 2], ['w', 2, 2], ['l', 2, 4]],
  };
  const LABEL = {
    zh: { cs: '标准', cl: '大', std: '固定', h4: '4 个', h8: '8 个', s: '小', w: '宽', l: '大', remove: '移除', size: '尺寸', drag: '拖动排序' },
    en: { cs: 'Standard', cl: 'Large', std: 'Fixed', h4: '4', h8: '8', s: 'Small', w: 'Wide', l: 'Large', remove: 'Remove', size: 'Size', drag: 'Drag to reorder' },
    de: { cs: 'Standard', cl: 'Groß', std: 'Fest', h4: '4', h8: '8', s: 'Klein', w: 'Breit', l: 'Groß', remove: 'Entfernen', size: 'Größe', drag: 'Zum Sortieren ziehen' },
  };
  const DEFAULT = [['summary', 'std'], ['mood', 'std'], ['weather', 's'], ['habits', 'h4'], ['dayplan', 'std'], ['reflection', 'std'], ['calendar', 'cs']];
  const $ = s => document.querySelector(s);
  const lang = () => (LABEL[document.documentElement.lang?.slice(0, 2)] ? document.documentElement.lang.slice(0, 2) : 'zh');
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v) && v.length) return v.filter(([t]) => SIZES[t]).map(([t, s]) => [t, SIZES[t].some(x => x[0] === s) ? s : SIZES[t][0][0]]); } catch {} return DEFAULT.map(x => [...x]); };
  let cards = read();
  const save = () => localStorage.setItem(KEY, JSON.stringify(cards));

  function apply() {
    const view = $('#todayView'), engine = root.LifeLedgerLayoutEngine;
    if (!view || !engine) return;
    view.classList.add('tg');
    const on = new Set(cards.map(c => c[0]));
    // Sync engine hidden flags so each card's own renderer runs (weather, wall...).
    const layout = engine.getLayout();
    if (layout.widgets.some(w => w.hidden === on.has(w.type))) {
      layout.widgets.forEach(w => { w.hidden = !on.has(w.type); });
      engine._tgSilent = true; engine.writeStoredLayout(layout); engine._tgRender(); engine._tgSilent = false;
    }
    const L = LABEL[lang()];
    const want = [];
    for (const [type, size] of cards) {
      const card = view.querySelector(`:scope > [data-module="${type}"]`);
      if (!card) continue;
      want.push(card);
      const [, w, h] = SIZES[type].find(x => x[0] === size);
      card.dataset.tg = type; card.dataset.tgSize = size; card.style.setProperty('--tgw', w); card.style.setProperty('--tgh', h);
      if (card.hidden) card.hidden = false;
      card.removeAttribute('data-tg-off');
      let bar = card.querySelector(':scope > .tg-edit');
      if (!bar) { bar = document.createElement('div'); bar.className = 'tg-edit'; card.append(bar); }
      const variants = SIZES[type];
      const html = (type === 'habits' ? '' : `<button type="button" class="tg-remove" aria-label="${L.remove}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10"/></svg></button>`) +
        (variants.length > 1 ? `<div class="tg-sizes" role="radiogroup" aria-label="${L.size}">${variants.map(([k]) => `<button type="button" role="radio" data-size="${k}" aria-checked="${k === size}">${L[k]}</button>`).join('')}</div>` : '') +
        `<span class="tg-grip" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="1.3"/><circle cx="15" cy="7" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="17" r="1.3"/><circle cx="15" cy="17" r="1.3"/></svg></span>`;
      if (bar.dataset.k !== html) { bar.innerHTML = html; bar.dataset.k = html; }
    }
    // Move cards only when the order really changed: re-inserting a node restarts its
    // entrance animation, which made every habit check-in look like a full page reload.
    const current = [...view.children].filter(c => want.includes(c));
    if (current.some((c, i) => c !== want[i])) {
      want.forEach(c => view.append(c));
      view.querySelectorAll(':scope > :not([data-module])').forEach(n => view.append(n));
    }
    view.querySelectorAll(':scope > [data-module]').forEach(card => { if (!on.has(card.dataset.module)) { card.dataset.tgOff = ''; if (!card.hidden) card.hidden = true; } });
    const habits = view.querySelector('[data-module="habits"]');
    if (habits) habits.dataset.tgHabits = cards.find(c => c[0] === 'habits')?.[1] || 'h4';
    heroTop(); fit();
  }

  // Date chip and hero weather share one top row instead of colliding with the quote.
  function heroTop() {
    const chip = $('#todayDateChip'), weather = $('#heroWeather');
    if (!chip || !weather || chip.parentElement.classList.contains('tg-hero-top')) return;
    const row = document.createElement('div'); row.className = 'tg-hero-top';
    chip.before(row); row.append(chip, weather);
  }
  // Size-driven fit: habits go 2-per-row on narrow cards (taller footprint);
  // the hero quote steps its font down until the card holds it, never ellipsis.
  function fit() {
    const view = $('#todayView'); if (!view) return;
    const habits = view.querySelector(':scope > [data-module="habits"][data-tg]');
    if (habits) {
      const size = habits.dataset.tgSize, compact = size === 'h4' || habits.getBoundingClientRect().width < 760;
      habits.toggleAttribute('data-tg-compact', compact);
      habits.style.setProperty('--tgh', size === 'h8' && compact ? 5 : 3);
    }
    const quote = $('#todayHeroQuote'), hero = $('#todayView [data-module="summary"] .today-summary-hero');
    if (quote && hero && innerWidth > 760) {
      quote.style.removeProperty('--tg-quote');
      let px = parseFloat(getComputedStyle(quote).fontSize);
      const copy = quote.closest('.today-stage-copy');
      const limit = () => hero.getBoundingClientRect().bottom - parseFloat(getComputedStyle(hero).paddingBottom) + 1;
      while (px > 17 && copy.lastElementChild && [...copy.children].some(k => k.offsetParent && k.getBoundingClientRect().bottom > limit())) { px -= 1; quote.style.setProperty('--tg-quote', px + 'px'); }
    }
  }
  addEventListener('resize', () => requestAnimationFrame(fit));

  const history = [];
  const copy = list => list.map(c => [...c]);
  function setCards(next, record = true) {
    if (record) { history.push(copy(cards)); if (history.length > 20) history.shift(); }
    cards = next; save(); apply(); root.__tgRenderToday?.(); requestAnimationFrame(fit);
  }
  root.LifeLedgerTodayGrid = {
    SIZES, get: () => cards.map(c => [...c]), set: next => setCards(next.map(c => [...c])),
    reset: () => setCards(DEFAULT.map(x => [...x])),
    remove: type => setCards(cards.filter(c => c[0] !== type)),
    resize: (type, size) => setCards(cards.map(c => (c[0] === type ? [type, size] : c))),
    add: (type, size) => setCards([...cards.filter(c => c[0] !== type), [type, size || SIZES[type][0][0]]]),
  };

  function boot() {
    if (document.documentElement.hasAttribute('data-desktop')) return;
    const engine = root.LifeLedgerLayoutEngine;
    if (!engine || !$('#todayView')) return void setTimeout(boot, 50);
    engine._tgRender = engine.renderBoard.bind(engine);
    engine.renderBoard = () => { engine._tgRender(); if (!engine._tgSilent) apply(); };
    // Gallery "add" writes hidden=false through the engine; mirror it into the card list.
    engine.onLayoutChange?.(() => {});
    const origSet = engine.setLayout.bind(engine);
    engine.setLayout = (layout, id) => {
      const shown = layout.widgets.filter(w => !w.hidden).map(w => w.type);
      const added = shown.filter(t => SIZES[t] && !cards.some(c => c[0] === t));
      if (added.length) { history.push(copy(cards)); cards = [...cards, ...added.map(t => [t, SIZES[t][0][0]])]; save(); }
      origSet(layout, id);
      added.forEach(t => { const c = $(`#todayView > [data-module="${t}"]`); if (!c) return; c.dataset.tgNew = ''; setTimeout(() => c.removeAttribute('data-tg-new'), 2400); });
    };
    // Toolbar Undo / Reset / Escape act on the card list, not the engine's x/y layout.
    const origReset = engine.resetLayout.bind(engine), origEdit = engine.setEditMode.bind(engine);
    let snapshot = null;
    engine.undo = () => { if (!history.length) return false; setCards(history.pop(), false); return true; };
    engine.canUndo = () => history.length > 0;
    engine.resetLayout = () => { const def = origReset(); setCards(copy(DEFAULT)); return def; };
    engine.setEditMode = on => { if (on && !engine.isEditMode()) snapshot = copy(cards); if (!on) snapshot = null; origEdit(on); };
    engine.cancelEditSession = () => { if (snapshot) setCards(snapshot, false); snapshot = null; origEdit(false); };
    const view = $('#todayView');
    // Capture on document so the card-settings click handler never sees these.
    document.addEventListener('pointerdown', e => { if (e.target.closest('#todayView .tg-remove, #todayView .tg-sizes')) e.stopPropagation(); }, true);
    document.addEventListener('click', e => {
      const rm = e.target.closest('.tg-remove'), sz = e.target.closest('.tg-sizes button');
      if (!rm && !sz) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const type = e.target.closest('[data-module]').dataset.module;
      if (rm) root.LifeLedgerTodayGrid.remove(type); else root.LifeLedgerTodayGrid.resize(type, sz.dataset.size);
    }, true);
    if (root.Sortable) {
      root.Sortable.create(view, {
        draggable: '[data-tg]:not([data-tg-off])', animation: 220, easing: 'cubic-bezier(.2,.8,.2,1)',
        ghostClass: 'tg-ghost', chosenClass: 'tg-chosen', dragClass: 'tg-drag', forceFallback: true, fallbackOnBody: false,
        filter: '.tg-remove,.tg-sizes,button,input,textarea,select,a', preventOnFilter: false,
        onMove: () => engine.isEditMode(),
        onStart: evt => {
          view.classList.add('tg-dragging');
          // The lifted clone stays in the grid for styling; pin its real size (grid rules use height:100% !important).
          const r = evt.item.getBoundingClientRect();
          const fix = () => { const g = view.querySelector(':scope > .sortable-fallback'); if (g) { g.style.setProperty('height', r.height + 'px', 'important'); g.style.setProperty('width', r.width + 'px', 'important'); } if (view.classList.contains('tg-dragging')) requestAnimationFrame(fix); };
          fix();
        },
        onEnd: () => {
          view.classList.remove('tg-dragging');
          const order = [...view.querySelectorAll(':scope > [data-tg]:not([data-tg-off])')].map(c => c.dataset.module);
          setCards(order.map(t => cards.find(c => c[0] === t)).filter(Boolean));
        },
      });
      // Only allow drag in edit mode.
      const sortable = root.Sortable.get(view);
      new MutationObserver(() => sortable.option('disabled', !engine.isEditMode())).observe(view, { attributes: true, attributeFilter: ['class'] });
      sortable.option('disabled', !engine.isEditMode());
    }
    // Today's month card shows mood only; the heatmap lives in its own card.
    if (!document.querySelector('#todayMonthViewSwitch [data-calendar-view="mood"].active')) document.querySelector('#todayMonthViewSwitch [data-calendar-view="mood"]')?.click();
    apply(); shell(); focusOverview('#module-body-focus'); focusOverview('#reflectionFocusPage');
    setTimeout(() => $('#todayView')?.classList.add('tg-settled'), 1400);
    setTimeout(fit, 300); document.fonts?.ready.then(fit);
  }

  // Web shell pieces restored from the 3.5 web version: the walker logo and a
  // back-to-top button (the page scrolls as one; the toolbar is not pinned).
  function shell() {
    const mark = $('.sidebar-mark');
    if (mark && !mark.querySelector('svg')) mark.innerHTML = '<svg viewBox="0 0 32 32" fill="none"><circle cx="16.3" cy="6" r="2.5" fill="currentColor" stroke="none"/><path class="walker-body" d="m15.3 10.1-2.7 6.2 4.1 2.1 1.7 7.3m-3-15.2 5 3.5 3.5-1.8m-11 4.2-5.2 8.1"/><path class="brand-path" d="M4.5 27.2c6.6-3.6 14.5-4.1 23-.9"/></svg>';
    const pane = $('.workspace-pane'); if (!pane || $('#tgTop')) return;
    const top = document.createElement('button');
    top.type = 'button'; top.id = 'tgTop'; top.className = 'tg-top'; top.hidden = true;
    top.setAttribute('aria-label', { zh: '回到顶部', de: 'Nach oben', en: 'Back to top' }[lang()]);
    top.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>';
    top.addEventListener('click', () => pane.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
    document.body.append(top);
    pane.addEventListener('scroll', () => { top.hidden = pane.scrollTop < 320; }, { passive: true });
  }

  // Focus card = the 3.5 web focus overview (ring, big timer, 25/50, settings),
  // driven by the app's existing focus timer through the toolbar panel's controls.
  function focusOverview(sel) {
    const body = $(sel); if (!body || body.querySelector('.tg-focus')) return;
    [...body.children].forEach(c => c.setAttribute('hidden', ''));
    body.insertAdjacentHTML('beforeend', `<div class="tg-focus focus-overview-card">
      <div class="focus-overview-copy"><h2 data-tg-f="title"></h2><p data-tg-f="hint"></p><p class="focus-today-summary" data-tg-f="summary"></p>
        <div class="focus-quick-settings"><div class="focus-quick-presets" role="group"><button type="button" data-tg-preset="classic">25</button><button type="button" data-tg-preset="deep">50</button></div>
        <button class="focus-settings-button" type="button" data-tg-f="settings"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg><span></span></button></div></div>
      <div class="focus-inline-timer" style="--focus-inline-progress:0"><span class="focus-inline-ring" aria-hidden="true"><i></i></span>
        <div class="focus-inline-copy"><span data-tg-f="phase"></span><strong data-tg-f="time">25:00</strong></div>
        <div class="focus-inline-actions"><button class="primary-button" type="button" data-tg-f="primary"></button><button class="secondary-button" type="button" data-tg-f="finish" hidden></button></div></div></div>`);
    const q = k => body.querySelector(`[data-tg-f="${k}"]`);
    const T = {
      zh: { title: '专注时间', hint: '选一件事，全心投入。', settings: '设置' },
      en: { title: 'Focus Time', hint: 'Choose one thing. Give it your full attention.', settings: 'Settings' },
      de: { title: 'Fokuszeit', hint: 'Wähle eine Sache. Schenk ihr deine volle Aufmerksamkeit.', settings: 'Einstellungen' },
    };
    const sync = () => {
      const t = T[lang()], src = id => document.getElementById(id);
      q('title').textContent = t.title; q('hint').textContent = t.hint; q('settings').querySelector('span').textContent = t.settings;
      q('summary').textContent = src('focusTodaySummary')?.textContent || '';
      q('time').textContent = src('focusInlineTime')?.textContent || '25:00';
      q('phase').textContent = src('focusPhase')?.textContent || '';
      const p = src('focusQuickPrimary'), f = src('focusQuickFinish');
      body.querySelectorAll(':scope > :not(.tg-focus)').forEach(c => { if (!c.hidden) c.hidden = true; });
      q('primary').textContent = p?.hidden ? (src('focusPrimary')?.textContent || '') : p?.textContent; q('primary').disabled = !!p?.disabled;
      q('finish').textContent = f?.textContent || ''; q('finish').hidden = !f || f.hidden;
      body.querySelector('.focus-inline-timer').style.setProperty('--focus-inline-progress', getComputedStyle(src('focusClock') || body).getPropertyValue('--focus-progress') || 0);
      body.querySelectorAll('[data-tg-preset]').forEach(b => { const o = document.querySelector(`#focusQuickPresets [data-quick-focus-preset="${b.dataset.tgPreset}"]`); b.classList.toggle('active', !!o?.classList.contains('active')); b.disabled = !!o?.disabled; });
    };
    body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tgPreset) document.querySelector(`#focusQuickPresets [data-quick-focus-preset="${b.dataset.tgPreset}"]`)?.click();
      else if (b.dataset.tgF === 'primary') $('#focusQuickPrimary')?.click();
      else if (b.dataset.tgF === 'finish') $('#focusQuickFinish')?.click();
      else if (b.dataset.tgF === 'settings') $('#reflectionFocusSettings')?.click();
      requestAnimationFrame(sync);
    });
    // ponytail: mirrors the toolbar focus panel's text once a second; give the focus
    // timer a change event if this ever needs to be exact to the frame.
    sync(); setInterval(sync, 1000);
  }
  if (document.readyState === 'complete') boot(); else root.addEventListener('load', boot);
})(window);
