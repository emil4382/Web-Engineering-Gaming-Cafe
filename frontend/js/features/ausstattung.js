// equipment page

import {  qs, qsa } from '../utils/dom.js';

// init
export default function init() {
  const tablist = qs('#specTabs');
  if (!tablist ) return;

  const tabs = (qsa('[role="tab"]', tablist));
  if (tabs.length === 0) return;

  function activate(tab, setFocus = true) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;

      const panel = panelFor(t);
      if (panel) panel.hidden = !selected;
    });

    if ( setFocus) tab.focus();
  }

  function panelFor(tab) {
    const id = tab.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }

  // click
  tabs.forEach( (tab) => {
    tab.addEventListener('click', () => activate(tab, false) );
  });

  // keyboard
  tablist.addEventListener( 'keydown', ( event) => {
    const current = tabs.indexOf((event.target));
    if ( current === -1) return;

    let next = -1;
    switch (event.key) {
      case 'ArrowRight':
        next = (current + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        next = (current - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    activate( tabs[next]);
  } );

  // initial state
  const initial = tabs.find((t) => t.getAttribute('aria-selected' ) === 'true') || tabs[0];
  activate(initial, false);
}
