(function (root) {
  const VIEW_ORDER = ["today", "week", "timeline", "review", "habits"];

  function normalizeQuery(query) {
    return String(query || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
    }[character]));
  }

  function commandMatches(command, query) {
    const parts = normalizeQuery(query).split(/\s+/).filter(Boolean);
    if (!parts.length) return true;
    const haystack = `${command.title || ""} ${command.subtitle || ""} ${command.keywords || ""}`.toLowerCase();
    return parts.every(part => haystack.includes(part));
  }

  function filterCommands(commands, query) {
    return (commands || []).filter(command => commandMatches(command, query));
  }

  function matchRanges(text, query) {
    const source = String(text || "");
    const parts = normalizeQuery(query).split(/\s+/).filter(Boolean);
    if (!parts.length) return [];
    const lower = source.toLowerCase();
    const ranges = [];
    parts.forEach(part => {
      let from = 0;
      while (from < lower.length) {
        const index = lower.indexOf(part, from);
        if (index < 0) break;
        ranges.push([index, index + part.length]);
        from = index + part.length;
      }
    });
    ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    const merged = [];
    ranges.forEach(range => {
      const last = merged[merged.length - 1];
      if (!last || range[0] > last[1]) merged.push(range.slice());
      else last[1] = Math.max(last[1], range[1]);
    });
    return merged;
  }

  function highlightMarkup(text, query) {
    const source = String(text || "");
    const ranges = matchRanges(source, query);
    if (!ranges.length) return escapeHtml(source);
    let cursor = 0;
    let html = "";
    ranges.forEach(([start, end]) => {
      html += escapeHtml(source.slice(cursor, start));
      html += `<mark>${escapeHtml(source.slice(start, end))}</mark>`;
      cursor = end;
    });
    html += escapeHtml(source.slice(cursor));
    return html;
  }

  function nextSelection(current, delta, length) {
    if (!length) return -1;
    const index = Number.isInteger(current) ? current : -1;
    if (index < 0) return delta < 0 ? length - 1 : 0;
    return (index + delta + length) % length;
  }

  function viewDirection(from, to) {
    const start = VIEW_ORDER.indexOf(from);
    const end = VIEW_ORDER.indexOf(to);
    if (start < 0 || end < 0 || start === end) return 0;
    return end > start ? 1 : -1;
  }

  function disclosureState(openIds, toggledId, willOpen) {
    const current = Array.isArray(openIds) ? openIds.filter(id => id !== toggledId) : [];
    return willOpen ? [toggledId] : current;
  }

  function indicatorGeometry(container, target) {
    return {
      x: target.left - container.left,
      y: target.top - container.top,
      width: Math.max(0, target.width),
      height: Math.max(0, target.height),
    };
  }

  function flipDelta(previous, next) {
    if (!previous || !next || !next.width || !next.height) return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
    return {
      x: previous.x - next.x,
      y: previous.y - next.y,
      scaleX: previous.width / next.width,
      scaleY: previous.height / next.height,
    };
  }

  function motionPlan(previous, next, options = {}) {
    if (!next) return { animate: false, frame: previous || null };
    if (options.reduced || !previous) return { animate: false, frame: next };
    return { animate: true, frame: next, invert: flipDelta(previous, next) };
  }

  function badgeVisibility(count, seenCount) {
    const pending = Math.max(0, Number(count) || 0);
    const seen = Math.max(0, Number(seenCount) || 0);
    return { visible: pending > seen, count: pending };
  }

  const MOTION_CLASS = { full: "", reduced: "motion-reduced", off: "motion-off" };

  function mapMotionPreference(value) {
    const key = String(value || "full").toLowerCase();
    if (key === "reduced") return MOTION_CLASS.reduced;
    if (key === "off") return MOTION_CLASS.off;
    return MOTION_CLASS.full;
  }

  function applyMotionPreference(doc = root.document, value = "full") {
    if (!doc?.documentElement) return mapMotionPreference(value);
    const className = mapMotionPreference(value);
    doc.documentElement.classList.remove("motion-reduced", "motion-off");
    if (className) doc.documentElement.classList.add(className);
    return className;
  }

  function motionTravelDisabled() {
    const doc = root.document;
    if (!doc) return false;
    const el = doc.documentElement;
    if (el?.classList?.contains("motion-off") || el?.classList?.contains("motion-reduced")) return true;
    return Boolean(root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  }

  function motionReduced() {
    return motionTravelDisabled();
  }

  function slideIndicatorFrame(from, to, progress) {
    if (!to) return from || { x: 0, y: 0, width: 0, height: 0 };
    const start = from || to;
    const t = Math.max(0, Math.min(1, Number(progress) || 0));
    const smooth = value => value * value * (3 - 2 * value);
    const lead = smooth(t);
    const trail = smooth(Math.max(0, (t - 0.22) / 0.78));
    const x = start.x + (to.x - start.x) * lead;
    const startRight = start.x + start.width;
    const endRight = to.x + to.width;
    const right = startRight + (endRight - startRight) * trail;
    return {
      x,
      y: to.y,
      width: Math.max(0, right - x),
      height: to.height ?? start.height ?? 0,
    };
  }

  function clampStepper(value, min, max, step) {
    const lo = Number(min);
    const hi = Number(max);
    const stride = Math.max(1, Number(step) || 1);
    const snapped = lo + Math.round((Number(value) - lo) / stride) * stride;
    return Math.max(lo, Math.min(hi, snapped));
  }

  function submitStateStep(state, event) {
    const current = String(state || "idle");
    const kind = String(event || "");
    if (kind === "reset" || kind === "timeout") return "idle";
    if (current === "idle" && kind === "start") return "busy";
    if (current === "busy" && kind === "success") return "done";
    if (current === "busy" && kind === "fail") return "error";
    if (current === "done" && kind === "reset") return "idle";
    if (current === "error" && (kind === "start" || kind === "reset")) return kind === "start" ? "busy" : "idle";
    return current;
  }

  function flipSiblingsPlan(previousRects, nextRects) {
    const plans = [];
    nextRects.forEach((next, id) => {
      const previous = previousRects.get(id);
      if (!previous || !next) return;
      const invert = flipDelta(previous, next);
      if (!invert.x && !invert.y && invert.scaleX === 1 && invert.scaleY === 1) return;
      plans.push({ id, invert, frame: next });
    });
    return plans;
  }

  function flipSharedRects(pairs, options = {}) {
    const cap = Number.isFinite(options.cap) ? options.cap : 24;
    const reduced = options.reduced ?? motionTravelDisabled();
    return (pairs || []).slice(0, cap).map(({ from, to, node }) => {
      if (!node || !from || !to || reduced) return { node, animate: false };
      const invert = flipDelta(from, to);
      return { node, animate: true, invert, frame: to };
    });
  }

  function hairlineSvgChecks(source) {
    const svg = String(source || "");
    const errors = [];
    if (!/<svg[\s>]/i.test(svg)) errors.push("missing-svg");
    if (/<script|xlink:href\s*=\s*["']http/i.test(svg)) errors.push("external-ref");
    if (!/currentColor/i.test(svg)) errors.push("missing-currentColor");
    if (!/data-layer\s*=/.test(svg)) errors.push("missing-data-layer");
    return { ok: !errors.length, errors };
  }

  function mountHairline(host, src, options = {}) {
    if (!host || !/^\.\/assets\/hairline\/[a-z-]+\.svg$/.test(String(src))) return null;
    const doc = root.document;
    if (!doc) return null;
    host.classList.add("hairline-mount");
    const settle = () => {
      if (!host.dataset.hairlineSettled && !motionTravelDisabled()) {
        host.classList.add("hairline-enter");
        host.dataset.hairlineSettled = "true";
        root.setTimeout?.(() => host.classList.remove("hairline-enter"), 320);
      } else {
        host.dataset.hairlineSettled = "true";
      }
    };
    const applySvg = markup => {
      host.replaceChildren();
      const wrap = doc.createElement("div");
      wrap.innerHTML = markup;
      const svg = wrap.querySelector("svg");
      if (!svg) return null;
      svg.classList.add("hairline-illustration");
      if (options.alt) svg.setAttribute("role", "img");
      if (options.alt) svg.setAttribute("aria-label", options.alt);
      host.append(svg);
      settle();
      return svg;
    };
    if (root.fetch) {
      host.dataset.hairlineSrc = src;
      root.fetch(src).then(response => response.text()).then(markup => {
        if (host.dataset.hairlineSrc !== src) return;
        applySvg(markup);
      }).catch(() => {
        host.replaceChildren();
        const img = doc.createElement("img");
        img.className = "hairline-illustration";
        img.src = src;
        img.alt = options.alt || "";
        img.decoding = "async";
        img.loading = "lazy";
        host.append(img);
        settle();
      });
      return host;
    }
    host.replaceChildren();
    const img = doc.createElement("img");
    img.className = "hairline-illustration";
    img.src = src;
    img.alt = options.alt || "";
    host.append(img);
    settle();
    return img;
  }

  function openAnchoredPopover(options = {}) {
    const {
      trigger, popover, onSelect, items = [], reduced = motionTravelDisabled(),
    } = options;
    if (!trigger || !popover) return { open() {}, close() {}, isOpen: () => false };
    let selected = 0;
    let previousFocus = null;

    function paint() {
      popover.querySelectorAll("[data-popover-item]").forEach((node, index) => {
        node.classList.toggle("is-selected", index === selected);
        node.setAttribute("aria-selected", String(index === selected));
      });
    }

    function close() {
      if (popover.hidden) return;
      popover.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      popover.classList.remove("is-open");
      if (previousFocus?.isConnected) previousFocus.focus();
      previousFocus = null;
    }

    function open() {
      if (!popover.hidden) return;
      previousFocus = root.document.activeElement;
      popover.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      popover.classList.add("is-open");
      if (!reduced) popover.classList.add("popover-animate");
      selected = 0;
      paint();
      popover.querySelector("[data-popover-item]")?.focus();
    }

    function choose(index) {
      const item = items[index];
      if (!item) return;
      close();
      onSelect?.(item, index);
    }

    popover.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        trigger.focus();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        selected = nextSelection(selected, event.key === "ArrowDown" ? 1 : -1, items.length);
        paint();
        popover.querySelectorAll("[data-popover-item]")[selected]?.focus();
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose(selected);
      }
    });

    trigger.addEventListener("click", () => (popover.hidden ? open() : close()));
    trigger.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        popover.hidden ? open() : close();
      }
    });

    root.document?.addEventListener("click", event => {
      if (popover.hidden) return;
      if (event.target.closest?.(popover) || event.target.closest?.(trigger)) return;
      close();
    });

    return { open, close, isOpen: () => !popover.hidden, choose };
  }

  function morphIconToggle(button, nextName, options = {}) {
    if (!button) return;
    const reduced = options.reduced ?? motionTravelDisabled();
    const current = button.dataset.iconState || options.from || "a";
    const next = nextName || options.to || "b";
    if (current === next) return;
    button.dataset.iconState = next;
    button.classList.toggle("icon-morph-on", next === options.onState);
    if (reduced) return;
    button.classList.remove("icon-morphing");
    button.offsetWidth;
    button.classList.add("icon-morphing");
    root.clearTimeout?.(button._morphTimer);
    button._morphTimer = root.setTimeout?.(() => button.classList.remove("icon-morphing"), options.duration || 160);
  }

  let slideIndicatorRaf = 0;

  function slideIndicator(indicator, targetFrame, options = {}) {
    if (!indicator || !targetFrame) return null;
    const reduced = options.reduced ?? motionTravelDisabled();
    const duration = options.duration ?? 240;
    const previous = indicator.dataset.slideFrame ? JSON.parse(indicator.dataset.slideFrame) : null;
    const from = previous || targetFrame;
    if (reduced || !previous) {
      applyFrame(indicator, targetFrame, { animate: false });
      indicator.dataset.slideFrame = JSON.stringify(targetFrame);
      return { animate: false, frame: targetFrame };
    }
    const start = root.performance?.now?.() ?? Date.now();
    root.cancelAnimationFrame?.(slideIndicatorRaf);
    const tick = now => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const frame = slideIndicatorFrame(from, targetFrame, t);
      applyFrame(indicator, frame, { animate: false });
      if (t < 1) {
        slideIndicatorRaf = root.requestAnimationFrame?.(tick) ?? 0;
      } else {
        indicator.dataset.slideFrame = JSON.stringify(targetFrame);
      }
    };
    slideIndicatorRaf = root.requestAnimationFrame?.(tick) ?? 0;
    return { animate: true, frame: targetFrame };
  }

  function applyFrame(indicator, frame, { animate, invert }) {
    if (!indicator || !frame) return;
    const transform = `translate3d(${frame.x}px, ${frame.y}px, 0)`;
    indicator.style.width = `${frame.width}px`;
    indicator.style.height = `${frame.height}px`;
    if (!animate || !invert) {
      indicator.style.transition = "none";
      indicator.style.transform = transform;
      indicator.offsetWidth;
      indicator.style.transition = "";
      return;
    }
    indicator.style.transition = "none";
    indicator.style.transform = `translate3d(${frame.x + invert.x}px, ${frame.y + invert.y}px, 0) scale(${invert.scaleX}, ${invert.scaleY})`;
    indicator.offsetWidth;
    indicator.style.transition = "";
    indicator.style.transform = transform;
  }

  function navTargetBox(nav, button) {
    const navRect = nav.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const icon = button.querySelector(".nav-icon")?.getBoundingClientRect();
    const label = button.querySelector(".nav-label")?.getBoundingClientRect();
    const left = (icon?.left || buttonRect.left) - 8;
    const right = (label?.right || buttonRect.right) + 12;
    const width = Math.min(navRect.width - 8, Math.max(buttonRect.width - 8, right - left));
    return indicatorGeometry(navRect, {
      left,
      top: buttonRect.top,
      width,
      height: buttonRect.height,
    });
  }

  function moveNavIndicator(options = {}) {
    const nav = root.document?.querySelector(".main-nav");
    const indicator = nav?.querySelector(":scope > .nav-indicator");
    const button = nav?.querySelector(".nav-item.active");
    if (!nav || !indicator || !button) return null;
    const next = navTargetBox(nav, button);
    const previous = indicator.dataset.frame ? JSON.parse(indicator.dataset.frame) : null;
    const plan = motionPlan(previous, next, { reduced: options.animate === false || motionReduced() });
    applyFrame(indicator, plan.frame, plan);
    indicator.dataset.frame = JSON.stringify(plan.frame);
    indicator.hidden = false;
    return plan;
  }

  function mountNavIndicator(nav = root.document?.querySelector(".main-nav")) {
    if (!nav || nav.querySelector(":scope > .nav-indicator")) return;
    const indicator = root.document.createElement("span");
    indicator.className = "nav-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.hidden = true;
    nav.prepend(indicator);
    if (root.ResizeObserver) {
      const observer = new root.ResizeObserver(() => moveNavIndicator({ animate: false }));
      observer.observe(nav);
    }
    moveNavIndicator({ animate: false });
  }

  function glideTo(container, target, options = {}) {
    if (!container || !target) return null;
    let indicator = container.querySelector(":scope > .selection-glide");
    if (!indicator) {
      indicator = root.document.createElement("span");
      indicator.className = "selection-glide";
      indicator.setAttribute("aria-hidden", "true");
      container.append(indicator);
    }
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const next = indicatorGeometry(containerRect, {
      left: targetRect.left,
      top: targetRect.top,
      width: targetRect.width,
      height: targetRect.height,
    });
    next.y += container.scrollTop;
    next.x += container.scrollLeft;
    const previous = container.dataset.glideFrame ? JSON.parse(container.dataset.glideFrame) : null;
    const reduced = options.animate === false || motionTravelDisabled();
    if (options.elastic !== false && !reduced) {
      slideIndicator(indicator, next, { reduced, duration: options.duration ?? 240 });
      container.dataset.glideFrame = JSON.stringify(next);
      return { animate: true, frame: next };
    }
    const plan = motionPlan(previous, next, { reduced });
    applyFrame(indicator, plan.frame, plan);
    container.dataset.glideFrame = JSON.stringify(plan.frame);
    return plan;
  }

  function syncSegments(rootNode = root.document) {
    rootNode?.querySelectorAll("[data-segment]").forEach(container => {
      const active = container.querySelector("button.active, button[aria-pressed='true']");
      if (active) glideTo(container, active, { animate: container.dataset.segmentReady === "true" });
      container.dataset.segmentReady = "true";
    });
  }

  function retarget(element) {
    if (!element || motionReduced()) return;
    element.classList.remove("is-retargeting");
    element.offsetWidth;
    element.classList.add("is-retargeting");
  }

  function rollText(element, nextText, previousText) {
    if (!element) return;
    const next = String(nextText ?? "");
    const previous = previousText == null ? element.dataset.rollValue : String(previousText);
    if (previous == null || previous === "" || previous === next || motionReduced()) {
      element.textContent = next;
      element.dataset.rollValue = next;
      return;
    }
    element.classList.add("roll-host");
    element.replaceChildren();
    const outgoing = root.document.createElement("span");
    outgoing.className = "roll-old";
    outgoing.textContent = previous;
    const incoming = root.document.createElement("span");
    incoming.className = "roll-new";
    incoming.textContent = next;
    element.append(outgoing, incoming);
    element.dataset.rollValue = next;
    root.setTimeout(() => {
      if (element.dataset.rollValue !== next) return;
      element.classList.remove("roll-host");
      element.textContent = next;
    }, 200);
  }

  function mountDisclosures(scope = root.document) {
    if (!scope || scope.__lifeLedgerDisclosures) return;
    scope.__lifeLedgerDisclosures = true;
    scope.addEventListener("toggle", event => {
      const details = event.target;
      if (!details || details.tagName !== "DETAILS" || !details.open) return;
      const group = details.parentElement?.closest("[data-disclosure-group]") === details.parentElement
        ? details.parentElement
        : details.parentElement;
      const host = details.parentElement;
      if (!host?.closest("[data-disclosure-group]")) return;
      if (!host.hasAttribute("data-disclosure-group") && !host.closest("[data-disclosure-group]")) return;
      const exclusiveHost = host.hasAttribute("data-disclosure-group") ? host : null;
      if (!exclusiveHost) return;
      exclusiveHost.querySelectorAll(":scope > details[open]").forEach(other => {
        if (other !== details) other.open = false;
      });
    }, true);
  }

  function mountCommandPalette({ root: paletteRoot, getCommands, onRun, text }) {
    const input = paletteRoot?.querySelector("[data-command-input]");
    const list = paletteRoot?.querySelector("[data-command-list]");
    const empty = paletteRoot?.querySelector("[data-command-empty]");
    if (!paletteRoot || !input || !list) return { open() {}, close() {}, toggle() {}, isOpen: () => false };
    let commands = [];
    let selected = 0;
    let previousFocus = null;

    function render() {
      commands = filterCommands(getCommands(), input.value);
      selected = commands.length ? Math.min(selected, commands.length - 1) : -1;
      if (selected < 0 && commands.length) selected = 0;
      list.replaceChildren();
      commands.forEach((command, index) => {
        const item = root.document.createElement("li");
        item.className = index === selected ? "is-selected" : "";
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(index === selected));
        item.id = `command-option-${index}`;
        const title = root.document.createElement("span");
        title.className = "command-title";
        title.innerHTML = highlightMarkup(command.title, input.value);
        const subtitle = root.document.createElement("small");
        subtitle.textContent = command.subtitle || "";
        item.append(title, subtitle);
        item.addEventListener("pointermove", () => {
          selected = index;
          paintSelection();
        });
        item.addEventListener("click", () => choose(index));
        list.append(item);
      });
      if (empty) {
        empty.hidden = commands.length > 0;
        const emptyText = typeof text?.empty === "function" ? text.empty() : text?.empty;
        empty.textContent = emptyText || "No matching commands";
      }
      input.setAttribute("aria-activedescendant", selected >= 0 ? `command-option-${selected}` : "");
      list.querySelector(".is-selected")?.scrollIntoView({ block: "nearest" });
    }

    function paintSelection() {
      [...list.children].forEach((item, index) => {
        item.classList.toggle("is-selected", index === selected);
        item.setAttribute("aria-selected", String(index === selected));
      });
      input.setAttribute("aria-activedescendant", selected >= 0 ? `command-option-${selected}` : "");
    }

    function choose(index) {
      const command = commands[index];
      if (!command) return;
      close();
      onRun(command);
    }

    function open() {
      if (!paletteRoot.hidden) return;
      previousFocus = root.document.activeElement;
      paletteRoot.hidden = false;
      input.value = "";
      selected = 0;
      render();
      input.focus();
    }

    function close() {
      if (paletteRoot.hidden) return;
      paletteRoot.hidden = true;
      if (previousFocus && previousFocus.isConnected && previousFocus !== input) previousFocus.focus();
      previousFocus = null;
    }

    input.addEventListener("input", () => {
      selected = 0;
      render();
    });
    paletteRoot.addEventListener("keydown", event => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        selected = nextSelection(selected, event.key === "ArrowDown" ? 1 : -1, commands.length);
        paintSelection();
        list.querySelector(".is-selected")?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        choose(selected);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    });
    paletteRoot.querySelector("[data-command-dismiss]")?.addEventListener("click", close);
    return {
      open, close, toggle() { paletteRoot.hidden ? open() : close(); }, isOpen: () => !paletteRoot.hidden, render,
    };
  }

  const exported = {
    VIEW_ORDER,
    MOTION_CLASS,
    normalizeQuery,
    filterCommands,
    matchRanges,
    highlightMarkup,
    nextSelection,
    viewDirection,
    disclosureState,
    indicatorGeometry,
    flipDelta,
    motionPlan,
    badgeVisibility,
    mapMotionPreference,
    applyMotionPreference,
    motionTravelDisabled,
    motionReduced,
    slideIndicatorFrame,
    slideIndicator,
    clampStepper,
    submitStateStep,
    flipSiblingsPlan,
    flipSharedRects,
    hairlineSvgChecks,
    mountHairline,
    openAnchoredPopover,
    morphIconToggle,
    moveNavIndicator,
    mountNavIndicator,
    glideTo,
    syncSegments,
    retarget,
    rollText,
    mountDisclosures,
    mountCommandPalette,
  };

  root.LifeLedgerInteraction = exported;
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
})(typeof window !== "undefined" ? window : globalThis);
