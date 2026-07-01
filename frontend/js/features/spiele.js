// games page

import { apiGet  } from '../api/api.js';
import { qs, el } from '../utils/dom.js';

const SEARCH_DEBOUNCE = 180;

const TILE_VARIANTS = 8;

// helpers
function shortGenre(genre) {
  return String( genre || '').split('/')[0].trim( );
}

function buildCover( game, index) {
  const cover = el( 'div', { class: 'cover' });

  if (game.featured) {
    cover.appendChild(el('span', { class: 'badge-cover badge-featured' }, 'Featured'));
  } else if (game.tournament) {
    cover.appendChild(el('span',  { class: 'badge-cover badge-tour' }, 'Turnier'));
  }
  cover.appendChild(
    el('span', {  class: 'badge-cover badge-avail' }, el( 'span', {  class: 'dot'  }), 'Verfügbar'),
   );

  if (game.image) {
    cover.appendChild(
      el('img', { src: game.image, alt: `${game.name} Cover`, loading: 'lazy' }),
    );
  } else {
    const variant = `c${(index % TILE_VARIANTS) + 1}`;
    const letter = (game.name.match(/[A-Za-z]/ ) || [ '?'] )[0].toUpperCase();
    cover.appendChild(
      el(
        'div',
        { class: `tile ${variant}` },
        el('span', {  class: 'letter', 'aria-hidden': 'true' }, letter),
        el('span', { class: 'tname'  }, game.name),
        el('span', { class: 'tgenre'  }, shortGenre(game.genre )),
      ),
     );
  }

  return cover;
}

function buildCard(game, index) {
  return el(
    'article',
    { class: 'gcard' },
    buildCover(game, index),
    el(
      'div',
      { class: 'gbody' },
      el('h3', { class: 'gtitle' },  game.name),
      el('p', { class: 'ggenre' }, shortGenre(game.genre)),
    ),
   );
}

function matches( game, term, genre) {
  const nameOk = !term || game.name.toLowerCase( ).includes( term );
  const genreOk = genre === 'all' || String(game.genre || '').toLowerCase().includes( genre.toLowerCase() );
  return nameOk && genreOk;
}

function render( { grid, count, games, term, genre  }) {
  const visible = games.filter((g) => matches(g, term, genre ) );
  grid.replaceChildren(  );

  if (visible.length === 0) {
    grid.appendChild(
      el(
        'div',
        { class: 'empty-state' },
        el('h3', {},  'Keine Spiele gefunden'),
        el('p', {},  'Passe deine Suche oder den Genre-Filter an.'),
      ),
     );
    count.textContent = 'Keine Spiele gefunden.';
    return;
  }

  visible.forEach((game, i) => grid.appendChild(buildCard(game, i)));
  count.textContent =
    visible.length === 1 ? '1 Spiel gefunden.' : `${visible.length} Spiele gefunden.`;
}

export default async function init() {
  const grid = qs( '#gameGrid');
  const search = qs('#gameSearch' );
  const filters = qs('#gameFilters' );
  const count = qs('#gameCount');
  if ( !grid) return;

  let games = [];
  try {
    const data = await apiGet( '/api/games');
    games = Array.isArray(data) ? data : [ ];
  } catch {
    games = [];
  }

  const state = {  grid, count, games, term: '', genre: 'all' };
  render(state);

  // search
  if (search) {
    let timer = 0;
    search.addEventListener('input', ( ) => {
      window.clearTimeout(timer);
      timer = window.setTimeout((  ) => {
        state.term = search.value.trim().toLowerCase();
        render(state );
      }, SEARCH_DEBOUNCE);
    });
   }

  // genre filter
  if (filters) {
    filters.addEventListener('click', (event) => {
      const chip = event.target.closest('.chip');
      if (!chip || !filters.contains( chip)) return;

      for (const c of filters.querySelectorAll( '.chip')) {
        const isActive = c === chip;
        c.classList.toggle('active', isActive);
        c.setAttribute('aria-pressed', String(isActive ));
      }

      state.genre = chip.dataset.genre || 'all';
      render(state);
    });
  }
}
