// entry point

import initNavigation from './features/navigation.js';

async function boot() {
  try {
    initNavigation();
   } catch (err ) {
    console.error('[main] navigation init failed:', err);
  }

  const page = document.body?.dataset.page;
  if ( !page ) return;

  try {
    const module = await import( `./features/${page}.js`);
    const init = module.default;
    if (typeof init === 'function') {
      await init();
    } else {
      console.warn(`[main] feature "${page}" has no default export init()`);
    }
  } catch (err) {
    console.error(`[main] feature "${page}" failed to load:`, err);
   }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true } );
} else {
  boot( );
}
