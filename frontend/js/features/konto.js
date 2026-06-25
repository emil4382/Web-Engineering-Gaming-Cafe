/**
 * @file Konto (account) page feature: login + register forms.
 *
 * Wires the two `.auth-card` forms (`#loginForm`, `#registerForm`) with:
 * - client-side validation (username ≥ 3 chars, password required, register
 *   passwords must match) using inline `.field-error[role=alert]` messages and
 *   `aria-invalid` on the offending control,
 * - submit → `apiPost('/api/auth/login' | '/api/auth/register', body)` which
 *   resolves to a simulated success in mock/offline mode,
 * - on success: persist the user via `utils/storage`, show a success toast, and
 *   reflect the logged-in state in the UI (forms replaced by a greeting).
 *
 * No `alert()` is used anywhere — all feedback is inline or via toast.
 *
 * @module features/konto
 */

import { apiPost, ApiError } from '../api/api.js';
import { qs, el } from '../utils/dom.js';
import { getJSON, setJSON, remove } from '../utils/storage.js';

/** localStorage key under which the signed-in user is cached. */
const USER_KEY = 'pixelforge.user';

/** Minimum allowed username length. */
const MIN_USERNAME = 3;

/* ------------------------------------------------------------------ */
/* Validation helpers                                                 */
/* ------------------------------------------------------------------ */

/**
 * Show a field error: fills the `.field-error` node and flags the input as
 * invalid for assistive tech and styling.
 * @param {HTMLInputElement} input - The control in error.
 * @param {HTMLElement|null} errorNode - The sibling `.field-error[role=alert]`.
 * @param {string} message - German error message.
 * @returns {void}
 */
function setError(input, errorNode, message) {
  if (input) input.setAttribute('aria-invalid', 'true');
  if (errorNode) errorNode.textContent = message;
}

/**
 * Clear a previously shown field error.
 * @param {HTMLInputElement} input - The control to reset.
 * @param {HTMLElement|null} errorNode - The sibling `.field-error` node.
 * @returns {void}
 */
function clearError(input, errorNode) {
  if (input) input.removeAttribute('aria-invalid');
  if (errorNode) errorNode.textContent = '';
}

/**
 * Validate a username value.
 * @param {string} value - Raw username.
 * @returns {string} Error message, or '' when valid.
 */
function validateUsername(value) {
  const v = value.trim();
  if (!v) return 'Bitte gib einen Benutzernamen ein.';
  if (v.length < MIN_USERNAME) return `Benutzername min. ${MIN_USERNAME} Zeichen.`;
  return '';
}

/**
 * Validate a required password value.
 * @param {string} value - Raw password.
 * @returns {string} Error message, or '' when valid.
 */
function validatePassword(value) {
  if (!value) return 'Bitte gib ein Passwort ein.';
  return '';
}

/* ------------------------------------------------------------------ */
/* Toast                                                              */
/* ------------------------------------------------------------------ */

/**
 * Append a toast to the page-level live region, then auto-dismiss it.
 * @param {string} message - Body text.
 * @param {'ok'|'warn'|'danger'} [variant='ok'] - Visual variant.
 * @returns {void}
 */
function toast(message, variant = 'ok') {
  const region = qs('#toastRegion');
  if (!region) return;
  const node = el(
    'div',
    { class: `toast toast-${variant}` },
    el('span', {}, message),
  );
  region.appendChild(node);
  setTimeout(() => node.remove(), 4500);
}

/* ------------------------------------------------------------------ */
/* Logged-in state                                                    */
/* ------------------------------------------------------------------ */

/**
 * Replace both auth cards with a signed-in confirmation panel.
 * @param {{username:string}} user - The signed-in user.
 * @returns {void}
 */
function renderLoggedIn(user) {
  const grid = qs('.grid-2');
  if (!grid) return;

  const initial = (user.username || '?').charAt(0).toUpperCase();

  const panel = el(
    'div',
    { class: 'card auth-card', id: 'accountStatus' },
    el('p', { class: 'kicker' }, 'Angemeldet'),
    el('div', { class: 'profile-avatar' }, initial),
    el('h2', {}, `Hallo, ${user.username}`),
    el('p', { class: 'lead' }, 'Du bist eingeloggt. Viel Spaß bei PixelForge!'),
    el('button', {
      type: 'button',
      class: 'btn btn-outline',
      onClick: () => logout(),
    }, 'Abmelden'),
  );

  grid.replaceChildren(panel);
}

/**
 * Sign the user out: clear storage and restore the page to its logged-out
 * markup by reloading. Kept minimal and side-effect-free beyond storage.
 * @returns {void}
 */
function logout() {
  remove(USER_KEY);
  toast('Du wurdest abgemeldet.', 'ok');
  // Restore the original two-form layout.
  location.reload();
}

/**
 * Persist the user and switch the UI into its logged-in state.
 * @param {{username:string}} user - The signed-in user.
 * @returns {void}
 */
