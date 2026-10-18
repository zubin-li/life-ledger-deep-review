/* Shared input-aware light. No card transform ownership: drag/FLIP stay with the layout engine. */
(() => {
  const html = document.documentElement;
  const enabled = () => !html.matches('.motion-reduced,.motion-off') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('keydown', () => { html.dataset.deskInput = 'keyboard'; }, true);
  document.addEventListener('pointerdown', () => { html.dataset.deskInput = 'pointer'; }, true);
  let pending, active;
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !enabled()) return;
    html.dataset.deskInput = 'pointer';
    const card = event.target.closest('#todayView:not(.is-editing-layout) > .module-card, #weekView:not(.is-editing-layout) > .module-card');
    if (!card) { if (active) active.removeAttribute('data-desk-lit'); active = null; return; }
    if (active !== card) { active?.removeAttribute('data-desk-lit'); active = card; }
    const x = event.clientX, y = event.clientY;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      if (active !== card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--light-x', `${x - rect.x}px`);
      card.style.setProperty('--light-y', `${y - rect.y}px`);
      card.dataset.deskLit = 'true';
    });
  }, { passive: true });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) { active?.removeAttribute('data-desk-lit'); active = null; } });
})();
