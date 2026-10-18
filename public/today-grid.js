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
    dayplan: [['std', 2, 3]], reflection: [['std', 2, 3]], focus: [['std', 1, 2]],
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
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v) && v.length) return v.filter(([t, s]) => SIZES[t]?.some(x => x[0] === s)); } catch {} return DEFAULT.map(x => [...x]); };
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
    for (const [type, size] of cards) {
      const card = view.querySelector(`:scope > [data-module="${type}"]`);
      if (!card) continue;
      const [, w, h] = SIZES[type].find(x => x[0] === size);
      card.dataset.tg = type; card.dataset.tgSize = size; card.style.setProperty('--tgw', w); card.style.setProperty('--tgh', h);
      card.hidden = false; card.removeAttribute('data-tg-off');
      let bar = card.querySelector(':scope > .tg-edit');
      if (!bar) { bar = document.createElement('div'); bar.className = 'tg-edit'; card.append(bar); }
      const variants = SIZES[type];
      bar.innerHTML = (type === 'habits' ? '' : `<button type="button" class="tg-remove" aria-label="${L.remove}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10"/></svg></button>`) +
        (variants.length > 1 ? `<div class="tg-sizes" role="radiogroup" aria-label="${L.size}">${variants.map(([k]) => `<button type="button" role="radio" data-size="${k}" aria-checked="${k === size}">${L[k]}</button>`).join('')}</div>` : '') +
        `<span class="tg-grip" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="1.3"/><circle cx="15" cy="7" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="17" r="1.3"/><circle cx="15" cy="17" r="1.3"/></svg></span>`;
      view.append(card);
    }
    view.querySelectorAll(':scope > [data-module]').forEach(card => { if (!on.has(card.dataset.module)) { card.dataset.tgOff = ''; card.hidden = true; } });
    view.querySelectorAll(':scope > :not([data-module])').forEach(n => view.append(n));
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
    apply();
    setTimeout(fit, 300); document.fonts?.ready.then(fit);
  }
  if (document.readyState === 'complete') boot(); else root.addEventListener('load', boot);
})(window);
