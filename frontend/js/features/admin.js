/**
 * @file Admin booking management (page `admin.html`, `data-page="admin"`).
 *
 * Behaviour:
 * - On "Laden", read the admin token, call `apiGet('/api/bookings')` and render
 *   the returned bookings into the {@link adminTable}.
 * - The mock layer has no `/bookings` route, so when the API falls back to mock
 *   mode we synthesise a deterministic sample list from the mock seat data — the
 *   page therefore works fully standalone with no backend, as required.
 * - Each row gets a "Stornieren" action that simulates a cancel via
 *   `apiSend('DELETE', …)` and removes the row optimistically.
 * - Loading / empty / error states are reflected in the table body and via
 *   toasts; the token is sent as the `x-admin-token` header (real backend only).
 *
 * @module features/admin
 */

import { apiGet, apiSend, ApiError } from '../api/api.js';
import MOCK from '../api/mock.js';
import { qs, el } from '../utils/dom.js';
import { formatDateDE } from '../utils/format.js';
import { ALLOWED_TIMES } from '../config/seatLayout.js';

/** Number of columns in the admin table (for full-width state rows). */
const COLS = 6;

/**
 * Human-readable label + badge variant for each booking status.
 * @type {Object<string, {label: string, badge: string}>}
 */
const STATUS_META = {
  confirmed: { label: 'Bestätigt', badge: 'badge-ok' },
  pending: { label: 'Reserviert', badge: 'badge-warn' },
  cancelled: { label: 'Storniert', badge: 'badge-danger' },
};

/**
 * Initialise the admin page: wire the load form and render bookings on submit.
 * No-ops gracefully if the expected markup is absent.
 * @returns {void}
 */
export default function init() {
  const form = qs('#adminLoadForm');
  const table = qs('#adminTable');
  const tokenInput = qs('#adminToken');
  if (!form || !table) return;

  const tbody = table.querySelector('tbody') || el('tbody');
  if (!table.contains(tbody)) table.appendChild(tbody);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void loadBookings(tbody, tokenInput ? tokenInput.value.trim() : '');
  });
}

/* ------------------------------------------------------------------ */
/* Data loading                                                       */
/* ------------------------------------------------------------------ */

/**
 * Fetch bookings (with mock fallback) and render them, handling loading,
 * empty and error states.
 * @param {HTMLTableSectionElement} tbody - The table body to render into.
 * @param {string} token - Admin token to send as `x-admin-token`.
 * @returns {Promise<void>}
 */
