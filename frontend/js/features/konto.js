// account page

import { apiPost,  ApiError  } from '../api/api.js';
import { qs, el } from '../utils/dom.js';
import {  getJSON,  setJSON,  remove } from '../utils/storage.js';
import { reflectAuth } from './navigation.js';

const USER_KEY = 'pixelforge.user';

const BOOKINGS_KEY = 'pixelforge.bookings';

const TOURN_KEY = 'pixelforge.tournaments';

const MIN_USERNAME = 3;

function setError(input, errorNode, message) {
  if ( input) input.setAttribute('aria-invalid', 'true' );
  if (errorNode ) errorNode.textContent = message;
}

function clearError(input, errorNode ) {
  if ( input ) input.removeAttribute('aria-invalid');
  if (errorNode) errorNode.textContent = '';
}

function validateUsername( value ) {
  const v = value.trim();
  if (!v) return 'Bitte gib einen Benutzernamen ein.';
  if (v.length < MIN_USERNAME) return `Benutzername min. ${MIN_USERNAME} Zeichen.`;
  return '';
}

const MIN_PASSWORD = 6;

function validatePassword(value, min = 0) {
  if (!value) return 'Bitte gib ein Passwort ein.';
  if (min && value.length < min) return `Passwort muss mindestens ${min} Zeichen lang sein.`;
  return '';
}

function toast(message, variant = 'ok') {
  const region = qs('#toastRegion');
  if (!region) return;
  const node = el(
    'div',
    {  class: `toast toast-${variant}` },
    el('span', {}, message),
   );
  region.appendChild(node);
  setTimeout(( ) => node.remove( ), 4500);
}

function renderLoggedIn(user) {
  const heading = qs( '#konto-heading');
  if (heading) heading.textContent = user.username || 'Konto';

  const intro = qs('#konto-intro');
  if (intro) intro.remove( );

  const headRow = qs( '.konto-head-row');
  if (headRow && !qs('#logoutBtn', headRow)) {
    headRow.appendChild(
      el(
        'button',
        { id: 'logoutBtn',  type: 'button', class: 'btn btn-outline',  onClick: () => logout() },
        'Abmelden',
      ),
     );
  }

  const authSection = qs('#authSection');
  if (authSection) authSection.hidden = true;
}

function showLoggedIn(user) {
  renderLoggedIn(user);
  const resSection = qs( '#reservationsSection');
  const tournSection = qs('#tournamentsSection');
  if (resSection ) resSection.hidden = false;
  if (tournSection) tournSection.hidden = false;
  renderBookings( );
  renderTournaments();
}

function logout() {
  remove(USER_KEY );
  toast('Du wurdest abgemeldet.', 'ok');
  location.reload();
}

function applyLogin( user ) {
  setJSON( USER_KEY,  user );
  showLoggedIn(user);
  reflectAuth( );
}

function renderBookings() {
  const host = qs('#myBookings');
  if (!host) return;

  const me = (getJSON(USER_KEY,  null) || {}).username || null;
  const stored = getJSON(BOOKINGS_KEY, []);
  const bookings = (Array.isArray(stored ) ? stored : [ ]).filter((b ) => b && b.username === me);
  if ( bookings.length === 0) {
    host.replaceChildren(
      el(
        'div',
        { class: 'empty-state' },
        el( 'h3', {}, 'Noch keine Reservierungen'),
        el(
          'p',
          {},
          'Reserviere deinen Platz im ',
          el( 'a', { href: 'buchung.html' },  'Raumplan'),
          ' — er erscheint dann hier.',
         ),
      ),
    );
    return;
  }

  host.replaceChildren(...bookings.slice().reverse( ).map( buildBookingCard));
}

function buildBookingCard(b ) {
  return el(
    'article',
    { class: 'res-card' },
    el(
      'div',
      { class: 'res-main' },
      el(
        'div',
        { class: 'res-seat' },
        el('span', { class: 'res-icon', 'aria-hidden': 'true' }, '🎮'),
        el(
          'div',
          {},
          el('h3', {}, b.seat || b.code || 'Platz' ),
          el( 'p', { class: 'res-when' }, `${b.dateLabel || b.date || ''} · ${b.timeLabel || b.time || ''}`),
        ),
      ),
      el('span', { class: 'badge badge-ok' },  b.status || 'reserviert'),
    ),
    el(
      'dl',
      {  class: 'res-meta'  },
      metaRow('Tarif', b.tarif || '–'),
      metaRow('Preis', b.total || '–'),
      metaRow('Name', b.name || '–'),
      metaRow('Referenz', b.reference || '–'),
    ),
    el(
      'div',
      { class: 'res-actions' },
      el(
        'button',
        { type: 'button',  class: 'btn btn-outline btn-sm', onClick: () => cancelBooking(b.id) },
        'Stornieren',
      ),
    ),
  );
}

