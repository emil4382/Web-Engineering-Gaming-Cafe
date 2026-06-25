/**
 * @file Module entry point for every PixelForge page.
 *
 * Loaded once per page via:
 *   <script type="module" src="js/main.js"></script>
 *
 * Responsibilities:
 * 1. Always run shared navigation init (mobile menu, scroll state, auth reflect).
 * 2. Read `document.body.dataset.page` and, if present, lazily import the
 *    matching feature module from `js/features/<page>.js` and call its default
 *    `init()`. Each step is isolated in try/catch so a missing, disabled or
 *    broken feature module never takes down the whole page.
 *
 * Convention: a page opts into its feature JS with a single data attribute:
 *   <body data-page="booking">  → imports ./features/booking.js
 *   <body data-page="menu">     → imports ./features/menu.js
 *   <body>                      → navigation only, no feature import
 *
 * @module main
 */

import initNavigation from './features/navigation.js';

/**
 * Boot the page: shared navigation first, then the optional per-page feature.
 * @returns {Promise<void>}
 */
async function boot() {
  // 1) Shared navigation — must work even if a feature module is broken.
  try {
    initNavigation();
  } catch (err) {
    console.error('[main] navigation init failed:', err);
  }

  // 2) Optional per-page feature module, selected by <body data-page="…">.
  const page = document.body?.dataset.page;
  if (!page) return;

  try {
    const module = await import(`./features/${page}.js`);
    const init = module.default;
    if (typeof init === 'function') {
      await init();
    } else {
      console.warn(`[main] feature "${page}" has no default export init()`);
    }
  } catch (err) {
    // Missing/disabled module or a runtime error inside it — never fatal.
    console.error(`[main] feature "${page}" failed to load:`, err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  // Script may be deferred and parsed after DOMContentLoaded already fired.
  boot();
}
