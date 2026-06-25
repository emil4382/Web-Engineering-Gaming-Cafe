/**
 * @file Spiele-Bibliothek page feature module.
 *
 * Loads the game catalog (`GET /api/games`, with automatic mock fallback so the
 * page works as a static site), renders each game as a `.gcard` tile into
 * `#gameGrid`, and wires the search field (`#gameSearch`, debounced) and the
 * genre filter chips (`#gameFilters`). Results are reflected into an aria-live
 * count (`#gameCount`); when nothing matches, an `.empty-state` is shown.
 *
 * Cards use a real `<img>` cover when the game has an asset
 * (valorant/counter-strike/fifa/fortnite/apex-legends/overwatch) and otherwise
 * fall back to a solid-colour letter tile (`.tile.c1`–`.c6`). The four
 * tournament titles get a small "Turnier" badge.
 *
 * @module features/spiele
 */

import { apiGet } from '../api/api.js';
import { qs, el } from '../utils/dom.js';

/** Debounce delay (ms) for the search input. */
const SEARCH_DEBOUNCE = 180;

/** Number of poster-tile gradient variants available in the stylesheet (.c1–.c8). */
const TILE_VARIANTS = 8;

/**
 * @typedef {Object} Game
 * @property {string} name        Display name, e.g. 'Valorant'.
 * @property {string} emoji       Source emoji (not rendered — DARK-MODERN is emoji-free).
 * @property {string} genre       Full genre label, e.g. 'Shooter / FPS'.
 * @property {string} slug        URL-safe slug used for the cover asset.
 * @property {?string} image      Cover image path, or null when no asset exists.
 * @property {boolean} tournament Whether this is one of the four tournament titles.
 */

/**
 * Short genre label shown on a card, derived from the full genre string by
 * taking the part before the first slash (e.g. 'Shooter / FPS' → 'Shooter').
 * @param {string} genre - Full genre label.
 * @returns {string} Trimmed short label.
 */
function shortGenre(genre) {
  return String(genre || '').split('/')[0].trim();
}

/**
 * Build the cover element for a game: a real `<img>` when an asset exists,
 * otherwise a solid-colour letter tile (no neon/glow).
 * @param {Game} game - The game to render a cover for.
 * @param {number} index - Position in the list (drives the tile colour variant).
 * @returns {HTMLElement} The `.cover` element.
 */
function buildCover(game, index) {
  const cover = el('div', { class: 'cover' });

  // Tournament games get a small accent "Turnier" badge.
  if (game.tournament) {
    cover.appendChild(el('span', { class: 'badge-cover badge-tour' }, 'Turnier'));
  }
  // All featured library titles are playable on site → "Verfügbar" badge.
  cover.appendChild(
    el('span', { class: 'badge-cover badge-avail' }, el('span', { class: 'dot' }), 'Verfügbar'),
  );

  if (game.image) {
    cover.appendChild(
      el('img', { src: game.image, alt: `${game.name} Cover`, loading: 'lazy' }),
    );
  } else {
    const variant = `c${(index % TILE_VARIANTS) + 1}`;
    const letter = (game.name.match(/[A-Za-z]/) || ['?'])[0].toUpperCase();
    cover.appendChild(
      el(
        'div',
        { class: `tile ${variant}` },
        el('span', { class: 'letter', 'aria-hidden': 'true' }, letter),
        el('span', { class: 'tname' }, game.name),
        el('span', { class: 'tgenre' }, shortGenre(game.genre)),
      ),
    );
  }

  return cover;
}

/**
 * Build a single `.gcard` tile for a game.
 * @param {Game} game - The game to render.
 * @param {number} index - Position in the list (for the tile colour variant).
 * @returns {HTMLElement} The `<article class="gcard">` element.
 */
function buildCard(game, index) {
  return el(
    'article',
    { class: 'gcard' },
    buildCover(game, index),
    el(
      'div',
      { class: 'gbody' },
      el('h3', { class: 'gtitle' }, game.name),
      el('p', { class: 'ggenre' }, shortGenre(game.genre)),
    ),
  );
}

/**
 * Decide whether a game matches the active search term and genre filter.
 * @param {Game} game - Candidate game.
 * @param {string} term - Lower-cased search term (may be empty).
 * @param {string} genre - Active genre token ('all' or e.g. 'Shooter').
 * @returns {boolean} True when the game should be visible.
 */
function matches(game, term, genre) {
  const nameOk = !term || game.name.toLowerCase().includes(term);
  const genreOk = genre === 'all' || String(game.genre || '').toLowerCase().includes(genre.toLowerCase());
  return nameOk && genreOk;
}

/**
 * Render the filtered game list into the grid and update the live count.
 * @param {Object} ctx - Render context.
 * @param {HTMLElement} ctx.grid - The `#gameGrid` container.
 * @param {HTMLElement} ctx.count - The `#gameCount` live region.
 * @param {Game[]} ctx.games - Full game list.
 * @param {string} ctx.term - Current search term (lower-cased).
 * @param {string} ctx.genre - Active genre token.
 * @returns {void}
 */
function render({ grid, count, games, term, genre }) {
  const visible = games.filter((g) => matches(g, term, genre));
  grid.replaceChildren();

  if (visible.length === 0) {
    grid.appendChild(
      el(
        'div',
        { class: 'empty-state' },
        el('h3', {}, 'Keine Spiele gefunden'),
        el('p', {}, 'Passe deine Suche oder den Genre-Filter an.'),
      ),
    );
    count.textContent = 'Keine Spiele gefunden.';
    return;
  }

  visible.forEach((game, i) => grid.appendChild(buildCard(game, i)));
  count.textContent =
    visible.length === 1 ? '1 Spiel gefunden.' : `${visible.length} Spiele gefunden.`;
}

/**
 * Initialise the Spiele-Bibliothek page: load games, render the grid and wire
 * the search box and genre chips. Safe to call when the markup is absent.
 * @returns {Promise<void>}
 */
export default async function init() {
  const grid = qs('#gameGrid');
  const search = qs('#gameSearch');
  const filters = qs('#gameFilters');
  const count = qs('#gameCount');
  if (!grid) return;

  /** @type {Game[]} */
  let games = [];
  try {
    const data = await apiGet('/api/games');
    games = Array.isArray(data) ? data : [];
  } catch {
    games = [];
  }

  const state = { grid, count, games, term: '', genre: 'all' };
  render(state);

  // Debounced search by name.
  if (search) {
    let timer = 0;
    search.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        state.term = search.value.trim().toLowerCase();
        render(state);
      }, SEARCH_DEBOUNCE);
    });
  }

  // Genre filter chips (event delegation; updates active state + aria-pressed).
  if (filters) {
    filters.addEventListener('click', (event) => {
      const chip = event.target.closest('.chip');
      if (!chip || !filters.contains(chip)) return;

      for (const c of filters.querySelectorAll('.chip')) {
        const isActive = c === chip;
        c.classList.toggle('active', isActive);
        c.setAttribute('aria-pressed', String(isActive));
      }

      state.genre = chip.dataset.genre || 'all';
      render(state);
    });
  }
}