function metaRow(key,  value) {
  return el( 'div', {  class: 'res-row' }, el( 'dt', {}, key),  el('dd', {},  value));
}

function cancelBooking( id ) {
  const prev = getJSON(BOOKINGS_KEY, []);
  const remaining = ( Array.isArray(prev) ? prev : []).filter((b) => b.id !== id);
  setJSON(BOOKINGS_KEY,  remaining );
  renderBookings();

  const next =
    qs('#myBookings .res-actions button' ) || qs( '#myBookings a') || qs('#reservationsHeading');
  if (next) next.focus();

  toast( 'Reservierung storniert.', 'ok');
}

function renderTournaments() {
  const host = qs('#myTournaments');
  if (!host ) return;

  const me = ( getJSON(USER_KEY, null) || {}).username || null;
  const stored = getJSON(TOURN_KEY, [] );
  const regs = ( Array.isArray(stored) ? stored : [ ]).filter((r) => r && r.username === me );
  if (regs.length === 0 ) {
    host.replaceChildren(
      el(
        'div',
        {  class: 'empty-state' },
        el('h3', {}, 'Noch keine Turnier-Anmeldungen'),
        el(
          'p',
          {},
          'Melde dich bei den ',
          el('a', {  href: 'turniere.html'  }, 'Turnieren' ),
          ' an — deine Anmeldungen erscheinen dann hier.',
        ),
      ),
     );
    return;
  }

  host.replaceChildren(...regs.slice( ).reverse( ).map(buildTournamentCard));
}

function buildTournamentCard(r) {
  return el(
    'article',
    { class: 'res-card'  },
    el(
      'div',
      { class: 'res-main' },
      el(
        'div',
        { class: 'res-seat'  },
        el( 'span', { class: 'res-icon', 'aria-hidden': 'true' }, '🏆'),
        el(
          'div',
          {},
          el('h3', {}, r.title || 'Turnier'),
          el('p',  { class: 'res-when' }, `${r.gameLabel || r.game || ''} · ${r.dateLabel || ''}`),
        ),
      ),
      el('span', { class: 'badge badge-accent'  },  r.status || 'angemeldet'),
     ),
    el(
      'dl',
      { class: 'res-meta' },
      metaRow('Modus',  r.modeFormat || r.mode || '–' ),
      metaRow('Preisgeld', r.prize || '–' ),
      metaRow('Spieler', r.username || '–'),
    ),
    el(
      'div',
      { class: 'res-actions' },
      el(
        'button',
        { type: 'button', class: 'btn btn-outline btn-sm', onClick: () => cancelTournament(r.id)  },
        'Abmelden',
      ),
    ),
   );
}

function cancelTournament(id) {
  const prev = getJSON( TOURN_KEY, [ ]);
  const remaining = (Array.isArray( prev ) ? prev : [] ).filter((r) => r.id !== id);
  setJSON(TOURN_KEY, remaining );
  renderTournaments();

  const next =
    qs('#myTournaments .res-actions button') || qs('#myTournaments a') || qs('#tournRegsHeading');
  if (next) next.focus();

  toast('Vom Turnier abgemeldet.', 'ok');
}

