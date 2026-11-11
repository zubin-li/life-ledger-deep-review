import { createWidgetRegistry, normalizeWidgetSize, sizeLabel, WIDGET_SIZES } from "./prototype-361-widgets.js";

export function initVariantC(deps) {
  const registry = createWidgetRegistry(deps);
  return { registry, renderCWidgets, bindCCanvas, renderCHeaderExtras };
}

function widgetChrome(widgetId, def, layout, size) {
  const edit = layout.editMode;
  if (!edit) return "";
  const sizeButtons = WIDGET_SIZES.map((sz) => {
    const allowed = def.allowedSizes.includes(sz);
    const active = size === sz;
    return `<button type="button" class="proto-w-size-btn ${active ? "is-on" : ""}" data-action="set-widget-size" data-widget="${widgetId}" data-size="${sz}" ${allowed ? "" : "disabled"} aria-pressed="${active}">${sizeLabel(sz)}</button>`;
  }).join("");
  return `
    <div class="proto-widget-chrome">
      <button type="button" class="proto-w-drag-handle" data-widget-drag="${widgetId}" aria-label="拖动 ${def.title}">⠿</button>
      <div class="proto-w-size-anchor">
        <button type="button" class="proto-icon-btn" data-action="toggle-size-picker" data-widget="${widgetId}" aria-expanded="${layout.sizePickerOpen === widgetId}" aria-haspopup="listbox">尺寸</button>
        ${layout.sizePickerOpen === widgetId ? `<div class="proto-w-size-popover" role="listbox" aria-label="${def.title} 尺寸">${sizeButtons}</div>` : ""}
      </div>
      <button type="button" class="proto-icon-btn" data-action="move-widget" data-widget="${widgetId}" data-dir="-1" aria-label="前移">↑</button>
      <button type="button" class="proto-icon-btn" data-action="move-widget" data-widget="${widgetId}" data-dir="1" aria-label="后移">↓</button>
      <button type="button" class="proto-icon-btn proto-w-remove" data-action="remove-widget" data-widget="${widgetId}" aria-label="移除">−</button>
    </div>`;
}

export function renderCWidgets(state, registry) {
  const layout = state.cWidgetLayout;
  return layout.order
    .map((id) => {
      const def = registry[id];
      if (!def) return "";
      const size = normalizeWidgetSize(registry, id, layout.sizes[id] || def.defaultSize);
      layout.sizes[id] = size;
      const body = def.render(state, size);
      return `
      <article class="proto-widget proto-w-size-${size} ${layout.editMode ? "is-edit" : ""} ${layout.focusedWidget === id ? "is-focused" : ""}" data-widget="${id}" data-size="${size}" tabindex="${layout.editMode ? "0" : "-1"}">
        <header class="proto-widget-head">
          <h2 class="proto-widget-title">${def.title}</h2>
          ${widgetChrome(id, def, layout, size)}
        </header>
        <div class="proto-widget-body">${body}</div>
        <div class="proto-w-drop-indicator" aria-hidden="true"></div>
      </article>`;
    })
    .join("");
}

export function renderCHeaderExtras(state, registry) {
  const layout = state.cWidgetLayout;
  const editLabel = layout.editMode ? "完成" : "编辑布局";
  const paletteItems = layout.offCanvas
    .map((id) => {
      const title = registry[id]?.title || id;
      return `<button type="button" class="proto-w-palette-item" data-action="add-widget" data-widget="${id}">${title}</button>`;
    })
    .join("");
  return `
    <button type="button" class="proto-chip ${layout.editMode ? "is-on" : ""}" data-action="toggle-c-edit">${editLabel}</button>
    ${layout.editMode ? `<button type="button" class="proto-chip" data-action="toggle-add-palette" aria-expanded="${layout.addPaletteOpen}">添加小组件</button>` : ""}
    ${layout.editMode && layout.addPaletteOpen ? `<div class="proto-w-add-palette" role="menu">${paletteItems || '<span class="proto-w-meta">暂无可添加项</span>'}</div>` : ""}`;
}

let pointerDrag = null;

function onPointerMove(e, state, onReorder, showToast) {
  if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
  const { el, offsetX, offsetY, grid: g } = pointerDrag;
  el.style.transform = `translate(${e.clientX - offsetX - parseFloat(el.style.left)}px, ${e.clientY - offsetY - parseFloat(el.style.top)}px)`;
  const target = document.elementFromPoint(e.clientX, e.clientY)?.closest(".proto-widget");
  g.querySelectorAll(".proto-w-drop-indicator").forEach((n) => n.classList.remove("is-active"));
  if (target && target !== el && g.contains(target)) {
    target.querySelector(".proto-w-drop-indicator")?.classList.add("is-active");
    pointerDrag.hoverId = target.dataset.widget;
  } else {
    pointerDrag.hoverId = null;
  }
}

