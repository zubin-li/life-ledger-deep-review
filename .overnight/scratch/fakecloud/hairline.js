/* Hairline illustrations (assets/hairline/*.svg, 1px line art in currentColor + accent).
   mount(host, name) inlines the SVG once so CSS can colour and draw it in. Web only. */
(function (root) {
  const cache = new Map();
  const load = name => {
    if (!/^[a-z-]+$/.test(name)) return Promise.resolve("");
    if (!cache.has(name)) cache.set(name, fetch(`./assets/hairline/${name}.svg`).then(r => (r.ok ? r.text() : "")).catch(() => ""));
    return cache.get(name);
  };
  function mount(host, name) {
    if (!host || (host.dataset.mounted === name)) return;
    host.dataset.art = name; host.dataset.mounted = name;
    host.classList.add("ll-art");
    load(name).then(svg => {
      if (host.dataset.art !== name || !/^<svg[\s>]/.test(svg.trim()) || /<script/i.test(svg)) return;
      host.innerHTML = svg;
      host.querySelector("svg")?.setAttribute("aria-hidden", "true");
      host.classList.remove("is-drawn"); void host.offsetWidth; host.classList.add("is-drawn");
    });
  }
  // Empty-state block: art + one serif line + one muted line.
  function empty(name, title, help = "") {
    const box = document.createElement("div");
    box.className = "ll-empty";
    const art = document.createElement("div");
    const strong = document.createElement("strong"); strong.textContent = title;
    box.append(art, strong);
    if (help) { const p = document.createElement("p"); p.textContent = help; box.append(p); }
    mount(art, name);
    return box;
  }
  root.LifeLedgerHairline = { mount, empty };
})(window);