function applyLogin(user) {
  setJSON(USER_KEY, user);
  renderLoggedIn(user);
}

/* ------------------------------------------------------------------ */
/* Form wiring                                                        */
/* ------------------------------------------------------------------ */

/**
 * Wire the login form: validate, POST, store, toast.
 * @param {HTMLFormElement} form - The `#loginForm` element.
 * @returns {void}
 */
function wireLogin(form) {
  const username = qs('#loginUsername', form);
  const password = qs('#loginPassword', form);
  const usernameError = qs('#loginUsernameError', form);
  const passwordError = qs('#loginPasswordError', form);

  username.addEventListener('input', () => clearError(username, usernameError));
  password.addEventListener('input', () => clearError(password, passwordError));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError(username, usernameError);
    clearError(password, passwordError);

    const uMsg = validateUsername(username.value);
    const pMsg = validatePassword(password.value);
    let ok = true;
    if (uMsg) { setError(username, usernameError, uMsg); ok = false; }
    if (pMsg) { setError(password, passwordError, pMsg); ok = false; }
    if (!ok) {
      (uMsg ? username : password).focus();
      return;
    }

    const body = { username: username.value.trim(), password: password.value };
    const submitBtn = qs('button[type="submit"]', form);
    if (submitBtn) submitBtn.disabled = true;

    try {
      await apiPost('/api/auth/login', body);
      applyLogin({ username: body.username });
      toast(`Willkommen zurück, ${body.username}!`, 'ok');
    } catch (err) {
      handleApiError(err, { username, usernameError, password, passwordError });
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/**
 * Wire the register form: validate (incl. password match), POST, store, toast.
 * @param {HTMLFormElement} form - The `#registerForm` element.
 * @returns {void}
 */
function wireRegister(form) {
  const username = qs('#registerUsername', form);
  const password = qs('#registerPassword', form);
  const confirm = qs('#registerPasswordConfirm', form);
  const usernameError = qs('#registerUsernameError', form);
  const passwordError = qs('#registerPasswordError', form);
  const confirmError = qs('#registerPasswordConfirmError', form);

  username.addEventListener('input', () => clearError(username, usernameError));
  password.addEventListener('input', () => clearError(password, passwordError));
  confirm.addEventListener('input', () => clearError(confirm, confirmError));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError(username, usernameError);
    clearError(password, passwordError);
    clearError(confirm, confirmError);

    const uMsg = validateUsername(username.value);
    const pMsg = validatePassword(password.value);
    let firstInvalid = null;
    if (uMsg) { setError(username, usernameError, uMsg); firstInvalid = firstInvalid || username; }
    if (pMsg) { setError(password, passwordError, pMsg); firstInvalid = firstInvalid || password; }
    if (!confirm.value) {
      setError(confirm, confirmError, 'Bitte wiederhole dein Passwort.');
      firstInvalid = firstInvalid || confirm;
    } else if (password.value && confirm.value !== password.value) {
      setError(confirm, confirmError, 'Die Passwörter stimmen nicht überein.');
      firstInvalid = firstInvalid || confirm;
    }
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const body = { username: username.value.trim(), password: password.value };
    const submitBtn = qs('button[type="submit"]', form);
    if (submitBtn) submitBtn.disabled = true;

    try {
      await apiPost('/api/auth/register', body);
      applyLogin({ username: body.username });
      toast(`Konto erstellt — willkommen, ${body.username}!`, 'ok');
    } catch (err) {
      handleApiError(err, { username, usernameError, password, passwordError });
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/**
 * Map a backend {@link ApiError} (incl. per-field errors) onto the form, with a
 * toast fallback. In mock/offline mode this path is not hit (writes succeed).
 * @param {unknown} err - The thrown error.
 * @param {{username:HTMLInputElement, usernameError:HTMLElement,
 *          password:HTMLInputElement, passwordError:HTMLElement}} refs
 *   - Field/error node references.
 * @returns {void}
 */
function handleApiError(err, refs) {
  if (err instanceof ApiError && err.fields) {
    if (err.fields.username) setError(refs.username, refs.usernameError, err.fields.username);
    if (err.fields.password) setError(refs.password, refs.passwordError, err.fields.password);
    return;
  }
  const message = err instanceof ApiError ? err.message : 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
  toast(message, 'danger');
}

/* ------------------------------------------------------------------ */
/* Init                                                               */
/* ------------------------------------------------------------------ */

/**
 * Initialise the Konto page. Called by `js/main.js` after navigation boot when
 * `document.body.dataset.page === 'konto'`. Restores an existing session from
 * storage, otherwise wires the login + register forms.
 * @returns {void}
 */
export default function init() {
  const existing = getJSON(USER_KEY, null);
  if (existing && existing.username) {
    renderLoggedIn(existing);
    return;
  }

  const loginForm = qs('#loginForm');
  const registerForm = qs('#registerForm');
  if (loginForm) wireLogin(loginForm);
  if (registerForm) wireRegister(registerForm);
}
