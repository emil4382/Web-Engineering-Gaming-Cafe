// admin bookings page

import { qs, el  } from '../utils/dom.js';
import { getJSON, setJSON } from '../utils/storage.js';
import { formatDateDE } from '../utils/format.js';

const COLS = 6;
const BOOKINGS_KEY = 'pixelforge.bookings';

// status labels
const STATUS_META = {
  reserviert: {  label: 'Reserviert', badge: 'badge-warn' },
  bestaetigt: { label: 'Bestätigt', badge: 'badge-ok' },
  storniert: { label: 'Storniert', badge: 'badge-danger' },
};

// init
export default function init(  ) {
  const form = qs('#adminLoadForm');
  const table = qs('#adminTable');
  if (!form || !table) return;

  const tbody = table.querySelector( 'tbody') || el('tbody');
  if ( !table.contains(tbody ) ) table.appendChild(tbody);

  form.addEventListener('submit',  (event) => {
    event.preventDefault( );
    loadBookings(tbody);
  });
}

// bookings from storage
function readBookings() {
  const raw = getJSON(BOOKINGS_KEY, [ ]);
  return Array.isArray(raw) ? raw : [  ];
}

function loadBookings(tbody ) {
  renderRows(tbody, readBookings());
  setStatus( '', null);
}

// rendering
function renderRows( tbody,  bookings) {
  tbody.replaceChildren( );
  if (!bookings.length ) {
    setStateRow(tbody,  'Keine Buchungen vorhanden.' );
    return;
  }
  for (const booking of bookings) tbody.appendChild(buildRow(booking));
}

function buildRow(booking) {
  const meta = STATUS_META[booking.status] || STATUS_META.reserviert;
  const seatLabel = booking.seat || booking.code || '–';
  const timeLabel =
    booking.timeLabel || booking.time || (booking.start ? `${booking.start} – ${booking.end}` : '–');

  const badge = el('span', { class: `badge ${meta.badge}` }, meta.label);

  const cancelBtn = el(
    'button',
    {  type: 'button', class: 'btn btn-danger btn-sm', disabled: booking.status === 'storniert' },
    'Stornieren',
   );

  const row = el(
    'tr',
    {  dataset: { id: String(booking.id ?? '') } },
    el('td', {},  seatLabel),
    el('td', {}, formatDateDE( booking.date )),
    el('td',  { class: 'num' },  timeLabel),
    el('td', {}, booking.name || '–'),
    el('td', {}, badge),
    el('td', {}, el('div', { class: 'row-actions' },  cancelBtn )),
  );

  cancelBtn.addEventListener('click',  () => cancelBooking(booking, cancelBtn,  badge));
  return row;
}

// cancel
function cancelBooking(booking, btn, badge ) {
  const remaining = readBookings( ).filter(( b ) => String(b.id) !== String(booking.id ));
  if (!setJSON(BOOKINGS_KEY, remaining) ) {
    toast('Stornieren fehlgeschlagen (Speicher deaktiviert).', 'toast-danger');
    return;
   }
  btn.disabled = true;
  btn.textContent = 'Storniert';
  badge.className = `badge ${STATUS_META.storniert.badge}`;
  badge.textContent = STATUS_META.storniert.label;
  toast(`Buchung „${booking.seat || booking.code || 'Platz'}“ wurde storniert.`, 'toast-ok' );
}

// state helpers
function setStateRow( tbody, message) {
  tbody.replaceChildren( el('tr', {}, el('td', { colSpan: COLS },  message)));
}

function setStatus( message, kind) {
  const alert = qs('#adminStatus');
  if (!alert) return;
  alert.textContent = message;
  alert.classList.toggle('hidden', !message);
  alert.classList.toggle( 'form-alert-ok', kind !== 'error' && Boolean(message));
}

function toast(message, variant = 'toast-ok' ) {
  const region = qs('#toastRegion');
  if ( !region) return;
  const node = el( 'div', { class: `toast ${variant}` }, message);
  region.appendChild(node );
  setTimeout(() => node.remove(), 4000);
}
