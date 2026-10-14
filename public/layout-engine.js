/**
 * Life Ledger 2.0 — Today Layout Engine
 * Owns layout schema v2, 12-column grid geometry, discrete S/M/L aspect states,
 * 2D drag & drop with zero-easing direct tracking, settle/reflow animations,
 * collision handling, keyboard navigation, undo transactions, and non-destructive v1 migration.
 */
(function (root) {
  const SCHEMA_VERSION = 2;
  const STORAGE_KEY_V2 = "life-ledger-layout-v2";
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
      { id: "today-focus", type: "focus", size: "small", x: 8, y: 0, hidden: false, settings: {} },
      { id: "today-context", type: "context", size: "small", x: 8, y: 1, hidden: false, settings: {} },
      { id: "today-habits", type: "habits", size: "large", x: 0, y: 2, hidden: false, settings: {} },
      { id: "today-reflection", type: "reflection", size: "small", x: 8, y: 2, hidden: false, settings: {} },
      { id: "today-photos", type: "photos", size: "medium", x: 0, y: 4, hidden: false, settings: {} },
      { id: "today-calendar", type: "calendar", size: "large", x: 0, y: 5, hidden: false, settings: {} },
    ],
  };

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
      this.STORAGE_KEY = STORAGE_KEY_V2;
      this.V1_STORAGE_KEY = STORAGE_KEY_V1;
      this.SCHEMA_VERSION = SCHEMA_VERSION;
      this.COLUMNS = COLUMNS;
      this.SIZE_DIMENSIONS = SIZE_DIMENSIONS;
      this.DEFAULT_LAYOUT = DEFAULT_TODAY_LAYOUT;

      this._container = null;
      this._activeLayout = null;
      this._isEditing = false;
      this._transactionHistory = [];
      this._dragState = null;
      this._resizeState = null;
      this._editSessionSnapshot = null;
      this._hasInitListeners = false;
      this._changeListeners = new Set();
    }

    setTranslator(fn) {
      setTranslator(fn);
    }

    getSizeDimensions(size) {
      return SIZE_DIMENSIONS[size] || SIZE_DIMENSIONS.medium;
    }

    validateLayout(data) {
      const errors = [];
      if (!data || typeof data !== "object") {
        return { valid: false, errors: ["Layout data is not an object"], layout: clone(DEFAULT_TODAY_LAYOUT) };
      }
      if (data.schemaVersion !== 2) {
        errors.push(`Invalid schemaVersion ${data.schemaVersion}; expected 2`);
      }
      if (data.view !== "today") {
        errors.push(`Invalid view "${data.view}"; expected "today"`);
      }
      if (!Array.isArray(data.widgets)) {
        errors.push("Layout widgets is not an array");
        return { valid: false, errors, layout: clone(DEFAULT_TODAY_LAYOUT) };
      }

      const validatedWidgets = [];
      const defaultWidgetsMap = new Map(DEFAULT_TODAY_LAYOUT.widgets.map(w => [w.type, w]));

      for (const w of data.widgets) {
        if (!w || typeof w !== "object") continue;
        const type = String(w.type || w.id || "").replace(/^today-/, "");
        const id = w.id || `today-${type}`;
        let size = w.size;
        if (!["small", "medium", "large"].includes(size)) {
          size = defaultWidgetsMap.get(type)?.size || "medium";
          errors.push(`Widget ${id} has invalid size "${w.size}"; normalized to "${size}"`);
        }
        const dims = this.getSizeDimensions(size);

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
          settings: typeof w.settings === "object" && w.settings ? { ...w.settings } : {},
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
          widgets: resolvedWidgets,
        },
      };
    }

    _resolveAllCollisions(widgets) {
      const items = widgets.map(w => ({ ...w, ...this.getSizeDimensions(w.size) }));
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
        return clone(DEFAULT_TODAY_LAYOUT);
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
      const defaultWidgetsMap = new Map(DEFAULT_TODAY_LAYOUT.widgets.map(w => [w.type, w]));
      const allKnownTypes = ["summary", "habits", "calendar", "focus", "photos", "reflection", "context"];

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
        const isHidden = isProtected ? false : (hidden.has(type) || hidden.has(rawId));

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
        const rawV2 = root.localStorage ? root.localStorage.getItem(STORAGE_KEY_V2) : null;
        if (rawV2) {
          try {
            const parsed = JSON.parse(rawV2);
            const { valid, layout } = this.validateLayout(parsed);
            return layout;
          } catch {
            // Corrupt JSON: return deterministic default without deleting the raw value in localStorage
            return clone(DEFAULT_TODAY_LAYOUT);
          }
        }

        // V2 not yet in storage: check v1 for one-time non-destructive migration
        const rawV1 = root.localStorage ? root.localStorage.getItem(STORAGE_KEY_V1) : null;
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

        return clone(DEFAULT_TODAY_LAYOUT);
      } catch {
        return clone(DEFAULT_TODAY_LAYOUT);
      }
    }

    writeStoredLayout(layout) {
      try {
        if (!root.localStorage) return;
        const { layout: normalized } = this.validateLayout(layout);
        root.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(normalized));
        this._activeLayout = normalized;
        this._notifyChange(normalized);
      } catch {}
    }

    resetLayout() {
      const def = clone(DEFAULT_TODAY_LAYOUT);
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

    setLayout(layout) {
      this._pushTransaction();
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
    _pointerToGridColumn(relX, metrics) {
      const colIndex = this._nearestTrackIndex(relX, metrics.colTracks, metrics.colGap);
      // S/M/L widgets align to 4-column slots (matches keyboard ArrowLeft/Right step of 4).
      let targetX = Math.round(colIndex / 4) * 4;
      if (targetX < 0) targetX = 0;
      if (targetX > COLUMNS - 1) targetX = COLUMNS - 4;
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

        // Position in 12-column grid via CSS variables
        const dims = this.getSizeDimensions(w.size);
        card.style.setProperty("--grid-x", String(w.x));
        card.style.setProperty("--grid-y", String(w.y));
        card.style.setProperty("--grid-w", String(dims.w));
        card.style.setProperty("--grid-h", String(dims.h));
        card.dataset.widgetSize = w.size;

        if (w.hidden && !isEditing) {
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
            size: w.size,
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
        }

        let resizeHandle = card.querySelector(":scope > .widget-resize-handle");
        if (isEditing) {
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
          <button type="button" class="widget-size-btn${size === "large" ? " is-active" : ""}" data-size="large" aria-checked="${size === "large"}" role="radio" title="${escapeHtml(tr("modules.sizeLarge", "Large"))}">L</button>
        </div>
        <div class="widget-edit-trailing">
          ${isProtected ? "" : `<button type="button" class="widget-hide-btn" data-action="toggle-hide" aria-label="${escapeHtml(hideLabel)}" title="${escapeHtml(hideText)}">${isHidden ? SHOW_ICON : HIDE_ICON}</button>`}
        </div>
      `;

      // Setup 2D pointer drag on the drag handle
      const handle = editBar.querySelector(".widget-drag-handle");
      if (handle) {
        this._setupPointerDrag(handle, card, widgetData);
        this._setupKeyboardMove(handle, widgetData);
      }

      // Size buttons with arrow key traversal (radiogroup behavior)
      const sizeBtns = Array.from(editBar.querySelectorAll(".widget-size-btn"));
      sizeBtns.forEach((btn, idx) => {
        btn.addEventListener("click", e => {
          e.preventDefault();
          const targetSize = btn.dataset.size;
          if (targetSize && targetSize !== widgetData.size) {
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
      const widgetDef = root.LifeLedgerWidgetRegistry?.get(widgetData.type) ||
        root.LifeLedgerWidgetRegistry?.get(widgetData.id);
      const allowed = Array.isArray(widgetDef?.allowedSizes)
        ? widgetDef.allowedSizes.filter(size => Object.hasOwn(SIZE_DIMENSIONS, size))
        : [];
      return allowed.length ? allowed : ["small", "medium", "large"];
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
      card.dataset.widgetSize = size;

      const widgetDef = root.LifeLedgerWidgetRegistry?.get(widgetData.type) ||
        root.LifeLedgerWidgetRegistry?.get(widgetData.id);
      widgetDef?.render?.({
        element: card,
        size,
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
      root.setTimeout(() => {
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
          originalSize: widgetData.size,
          candidateSize: widgetData.size,
          allowedSizes: this._allowedWidgetSizes(widgetData),
          startX: event.clientX,
          startY: event.clientY,
          horizontalSpan,
          verticalSpan,
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
      if (!["small", "medium", "large"].includes(newSize)) return;
      const layout = this.getLayout();
      const widget = layout.widgets.find(w => w.id === widgetId);
      if (!widget) return;

      this._pushTransaction();
      widget.size = newSize;
      const dims = this.getSizeDimensions(newSize);

      // Clamp x if it exceeds 12
      if (widget.x + dims.w > COLUMNS) {
        widget.x = Math.max(0, COLUMNS - dims.w);
      }

      // Resolve collisions
      layout.widgets = this._resolveAllCollisions(layout.widgets);
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
        if (e.button !== 0 || !this._isEditing) return;
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const cardRect = card.getBoundingClientRect();
        const containerRect = this._container.getBoundingClientRect();
        const gridMetrics = this._measureGridMetrics();
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
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          this._dragState.lastClientX = moveEvent.clientX;
          this._dragState.lastClientY = moveEvent.clientY;

          // Direct follow with zero easing
          card.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        };

        const onUp = upEvent => {
          cleanUp();
          if (!this._dragState) return;

          const containerRectNow = this._container.getBoundingClientRect();
          const dragState = this._dragState;
          const endX = dragState.lastClientX ?? upEvent.clientX;
          const endY = dragState.lastClientY ?? upEvent.clientY;
          const dx = endX - dragState.startX;
          const dy = endY - dragState.startY;
          const relX = dragState.cardRect.left - containerRectNow.left + dx;
          const relY = dragState.cardRect.top - containerRectNow.top + dy;
          const metrics = this._measureGridMetrics();

          const dims = this.getSizeDimensions(widgetData.size);
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
              layout.widgets = this._resolveAllCollisions(layout.widgets);
              this.writeStoredLayout(layout);
            }
          }

          // Settle transition
          if (motion === "off" || motion === "reduced") {
            card.style.transition = "none";
            card.style.transform = "none";
            card.style.zIndex = "";
            card.classList.remove("is-dragging");
            this.renderBoard();
          } else {
            card.style.transition = "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)";
            card.style.transform = "translate3d(0, 0, 0)";
            setTimeout(() => {
              card.style.transition = "";
              card.style.transform = "";
              card.style.zIndex = "";
              card.classList.remove("is-dragging");
              this.renderBoard();
            }, 240);
          }

          this._dragState = null;
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

        if (e.key === "ArrowLeft") deltaX = -4;
        else if (e.key === "ArrowRight") deltaX = 4;
        else if (e.key === "ArrowUp") deltaY = -1;
        else if (e.key === "ArrowDown") deltaY = 1;
        else return;

        e.preventDefault();
        const layout = this.getLayout();
        const w = layout.widgets.find(item => item.id === widgetData.id);
        if (!w) return;

        const dims = this.getSizeDimensions(w.size);
        let newX = w.x + deltaX;
        let newY = Math.max(0, w.y + deltaY);

        if (newX < 0) newX = 0;
        if (newX + dims.w > COLUMNS) newX = Math.max(0, COLUMNS - dims.w);

        if (newX === w.x && newY === w.y) return;

        this._pushTransaction();
        w.x = newX;
        w.y = newY;
        layout.widgets = this._resolveAllCollisions(layout.widgets);
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
