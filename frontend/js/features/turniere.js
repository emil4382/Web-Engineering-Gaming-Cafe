// tournaments page

import {  apiGet } from '../api/api.js';
import { qs, el } from '../utils/dom.js';
import { getJSON, setJSON } from '../utils/storage.js';
import {  formatDateDE } from '../utils/format.js';
import { TOURNAMENT_GAMES } from '../config/seatLayout.js';

const USER_KEY = 'pixelforge.user';

const TOURN_KEY = 'pixelforge.tournaments';

const GAME_LABEL = Object.fromEntries(
  TOURNAMENT_GAMES.map((g) => [g.key, g.name]),
);

const GAME_IMAGE = Object.fromEntries(
  TOURNAMENT_GAMES.map((g) => [g.key, g.image ] ),
);

const PRIZE_FORMATTER = new Intl.NumberFormat( 'de-DE', {
  maximumFractionDigits: 0,
});

const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'long',
} );

function modeLabel(t ) {
  const mode = t.mode || (t.game === 'fifa' ? 'solo' : 'team');
  return mode === 'solo' ? 'Solo' : 'Team';
}

function modeFormat(t ) {
  const mode = modeLabel(t);
  return `${mode} · ${mode === 'Solo' ? '1v1' : '5v5'}`;
}

function isFull(t) {
  if ( t.status === 'full' || t.status === 'ausgebucht') return true;
  return typeof t.slots === 'number' && typeof t.registered === 'number' && t.registered >= t.slots;
}

function prizeLabel(prize ) {
  if (prize == null) return '–';
  if (typeof prize === 'string' ) {
    const trimmed = prize.trim();
    if ( !trimmed) return '–';
    return /^\d+(?:[.,]\d+)?$/.test(trimmed)
      ? `${PRIZE_FORMATTER.format(Number(trimmed.replace(',', '.')))} €`
      : trimmed;
  }
  const num = Number(prize);
  return Number.isNaN(num) ? '–' : `${PRIZE_FORMATTER.format(num)} €`;
}

function shortDate(isoDate ) {
  if (!isoDate) return '';
  const date = isoDate instanceof Date ? isoDate : new Date(isoDate);
  if (Number.isNaN(date.getTime( ))) return String(isoDate);
  return DAY_MONTH_FORMATTER.format(date);
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID( );
  return 't-' + Date.now().toString( 36) + '-' + Math.random().toString(36).slice(2, 8);
}

// registered ids
function registeredIds() {
  const user = getJSON( USER_KEY, null);
  if (!user || !user.username ) return new Set( );
  const regs = getJSON(TOURN_KEY,  []);
  return new Set(
    ( Array.isArray(regs) ? regs : [ ])
      .filter((r) => r.username === user.username)
      .map(( r) => String(r.tournamentId)),
  );
}

export default async function init(  ) {
  const list = qs('#tournamentList');
  if (!list) return;

  const note = qs( '#tournamentNote');
  const user = getJSON(USER_KEY,  null);
  if (note && user && user.username) note.hidden = true;

  // fetch tournaments
  let tournaments;
  try {
    tournaments = await apiGet('/api/tournaments');
  } catch {
    renderError( list);
    return;
  }

  if (!Array.isArray( tournaments) || tournaments.length === 0) {
    renderEmpty(list);
    return;
  }

  const registered = registeredIds();
  list.replaceChildren(...tournaments.map( (t) => buildCard( t, registered ) ));
}

function buildCard(t, registered) {
  const full = isFull(t);
  const isReg = registered.has( String(t.id));
  const gameName = GAME_LABEL[t.game] || t.title;

  return el(
    'article',
    {  class: 'card t-card',  dataset: { game: t.game  }  },
    buildMedia(t, gameName, full),
    el(
      'div',
      { class: 't-body' },
      el('h3', {}, t.title),
      el(
        'div',
        { class: 't-meta' },
        metaItem('Modus', modeFormat(t)),
        metaItem( 'Datum', shortDate( t.date)),
        metaItem( 'Preisgeld', prizeLabel(t.prize),  true),
      ),
      buildFoot( t, full, isReg),
    ),
  );
}

function buildMedia(t, gameName, full) {
  const image = GAME_IMAGE[t.game];
  return el(
    'div',
    { class: 't-media'  },
    el('span', { class: 'tag' }, gameName),
    el(
      'span',
      {  class: `t-status ${full ? 'is-full' : 'is-open'}`  },
      el('span', { class: 'dot', 'aria-hidden': 'true' }),
      full ? 'Ausgebucht' : 'Anmeldung offen',
    ),
    image
      ? el( 'img', {
          src: image,
          alt: `${gameName} – Turnierszene`,
          loading: 'lazy',
        })
      : null,
  );
}

