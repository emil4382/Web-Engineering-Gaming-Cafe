/**
 * @file Feature module for the Preise (pricing) page.
 *
 * Renders the four booking tariffs as `.tariff` cards into `#tariffGrid`,
 * driven entirely by the {@link module:config/seatLayout.TARIFE} config so the
 * markup stays in sync with the single source of truth.  The `featured` tariff
 * is highlighted with `.pop` and a "Beliebt" badge; prices are localised via
 * {@link module:utils/format.formatEuro}.
 *
 * @module features/preise
 */

import { TARIFE } from '../config/seatLayout.js';
import { qs, el } from '../utils/dom.js';
import { formatEuro } from '../utils/format.js';

/**
 * Maps a tariff billing unit to a short, human-readable price suffix
 * (German), shown after the amount, e.g. `5,00 € / Stunde`.
 * @type {Record<string, string>}
 */
const UNIT_SUFFIX = {
  hour: '/ Stunde',
  day: '/ Tag',
  night: '/ Nacht',
  month: '/ Monat',
};

/**
 * A small accent check-mark icon used as the bullet for each feature.
 * Built fresh per call so each list item gets its own node.
 * @returns {SVGElement} An inline, decorative check SVG.
 */
function checkIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'ic');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 10.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z');
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);
  return svg;
}

/**
 * Build a single `.tariff` card element from a tariff config entry.
 * @param {import('../config/seatLayout.js').Tarif} tarif - Tariff to render.
 * @returns {HTMLElement} The fully assembled `.tariff` card.
 */
function tariffCard(tarif) {
  const features = el(
    'ul',
    null,
    ...tarif.features.map((feature) => el('li', null, checkIcon(), el('span', null, feature))),
  );

  const price = el(
    'p',
    { class: 't-price' },
    formatEuro(tarif.price),
    el('span', null, ` ${UNIT_SUFFIX[tarif.unit] || ''}`.trimEnd()),
  );

  return el(
    'article',
    { class: tarif.featured ? 'card tariff pop' : 'card tariff' },
    tarif.featured ? el('span', { class: 'pop-badge' }, 'Beliebt') : null,
    el('p', { class: 't-name' }, tarif.name),
    price,
    el('p', { class: 't-desc' }, tarif.unitLabel),
    features,
    el(
      'a',
      {
        class: tarif.featured ? 'btn btn-primary' : 'btn btn-outline',
        href: 'buchung.html',
      },
      `${tarif.name} buchen`,
    ),
  );
}

/**
 * Initialise the Preise page: render all tariff cards into `#tariffGrid`.
 * No-ops gracefully if the container is missing (so the page never breaks).
 * @returns {void}
 */
export default function init() {
  const grid = qs('#tariffGrid');
  if (!grid) return;

  grid.replaceChildren(...TARIFE.map(tariffCard));
}