function onPointerUp(e, state, onReorder, showToast) {
  if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
  pointerDrag.handle.releasePointerCapture(e.pointerId);
  document.removeEventListener("pointermove", pointerDrag.moveListener);
  document.removeEventListener("pointerup", pointerDrag.upListener);
  document.removeEventListener("pointercancel", pointerDrag.cancelListener);
  finishPointerDrag(state, onReorder, showToast);
}

export function bindCCanvas(state, registry, onReorder, showToast) {
  const grid = document.getElementById("protoCGrid");
  if (!grid) return;

  grid.onpointerdown = (e) => {
    const handle = e.target.closest("[data-widget-drag]");
    if (!handle || !state.cWidgetLayout.editMode) return;
    const widgetId = handle.dataset.widgetDrag;
    const el = grid.querySelector(`[data-widget="${widgetId}"]`);
    if (!el) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    pointerDrag = {
      id: widgetId,
      el,
      handle,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      pointerId: e.pointerId,
      placeholder: document.createElement("div"),
      grid,
      moveListener: (ev) => onPointerMove(ev, state, onReorder, showToast),
      upListener: (ev) => onPointerUp(ev, state, onReorder, showToast),
      cancelListener: () => finishPointerDrag(state, onReorder, showToast, true),
    };
    pointerDrag.placeholder.className = `proto-w-placeholder proto-w-size-${el.dataset.size}`;
    el.classList.add("is-lifted");
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    grid.insertBefore(pointerDrag.placeholder, el);
    document.body.appendChild(el);
    document.addEventListener("pointermove", pointerDrag.moveListener);
    document.addEventListener("pointerup", pointerDrag.upListener);
    document.addEventListener("pointercancel", pointerDrag.cancelListener);
  };

  if (!document.documentElement.dataset.cCanvasDocBound) {
    document.documentElement.dataset.cCanvasDocBound = "1";
    document.addEventListener(
      "click",
      (e) => {
        if (!state.cWidgetLayout?.sizePickerOpen) return;
        if (e.target.closest("[data-action='toggle-size-picker']") || e.target.closest(".proto-w-size-popover")) return;
        state.cWidgetLayout.sizePickerOpen = null;
        onReorder(false);
      },
      true
    );

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !state.cWidgetLayout) return;
      if (state.cWidgetLayout.sizePickerOpen) {
        state.cWidgetLayout.sizePickerOpen = null;
        onReorder(false);
      }
      if (state.cWidgetLayout.addPaletteOpen) {
        state.cWidgetLayout.addPaletteOpen = false;
        onReorder(false);
      }
    });
  }
}

function finishPointerDrag(state, onReorder, showToast, cancel = false) {
  const drag = pointerDrag;
  pointerDrag = null;
  if (!drag) return;
  if (drag.moveListener) {
    document.removeEventListener("pointermove", drag.moveListener);
    document.removeEventListener("pointerup", drag.upListener);
    document.removeEventListener("pointercancel", drag.cancelListener);
  }
  const grid = drag.grid || document.getElementById("protoCGrid");
  drag.el.classList.remove("is-lifted");
  drag.el.style.transform = "";
  drag.el.style.width = "";
  drag.el.style.height = "";
  drag.el.style.left = "";
  drag.el.style.top = "";
  drag.placeholder.remove();
  if (!cancel && drag.hoverId && drag.hoverId !== drag.id) {
    const order = [...state.cWidgetLayout.order];
    const from = order.indexOf(drag.id);
    const to = order.indexOf(drag.hoverId);
    order.splice(from, 1);
    order.splice(to, 0, drag.id);
    state.cWidgetLayout.order = order;
    showToast("小组件已移动");
  }
  grid?.querySelectorAll(".proto-w-drop-indicator").forEach((n) => n.classList.remove("is-active"));
  drag.el.remove();
  onReorder(true);
  const liveGrid = document.getElementById("protoCGrid");
  const settled = liveGrid?.querySelector(`[data-widget="${drag.id}"]`);
  settled?.classList.add("is-settling");
  setTimeout(() => settled?.classList.remove("is-settling"), 280);
}
