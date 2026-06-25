/**
 * @file Gastro page feature — renders the menu and wires the category filter.
 * @module features/gastro
 */

import { apiGet } from '../api/api.js';
import { qs, qsa, el } from '../utils/dom.js';
import { formatEuro } from '../utils/format.js';

/**
 * Human-readable German labels for the menu categories. Used for the small
 * category tag printed on each menu card.
 * @type {Object<string, string>}
 */
const CATEGORY_LABELS = {
  snacks: 'Snacks',
  energy: 'Energy',
  kaffee: 'Kaffee',
  soft: 'Soft',
};

/**
 * Build a single `.menu-card` for a menu item.
 * @param {{name:string, desc:string, price:number, category:string}} item - Menu item.
 * @returns {HTMLElement} The constructed `.menu-card` article.
 */
function menuCard(item) {
  const tag = CATEGORY_LABELS[item.category] || item.category;
  return el('article', { class: 'menu-card', dataset: { cat: item.category } },
    el('div', { class: 'm-body' },
      el('div', { class: 'm-top' },
        el('h3', { class: 'm-name' }, item.name),
        el('span', { class: 'm-price' }, formatEuro(item.price)),
      ),
      el('p', { class: 'm-desc' }, item.desc),
      el('div', { class: 'm-tags' },
        el('span', { class: 'tag tag-outline' }, tag),
      ),
    ),
  );
}

/**
 * Render the empty-state shown when a filter matches no items.
 * @param {string} categoryLabel - The (German) label of the active category.
 * @returns {HTMLElement} The `.empty-state` element.
 */
function emptyState(categoryLabel) {
  return el('div', { class: 'empty-state' },
    el('h3', {}, 'Keine Einträge'),
    el('p', {}, `In der Kategorie „${categoryLabel}“ ist momentan nichts verfügbar.`),
  );
}

/**
 * Initialise the Gastro page: load the menu, render the cards, and wire the
 * category filter chips. Falls back to mock data automatically when no backend
 * is reachable (see api/api.js).
 * @returns {Promise<void>}
 */
export default async function init() {
  const grid = qs('#menuGrid');
  const filters = qs('#menuFilters');
  if (!grid || !filters) return;

  /** @type {Array<{name:string, desc:string, price:number, category:string}>} */
  let menu = [];
  try {
    menu = await apiGet('/api/menu');
  } catch {
    grid.replaceChildren(
      el('div', { class: 'empty-state' },
        el('h3', {}, 'Menü nicht verfügbar'),
        el('p', {}, 'Die Speisekarte konnte gerade nicht geladen werden. Bitte versuche es später erneut.'),
      ),
    );
    return;
  }

  /** Currently active category filter ('all' shows everything). */
  let activeCat = 'all';

  /**
   * Re-render the grid for the active category, swapping in the empty-state
   * when nothing matches.
   * @returns {void}
   */
  function render() {
    const items = activeCat === 'all'
      ? menu
      : menu.filter((item) => item.category === activeCat);

    if (items.length === 0) {
      const label = CATEGORY_LABELS[activeCat] || activeCat;
      grid.replaceChildren(emptyState(label));
      return;
    }
    grid.replaceChildren(...items.map(menuCard));
  }

  /**
   * Activate a category chip: update aria-pressed/active state on all chips and
   * re-render the grid.
   * @param {HTMLElement} chip - The clicked chip button.
   * @returns {void}
   */
  function activate(chip) {
    activeCat = chip.dataset.cat || 'all';
    for (const btn of qsa('.chip', filters)) {
      const on = btn === chip;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
    }
    render();
  }

  filters.addEventListener('click', (event) => {
    const chip = event.target instanceof Element ? event.target.closest('.chip') : null;
    if (chip && filters.contains(chip)) activate(chip);
  });

  render();
}
