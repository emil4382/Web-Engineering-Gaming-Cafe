/**
 * @file Turniere page — renders the tournament cards and wires the
 * "Anmelden" flow.
 *
 * Loads the four tournaments via {@link apiGet} (with automatic mock
 * fallback so the page works as a static site), renders one `.tcard` per
 * tournament into `#tournamentList`, and handles registration:
 * - logged out (`getMe()` resolves `null`) → a "Bitte einloggen" toast that
 *   links to `konto.html`;
 * - logged in → a simulated registration success toast.
 *
 * @module features/turniere
 */

import { apiGet, apiPost, getMe, ApiError } from '../api/api.js';
import { qs, el } from '../utils/dom.js';
import { formatEuro, formatDateDE } from '../utils/format.js';
import { TOURNAMENT_GAMES } from '../config/seatLayout.js';

/** Map of game slug → display label, derived from the config single source. */
const GAME_LABEL = Object.fromEntries(
  TOURNAMENT_GAMES.map((g) => [g.key, g.name]),
);

/**
 * Human-readable mode label. Solo for FIFA (1v1), Team for the 5v5 games.
 * Falls back to the tournament's own `mode` field when present.
 * @param {{game:string, mode?:string}} t - Tournament record.
 * @returns {string} 'Solo' or 'Team'.
 */
function modeLabel(t) {
  const mode = t.mode || (t.game === 'fifa' ? 'solo' : 'team');
  return mode === 'solo' ? 'Solo' : 'Team';
}

/**
 * Initialise the Turniere page: fetch tournaments and render the cards.
 * Safe to call once; no-ops gracefully if `#tournamentList` is absent.
 * @returns {Promise<void>}
 */
export default async function init() {
  const list = qs('#tournamentList');
  if (!list) return;

  let tournaments;
  try {
    tournaments = await apiGet('/api/tournaments');
  } catch (err) {
    renderError(list);
    return;
  }

  if (!Array.isArray(tournaments) || tournaments.length === 0) {
    renderEmpty(list);
    return;
  }

  list.replaceChildren(...tournaments.map(buildCard));
}

/**
 * Build one tournament `.tcard` element with all its parts.
 * @param {Object} t - Tournament record from the API/mock.
 * @returns {HTMLElement} The card article.
 */
function buildCard(t) {
  const isFull = t.status === 'full';
  const gameName = GAME_LABEL[t.game] || t.title;

  const statusBadge = el(
    'span',
    { class: `badge ${isFull ? 'badge-warn' : 'badge-ok'}` },
    isFull ? 'Ausgebucht' : 'Anmeldung offen',
  );

  const meta = el(
    'div',
    { class: 'tcard-meta' },
    metaItem('Datum', formatDateDE(t.date)),
    metaItem('Modus', `${t.format || modeLabel(t)}`),
    metaItem('Preisgeld', formatEuro(t.prize)),
    metaItem('Plätze', `${t.registered ?? 0} / ${t.slots ?? '–'}`),
  );

  const card = el(
    'article',
    { class: 'tcard', dataset: { game: t.game, full: String(isFull) } },
    el(
      'div',
      { class: 'tcard-top' },
      el('span', { class: 'tcard-game' }, gameName),
      statusBadge,
    ),
    el('h3', {}, t.title),
    el('p', { class: 't-when' }, `${modeLabel(t)} · ${formatDateDE(t.date)}`),
    meta,
    buildSlots(t),
    buildFoot(t, isFull),
  );

  return card;
}

/**
 * Build a single labelled meta cell (`.tmeta` with `.k` label + `.v` value).
 * @param {string} label - Uppercase key label.
 * @param {string} value - Display value.
 * @returns {HTMLElement} The meta cell.
 */
function metaItem(label, value) {
  return el(
    'div',
    { class: 'tmeta' },
    el('span', { class: 'k' }, label),
    el('span', { class: 'v' }, value),
  );
}

/**
 * Build the slots progress bar when capacity data is available.
 * @param {{registered?:number, slots?:number}} t - Tournament record.
 * @returns {HTMLElement|null} The `.t-slots` block, or null if unknown.
 */
function buildSlots(t) {
  if (typeof t.slots !== 'number' || t.slots <= 0) return null;
  const registered = Math.min(t.registered ?? 0, t.slots);
  const pct = Math.round((registered / t.slots) * 100);

  const fill = el('span', { style: { width: `${pct}%` } });
  // The CSS bar reads --fill; set it on the inner span so it animates.
  fill.style.setProperty('--fill', `${pct}%`);

  return el(
    'div',
    { class: 't-slots' },
    el(
      'span',
      { class: 'muted' },
      `${registered} von ${t.slots} Plätzen belegt`,
    ),
    el('div', { class: 'bar' }, fill),
  );
}

