// Static hosting is local-first by default. The Cloudflare Worker overrides
// this file at request time; CloudBase is detected from _init_tcb-env.js.
window.LIFE_LEDGER_DEPLOYMENT_MODE = window.LIFE_LEDGER_DEPLOYMENT_MODE || "local";
