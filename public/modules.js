/**
 * Life Ledger 3.6.0 — Modular Board Controller
 * Manages reorderable, collapsible, hideable module canvases on Today and Week.
 * Layout state isolated in localStorage["life-ledger-layout-v1"].
 */
(function (root) {
  const STORAGE_KEY = "life-ledger-layout-v1";
  const DEFAULT_BOARDS = {
    today: {
      order: ["summary", "habits", "calendar", "focus", "photos", "reflection", "context"],
      collapsed: [],
      hidden: [],
      protected: ["habits"],
    },
    week: {
      order: ["completed", "insights", "goals", "review"],
      collapsed: [],
      hidden: [],
      protected: [],
    },
  };

  let translator = (key, vars = {}) => {
    if (typeof vars === "string") return vars;
    return vars?.fallback || key;
  };
  function setTranslator(fn) {
    if (typeof fn === "function") {
      translator = fn;
    }
  }
  function tr(key, vars = {}) {
    try {
      const res = translator(key, vars);
      if (typeof res === "string") return res;
      if (typeof vars === "string") return vars;
      return vars?.fallback || key;
    } catch {
      return typeof vars === "string" ? vars : vars?.fallback || key;
    }
  }
  function escapeHtml(text) {
    return String(text ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function readStoredLayout() {
    try {
      const raw = root.localStorage ? root.localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeStoredLayout(layout) {
    try {
      if (root.localStorage) {
        root.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      }
    } catch {}
  }

  function getBoardState(boardName) {
    const defaults = DEFAULT_BOARDS[boardName] || { order: [], collapsed: [], hidden: [], protected: [] };
    const stored = readStoredLayout()[boardName];
    if (!stored || typeof stored !== "object") {
      return {
        order: [...defaults.order],
        collapsed: [...defaults.collapsed],
        hidden: [...defaults.hidden],
      };
    }
    const known = new Set(defaults.order);
    const validOrder = (Array.isArray(stored.order) ? stored.order : []).filter(id => known.has(id));
    defaults.order.forEach(id => {
      if (!validOrder.includes(id)) validOrder.push(id);
    });
    const protectedSet = new Set(defaults.protected || []);
    const validHidden = (Array.isArray(stored.hidden) ? stored.hidden : []).filter(id => known.has(id) && !protectedSet.has(id));
    const validCollapsed = (Array.isArray(stored.collapsed) ? stored.collapsed : []).filter(id => known.has(id) && !protectedSet.has(id));
    return {
      order: validOrder,
      collapsed: validCollapsed,
      hidden: validHidden,
    };
  }

  function saveBoardState(boardName, state) {
    const all = readStoredLayout();
    const defaults = DEFAULT_BOARDS[boardName] || { protected: [] };
    const protectedSet = new Set(defaults.protected || []);
    all[boardName] = {
      order: Array.isArray(state.order) ? state.order : [],
      collapsed: (Array.isArray(state.collapsed) ? state.collapsed : []).filter(id => !protectedSet.has(id)),
      hidden: (Array.isArray(state.hidden) ? state.hidden : []).filter(id => !protectedSet.has(id)),
    };
    writeStoredLayout(all);
  }

  function resetLayout(board) {
    const boardName = typeof board === "string" ? board : board?.dataset?.moduleBoard;
    const boardEl = typeof board === "string" ? root.document?.querySelector(`[data-module-board="${board}"]`) : board;
    if (boardName) {
      const all = readStoredLayout();
      delete all[boardName];
      if (Object.keys(all).length === 0) {
        if (root.localStorage) root.localStorage.removeItem(STORAGE_KEY);
      } else {
        writeStoredLayout(all);
      }
    } else {
      if (root.localStorage) root.localStorage.removeItem(STORAGE_KEY);
    }
    if (boardEl) {
      applyBoardDOM(boardEl);
    }
  }

  function getMotionMode() {
    const doc = root.document?.documentElement;
    if (!doc) return "full";
    if (doc.classList.contains("motion-off")) return "off";
    if (doc.classList.contains("motion-reduced")) return "reduced";
    return "full";
  }

  function announce(message) {
    const doc = root.document;
    if (!doc || !message) return;
    let live = doc.getElementById("moduleLiveRegion");
    if (!live) {
      live = doc.createElement("div");
      live.id = "moduleLiveRegion";
      live.className = "sr-only";
      live.setAttribute("aria-live", "polite");
      live.setAttribute("aria-atomic", "true");
      doc.body.appendChild(live);
    }
    live.textContent = message;
  }

  function flipAnimate(container, workFn) {
    const motion = getMotionMode();
    if (motion === "off" || !container) {
      workFn();
      return;
    }
    const children = Array.from(container.querySelectorAll(":scope > [data-module]"));
    const firstRects = new Map(children.map(el => [el, el.getBoundingClientRect()]));
    workFn();
    const lastRects = new Map(children.map(el => [el, el.getBoundingClientRect()]));

    children.forEach(el => {
      const first = firstRects.get(el);
      const last = lastRects.get(el);
      if (!first || !last) return;
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (motion === "reduced") {
        el.style.transition = "opacity 180ms ease-out";
        el.style.opacity = "0.4";
        root.requestAnimationFrame?.(() => {
          el.style.opacity = "1";
          setTimeout(() => { el.style.transition = ""; el.style.opacity = ""; }, 180);
        });
        return;
      }
      if (dx === 0 && dy === 0) return;
      el.style.transition = "none";
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      root.requestAnimationFrame?.(() => {
        el.style.transition = "transform 220ms cubic-bezier(0.25, 1, 0.5, 1)";
        el.style.transform = "translate3d(0, 0, 0)";
        setTimeout(() => { el.style.transition = ""; el.style.transform = ""; }, 240);
      });
    });
  }

  function toggleCollapse(moduleEl) {
    if (!moduleEl) return;
    const boardEl = moduleEl.closest("[data-module-board]");
    const boardName = boardEl?.dataset.moduleBoard;
    const moduleId = moduleEl.dataset.module;
    const defaults = DEFAULT_BOARDS[boardName];
    if (defaults && defaults.protected && defaults.protected.includes(moduleId)) return;
    const bodyEl = moduleEl.querySelector(".module-body");
    const toggleBtn = moduleEl.querySelector(".module-collapse-toggle");
    const isCollapsed = moduleEl.classList.contains("is-collapsed");
    const willCollapse = !isCollapsed;

    flipAnimate(boardEl, () => {
      moduleEl.classList.toggle("is-collapsed", willCollapse);
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", String(!willCollapse));
      }
      if (bodyEl) {
        bodyEl.hidden = willCollapse;
      }
    });

    if (boardName) {
      const state = getBoardState(boardName);
      const set = new Set(state.collapsed);
      if (willCollapse) set.add(moduleId);
      else set.delete(moduleId);
      state.collapsed = Array.from(set);
      saveBoardState(boardName, state);
    }
  }

  function moveModule(boardEl, moduleId, delta) {
    if (!boardEl || !moduleId) return;
    const boardName = boardEl.dataset.moduleBoard;
    const state = getBoardState(boardName);
    const visibleOrder = state.order.filter(id => !state.hidden.includes(id));
    const idx = visibleOrder.indexOf(moduleId);
    if (idx === -1) return;
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= visibleOrder.length) return;
    const targetId = visibleOrder[targetIdx];

    const fullIdx = state.order.indexOf(moduleId);
    const fullTargetIdx = state.order.indexOf(targetId);
    state.order.splice(fullIdx, 1);
    state.order.splice(fullTargetIdx, 0, moduleId);
    saveBoardState(boardName, state);

    flipAnimate(boardEl, () => {
      applyBoardDOM(boardEl);
    });
    const dir = delta < 0 ? tr("modules.up", "up") : tr("modules.down", "down");
    announce(tr("modules.movedDelta", { name: tr(`modules.names.${moduleId}`, moduleId), dir }));
  }

  function toggleHide(boardEl, moduleId) {
    if (!boardEl || !moduleId) return;
    const boardName = boardEl.dataset.moduleBoard;
    const defaults = DEFAULT_BOARDS[boardName];
    if (defaults && defaults.protected && defaults.protected.includes(moduleId)) return;
    const state = getBoardState(boardName);
    const set = new Set(state.hidden);
    if (set.has(moduleId)) set.delete(moduleId);
    else set.add(moduleId);
    state.hidden = Array.from(set);
    saveBoardState(boardName, state);
    flipAnimate(boardEl, () => {
      applyBoardDOM(boardEl);
    });
    const name = tr(`modules.names.${moduleId}`, moduleId);
    announce(tr(set.has(moduleId) ? "modules.hidden" : "modules.visible", { name }));
  }

  function applyBoardDOM(boardEl) {
    if (!boardEl) return;
    const boardName = boardEl.dataset.moduleBoard;
    const state = getBoardState(boardName);
    const isEditing = boardEl.classList.contains("is-editing-layout");

    const modulesById = new Map();
    boardEl.querySelectorAll(":scope > [data-module]").forEach(el => {
      modulesById.set(el.dataset.module, el);
    });

    state.order.forEach(id => {
      const el = modulesById.get(id);
      if (el) boardEl.appendChild(el);
    });

    state.order.forEach(id => {
      const el = modulesById.get(id);
      if (!el) return;
      const isHidden = state.hidden.includes(id);
      const isCollapsed = state.collapsed.includes(id);

      if (isHidden && !isEditing) {
        el.hidden = true;
      } else {
        el.hidden = false;
        el.classList.toggle("is-layout-hidden", isHidden);
      }

      el.classList.toggle("is-collapsed", isCollapsed && !isEditing);
      const bodyEl = el.querySelector(".module-body");
      if (bodyEl) {
        bodyEl.hidden = isCollapsed && !isEditing;
      }
      const toggleBtn = el.querySelector(".module-collapse-toggle");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", String(!isCollapsed || isEditing));
      }

      let editBar = el.querySelector(".module-edit-bar");
      if (isEditing) {
        if (!editBar) {
          editBar = root.document.createElement("div");
          editBar.className = "module-edit-bar";
          el.prepend(editBar);
        }
        editBar.hidden = false;
        renderEditBar(editBar, boardEl, id, state);
      } else if (editBar) {
        editBar.hidden = true;
      }
    });
  }

  function setupDrag(handle, moduleEl, boardEl, moduleId) {
    handle.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      const boardName = boardEl.dataset.moduleBoard;
      const state = getBoardState(boardName);
      const originalNextSibling = moduleEl.nextSibling;
      const originalParent = moduleEl.parentElement;

      handle.setPointerCapture?.(e.pointerId);

      let placeholder = root.document.createElement("div");
      placeholder.className = "module-drop-placeholder";
      placeholder.style.minHeight = `${Math.max(60, moduleEl.offsetHeight)}px`;
      moduleEl.after(placeholder);
      moduleEl.classList.add("is-dragging");

      function onMove(moveEvent) {
        moduleEl.style.pointerEvents = "none";
        const elem = root.document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        moduleEl.style.pointerEvents = "";
        const target = elem?.closest?.("[data-module]");
        if (target && target !== moduleEl && target.parentElement === boardEl) {
          const r = target.getBoundingClientRect();
          if (moveEvent.clientY < r.top + r.height / 2) {
            target.before(placeholder);
          } else {
            target.after(placeholder);
          }
        }
      }

      function onUp(upEvent) {
        cleanListeners();
        try { handle.releasePointerCapture?.(upEvent.pointerId); } catch {}
        moduleEl.classList.remove("is-dragging");
        moduleEl.style.pointerEvents = "";

        flipAnimate(boardEl, () => {
          placeholder.replaceWith(moduleEl);
          const newOrder = Array.from(boardEl.querySelectorAll(":scope > [data-module]"))
            .map(el => el.dataset.module);
          state.order = newOrder;
          saveBoardState(boardName, state);
        });
        const name = tr(`modules.names.${moduleId}`, moduleId);
        announce(tr("modules.moved", { name }));
      }

      function onCancel(cancelEvent) {
        cleanListeners();
        try { handle.releasePointerCapture?.(cancelEvent.pointerId); } catch {}
        moduleEl.classList.remove("is-dragging");
        moduleEl.style.pointerEvents = "";
        placeholder.remove();
        if (originalNextSibling && originalNextSibling.parentElement === originalParent) {
          originalParent.insertBefore(moduleEl, originalNextSibling);
        } else {
          originalParent.appendChild(moduleEl);
        }
      }

      function cleanListeners() {
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        handle.removeEventListener("pointercancel", onCancel);
        root.document.removeEventListener("pointermove", onMove);
        root.document.removeEventListener("pointerup", onUp);
        root.document.removeEventListener("pointercancel", onCancel);
      }

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
      handle.addEventListener("pointercancel", onCancel);
      root.document.addEventListener("pointermove", onMove);
      root.document.addEventListener("pointerup", onUp);
      root.document.addEventListener("pointercancel", onCancel);
    });
  }

  function renderEditBar(editBar, boardEl, moduleId, state) {
    const defaults = DEFAULT_BOARDS[boardEl.dataset.moduleBoard];
    const isProtected = defaults && defaults.protected && defaults.protected.includes(moduleId);
    const isHidden = state.hidden.includes(moduleId);
    const nameLabel = tr(`modules.names.${moduleId}`, moduleId);
    const dragLabel = tr("modules.dragHandle", { name: nameLabel });
    const dragHint = tr("modules.dragHint", "Alt+Up/Down to reorder");
    const moveUpLabel = tr("modules.moveUp", { name: nameLabel });
    const moveDownLabel = tr("modules.moveDown", { name: nameLabel });
    const toggleHideLabel = isHidden ? tr("modules.show", { name: nameLabel }) : tr("modules.hide", { name: nameLabel });
    const toggleHideText = isHidden ? tr("modules.actionShow", "Show") : tr("modules.actionHide", "Hide");

    editBar.innerHTML = `
      <button type="button" class="module-edit-handle" aria-label="${escapeHtml(dragLabel)}" title="${escapeHtml(dragHint)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
      </button>
      <span class="module-edit-name">${escapeHtml(nameLabel)}</span>
      <div class="module-edit-actions">
        <button type="button" class="module-edit-btn" data-action="up" aria-label="${escapeHtml(moveUpLabel)}">↑</button>
        <button type="button" class="module-edit-btn" data-action="down" aria-label="${escapeHtml(moveDownLabel)}">↓</button>
        ${isProtected ? "" : `<button type="button" class="module-edit-btn" data-action="toggle-hide" aria-label="${escapeHtml(toggleHideLabel)}">${escapeHtml(toggleHideText)}</button>`}
      </div>
    `;

    const handle = editBar.querySelector(".module-edit-handle");
    handle?.addEventListener("keydown", event => {
      if (event.altKey && event.key === "ArrowUp") {
        event.preventDefault();
        moveModule(boardEl, moduleId, -1);
        handle.focus();
      } else if (event.altKey && event.key === "ArrowDown") {
        event.preventDefault();
        moveModule(boardEl, moduleId, 1);
        handle.focus();
      }
    });

    const moduleEl = editBar.closest("[data-module]");
    if (handle && moduleEl) setupDrag(handle, moduleEl, boardEl, moduleId);

    editBar.querySelector('[data-action="up"]')?.addEventListener("click", () => moveModule(boardEl, moduleId, -1));
    editBar.querySelector('[data-action="down"]')?.addEventListener("click", () => moveModule(boardEl, moduleId, 1));
    editBar.querySelector('[data-action="toggle-hide"]')?.addEventListener("click", () => toggleHide(boardEl, moduleId));
  }

  function renderLayoutEditHint(boardEl, enabled) {
    let hint = boardEl.querySelector(".layout-edit-hint-banner");
    if (!enabled) {
      hint?.remove();
      return;
    }
    const layout = readStoredLayout();
    if (layout.editHintDismissed) {
      hint?.remove();
      return;
    }
    if (!hint) {
      hint = root.document.createElement("aside");
      hint.className = "layout-edit-hint-banner";
      hint.innerHTML = `
        <div class="layout-edit-hint-art hairline-mount is-inline" id="layoutEditHintArt"></div>
        <div class="layout-edit-hint-copy">
          <strong>${escapeHtml(tr("modules.hintTitle", "Customize your dashboard"))}</strong>
          <p>${escapeHtml(tr("modules.hintDesc", "Drag cards to reorder, or use the arrows. Changes save automatically."))}</p>
        </div>
        <button type="button" class="layout-edit-hint-dismiss icon-button" aria-label="${escapeHtml(tr("modules.dismissHint", "Dismiss"))}"><svg class="ui-icon" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      `;
      hint.querySelector(".layout-edit-hint-dismiss")?.addEventListener("click", () => {
        const current = readStoredLayout();
        current.editHintDismissed = true;
        writeStoredLayout(current);
        hint.remove();
      });
      boardEl.prepend(hint);
      const art = hint.querySelector("#layoutEditHintArt");
      if (art && root.LifeLedgerInteraction?.mountHairline) {
        root.LifeLedgerInteraction.mountHairline(art, "./assets/hairline/layout-edit-hint.svg");
      }
    }
  }

  function setEditMode(boardEl, enabled) {
    if (!boardEl) return;
    const active = Boolean(enabled);
    boardEl.classList.toggle("is-editing-layout", active);
    const btn = root.document.querySelector(`[data-action="edit-layout"][data-board="${boardEl.dataset.moduleBoard}"]`) ||
      root.document.getElementById("editLayoutToggle");
    if (btn) btn.setAttribute("aria-pressed", String(active));
    renderLayoutEditHint(boardEl, active);
    applyBoardDOM(boardEl);
    announce(active ? tr("modules.editEnabled", "Layout edit mode enabled") : tr("modules.editDisabled", "Layout edit mode closed"));
  }

  function initBoard(boardEl) {
    if (!boardEl || boardEl._moduleBoardInitialized) return;
    boardEl._moduleBoardInitialized = true;

    boardEl.addEventListener("click", event => {
      const toggle = event.target.closest(".module-collapse-toggle");
      if (toggle) {
        event.preventDefault();
        const moduleEl = toggle.closest("[data-module]");
        toggleCollapse(moduleEl);
      }
    });

    applyBoardDOM(boardEl);
  }

  function isEditMode(boardEl) {
    return Boolean(boardEl && boardEl.classList.contains("is-editing-layout"));
  }

  const LifeLedgerModules = {
    DEFAULT_BOARDS,
    STORAGE_KEY,
    setTranslator,
    getBoardState,
    saveBoardState,
    resetLayout,
    applyBoardDOM,
    initBoard,
    toggleCollapse,
    moveModule,
    toggleHide,
    setEditMode,
    isEditMode,
  };

  root.LifeLedgerModules = LifeLedgerModules;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = LifeLedgerModules;
  }
})(typeof window !== "undefined" ? window : globalThis);
