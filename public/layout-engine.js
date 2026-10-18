/**
 * Life Ledger 2.0 — Today Layout Engine
 * Owns layout schema v2, 12-column grid geometry, discrete S/M/L aspect states,
 * 2D drag & drop with zero-easing direct tracking, settle/reflow animations,
 * collision handling, keyboard navigation, undo transactions, and non-destructive v1 migration.
 */
(function (root) {
  const SCHEMA_VERSION = 2;
  const STORAGE_KEY_V2 = "life-ledger-layout-v2";
  const WEB_STORAGE_KEY_V2 = "life-ledger-layout-v2-web";
  const STORAGE_KEY_V1 = "life-ledger-layout-v1";
  const COLUMNS = 12;

  const SIZE_DIMENSIONS = {
    small: { w: 4, h: 1 },
    medium: { w: 8, h: 1 },
    large: { w: 8, h: 2 },
  };

  const DEFAULT_TODAY_LAYOUT = {
    schemaVersion: 2,
    view: "today",
    widgets: [
      { id: "today-summary", type: "summary", size: "large", x: 0, y: 0, hidden: false, settings: {} },
      { id: "today-mood", type: "mood", size: "small", x: 8, y: 0, hidden: false, settings: {shape:"wide"} },
      { id: "today-focus", type: "focus", size: "small", x: 8, y: 1, hidden: false, settings: {} },
      { id: "today-context", type: "context", size: "small", x: 8, y: 3, hidden: false, settings: {} },
      { id: "today-habits", type: "habits", size: "medium", x: 0, y: 2, hidden: false, settings: {} },
      { id: "today-reflection", type: "reflection", size: "small", x: 8, y: 2, hidden: false, settings: {} },
      { id: "today-photos", type: "photos", size: "small", x: 8, y: 4, hidden: false, settings: {} },
      { id: "today-calendar", type: "calendar", size: "large", x: 0, y: 3, hidden: false, settings: {} },
      { id: "today-heatmap", type: "heatmap", size: "medium", x: 0, y: 7, hidden: true, settings: {} },
      { id: "today-wall", type: "wall", size: "large", x: 0, y: 8, hidden: true, settings: {} },
      { id: "today-weather", type: "weather", size: "large", x: 0, y: 10, hidden: true, settings: {} },
    ],
  };

  // The browser and the installed desktop app share widgets and behavior, but
  // not their starting composition. Keep the user's desktop layout untouched
  // while the web surface starts from the approved, more expansive dashboard.
  // Web Today = the original 3.5 page rhythm, now as widgets (user decision
  // 2026-10-17): hero + mood, a full-width foundations row, daily calendar +
  // reflection side by side, then the month in view. Newer widgets (weather,
  // heatmap, photos, wall, 7-day rhythm) start in the library, not on the page.
  const WEB_DEFAULT_TODAY_LAYOUT = {
    schemaVersion: 2,
    view: "today",
    widgets: [
      { id: "today-summary", type: "summary", size: "large", x: 0, y: 0, hidden: false, settings: {} },
      { id: "today-mood", type: "mood", size: "small", x: 8, y: 0, hidden: false, settings: {} },
      { id: "today-habits", type: "habits", size: "large", x: 0, y: 2, hidden: false, settings: {} },
      { id: "today-dayplan", type: "dayplan", size: "large", x: 0, y: 4, hidden: false, settings: {} },
      { id: "today-reflection", type: "reflection", size: "large", x: 6, y: 4, hidden: false, settings: {} },
      { id: "today-calendar", type: "calendar", size: "large", x: 0, y: 7, hidden: false, settings: {} },
      { id: "today-focus", type: "focus", size: "small", x: 0, y: 14, hidden: true, settings: {} },
      { id: "today-weather", type: "weather", size: "large", x: 0, y: 16, hidden: true, settings: {} },
      { id: "today-heatmap", type: "heatmap", size: "small", x: 8, y: 16, hidden: true, settings: {} },
      { id: "today-photos", type: "photos", size: "small", x: 0, y: 19, hidden: true, settings: {} },
      { id: "today-context", type: "context", size: "small", x: 4, y: 19, hidden: true, settings: {} },
      { id: "today-wall", type: "wall", size: "large", x: 0, y: 22, hidden: true, settings: {} },
    ],
  };

  // One designed footprint per web widget, in 12-column units at the widest
  // canvas (w) and in 132px rows (h). No S/M/L on the web.
  const WEB_DIMS = {
    summary: { w: 8, h: 2 }, mood: { w: 4, h: 2 }, habits: { w: 12, h: 2 },
    dayplan: { w: 6, h: 3 }, reflection: { w: 6, h: 3 }, calendar: { w: 12, h: 7 },
    focus: { w: 4, h: 2 }, weather: { w: 8, h: 3 }, heatmap: { w: 4, h: 3 },
    photos: { w: 4, h: 3 }, context: { w: 4, h: 2 }, wall: { w: 8, h: 3 },
  };
  const WEB_ROW = 132;
  const WEB_FOOTPRINTS = Object.fromEntries(Object.keys(WEB_DIMS).map(type => [type, ["large"]]));

  const WEB_FOOTPRINT_VERSION = 5;

  function isWebSurface() {
    const doc = root.document?.documentElement;
    return Boolean(
      root.location?.protocol &&
      typeof doc?.hasAttribute === "function" &&
      !doc.hasAttribute("data-desktop")
    );
  }

  const PROTECTED_WIDGETS = new Set(["habits", "today-habits"]);

  // The hide/show action is icon-only; its localized name stays on aria-label and title.
  const HIDE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.6"/><path d="m4 4 16 16"/></svg>';
  const SHOW_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.6"/></svg>';

  let appTranslator = null;

  function setTranslator(fn) {
    if (typeof fn === "function") appTranslator = fn;
  }

  function tr(key, varsOrFallback = {}, fallbackStr = "") {
    let vars = {};
    let fallback = fallbackStr;
    if (typeof varsOrFallback === "string") {
      fallback = varsOrFallback;
    } else if (varsOrFallback && typeof varsOrFallback === "object") {
      vars = varsOrFallback;
      if (vars.fallback) fallback = vars.fallback;
    }

    if (appTranslator) {
      try {
        const res = appTranslator(key, vars);
        if (typeof res === "string" && res !== key && !res.startsWith("modules.")) {
          return res;
        }
      } catch {
        // ignore
      }
    }
    return fallback || key;
  }

  function escapeHtml(text) {
    return String(text ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function clone(obj) {
    try {
      return structuredClone(obj);
    } catch {
      return JSON.parse(JSON.stringify(obj));
    }
  }

  function getMotionMode() {
    const doc = root.document?.documentElement;
    if (!doc) return "full";
    if (doc.classList.contains("motion-off")) return "off";
    if (doc.classList.contains("motion-reduced")) return "reduced";
    return "full";
  }

  function rectsOverlap(a, b) {
    return !(
      a.x + a.w <= b.x ||
      b.x + b.w <= a.x ||
      a.y + a.h <= b.y ||
      b.y + b.h <= a.y
    );
  }

  class TodayLayoutEngine {
    constructor() {
      this._isWebSurface = isWebSurface();
      this.STORAGE_KEY = this._isWebSurface ? WEB_STORAGE_KEY_V2 : STORAGE_KEY_V2;
      this.V1_STORAGE_KEY = STORAGE_KEY_V1;
      this.SCHEMA_VERSION = SCHEMA_VERSION;
      this.COLUMNS = COLUMNS;
      this.SIZE_DIMENSIONS = SIZE_DIMENSIONS;
      this.DEFAULT_LAYOUT = this._isWebSurface ? WEB_DEFAULT_TODAY_LAYOUT : DEFAULT_TODAY_LAYOUT;

      this._container = null;
      this._activeLayout = null;
      this._isEditing = false;
      this._transactionHistory = [];
      this._dragState = null;
      this._resizeState = null;
      this._editSessionSnapshot = null;
      this._hasInitListeners = false;
      this._changeListeners = new Set();
      this._smallColumns = 4;
    }

    setTranslator(fn) {
      setTranslator(fn);
    }

    getSizeDimensions(size, settings = {}, type = "") {
      if (this._isWebSurface && WEB_DIMS[type]) {
        const { w, h } = WEB_DIMS[type];
        // Narrower canvases stack every section full width (as the original
        // tablet layout did); foundations then shows 2×2 cards and needs a row more.
        if (this._smallColumns === 4) return { w, h };
        return { w: COLUMNS, h: type === "habits" ? 3 : h };
      }
      const small = this._smallColumns;
      const wide = Math.min(COLUMNS, small * 2);
      if (size === "small") return {w:small, h:settings?.shape === "square" ? 2 : 1};
      if (size === "square" || (size === "large" && settings?.shape === "square")) return {w:wide, h:4};
      return {w:wide, h:size === "large" ? 2 : 1};
    }

    validateLayout(data) {
      const errors = [];
      if (!data || typeof data !== "object") {
        return { valid: false, errors: ["Layout data is not an object"], layout: clone(this.DEFAULT_LAYOUT) };
      }
      if (data.schemaVersion !== 2) {
        errors.push(`Invalid schemaVersion ${data.schemaVersion}; expected 2`);
      }
      if (data.view !== "today") {
        errors.push(`Invalid view "${data.view}"; expected "today"`);
      }
      if (!Array.isArray(data.widgets)) {
        errors.push("Layout widgets is not an array");
        return { valid: false, errors, layout: clone(this.DEFAULT_LAYOUT) };
      }

      const validatedWidgets = [];
      const defaultWidgetsMap = new Map(this.DEFAULT_LAYOUT.widgets.map(w => [w.type, w]));

      // Positions saved under the old S/M/L web sizes no longer fit the fixed
      // footprints and left staggered gaps. Re-seat them once on the designed
      // layout, keeping only the user's hidden/shown choices.
      let storedWidgets = data.widgets;
      if (this._isWebSurface && data.webFootprints !== WEB_FOOTPRINT_VERSION) {
        const hiddenByType = new Map(data.widgets.filter(Boolean).map(w => [String(w.type || w.id || "").replace(/^today-/, ""), Boolean(w.hidden)]));
        storedWidgets = this.DEFAULT_LAYOUT.widgets.map(w => ({ ...clone(w), hidden: w.hidden || Boolean(hiddenByType.get(w.type)) }));
        data = { ...data, laneColumns: undefined };
      }
      const sourceWidgets = (data.laneColumns || 4) === this._smallColumns
        ? storedWidgets : this._reflowWidgets(storedWidgets);
      for (const w of sourceWidgets) {
        if (!w || typeof w !== "object") continue;
        const type = String(w.type || w.id || "").replace(/^today-/, "");
        const id = w.id || `today-${type}`;
        const definition=root.LifeLedgerWidgetRegistry?.get(type);
        const settings=typeof w.settings === 'object' && w.settings ? {...w.settings} : {};
        // Small mood squares came from the old forced footprint, not a size
        // offered by the editor. Retire that restriction without writing storage.
        if(type==='mood' && w.size==='small' && settings.shape==='square')settings.shape='wide';
        let size = w.size;
        if(definition?.allowedSizes && !definition.allowedSizes.includes(size))size=definition.defaultSize;
        if(definition?.fixedShape)settings.shape=definition.fixedShape;
        if(this._isWebSurface && WEB_FOOTPRINTS[type]){[size,settings.shape="wide"]=WEB_FOOTPRINTS[type];}
        if (!["small", "medium", "large"].includes(size)) {
          size = defaultWidgetsMap.get(type)?.size || "medium";
          errors.push(`Widget ${id} has invalid size "${w.size}"; normalized to "${size}"`);
        }
        const dims = this.getSizeDimensions(size, settings, type);

        let x = Number.isInteger(w.x) ? w.x : 0;
        let y = Number.isInteger(w.y) ? w.y : 0;
        if (x < 0) {
          x = 0;
          errors.push(`Widget ${id} has negative x`);
        }
        if (x + dims.w > COLUMNS) {
          x = Math.max(0, COLUMNS - dims.w);
          errors.push(`Widget ${id} exceeds column bounds; clamped to ${x}`);
        }
        if (y < 0) {
          y = 0;
          errors.push(`Widget ${id} has negative y`);
        }

        const isProtected = PROTECTED_WIDGETS.has(type) || PROTECTED_WIDGETS.has(id);
        const hidden = isProtected ? false : Boolean(w.hidden);

        validatedWidgets.push({
          id,
          type,
          size,
          x,
          y,
          hidden,
          settings,
        });
      }

      // Check if any default known widgets are missing, append them safely
      for (const [type, def] of defaultWidgetsMap.entries()) {
        if (!validatedWidgets.some(w => w.type === type)) {
          validatedWidgets.push(clone(def));
        }
      }

      // Check for overlapping visible widgets and resolve collisions deterministically
      const resolvedWidgets = this._resolveAllCollisions(validatedWidgets);

      const isValid = errors.length === 0;
      return {
        valid: isValid,
        errors,
        layout: {
          schemaVersion: 2,
          view: "today",
          ...(this._isWebSurface ? {webFootprints: WEB_FOOTPRINT_VERSION} : {}),
          ...(this._smallColumns !== 4 || data.laneColumns ? {laneColumns:this._smallColumns} : {}),
          widgets: resolvedWidgets,
        },
      };
    }

    _reflowWidgets(widgets) {
      const placed = [];
      // On a narrower canvas, keep the primary daily action near the greeting.
      // This only changes presentation during reflow; explicit saved positions
      // at the current lane count and the source layout remain untouched.
      // The web keeps the original section order at every width.
      const priority = w => this._smallColumns >= 6 && !this._isWebSurface ? ({summary:-2, habits:-1}[w.type] || 0) : 0;
      const ordered = [...widgets].filter(Boolean).sort((a,b) => priority(a)-priority(b) || (a.y-b.y) || (a.x-b.x));
      for (const widget of ordered) {
        const item = {...widget, ...this.getSizeDimensions(widget.size,widget.settings,widget.type)};
        if (!item.hidden) {
          let row = 0, found = false;
          while (!found) {
            for (let x=0; x+item.w<=COLUMNS; x+=this.getLaneStep()) {
              const candidate = {...item,x,y:row};
              if (!placed.some(other=>!other.hidden&&rectsOverlap(candidate,other))) {
                item.x=x;item.y=row;found=true;break;
              }
            }
            row++;
          }
        }
        placed.push(item);
      }
      return placed.map(({w,h,...widget})=>widget);
    }

    _resolveAllCollisions(widgets, priorityId) {
      const ordered = priorityId ? [...widgets.filter(w => w.id === priorityId), ...widgets.filter(w => w.id !== priorityId)] : widgets;
      const items = ordered.map(w => ({ ...w, ...this.getSizeDimensions(w.size, w.settings, w.type) }));
      const placed = [];

      for (const item of items) {
        if (item.hidden) {
          placed.push(item);
          continue;
        }

        let hasOverlap = true;
        let attempts = 0;
        while (hasOverlap && attempts < 100) {
          hasOverlap = false;
          for (const other of placed) {
            if (other.hidden) continue;
            if (rectsOverlap(item, other)) {
              hasOverlap = true;
              item.y = other.y + other.h;
              break;
            }
          }
          attempts++;
        }
        placed.push(item);
      }

      return placed.map(({ w, h, ...rest }) => rest);
    }

    migrateFromV1(v1Data) {
      if (!v1Data || typeof v1Data !== "object") {
        return clone(this.DEFAULT_LAYOUT);
      }
      let order = [];
      let collapsed = new Set();
      let hidden = new Set();

      if (Array.isArray(v1Data)) {
        order = v1Data.map(item => item.id || item.type);
        v1Data.forEach(item => {
          const key = item.id || item.type;
          if (item.collapsed) collapsed.add(key);
          if (item.hidden) hidden.add(key);
        });
      } else {
        const v1Today = v1Data.today || v1Data;
        order = Array.isArray(v1Today.order) ? v1Today.order : [];
        collapsed = new Set(Array.isArray(v1Today.collapsed) ? v1Today.collapsed : []);
        hidden = new Set(Array.isArray(v1Today.hidden) ? v1Today.hidden : []);
      }

      const widgets = [];
      const defaultWidgetsMap = new Map(this.DEFAULT_LAYOUT.widgets.map(w => [w.type, w]));
      const allKnownTypes = this.DEFAULT_LAYOUT.widgets.map(widget => widget.type);

      const resolvedOrder = [...order];
      for (const t of allKnownTypes) {
        if (!resolvedOrder.includes(t)) resolvedOrder.push(t);
      }

      let currentX = 0;
      let currentY = 0;

      for (const rawId of resolvedOrder) {
        const type = rawId.replace(/^today-/, "");
        const defaultWidget = defaultWidgetsMap.get(type);
        if (!defaultWidget) continue;

        let size = defaultWidget.size;
        if (collapsed.has(type) || collapsed.has(rawId)) {
          size = "small";
        }

        const dims = this.getSizeDimensions(size);
        if (currentX + dims.w > COLUMNS) {
          currentX = 0;
          currentY += 1;
        }

        const isProtected = PROTECTED_WIDGETS.has(type);
        const isHidden = isProtected ? false : (hidden.has(type) || hidden.has(rawId) || (defaultWidget.hidden && !order.includes(type) && !order.includes(rawId)));

        widgets.push({
          id: `today-${type}`,
          type,
          size,
          x: currentX,
          y: currentY,
          hidden: isHidden,
          settings: {},
        });

        if (!isHidden) {
          currentX += dims.w;
        }
      }

      const layout = {
        schemaVersion: 2,
        view: "today",
        widgets: this._resolveAllCollisions(widgets),
      };

      return layout;
    }

    readStoredLayout() {
      try {
        const rawV2 = root.localStorage ? root.localStorage.getItem(this.STORAGE_KEY) : null;
        if (rawV2) {
          try {
            const parsed = JSON.parse(rawV2);
            const { valid, layout } = this.validateLayout(parsed);
            return layout;
          } catch {
            // Corrupt JSON: return deterministic default without deleting the raw value in localStorage
            return this.validateLayout(clone(this.DEFAULT_LAYOUT)).layout;
          }
        }

        // V2 not yet in storage: check v1 for one-time non-destructive migration
        const rawV1 = !this._isWebSurface && root.localStorage ? root.localStorage.getItem(STORAGE_KEY_V1) : null;
        if (rawV1) {
          try {
            const parsedV1 = JSON.parse(rawV1);
            if (parsedV1 && (parsedV1.today || Array.isArray(parsedV1) || Array.isArray(parsedV1.order))) {
              const migrated = this.migrateFromV1(parsedV1);
              // Save to V2 key; leave V1 key untouched
              this.writeStoredLayout(migrated);
              return migrated;
            }
          } catch {}
        }

        return this.validateLayout(clone(this.DEFAULT_LAYOUT)).layout;
      } catch {
        return this.validateLayout(clone(this.DEFAULT_LAYOUT)).layout;
      }
    }

    writeStoredLayout(layout) {
      try {
        if (!root.localStorage) return;
        const { layout: normalized } = this.validateLayout(layout);
        root.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(normalized));
        this._activeLayout = normalized;
        this._notifyChange(normalized);
      } catch {}
    }

    resetLayout() {
      const def = clone(this.DEFAULT_LAYOUT);
      this.writeStoredLayout(def);
      if (this._container) {
        this.renderBoard();
      }
      return def;
    }

    getLayout() {
      if (!this._activeLayout) {
        this._activeLayout = this.readStoredLayout();
      }
      return clone(this._activeLayout);
    }

    setLayout(layout, priorityId) {
      this._pushTransaction();
      if(priorityId)layout={...layout,widgets:this._resolveAllCollisions(layout.widgets,priorityId)};
      this.writeStoredLayout(layout);
      if (this._container) {
        this.renderBoard();
      }
    }

    _pushTransaction() {
      if (!this._activeLayout) return;
      this._transactionHistory.push(clone(this._activeLayout));
      if (this._transactionHistory.length > 20) {
        this._transactionHistory.shift();
      }
    }

    undo() {
      if (this._transactionHistory.length === 0) return false;
      const prev = this._transactionHistory.pop();
      if (!prev) return false;
      this.writeStoredLayout(prev);
      if (this._container) {
        this.renderBoard();
      }
      return true;
    }

    canUndo() {
      return this._transactionHistory.length > 0;
    }

    onLayoutChange(callback) {
      if (typeof callback === "function") {
        this._changeListeners.add(callback);
      }
      return () => this._changeListeners.delete(callback);
    }

    _notifyChange(layout) {
      for (const listener of this._changeListeners) {
        try { listener(layout); } catch {}
      }
    }

    init(container) {
      if (!container) return;
      this._container = container;
      this._activeLayout = this.readStoredLayout();

      if (!this._hasInitListeners) {
        this._hasInitListeners = true;
        this._setupKeyboardHandlers();

        // Wire collapse toggles in Today board (evidence row #69)
        container.addEventListener("click", e => {
          const toggle = e.target.closest(".module-collapse-toggle");
          if (toggle && container.contains(toggle)) {
            e.preventDefault();
            const moduleCard = toggle.closest("[data-module]");
            if (!moduleCard) return;
            const bodyEl = moduleCard.querySelector(".module-body");
            const isExpanded = toggle.getAttribute("aria-expanded") === "true";
            const nextExpanded = !isExpanded;
            toggle.setAttribute("aria-expanded", String(nextExpanded));
            moduleCard.classList.toggle("is-collapsed", !nextExpanded);
            if (bodyEl) {
              bodyEl.hidden = !nextExpanded;
            }
          }
        });
      }

      this.renderBoard();
      if (!this._resizeObserver && root.ResizeObserver) {
        let width = 0;
        this._resizeObserver = new root.ResizeObserver(entries => {
          const next = Math.round(entries[0].contentRect.width);
          if (!next || next === width) return;
          width = next;
          if (!this._dragState && !this._resizeState) this.renderBoard();
        });
        this._resizeObserver.observe(container);
      }
    }

    setEditMode(enabled) {
      const nextMode = Boolean(enabled);
      if (!nextMode && this._resizeState) {
        this._resizeState.cancel();
      }
      if (nextMode) {
        if (!this._isEditing) {
          this._editSessionSnapshot = clone(this.getLayout());
        }
      } else {
        this._editSessionSnapshot = null;
      }
      this._isEditing = nextMode;
      if (!this._container) return;

      this._container.classList.toggle("is-editing-layout", this._isEditing);

      const toggleBtn = root.document?.querySelector("#editLayoutToggle") ||
        root.document?.querySelector(`[data-action="edit-layout"][data-board="today"]`);
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-pressed", String(this._isEditing));
        const editSpan = toggleBtn.querySelector("#editLayoutLabel") || toggleBtn;
        editSpan.textContent = this._isEditing ? tr("modules.doneEditing", "Done") : tr("modules.editLayout", "Edit layout");
      }

      const resetBtn = root.document?.querySelector("#resetLayoutButton");
      if (resetBtn) {
        resetBtn.hidden = !this._isEditing;
      }

      const undoBtn = root.document?.querySelector("#undoLayoutButton");
      if (undoBtn) {
        undoBtn.hidden = !this._isEditing;
      }

      this.renderBoard();
    }

    cancelEditSession() {
      if (this._editSessionSnapshot) {
        this.writeStoredLayout(this._editSessionSnapshot);
        this._editSessionSnapshot = null;
      }
      this.setEditMode(false);
    }

    isEditMode() {
      return this._isEditing;
    }

    toggleEditMode() {
      this.setEditMode(!this._isEditing);
    }

    _parseGridTracks(raw) {
      return String(raw || "")
        .split(/\s+/)
        .map(token => {
          const trimmed = token.trim();
          if (!trimmed || trimmed === "none") return 0;
          const px = /^([\d.]+)px$/.exec(trimmed);
          if (px) return parseFloat(px[1]);
          const num = parseFloat(trimmed);
          return Number.isFinite(num) ? num : 0;
        })
        .filter(n => n > 0);
    }

    _measureGridMetrics() {
      if (!this._container) {
        return { colTracks: [], rowTracks: [180], colGap: 20, rowGap: 20 };
      }
      const style = root.getComputedStyle(this._container);
      const colGap = parseFloat(style.columnGap) || 0;
      const rowGap = parseFloat(style.rowGap) || 0;
      let colTracks = this._parseGridTracks(style.gridTemplateColumns);
      let rowTracks = this._parseGridTracks(style.gridTemplateRows);

      const rect = this._container.getBoundingClientRect();
      if (!colTracks.length && rect.width > 0) {
        const colWidth = (rect.width - colGap * (COLUMNS - 1)) / COLUMNS;
        colTracks = Array.from({ length: COLUMNS }, () => colWidth);
      }
      if (!rowTracks.length) {
        rowTracks = [180];
      }

      // A CSS grid already exposes its real tracks. Spanning cards must not be
      // mistaken for single-row heights, and padding/scroll belong in the origin.
      if (style.display === "grid") {
        const paddingTop = parseFloat(style.paddingTop) || 0;
        return {colTracks, rowTracks, colGap, rowGap,
          originX: parseFloat(style.paddingLeft) || 0,
          rowStarts: this._trackStartPositions(rowTracks, rowGap).map(y => y + paddingTop - this._container.scrollTop)};
      }

      rowTracks = this._rowTracksFromPlacedCards(rowTracks, rowGap);
      const rowAnchors = this._measureRowAnchorMetrics(rowGap, rowTracks);
      if (rowAnchors.rowStarts?.length) {
        rowTracks = rowAnchors.rowTracks;
      }

      return { colTracks, rowTracks, rowStarts: rowAnchors.rowStarts, colGap, rowGap };
    }

    _measureRowAnchorMetrics(rowGap, fallbackTracks) {
      if (!this._container) {
        return { rowStarts: [0], rowTracks: fallbackTracks.length ? fallbackTracks : [180] };
      }
      const containerRect = this._container.getBoundingClientRect();
      const cards = [...this._container.querySelectorAll(":scope > [data-module]:not([hidden])")].filter(
        card => !card.classList.contains("is-dragging"),
      );
      const topsByY = new Map();
      let maxY = 0;
      for (const card of cards) {
        const y = Number.parseInt(card.style.getPropertyValue("--grid-y"), 10) || 0;
        const top = card.getBoundingClientRect().top - containerRect.top;
        topsByY.set(y, topsByY.has(y) ? Math.min(topsByY.get(y), top) : top);
        maxY = Math.max(maxY, y);
      }
      if (!topsByY.size) {
        return { rowStarts: [0], rowTracks: fallbackTracks.length ? fallbackTracks : [180] };
      }

      const rowStarts = [];
      const rowTracks = [];
      for (let i = 0; i <= maxY; i += 1) {
        if (topsByY.has(i)) {
          rowStarts[i] = topsByY.get(i);
        } else if (i === 0) {
          rowStarts[i] = 0;
        } else {
          const prevTrack = rowTracks[i - 1] || fallbackTracks[i - 1] || 180;
          rowStarts[i] = (rowStarts[i - 1] ?? 0) + prevTrack + rowGap;
        }

        let nextStart = null;
        for (let j = i + 1; j <= maxY; j += 1) {
          if (topsByY.has(j)) {
            nextStart = topsByY.get(j);
            break;
          }
        }
        if (nextStart != null) {
          rowTracks[i] = Math.max(1, nextStart - rowStarts[i] - rowGap);
        } else {
          let maxBottom = rowStarts[i];
          for (const card of cards) {
            const cy = Number.parseInt(card.style.getPropertyValue("--grid-y"), 10) || 0;
            if (cy !== i) continue;
            const rect = card.getBoundingClientRect();
            maxBottom = Math.max(maxBottom, rect.bottom - containerRect.top);
          }
          rowTracks[i] = Math.max(maxBottom - rowStarts[i], fallbackTracks[i] || 180);
        }
      }
      return { rowStarts, rowTracks };
    }

    _rowTracksFromPlacedCards(fallbackTracks, rowGap) {
      if (!this._container) return fallbackTracks;
      const cards = [...this._container.querySelectorAll(":scope > [data-module]:not([hidden])")];
      if (!cards.length) return fallbackTracks;

      const heights = new Map();
      for (const card of cards) {
        const y = Number.parseInt(card.style.getPropertyValue("--grid-y"), 10) || 0;
        const h = card.getBoundingClientRect().height;
        if (h > 0) heights.set(y, Math.max(heights.get(y) || 0, h));
      }
      if (!heights.size) return fallbackTracks;

      const maxRow = Math.max(...heights.keys(), fallbackTracks.length - 1);
      const tracks = [];
      for (let i = 0; i <= maxRow; i += 1) {
        tracks.push(heights.get(i) || fallbackTracks[i] || fallbackTracks[fallbackTracks.length - 1] || 180);
      }
      return tracks;
    }

    _trackStartPositions(tracks, gap) {
      const starts = [];
      let acc = 0;
      for (let i = 0; i < tracks.length; i += 1) {
        starts.push(acc);
        acc += tracks[i] + gap;
      }
      return starts;
    }

    _nearestTrackIndex(offsetPx, tracks, gap) {
      if (!tracks.length) return 0;
      const starts = this._trackStartPositions(tracks, gap);
      let bestIdx = 0;
      let bestDist = Math.abs(offsetPx - starts[0]);
      for (let i = 1; i < starts.length; i += 1) {
        const dist = Math.abs(offsetPx - starts[i]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      const lastStart = starts[starts.length - 1];
      const lastSize = tracks[tracks.length - 1] || 180;
      const step = lastSize + gap;
      if (offsetPx > lastStart + 1 && step > 0) {
        const extraRows = Math.round((offsetPx - lastStart) / step);
        bestIdx = starts.length - 1 + Math.max(0, extraRows);
      }
      return Math.max(0, bestIdx);
    }

    /** Map pointer/card top-left (container-relative px) to grid column start (0,4,8). */
    getLaneStep() {
      return this._isWebSurface && this._smallColumns === 4 ? 2 : this._smallColumns;
    }

    _pointerToGridColumn(relX, metrics) {
      const colIndex = this._nearestTrackIndex(relX - (metrics.originX || 0), metrics.colTracks, metrics.colGap);
      // The same lane width owns both pointer and keyboard movement.
      const step = this.getLaneStep();
      let targetX = Math.round(colIndex / step) * step;
      if (targetX < 0) targetX = 0;
      if (targetX > COLUMNS - 1) targetX = COLUMNS - step;
      return targetX;
    }

    _nearestTrackIndexFromStarts(offsetPx, starts, tracks, gap) {
      if (!starts?.length) return 0;
      let bestIdx = 0;
      let bestDist = Math.abs(offsetPx - (starts[0] ?? 0));
      for (let i = 1; i < starts.length; i += 1) {
        const start = starts[i];
        if (start == null) continue;
        const dist = Math.abs(offsetPx - start);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      const lastIdx = starts.length - 1;
      const lastStart = starts[lastIdx] ?? 0;
      const lastSize = tracks[lastIdx] || tracks[tracks.length - 1] || 180;
      const step = lastSize + gap;
      if (offsetPx > lastStart + lastSize / 2 && step > 0) {
        const extra = Math.round((offsetPx - lastStart) / step);
        return lastIdx + Math.max(0, extra);
      }
      return Math.max(0, bestIdx);
    }

    _pointerToGridRow(relY, metrics) {
      const starts = metrics.rowStarts;
      if (starts?.length) {
        let row = 0;
        for (let i = 0; i < starts.length; i += 1) {
          if (starts[i] != null && relY + 0.5 >= starts[i]) row = i;
        }
        const lastIdx = starts.length - 1;
        const lastStart = starts[lastIdx] ?? 0;
        const lastTrack = metrics.rowTracks[lastIdx] || metrics.rowTracks[metrics.rowTracks.length - 1] || 180;
        const step = lastTrack + metrics.rowGap;
        if (relY > lastStart + lastTrack && step > 0) {
          return lastIdx + Math.max(0, Math.floor((relY - lastStart) / step));
        }
        return row;
      }
      return this._nearestTrackIndex(relY, metrics.rowTracks, metrics.rowGap);
    }

    renderBoard() {
      if (!this._container) return;
      const available = this._container.clientWidth;
      if (available && root.getComputedStyle) {
        const style = root.getComputedStyle(this._container);
        const content = available - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
        const columns = content >= 840 ? 4 : content >= 480 ? 6 : 12;
        if (columns !== this._smallColumns) {
          this._smallColumns = columns;
          // Reflow is a presentation change, not permission to overwrite a saved layout.
          this._activeLayout = this.readStoredLayout();
        }
        // The capped canvas bounds the approved 180/380px rhythm. Within it,
        // keep square presets genuinely square as columns become narrower.
        const lanes = COLUMNS / columns;
        const gap = parseFloat(style.columnGap) || 20;
        const row = this._isWebSurface ? WEB_ROW : Math.min(180, Math.max(100, ((content - (lanes - 1) * gap) / lanes - gap) / 2));
        this._container.style.setProperty("--today-row", `${row}px`);
      }
      const layout = this.getLayout();
      const registry = root.LifeLedgerWidgetRegistry;
      const isEditing = this._isEditing;

      const cardMap = new Map();
      this._container.querySelectorAll(":scope > [data-module]").forEach(card => {
        const type = card.dataset.module;
        cardMap.set(type, card);
        cardMap.set(`today-${type}`, card);
      });

      // Sort widgets by (y, x) for clean DOM reading order and keyboard tab traversal
      const sortedWidgets = [...layout.widgets].sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      });

      for (const w of sortedWidgets) {
        const card = cardMap.get(w.type) || cardMap.get(w.id);
        if (!card) continue;
        card.setAttribute('aria-label',tr(`modules.names.${w.type}`,w.type));

        // Position in 12-column grid via CSS variables
        const dims = this.getSizeDimensions(w.size, w.settings, w.type);
        card.style.setProperty("--grid-x", String(w.x));
        card.style.setProperty("--grid-y", String(w.y));
        card.style.setProperty("--grid-w", String(dims.w));
        card.style.setProperty("--grid-h", String(dims.h));
        card.style.setProperty("--card-i", String(sortedWidgets.indexOf(w)));
        // A web square footprint (380x380) shows the full content state.
        const shownSize = this._isWebSurface && WEB_DIMS[w.type] ? "large" : w.size;
        card.dataset.widgetSize = shownSize;
        card.dataset.widgetShape = w.settings?.shape === "square" ? "square" : "wide";

        if (w.hidden) {
          card.hidden = true;
          card.classList.remove("is-widget-hidden");
        } else {
          card.hidden = false;
          card.classList.toggle("is-widget-hidden", Boolean(w.hidden));
        }

        // Render widget content per size matrix
        const widgetDef = registry?.get(w.type) || registry?.get(w.id);
        if (widgetDef && typeof widgetDef.render === "function") {
          widgetDef.render({
            element: card,
            size: shownSize,
            data: {},
            locale: root.document?.documentElement?.lang || "en",
            motion: getMotionMode(),
          });
        }

        // Mount / update edit bar in edit mode
        let editBar = card.querySelector(".widget-edit-bar");
        if (isEditing) {
          if (!editBar) {
            editBar = root.document.createElement("div");
            editBar.className = "widget-edit-bar";
            card.prepend(editBar);
          }
          editBar.hidden = false;
          this._renderWidgetEditBar(editBar, card, w);
        } else if (editBar) {
          editBar.hidden = true;
          card.querySelector(':scope > .widget-remove')?.remove();
        }

        let resizeHandle = card.querySelector(":scope > .widget-resize-handle");
        if (isEditing && this._allowedWidgetSizes(w).length > 1) {
          resizeHandle?.remove();
          resizeHandle = root.document.createElement("button");
          resizeHandle.type = "button";
          resizeHandle.className = "widget-resize-handle";
          card.appendChild(resizeHandle);
          this._renderWidgetResizeHandle(resizeHandle, card, w);
        } else if (resizeHandle) {
          resizeHandle.hidden = true;
        }

        // Ensure card DOM order matches sorted order
        this._container.appendChild(card);
      }
    }

    _renderWidgetEditBar(editBar, card, widgetData) {
      const type = widgetData.type;
      const isProtected = PROTECTED_WIDGETS.has(type) || PROTECTED_WIDGETS.has(widgetData.id);
      const isHidden = Boolean(widgetData.hidden);
      const size = widgetData.size;
      const chosenSize = size === "large" && widgetData.settings?.shape === "square" ? "square" : size;

      const nameKey = `modules.names.${type}`;
      const name = tr(nameKey, type);
      const dragLabel = tr("modules.dragAria", { name, fallback: `Drag ${name}` });
      const hideLabel = isHidden
        ? tr("modules.show", { name, fallback: `Show ${name}` })
        : tr("modules.hide", { name, fallback: `Hide ${name}` });
      const hideText = isHidden ? tr("modules.actionShow", "Show") : tr("modules.actionHide", "Hide");

      editBar.innerHTML = `
        <button type="button" class="widget-drag-handle module-edit-handle" aria-label="${escapeHtml(dragLabel)}" title="${escapeHtml(tr("modules.dragHint", "Drag or Arrow keys to move"))}">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="ui-icon"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
          <span class="widget-edit-title">${escapeHtml(name)}</span>
        </button>
        <div class="widget-size-picker" role="radiogroup" aria-label="${escapeHtml(tr("modules.sizeSelector", "Widget size"))}">
          <button type="button" class="widget-size-btn${size === "small" ? " is-active" : ""}" data-size="small" aria-checked="${size === "small"}" role="radio" title="${escapeHtml(tr("modules.sizeSmall", "Small"))}">S</button>
          <button type="button" class="widget-size-btn${size === "medium" ? " is-active" : ""}" data-size="medium" aria-checked="${size === "medium"}" role="radio" title="${escapeHtml(tr("modules.sizeMedium", "Medium"))}">M</button>
          <button type="button" class="widget-size-btn${chosenSize === "large" ? " is-active" : ""}" data-size="large" aria-checked="${chosenSize === "large"}" role="radio" title="${escapeHtml(tr("modules.sizeLarge", "Large"))}">L</button>
        </div>
        <div class="widget-edit-trailing">
          ${isProtected ? "" : `<button type="button" class="widget-hide-btn" data-action="toggle-hide" aria-label="${escapeHtml(hideLabel)}" title="${escapeHtml(hideText)}">${isHidden ? SHOW_ICON : HIDE_ICON}</button>`}
        </div>
      `;

      // Setup 2D pointer drag on the drag handle
      const handle = editBar.querySelector(".widget-drag-handle");
      const configure = root.document.createElement('button');
      configure.type = 'button'; configure.className = 'widget-configure';
      configure.setAttribute('aria-label', `${tr('modules.sizeSelector', 'Widget size')}: ${name}`);
      configure.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 4 6 6M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14Z"/></svg>';
      configure.addEventListener('click', () => card.dispatchEvent(new root.CustomEvent('widget-configure', {bubbles:true})));
      editBar.appendChild(configure);
      // Web: every removable widget gets a visible "remove" (−) control; it can be
      // added back from the widget library.
      if (this._isWebSurface && !isProtected) {
        const remove = root.document.createElement('button');
        remove.type = 'button'; remove.className = 'widget-remove';
        const lang = (root.document.documentElement.lang || 'en').split('-')[0];
        const label = ({zh:`移除「${name}」`, de:`${name} entfernen`}[lang]) || `Remove ${name}`;
        remove.setAttribute('aria-label', label); remove.title = label;
        remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10"/></svg>';
        remove.addEventListener('pointerdown', e => e.stopPropagation());
        remove.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); this._toggleWidgetHidden(widgetData.id); });
        card.querySelector(':scope > .widget-remove')?.remove();
        card.appendChild(remove);
      }
      if (handle) {
        this._setupPointerDrag(handle, card, widgetData);
        this._setupKeyboardMove(handle, widgetData);
      }

      // Size buttons with arrow key traversal (radiogroup behavior)
      let sizeBtns = Array.from(editBar.querySelectorAll(".widget-size-btn"));
      const allowed=this._allowedWidgetSizes(widgetData);
      sizeBtns.forEach(button=>{if(!allowed.includes(button.dataset.size))button.remove();});
      sizeBtns=sizeBtns.filter(button=>allowed.includes(button.dataset.size));
      if(allowed.length===1){
        const picker=editBar.querySelector('.widget-size-picker');
        picker.replaceChildren();const label=root.document.createElement('span');label.className='widget-fixed-size';
        const lang=(root.document.documentElement.lang||'en').split('-')[0];
        const fixed={zh:['固定尺寸','固定尺寸'],de:['Feste Größe','Feste Größe'],en:['Fixed size','Fixed size']};
        const square=widgetData.settings?.shape==='square';
        label.textContent=(fixed[lang]||fixed.en)[allowed[0]==='small'&&!square?1:0];picker.appendChild(label);
      }
      sizeBtns.forEach((btn, idx) => {
        btn.addEventListener("click", e => {
          e.preventDefault();
          const targetSize = btn.dataset.size;
          if (targetSize && targetSize !== chosenSize) {
            this._changeWidgetSize(widgetData.id, targetSize);
          }
        });
        btn.addEventListener("keydown", e => {
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const prev = sizeBtns[(idx - 1 + sizeBtns.length) % sizeBtns.length];
            prev.focus();
            prev.click();
          } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = sizeBtns[(idx + 1) % sizeBtns.length];
            next.focus();
            next.click();
          }
        });
      });

      // Hide toggle
      const hideBtn = editBar.querySelector('[data-action="toggle-hide"]');
      if (hideBtn) {
        hideBtn.addEventListener("click", e => {
          e.preventDefault();
          this._toggleWidgetHidden(widgetData.id);
        });
      }
    }

    _sizeLabel(size) {
      const keys = {
        small: "modules.sizeSmall",
        medium: "modules.sizeMedium",
        large: "modules.sizeLarge",
      };
      const fallbacks = { small: "Small", medium: "Medium", large: "Large" };
      if (size === "square") return tr("modules.sizeSquare", "Large square");
      return tr(keys[size], fallbacks[size] || size);
    }

    _resizeHandleLabel(widgetName, size) {
      return `${tr("modules.sizeSelector", "Widget size")}: ${widgetName} — ${this._sizeLabel(size)}`;
    }

    _renderWidgetResizeHandle(handle, card, widgetData) {
      const name = tr(`modules.names.${widgetData.type}`, widgetData.type);
      handle.hidden = false;
      handle.setAttribute("aria-label", this._resizeHandleLabel(name, widgetData.size));
      handle.setAttribute("title", tr("modules.sizeSelector", "Widget size"));
      handle.innerHTML = `<span class="widget-resize-state" aria-hidden="true">${escapeHtml(widgetData.size.charAt(0).toUpperCase())}</span>`;
      this._setupPointerResize(handle, card, widgetData, name);
    }

    _allowedWidgetSizes(widgetData) {
      if (this._isWebSurface && WEB_FOOTPRINTS[widgetData.type]) return [WEB_FOOTPRINTS[widgetData.type][0]];
      const widgetDef = root.LifeLedgerWidgetRegistry?.get(widgetData.type) ||
        root.LifeLedgerWidgetRegistry?.get(widgetData.id);
      const allowed = Array.isArray(widgetDef?.allowedSizes)
        ? widgetDef.allowedSizes.filter(size => Object.hasOwn(SIZE_DIMENSIONS, size))
        : [];
      const sizes = allowed.length ? allowed : ["small", "medium", "large"];
      return sizes.includes("large") && !widgetDef?.fixedShape ? [...sizes, "square"] : sizes;
    }

    _nearestResizeSize(state, dx, dy) {
      const dimensions = state.allowedSizes.map(size => ({ size, ...this.getSizeDimensions(size) }));
      const minW = Math.min(...dimensions.map(item => item.w));
      const maxW = Math.max(...dimensions.map(item => item.w));
      const minH = Math.min(...dimensions.map(item => item.h));
      const maxH = Math.max(...dimensions.map(item => item.h));
      const normalize = item => ({
        x: maxW === minW ? 0 : (item.w - minW) / (maxW - minW),
        y: maxH === minH ? 0 : (item.h - minH) / (maxH - minH),
      });
      const startDimensions = dimensions.find(item => item.size === state.originalSize) || dimensions[0];
      const start = normalize(startDimensions);
      const targetX = start.x + dx / state.horizontalSpan;
      const targetY = start.y + dy / state.verticalSpan;

      let nearest = dimensions[0].size;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const item of dimensions) {
        const point = normalize(item);
        const distance = (point.x - targetX) ** 2 + 2 * (point.y - targetY) ** 2;
        if (distance < nearestDistance) {
          nearest = item.size;
          nearestDistance = distance;
        }
      }
      return nearest;
    }

    _previewWidgetSize(card, widgetData, size, widgetName) {
      const dimensions = this.getSizeDimensions(size);
      const previewX = Math.min(widgetData.x, Math.max(0, COLUMNS - dimensions.w));
      card.style.setProperty("--grid-x", String(previewX));
      card.style.setProperty("--grid-w", String(dimensions.w));
      card.style.setProperty("--grid-h", String(dimensions.h));
      card.dataset.widgetSize = size === "square" ? "large" : size;
      card.dataset.widgetShape = size === "square" ? "square" : "wide";

      const widgetDef = root.LifeLedgerWidgetRegistry?.get(widgetData.type) ||
        root.LifeLedgerWidgetRegistry?.get(widgetData.id);
      widgetDef?.render?.({
        element: card,
        size: size === "square" ? "large" : size,
        data: {},
        locale: root.document?.documentElement?.lang || "en",
        motion: getMotionMode(),
      });

      card.querySelectorAll(".widget-size-btn").forEach(button => {
        const active = button.dataset.size === size;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-checked", String(active));
      });
      const handle = card.querySelector(":scope > .widget-resize-handle");
      const state = handle?.querySelector(".widget-resize-state");
      if (state) state.textContent = size.charAt(0).toUpperCase();
      handle?.setAttribute("aria-label", this._resizeHandleLabel(widgetName, size));
    }

    _settleResizedCard(card, previewRect, motion) {
      root.clearTimeout(card._settleTimer);
      card.classList.remove("is-resizing");
      const finalRect = card.getBoundingClientRect();
      const offsetX = previewRect.left - finalRect.left;
      const offsetY = previewRect.top - finalRect.top;

      if (motion === "off" || motion === "reduced") {
        card.style.transition = "none";
        card.style.transform = "";
        card.style.opacity = "";
        card.style.zIndex = "";
        root.requestAnimationFrame?.(() => {
          card.style.transition = "";
        });
        return;
      }

      card.style.transition = "none";
      card.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
      card.style.opacity = "0.92";
      card.getBoundingClientRect();
      card.style.transition = "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 240ms ease-out";
      card.style.transform = "translate3d(0, 0, 0)";
      card.style.opacity = "1";
      card._settleTimer = root.setTimeout(() => {
        card.style.transition = "";
        card.style.transform = "";
        card.style.opacity = "";
        card.style.zIndex = "";
      }, 240);
    }

    _setupPointerResize(handle, card, widgetData, widgetName) {
      handle.addEventListener("pointerdown", event => {
        if (
          event.button !== 0 ||
          event.isPrimary === false ||
          !this._isEditing ||
          this._resizeState ||
          this._dragState
        ) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();

        const cardRect = card.getBoundingClientRect();
        const metrics = this._measureGridMetrics();
        const compact = root.matchMedia?.("(max-width: 1179px)")?.matches;
        const fourColumnSpan = metrics.colTracks.slice(0, 4).reduce((sum, value) => sum + value, 0) +
          metrics.colGap * 4;
        const rowSpan = (metrics.rowTracks[widgetData.y] || metrics.rowTracks[0] || 180) + metrics.rowGap;
        const horizontalSpan = compact
          ? Math.max(120, Math.min(cardRect.width * 0.35, 180))
          : Math.max(120, fourColumnSpan);
        const verticalSpan = compact
          ? Math.max(120, Math.min(cardRect.width * 0.28, 180))
          : Math.max(120, rowSpan);
        const motion = getMotionMode();
        const pointerId = event.pointerId;

        card.classList.add("is-resizing");
        card.style.transition = "none";
        card.style.zIndex = "100";

        const state = {
          pointerId,
          originalSize: widgetData.size === "large" && widgetData.settings?.shape === "square" ? "square" : widgetData.size,
          candidateSize: widgetData.size === "large" && widgetData.settings?.shape === "square" ? "square" : widgetData.size,
          allowedSizes: this._allowedWidgetSizes(widgetData),
          startX: event.clientX,
          startY: event.clientY,
          horizontalSpan,
          verticalSpan: this._allowedWidgetSizes(widgetData).includes("square") ? verticalSpan * 3 : verticalSpan,
          cancel: null,
        };
        this._resizeState = state;

        const cleanUp = () => {
          handle.removeEventListener("pointermove", onMove);
          handle.removeEventListener("pointerup", onUp);
          handle.removeEventListener("pointercancel", onCancel);
          try { handle.releasePointerCapture(pointerId); } catch {}
        };

        const finish = cancelled => {
          if (this._resizeState !== state) return;
          cleanUp();

          if (cancelled || state.candidateSize === state.originalSize) {
            this._previewWidgetSize(card, widgetData, state.originalSize, widgetName);
            card.classList.remove("is-resizing");
            card.style.transition = "";
            card.style.transform = "";
            card.style.opacity = "";
            card.style.zIndex = "";
            this._resizeState = null;
            return;
          }

          const previewRect = card.getBoundingClientRect();
          const candidateSize = state.candidateSize;
          this._resizeState = null;
          this._changeWidgetSize(widgetData.id, candidateSize);
          this._settleResizedCard(card, previewRect, motion);
        };

        const onMove = moveEvent => {
          if (moveEvent.pointerId !== pointerId || moveEvent.isPrimary === false) return;
          moveEvent.preventDefault();
          const candidate = this._nearestResizeSize(
            state,
            moveEvent.clientX - state.startX,
            moveEvent.clientY - state.startY,
          );
          if (candidate === state.candidateSize) return;
          state.candidateSize = candidate;
          this._previewWidgetSize(card, widgetData, candidate, widgetName);
        };

        const onUp = upEvent => {
          if (upEvent.pointerId !== pointerId || upEvent.isPrimary === false) return;
          finish(false);
        };
        const onCancel = cancelEvent => {
          if (cancelEvent.pointerId !== pointerId) return;
          finish(true);
        };

        state.cancel = () => finish(true);
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onCancel);
        try { handle.setPointerCapture(pointerId); } catch {}
      });
    }

    _changeWidgetSize(widgetId, newSize) {
      if (!["small", "medium", "large", "square"].includes(newSize)) return;
      const layout = this.getLayout();
      const widget = layout.widgets.find(w => w.id === widgetId);
      if (!widget) return;
      if(!this._allowedWidgetSizes(widget).includes(newSize))return;

      this._pushTransaction();
      widget.size = newSize === "square" ? "large" : newSize;
      widget.settings = { ...widget.settings, shape: newSize === "square" ? "square" : "wide" };
      const dims = this.getSizeDimensions(newSize);

      // Clamp x if it exceeds 12
      if (widget.x + dims.w > COLUMNS) {
        widget.x = Math.max(0, COLUMNS - dims.w);
      }

      // Resolve collisions
      layout.widgets = this._resolveAllCollisions(layout.widgets, widgetId);
      this.writeStoredLayout(layout);
      this.renderBoard();
    }

    _toggleWidgetHidden(widgetId) {
      const layout = this.getLayout();
      const widget = layout.widgets.find(w => w.id === widgetId);
      if (!widget || PROTECTED_WIDGETS.has(widget.type) || PROTECTED_WIDGETS.has(widget.id)) return;

      this._pushTransaction();
      widget.hidden = !widget.hidden;
      layout.widgets = this._resolveAllCollisions(layout.widgets);
      this.writeStoredLayout(layout);
      this.renderBoard();
    }

    _setupPointerDrag(handle, card, widgetData) {
      let suppressMouseDown = false;

      const beginDrag = e => {
        if (e.button !== 0 || e.isPrimary === false || !this._isEditing || this._dragState || this._resizeState) return;
        e.preventDefault();
        root.clearTimeout(card._settleTimer);

        const startX = e.clientX;
        const startY = e.clientY;
        const cardRect = card.getBoundingClientRect();
        const containerRect = this._container.getBoundingClientRect();
        const gridMetrics = this._measureGridMetrics();
        const startScroll = this._container.scrollTop;
        const motion = getMotionMode();

        const pointerLike = String(e.type || "").startsWith("pointer");
        if (pointerLike) handle.setPointerCapture?.(e.pointerId);
        card.classList.add("is-dragging");

        // Zero easing during direct drag
        card.style.transition = "none";
        card.style.zIndex = "100";

        this._dragState = {
          pointerId: e.pointerId,
          handle,
          card,
          widgetData,
          startX,
          startY,
          origX: widgetData.x,
          origY: widgetData.y,
          cardRect,
          containerRect,
          gridMetrics,
        };

        const onMove = moveEvent => {
          if (!this._dragState) return;
          if (pointerLike && (moveEvent.pointerId !== e.pointerId || moveEvent.isPrimary === false)) return;
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          this._dragState.lastClientX = moveEvent.clientX;
          this._dragState.lastClientY = moveEvent.clientY;

          // Direct follow with zero easing
          const bounds = this._container.getBoundingClientRect();
          if (moveEvent.clientY > bounds.bottom - 44) this._container.scrollTop += 18;
          if (moveEvent.clientY < bounds.top + 44) this._container.scrollTop -= 18;
          card.style.transform = `translate3d(${dx}px, ${dy + this._container.scrollTop - startScroll}px, 0)`;
        };

        const onUp = upEvent => {
          if (pointerLike && upEvent.pointerId !== e.pointerId) return;
          cleanUp();
          if (!this._dragState) return;

          const containerRectNow = this._container.getBoundingClientRect();
          const dragState = this._dragState;
          const endX = dragState.lastClientX ?? upEvent.clientX;
          const endY = dragState.lastClientY ?? upEvent.clientY;
          const dx = endX - dragState.startX;
          const dy = endY - dragState.startY;
          const droppedRect = card.getBoundingClientRect();
          const relX = droppedRect.left - containerRectNow.left;
          const relY = droppedRect.top - containerRectNow.top;
          const metrics = this._measureGridMetrics();

          const dims = this.getSizeDimensions(widgetData.size, widgetData.settings, widgetData.type);
          let targetX = this._pointerToGridColumn(relX, metrics);
          let targetY = this._pointerToGridRow(relY, metrics);

          if (targetX + dims.w > COLUMNS) targetX = Math.max(0, COLUMNS - dims.w);

          const hasMoved = targetX !== widgetData.x || targetY !== widgetData.y;

          if (hasMoved) {
            this._pushTransaction();
            const layout = this.getLayout();
            const w = layout.widgets.find(item => item.id === widgetData.id);
            if (w) {
              w.x = targetX;
              w.y = targetY;
              layout.widgets = this._resolveAllCollisions(layout.widgets, w.id);
              this.writeStoredLayout(layout);
            }
          }

          const previewRect = card.getBoundingClientRect();
          this._dragState = null;
          card.classList.remove("is-dragging");
          card.style.transform = "";
          this.renderBoard();
          this._settleResizedCard(card, previewRect, motion);
          card.querySelector('.widget-drag-handle')?.focus({preventScroll:true});
        };

        const onCancel = () => {
          cleanUp();
          if (!this._dragState) return;
          card.style.transition = "none";
          card.style.transform = "none";
          card.style.zIndex = "";
          card.classList.remove("is-dragging");
          this._dragState = null;
          this.renderBoard();
        };

        const cleanUp = () => {
          try { handle.releasePointerCapture?.(e.pointerId); } catch {}
          root.window?.removeEventListener("pointermove", onMove);
          root.window?.removeEventListener("mousemove", onMove);
          root.window?.removeEventListener("pointerup", onUp);
          root.window?.removeEventListener("mouseup", onUp);
          root.window?.removeEventListener("pointercancel", onCancel);
          root.document?.removeEventListener("keydown", onKeyDown);
        };

        const onKeyDown = keyEvent => {
          if (keyEvent.key === "Escape") {
            keyEvent.preventDefault();
            onCancel();
          }
        };

        root.window?.addEventListener("pointermove", onMove);
        root.window?.addEventListener("mousemove", onMove);
        root.window?.addEventListener("pointerup", onUp);
        root.window?.addEventListener("mouseup", onUp);
        root.window?.addEventListener("pointercancel", onCancel);
        root.document?.addEventListener("keydown", onKeyDown);
      };

      handle.addEventListener("pointerdown", e => {
        suppressMouseDown = true;
        beginDrag(e);
      });
      handle.addEventListener("mousedown", e => {
        if (suppressMouseDown) {
          suppressMouseDown = false;
          return;
        }
        beginDrag(e);
      });
    }

    _setupKeyboardMove(handle, widgetData) {
      handle.addEventListener("keydown", e => {
        if (!this._isEditing) return;

        const key = e.key.toLowerCase();
        if (key === "s") {
          e.preventDefault();
          this._changeWidgetSize(widgetData.id, "small");
          const updatedHandle = this._container?.querySelector(`[data-module="${widgetData.type}"] .widget-drag-handle`);
          updatedHandle?.focus();
          return;
        }
        if (key === "m") {
          e.preventDefault();
          this._changeWidgetSize(widgetData.id, "medium");
          const updatedHandle = this._container?.querySelector(`[data-module="${widgetData.type}"] .widget-drag-handle`);
          updatedHandle?.focus();
          return;
        }
        if (key === "l") {
          e.preventDefault();
          this._changeWidgetSize(widgetData.id, "large");
          const updatedHandle = this._container?.querySelector(`[data-module="${widgetData.type}"] .widget-drag-handle`);
          updatedHandle?.focus();
          return;
        }

        let deltaX = 0;
        let deltaY = 0;

        if (e.key === "ArrowLeft") deltaX = -this.getLaneStep();
        else if (e.key === "ArrowRight") deltaX = this.getLaneStep();
        else if (e.key === "ArrowUp") deltaY = -1;
        else if (e.key === "ArrowDown") deltaY = 1;
        else return;

        e.preventDefault();
        const layout = this.getLayout();
        const w = layout.widgets.find(item => item.id === widgetData.id);
        if (!w) return;

        const dims = this.getSizeDimensions(w.size, w.settings, w.type);
        let newX = w.x + deltaX;
        let newY = Math.max(0, w.y + deltaY);

        if (newX < 0) newX = 0;
        if (newX + dims.w > COLUMNS) newX = Math.max(0, COLUMNS - dims.w);

        if (newX === w.x && newY === w.y) return;

        this._pushTransaction();
        w.x = newX;
        w.y = newY;
        layout.widgets = this._resolveAllCollisions(layout.widgets, w.id);
        this.writeStoredLayout(layout);
        this.renderBoard();

        // Keep focus on the handle after DOM update
        const updatedHandle = this._container.querySelector(`[data-module="${widgetData.type}"] .widget-drag-handle`);
        updatedHandle?.focus();
      });
    }

    _setupKeyboardHandlers() {
      root.document?.addEventListener("keydown", e => {
        if (!this._isEditing) return;
        if (e.key === "Escape") {
          e.preventDefault();
          if (this._resizeState) {
            this._resizeState.cancel();
          } else {
            this.cancelEditSession();
          }
        } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
          e.preventDefault();
          this.undo();
        }
      });
    }
  }

  const engine = new TodayLayoutEngine();
  root.LifeLedgerLayoutEngine = engine;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { TodayLayoutEngine, layoutEngine: engine };
  }
})(typeof window !== "undefined" ? window : globalThis);
