// prices page

import { TARIFE } from '../config/seatLayout.js';
import { qs,  el } from '../utils/dom.js';
import { formatEuro } from '../utils/format.js';

// price unit labels
const UNIT_SUFFIX = {
  hour: '/ Stunde',
  day: '/ Tag',
  night: '/ Nacht',
  month: '/ Monat',
};

// check icon
function checkIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg',  'svg');
  svg.setAttribute('class', 'ic');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute( 'focusable', 'false' );
  const path = document.createElementNS('http://www.w3.org/2000/svg',  'path');
  path.setAttribute('d', 'M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 10.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z');
  path.setAttribute( 'fill', 'currentColor');
  svg.appendChild(path);
  return svg;
}

function tariffCard(tarif ) {
  const features = el(
    'ul',
    null,
    ...tarif.features.map((feature) => el('li', null, checkIcon(),  el('span', null, feature))),
  );

  const price = el(
    'p',
    { class: 't-price' },
    formatEuro(tarif.price),
    el('span', null,  ` ${UNIT_SUFFIX[tarif.unit] || ''}`.trimEnd() ),
  );

  return el(
    'article',
    { class: tarif.featured ? 'card tariff pop' : 'card tariff' },
    tarif.featured ? el( 'span', { class: 'pop-badge' }, 'Beliebt') : null,
    el('p',  { class: 't-name' }, tarif.name ),
    price,
    el('p', { class: 't-desc' }, tarif.unitLabel),
    features,
    el(
      'a',
      {
        class: tarif.featured ? 'btn btn-primary' : 'btn btn-outline',
        href: `buchung.html?tarif=${encodeURIComponent(tarif.key)}`,
      },
      `${tarif.name} buchen`,
    ),
  );
}

export default function init( ) {
  const grid = qs('#tariffGrid');
  if (!grid) return;

  grid.replaceChildren(...TARIFE.map( tariffCard ));
}