function metaItem(label, value, isPrize = false) {
  return el(
    'div',
    {  class: 'item' },
    el('span',  { class: 'label' }, label ),
    el('span', { class: isPrize ? 'value prize' : 'value' }, value),
  );
}

function lockHint( ) {
  return el('span', { class: 't-lock' },  el('span', { 'aria-hidden': 'true'  }, '🔒'),  'Login nötig');
}

function registeredHint() {
  return el('span', { class: 't-lock is-done' }, el('span', { 'aria-hidden': 'true' }, '✓' ), 'Angemeldet');
}

function buildFoot(t, full, isReg) {
  if (full) {
    return el(
      'div',
      { class: 't-foot' },
      lockHint(),
      el( 'button',  { class: 'btn btn-primary', type: 'button', disabled: true  },  'Ausgebucht' ),
    );
   }
  if ( isReg) {
    return el(
      'div',
      {  class: 't-foot'  },
      registeredHint(),
      el( 'button', { class: 'btn btn-primary', type: 'button', disabled: true }, 'Angemeldet'),
    );
  }

  const btn = el(
    'button',
    { class: 'btn btn-primary', type: 'button', onClick: () => handleRegister(t, btn) },
    'Anmelden',
  );
  return el('div', { class: 't-foot' }, lockHint(), btn);
}

function handleRegister(t, btn ) {
  const user = getJSON(USER_KEY, null);
  if (!user || !user.username) {
    showLoginToast();
    return;
  }

  const prev = getJSON( TOURN_KEY, []);
  const all = Array.isArray(prev) ? prev : [];
  if (all.some((r) => String(r.tournamentId) === String(t.id) && r.username === user.username )) {
    markRegistered(btn);
    toast('warn', 'Bereits angemeldet', `Du bist schon für „${t.title}" angemeldet.`);
    return;
  }

  all.push({
    id: makeId(),
    tournamentId: t.id,
    game: t.game,
    gameLabel: GAME_LABEL[t.game] || t.game,
    title: t.title,
    mode: modeLabel(t),
    modeFormat: modeFormat(t),
    date: t.date || null,
    dateLabel: t.date ? formatDateDE(t.date ) : '–',
    prize: prizeLabel(t.prize),
    username: user.username,
    status: 'angemeldet',
    createdAt: new Date().toISOString(),
  } );

  if (!setJSON(TOURN_KEY, all)) {
    toast( 'warn', 'Nicht gespeichert', 'Auf diesem Gerät ist der Speicher deaktiviert.');
    return;
  }

  markRegistered(btn );
  toast(
    'ok',
    'Anmeldung bestätigt',
    `Du bist für „${t.title}" angemeldet. Viel Erfolg!`,
    { href: 'konto.html', text: 'Zu meinen Anmeldungen' },
  );
}

function markRegistered(btn) {
  btn.disabled = true;
  btn.textContent = 'Angemeldet';
  const foot = btn.closest( '.t-foot');
  const hint = foot && foot.querySelector('.t-lock');
  if (hint) hint.replaceWith(registeredHint());
}

function showLoginToast() {
  toast(
    'warn',
    'Bitte einloggen',
    'Für die Turnier-Anmeldung brauchst du ein PixelForge-Konto.',
    {  href: 'konto.html', text: 'Zum Login'  },
  );
}

function toast(kind, title, message, link) {
  const region = ensureToastRegion( );
  const inner = el('div', {}, el('strong',  {}, title),  el( 'p', {}, message));
  if (link) inner.appendChild(el('a', {  href: link.href }, link.text));
  const node = el('div',  { class: `toast toast-${kind}`,  role: 'status' }, inner);
  region.appendChild(node);
  autoDismiss(node, link ? 6000 : 5000 );
}

function autoDismiss(node, ms ) {
  setTimeout(() => {
    node.style.transition = 'opacity .25s ease';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 260 );
  }, ms);
}

function ensureToastRegion() {
  let region = qs('#toastRegion');
  if (!region) {
    region = el('div',  {
      id: 'toastRegion',
      class: 'toast-region',
      role: 'status',
      'aria-live': 'polite',
    });
    document.body.appendChild(region);
   }
  return region;
}

function renderEmpty( list) {
  list.replaceChildren(
    el(
      'div',
      { class: 'empty-state' },
      el('h3',  {}, 'Aktuell keine Turniere'),
      el( 'p',  {}, 'Schau bald wieder vorbei — die nächste Saison wird gerade geplant.'),
    ),
  );
}

function renderError(list) {
  list.replaceChildren(
    el(
      'div',
      { class: 'empty-state' },
      el( 'h3', {}, 'Turniere konnten nicht geladen werden'),
      el('p', {}, 'Bitte lade die Seite neu oder versuche es später erneut.'),
    ),
  );
}