/**
 * Build the card footer with the Anmelden button (or a disabled "Ausgebucht").
 * @param {Object} t - Tournament record.
 * @param {boolean} isFull - Whether the tournament is sold out.
 * @returns {HTMLElement} The `.tcard-foot` element.
 */
function buildFoot(t, isFull) {
  if (isFull) {
    return el(
      'div',
      { class: 'tcard-foot' },
      el('span', { class: 'badge badge-neutral badge-plain' }, 'Warteliste'),
      el('button', { class: 'btn btn-outline btn-sm', type: 'button', disabled: true }, 'Ausgebucht'),
    );
  }

  const btn = el(
    'button',
    {
      class: 'btn btn-primary btn-sm',
      type: 'button',
      onClick: () => handleRegister(t, btn),
    },
    'Anmelden',
  );

  return el('div', { class: 'tcard-foot' }, el('span', { class: 'badge badge-ok badge-plain' }, 'Frei'), btn);
}

/**
 * Handle an "Anmelden" click: gate on auth, then simulate registration.
 * @param {Object} t - Tournament record.
 * @param {HTMLButtonElement} btn - The clicked button (to disable while busy).
 * @returns {Promise<void>}
 */
async function handleRegister(t, btn) {
  btn.disabled = true;
  try {
    const me = await getMe();
    if (!me) {
      showLoginToast();
      return;
    }

    await apiPost(`/api/tournaments/${t.id}/register`, { tournamentId: t.id });
    toast('ok', 'Anmeldung bestätigt', `Du bist für "${t.title}" angemeldet. Viel Erfolg!`);
    btn.textContent = 'Angemeldet';
    return; // keep the button disabled after a successful sign-up
  } catch (err) {
    const msg = err instanceof ApiError ? err.message : 'Bitte versuche es später erneut.';
    toast('danger', 'Anmeldung fehlgeschlagen', msg);
  } finally {
    if (!btn.disabled || btn.textContent !== 'Angemeldet') btn.disabled = false;
  }
}

/**
 * Show the "Bitte einloggen" toast with a link to the account page.
 * @returns {void}
 */
function showLoginToast() {
  const region = ensureToastRegion();
  const node = el(
    'div',
    { class: 'toast toast-warn', role: 'status' },
    el(
      'div',
      {},
      el('strong', {}, 'Bitte einloggen'),
      el('p', {}, 'Für die Turnier-Anmeldung brauchst du ein PixelForge-Konto.'),
      el('a', { href: 'konto.html' }, 'Zum Login'),
    ),
  );
  region.appendChild(node);
  autoDismiss(node, 6000);
}

/**
 * Append a transient toast notification.
 * @param {'ok'|'warn'|'danger'} kind - Visual variant.
 * @param {string} title - Bold headline.
 * @param {string} message - Body text.
 * @returns {void}
 */
function toast(kind, title, message) {
  const region = ensureToastRegion();
  const node = el(
    'div',
    { class: `toast toast-${kind}`, role: 'status' },
    el(
      'div',
      {},
      el('strong', {}, title),
      el('p', {}, message),
    ),
  );
  region.appendChild(node);
  autoDismiss(node, 5000);
}

/**
 * Fade and remove a toast after a delay.
 * @param {HTMLElement} node - The toast node.
 * @param {number} ms - Lifetime in milliseconds.
 * @returns {void}
 */
function autoDismiss(node, ms) {
  setTimeout(() => {
    node.style.transition = 'opacity .25s ease';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 260);
  }, ms);
}

/**
 * Get the shared toast region, creating it if the page omitted it.
 * @returns {HTMLElement} The `#toastRegion` element.
 */
function ensureToastRegion() {
  let region = qs('#toastRegion');
  if (!region) {
    region = el('div', {
      id: 'toastRegion',
      class: 'toast-region',
      role: 'status',
      'aria-live': 'polite',
    });
    document.body.appendChild(region);
  }
  return region;
}

/**
 * Render the empty state into the list container.
 * @param {HTMLElement} list - The `#tournamentList` element.
 * @returns {void}
 */
function renderEmpty(list) {
  list.replaceChildren(
    el(
      'div',
      { class: 'empty-state' },
      el('h3', {}, 'Aktuell keine Turniere'),
      el('p', {}, 'Schau bald wieder vorbei — die nächste Saison wird gerade geplant.'),
    ),
  );
}

/**
 * Render the error state into the list container.
 * @param {HTMLElement} list - The `#tournamentList` element.
 * @returns {void}
 */
function renderError(list) {
  list.replaceChildren(
    el(
      'div',
      { class: 'empty-state' },
      el('h3', {}, 'Turniere konnten nicht geladen werden'),
      el('p', {}, 'Bitte lade die Seite neu oder versuche es später erneut.'),
    ),
  );
}
