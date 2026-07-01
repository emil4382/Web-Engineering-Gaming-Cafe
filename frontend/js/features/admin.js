// admin bookings page

import { apiGet, apiSend,  ApiError } from '../api/api.js';
import MOCK from '../api/mock.js';
import {  qs,  el } from '../utils/dom.js';
import { formatDateDE } from '../utils/format.js';
import {  ALLOWED_TIMES } from '../config/seatLayout.js';

const COLS = 6;

// status labels
const STATUS_META = {
  confirmed: {  label: 'Bestätigt', badge: 'badge-ok'  },
  pending: { label: 'Reserviert', badge: 'badge-warn' },
  cancelled: { label: 'Storniert',  badge: 'badge-danger' },
};

// init
export default function init() {
  const form = qs( '#adminLoadForm' );
  const table = qs('#adminTable');
  const tokenInput = qs('#adminToken' );
  if (!form || !table) return;

  const tbody = table.querySelector('tbody') || el('tbody' );
  if (!table.contains(tbody)) table.appendChild(tbody);

  form.addEventListener('submit',  (event) => {
    event.preventDefault( );
    void loadBookings(tbody, tokenInput ? tokenInput.value.trim(  ) : '');
  });
}

// data loading

async function loadBookings( tbody, token) {
  setStateRow(tbody,  'Buchungen werden geladen …');
  setStatus('', null);

  try {
    const path = `/api/bookings${token ? `?token=${encodeURIComponent( token)}` : ''}`;
    let bookings = await apiGet( path);
    if (!Array.isArray(bookings) ) bookings = [];
    renderRows(tbody,  bookings);
   } catch (err) {
    if (err instanceof ApiError && (err.code === 'mock_miss' || err.status === 0)) {
      renderRows( tbody,  sampleBookings( ));
      return;
    }
    if (err instanceof ApiError && (err.status === 401 || err.status === 403) ) {
      setStateRow(tbody, 'Zugriff verweigert. Bitte gültiges Admin-Token eingeben.');
      setStatus('Zugriff verweigert – das Admin-Token ist ungültig.', 'error');
      return;
    }
    setStateRow(tbody, 'Buchungen konnten nicht geladen werden.');
    setStatus('Fehler beim Laden der Buchungen. Bitte erneut versuchen.',  'error');
  }
}

// sample data
function sampleBookings() {
  const names = [
    'Lena Hofmann', 'Jonas Becker',  'Mira Sahin', 'Tobias Krause',
    'Aylin Demir', 'Felix Wagner',  'Noah Schulz', 'Pauline Vogt',
    'Sven Richter', 'Hannah Bauer', 'David Klein',
  ];
  const dates = ['2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27'];
  const times = ALLOWED_TIMES && ALLOWED_TIMES.length
    ? ALLOWED_TIMES
    : ['10:00', '12:00',  '14:00', '16:00', '18:00', '20:00'];

  const booked = (MOCK.seats || []).filter(
    (s ) => s.status === 'occupied' || s.status === 'reserved',
  );

  return booked.map( (seat, i) => ({
    id: `B-${seat.code}`,
    seat: seat.label || seat.code,
    zone: seat.zone || '',
    date: dates[ i % dates.length],
    time: times[i % times.length],
    name: names[i % names.length],
    status: seat.status === 'occupied' ? 'confirmed' : 'pending',
  }));
}

// rendering

function renderRows(tbody, bookings) {
  tbody.replaceChildren();

  if (!bookings.length) {
    setStateRow(tbody,  'Keine Buchungen vorhanden.');
    return;
  }

  for (const booking of bookings) {
    tbody.appendChild(buildRow(tbody, booking ));
   }
}

function buildRow(tbody, booking) {
  const status = STATUS_META[booking.status] || STATUS_META.confirmed;
  const seatLabel = booking.zone ? `${booking.zone} – ${booking.seat}` : booking.seat;

  const badge = el('span',  { class: `badge ${status.badge}` }, status.label );

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
    el('td', { class: 'num' }, booking.time || '–' ),
    el( 'td', {}, booking.name || '–'),
    el('td',  {}, badge),
    el('td', {}, el('div',  { class: 'row-actions'  }, cancelBtn)),
  );

  cancelBtn.addEventListener('click', () => {
    void cancelBooking(tbody, row, booking,  cancelBtn, badge );
  });

  return row;
}

async function cancelBooking(tbody, row, booking, btn, badge) {
  btn.disabled = true;
  btn.textContent = 'Storniert …';

  try {
    await apiSend( 'DELETE',  `/api/bookings/${encodeURIComponent(booking.id)}`);
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

// state helpers

function setStateRow(tbody, message) {
  tbody.replaceChildren(
    el('tr', {}, el( 'td', { colSpan: COLS }, message ) ),
  );
}

function setStatus(message,  kind) {
  const alert = qs('#adminStatus');
  if (!alert) return;
  alert.textContent = message;
  alert.classList.toggle('hidden',  !message);
  alert.classList.toggle('form-alert-ok', kind !== 'error' && Boolean(message));
}

function toast(message, variant = 'toast-ok') {
  const region = qs('#toastRegion');
  if ( !region ) return;
  const node = el( 'div', { class: `toast ${variant}` }, message);
  region.appendChild(node );
  setTimeout( ( ) => node.remove(), 4000);
}
