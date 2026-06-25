/**
 * @file Ausstattung page — accessible hardware category tabs.
 *
 * Implements the WAI-ARIA Tabs pattern (automatic activation) on `#specTabs`:
 * - Roving tabindex: the selected tab has `tabindex="0"`, all others `-1`.
 * - ArrowLeft / ArrowRight move focus to the previous / next tab and activate it
 *   (wrapping around the ends).
 * - Home / End jump to the first / last tab and activate it.
 * - Activating a tab sets `aria-selected="true"` on it (false on the rest) and
 *   shows its associated `.tabpanel` (via `aria-controls`), hiding all others.
 *
 * No-ops if `#specTabs` is absent, so the module is safe to import anywhere.
 *
 * @module features/ausstattung
 */

import { qs, qsa } from '../utils/dom.js';

/**
 * Initialise the hardware spec tabs on the Ausstattung page.
 * @returns {void}
 */
export default function init() {
  const tablist = qs('#specTabs');
  if (!tablist) return;

  /** @type {HTMLButtonElement[]} */
  const tabs = /** @type {HTMLButtonElement[]} */ (qsa('[role="tab"]', tablist));
  if (tabs.length === 0) return;

  /**
   * Activate a single tab: update aria-selected + roving tabindex on every tab,
   * toggle the matching panel's `hidden` state, and optionally move focus.
   * @param {HTMLButtonElement} tab - The tab to activate.
   * @param {boolean} [setFocus=true] - Whether to move focus to the tab.
   * @returns {void}
   */
  function activate(tab, setFocus = true) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;

      const panel = panelFor(t);
      if (panel) panel.hidden = !selected;
    });

    if (setFocus) tab.focus();
  }

  /**
   * Resolve the tabpanel controlled by a tab via its `aria-controls` id.
   * @param {HTMLButtonElement} tab - The tab whose panel to find.
   * @returns {HTMLElement|null} The controlled panel, or null.
   */
  function panelFor(tab) {
    const id = tab.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }

  // Click activates without forcing a focus jump (the click already focuses it).
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab, false));
  });

  // Keyboard: roving focus + automatic activation.
  tablist.addEventListener('keydown', (event) => {
    const current = tabs.indexOf(/** @type {HTMLButtonElement} */ (event.target));
    if (current === -1) return;

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
        return; // ignore other keys
    }

    event.preventDefault();
    activate(tabs[next]);
  });

  // Normalise the initial state from the markup (first selected, or first tab).
  const initial = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
  activate(initial, false);
}