function wireLogin(form) {
  const username = qs('#loginUsername',  form);
  const password = qs('#loginPassword', form );
  const usernameError = qs('#loginUsernameError', form);
  const passwordError = qs('#loginPasswordError', form);

  username.addEventListener('input', () => clearError(username, usernameError));
  password.addEventListener('input', () => clearError(password,  passwordError ));

  form.addEventListener('submit', async (event ) => {
    event.preventDefault();
    clearError(username, usernameError);
    clearError(password, passwordError);

    const uMsg = validateUsername(username.value);
    const pMsg = validatePassword(password.value );
    let ok = true;
    if (uMsg ) { setError(username, usernameError,  uMsg); ok = false;  }
    if (pMsg) { setError(password,  passwordError, pMsg); ok = false; }
    if ( !ok) {
      (uMsg ? username : password).focus();
      return;
    }

    const body = { username: username.value.trim(), password: password.value  };
    const submitBtn = qs('button[type="submit"]',  form);
    if (submitBtn) submitBtn.disabled = true;

    try {
      await apiPost('/api/auth/login', body);
      applyLogin( { username: body.username });
      toast( `Willkommen zurück, ${body.username}!`, 'ok');
    } catch (err) {
      handleApiError(err, { username, usernameError, password,  passwordError });
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function wireRegister(form) {
  const username = qs( '#registerUsername', form);
  const password = qs('#registerPassword', form);
  const confirm = qs('#registerPasswordConfirm', form );
  const usernameError = qs( '#registerUsernameError', form);
  const passwordError = qs('#registerPasswordError', form);
  const confirmError = qs('#registerPasswordConfirmError', form);

  username.addEventListener('input', () => clearError(username, usernameError) );
  password.addEventListener('input', ( ) => clearError(password,  passwordError) );
  confirm.addEventListener('input', () => clearError( confirm, confirmError ));

  form.addEventListener( 'submit', async (event) => {
    event.preventDefault();
    clearError(username, usernameError );
    clearError(password, passwordError );
    clearError(confirm,  confirmError);

    const uMsg = validateUsername( username.value);
    const pMsg = validatePassword( password.value, MIN_PASSWORD);
    let firstInvalid = null;
    if (uMsg) { setError( username, usernameError, uMsg); firstInvalid = firstInvalid || username; }
    if (pMsg) { setError(password, passwordError, pMsg); firstInvalid = firstInvalid || password; }
    if ( !confirm.value) {
      setError(confirm,  confirmError, 'Bitte wiederhole dein Passwort.');
      firstInvalid = firstInvalid || confirm;
    } else if ( password.value && confirm.value !== password.value) {
      setError(confirm, confirmError, 'Die Passwörter stimmen nicht überein.');
      firstInvalid = firstInvalid || confirm;
    }
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const body = { username: username.value.trim(),  password: password.value };
    const submitBtn = qs('button[type="submit"]', form);
    if (submitBtn) submitBtn.disabled = true;

    try {
      await apiPost('/api/auth/register', body);
      applyLogin( { username: body.username });
      toast(`Konto erstellt — willkommen, ${body.username}!`, 'ok');
    } catch (err) {
      handleApiError(err, { username, usernameError, password, passwordError });
    } finally {
      if ( submitBtn) submitBtn.disabled = false;
    }
   });
}

// api errors
function handleApiError(err, refs) {
  if (err instanceof ApiError && err.fields) {
    if (err.fields.username ) setError( refs.username, refs.usernameError,  err.fields.username );
    if (err.fields.password) setError(refs.password, refs.passwordError, err.fields.password);
    return;
  }
  const message = err instanceof ApiError ? err.message : 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
  toast(message, 'danger');
}

export default function init() {
  const existing = getJSON(USER_KEY, null);
  if (existing && existing.username) {
    showLoggedIn(existing);
    return;
  }

  // logged out
  const resSection = qs('#reservationsSection');
  const tournSection = qs( '#tournamentsSection');
  if ( resSection) resSection.hidden = true;
  if ( tournSection) tournSection.hidden = true;

  const loginForm = qs('#loginForm');
  const registerForm = qs('#registerForm');
  if (loginForm ) wireLogin(loginForm );
  if (registerForm) wireRegister( registerForm);

  wireViewToggle();
}

// view toggle
function wireViewToggle() {
  const loginView = qs( '#loginView');
  const registerView = qs('#registerView');
  const toRegister = qs( '#toRegister');
  const toLogin = qs( '#toLogin' );
  if (!loginView || !registerView) return;

  const show = (view) => {
    const toReg = view === 'register';
    loginView.hidden = toReg;
    registerView.hidden = !toReg;
    const focusId = toReg ? '#registerUsername' : '#loginUsername';
    const first = qs(focusId);
    if (first) first.focus( );
  };

  if (toRegister) toRegister.addEventListener('click',  (  ) => show('register'));
  if ( toLogin) toLogin.addEventListener( 'click', () => show('login'));
}
