(function (root) {
  "use strict";

  function motionReduced() {
    if (root.document?.documentElement?.classList?.contains("motion-reduced")) return true;
    try {
      return root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    } catch {
      return false;
    }
  }

  /** Grow `.rv-bar i` and legacy `.analytics-bar-track i` from 0 → target width (month change). */
  function animateBarWidthFills(scope) {
    if (!scope || motionReduced()) return;
    scope.querySelectorAll(".rv-bar i, .analytics-bar-track i").forEach((bar, index) => {
      const target = bar.style.width;
      if (!target) return;
      bar.style.setProperty("--bar-i", String(index));
      bar.style.width = "0%";
      bar.style.transition = "none";
      root.requestAnimationFrame(() => {
        bar.style.transition = "";
        bar.style.width = target;
      });
    });
  }

  /** Grow ledger budget bars from 0 → target (--p) when the month changes. */
  function animateLedgerBudgetFills(scope) {
    if (!scope || motionReduced()) return;
    scope.querySelectorAll(".ledger-budget-bar").forEach((bar, index) => {
      const target = bar.style.getPropertyValue("--p").trim();
      if (!target) return;
      bar.style.setProperty("--bar-i", String(index));
      bar.style.setProperty("--p", "0");
      bar.style.transition = "none";
      root.requestAnimationFrame(() => {
        bar.style.transition = "";
        bar.style.setProperty("--p", target);
      });
    });
  }

  /** Roll text in panel cells when month changes (weekday %, habit rate). */
  function rollPanelTextValues(scope, selector, storagePrefix, rollText) {
    if (!scope || !rollText) return;
    scope.querySelectorAll(selector).forEach((el, index) => {
      const next = el.textContent?.trim() || "";
      const key = `${storagePrefix}-${index}`;
      const prev = scope.dataset[key] || "";
      if (prev && prev !== next) rollText(el, next, prev);
      scope.dataset[key] = next;
    });
  }

  root.LifeLedgerReviewBars = {
    animateBarWidthFills,
    animateLedgerBudgetFills,
    rollPanelTextValues,
  };
})(typeof window !== "undefined" ? window : globalThis);