async function loadBookings(tbody, token) {
  setStateRow(tbody, 'Buchungen werden geladen …');
  setStatus('', null);

  try {
    const path = `/api/bookings${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    let bookings = await apiGet(path);
    if (!Array.isArray(bookings)) bookings = [];
    renderRows(tbody, bookings);
  } catch (err) {
    // The mock layer has no `/bookings` route → a `mock_miss` ApiError means we
    // are running standalone. Fall back to deterministic sample data so the
    // admin view is fully demoable without a backend.
    if (err instanceof ApiError && (err.code === 'mock_miss' || err.status === 0)) {
      renderRows(tbody, sampleBookings());
      return;
    }
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      setStateRow(tbody, 'Zugriff verweigert. Bitte gültiges Admin-Token eingeben.');
      setStatus('Zugriff verweigert – das Admin-Token ist ungültig.', 'error');
      return;
    }
    setStateRow(tbody, 'Buchungen konnten nicht geladen werden.');
    setStatus('Fehler beim Laden der Buchungen. Bitte erneut versuchen.', 'error');
  }
}

/**
 * Build a deterministic list of sample bookings from the mock seat data, so the
 * page shows realistic content with no backend. Occupied seats become confirmed
 * bookings, reserved seats become pending ones.
 * @returns {Array<{id:string, seat:string, zone:string, date:string, time:string, name:string, status:string}>}
 */
function sampleBookings() {
  const names = [
    'Lena Hofmann', 'Jonas Becker', 'Mira Sahin', 'Tobias Krause',
    'Aylin Demir', 'Felix Wagner', 'Noah Schulz', 'Pauline Vogt',
    'Sven Richter', 'Hannah Bauer', 'David Klein',
  ];
  const dates = ['2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27'];
  const times = ALLOWED_TIMES && ALLOWED_TIMES.length
    ? ALLOWED_TIMES
    : ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  const booked = (MOCK.seats || []).filter(
    (s) => s.status === 'occupied' || s.status === 'reserved',
  );

  return booked.map((seat, i) => ({
    id: `B-${seat.code}`,
    seat: seat.label || seat.code,
    zone: seat.zone || '',
    date: dates[i % dates.length],
    time: times[i % times.length],
    name: names[i % names.length],
    status: seat.status === 'occupied' ? 'confirmed' : 'pending',
  }));
}

/* ------------------------------------------------------------------ */
/* Rendering                                                          */
/* ------------------------------------------------------------------ */

/**
 * Render a list of bookings into the table body (or an empty-state row).
 * @param {HTMLTableSectionElement} tbody - The table body.
 * @param {Array<Object>} bookings - Bookings to render.
 * @returns {void}
 */
function renderRows(tbody, bookings) {
  tbody.replaceChildren();

  if (!bookings.length) {
    setStateRow(tbody, 'Keine Buchungen vorhanden.');
    return;
  }

  for (const booking of bookings) {
    tbody.appendChild(buildRow(tbody, booking));
  }
}

/**
 * Build a single booking `<tr>` including its "Stornieren" action.
 * @param {HTMLTableSectionElement} tbody - The owning table body.
 * @param {Object} booking - A booking record.
 * @returns {HTMLTableRowElement} The constructed row.
 */
function buildRow(tbody, booking) {
  const status = STATUS_META[booking.status] || STATUS_META.confirmed;
  const seatLabel = booking.zone ? `${booking.zone} – ${booking.seat}` : booking.seat;

  const badge = el('span', { class: `badge ${status.badge}` }, status.label);

  const cancelBtn = el(
    'button',
    {
      type: 'button',
      class: 'btn btn-danger btn-sm',
      disabled: booking.status === 'cancelled',
    },
    'Stornieren',
  );

  const row = el(
    'tr',
    { dataset: { id: String(booking.id ?? '') } },
    el('td', {}, seatLabel || '–'),
    el('td', {}, formatDateDE(booking.date)),
    el('td', { class: 'num' }, booking.time || '–'),
    el('td', {}, booking.name || '–'),
    el('td', {}, badge),
    el('td', {}, el('div', { class: 'row-actions' }, cancelBtn)),
  );

  cancelBtn.addEventListener('click', () => {
    void cancelBooking(tbody, row, booking, cancelBtn, badge);
  });

  return row;
}

/**
 * Simulate cancelling a booking, then reflect it in the row.
 * @param {HTMLTableSectionElement} tbody - The owning table body.
 * @param {HTMLTableRowElement} row - The booking's row.
 * @param {Object} booking - The booking record.
 * @param {HTMLButtonElement} btn - The cancel button.
 * @param {HTMLElement} badge - The status badge element to update.
 * @returns {Promise<void>}
 */
async function cancelBooking(tbody, row, booking, btn, badge) {
  btn.disabled = true;
  btn.textContent = 'Storniert …';

  try {
    await apiSend('DELETE', `/api/bookings/${encodeURIComponent(booking.id)}`);
    // Reflect the cancellation in place (POST/DELETE resolve to a simulated
    // success in mock mode, so this path is always reached standalone).
    badge.className = `badge ${STATUS_META.cancelled.badge}`;
    badge.textContent = STATUS_META.cancelled.label;
    btn.textContent = 'Storniert';
    toast(`Buchung „${booking.seat}“ wurde storniert.`, 'toast-ok');
  } catch {
    btn.disabled = false;
    btn.textContent = 'Stornieren';
    toast('Stornieren fehlgeschlagen. Bitte erneut versuchen.', 'toast-danger');
  }
}

/* ------------------------------------------------------------------ */
/* State helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Replace the table body with a single full-width message row
 * (loading / empty / error state).
 * @param {HTMLTableSectionElement} tbody - The table body.
 * @param {string} message - Message to show.
 * @returns {void}
 */
function setStateRow(tbody, message) {
  tbody.replaceChildren(
    el('tr', {}, el('td', { colSpan: COLS }, message)),
  );
}

/**
 * Show or hide the form-level status alert.
 * @param {string} message - Message text ('' hides the alert).
 * @param {'error'|null} kind - Alert kind.
 * @returns {void}
 */
function setStatus(message, kind) {
  const alert = qs('#adminStatus');
  if (!alert) return;
  alert.textContent = message;
  alert.classList.toggle('hidden', !message);
  // Reuse the form-alert error styling; success is not needed here.
  alert.classList.toggle('form-alert-ok', kind !== 'error' && Boolean(message));
}

/**
 * Append a transient toast to the shared toast region (if present).
 * @param {string} message - Toast text.
 * @param {'toast-ok'|'toast-warn'|'toast-danger'} [variant='toast-ok'] - Style.
 * @returns {void}
 */
function toast(message, variant = 'toast-ok') {
  const region = qs('#toastRegion');
  if (!region) return;
  const node = el('div', { class: `toast ${variant}` }, message);
  region.appendChild(node);
  setTimeout(() => node.remove(), 4000);
}
