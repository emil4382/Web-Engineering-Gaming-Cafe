/**
 * @file Booking page feature module (`data-page="buchung"`).
 *
 * Responsibilities:
 * 1. Build the dense LAN-café floor from `SEAT_ZONES`: a tight vertical stack
 *    of labelled desk-rows (each = two desks of four with an aisle gap) plus a
 *    compact Privat-Boxen row — no absolute pixel positioning.
 * 2. Fetch seat availability (`/api/seats/availability`, mock fallback) and
 *    render one accessible `.seat` <button> per PC into the correct desk,
 *    grouped by zone, with `aria-pressed` + a descriptive `aria-label`.
 * 3. Let the user pick exactly one available seat (mouse + keyboard) and keep
 *    `#selectedSeat` and the live `#bookingSummary` price recap in sync.
 * 4. Populate the time + tariff selects from config and validate the form on
 *    submit with inline `.field-error[role=alert]` messages (no `alert()`).
 * 5. On success, POST the booking, toast confirmation, mark the seat reserved,
 *    and persist the last choices + a "Meine Reservierungen" list via storage.
 *
 * @module features/buchung
 */

import { apiGet, apiPost, ApiError } from '../api/api.js';
import { qs, el } from '../utils/dom.js';
import { formatEuro, formatDateDE } from '../utils/format.js';
import { getJSON, setJSON } from '../utils/storage.js';
import { SEAT_ZONES, ALLOWED_TIMES, TARIFE } from '../config/seatLayout.js';

/** localStorage key for the last-used form choices. */
const LS_LAST = 'pixelforge.booking.last';
/** localStorage key for the list of confirmed reservations. */
const LS_BOOKINGS = 'pixelforge.booking.list';

/** Maps an API seat status to its CSS state class (base = available). */
const STATUS_CLASS = { occupied: 'occupied', reserved: 'reserved' };
/** German label for each seat status, used in the seat's aria-label. */
const STATUS_LABEL = {
  available: 'verfügbar',
  occupied: 'belegt',
  reserved: 'reserviert',
};

/** Seats per desk in a desk-row; an aisle gap splits the row into two desks. */
const SEATS_PER_DESK = 4;

/** @typedef {{id:string,code:string,label:string,zoneId:string,zone:string,tier:string,status:string}} Seat */

/**
 * Initialise the booking page: floor rendering, form controls, selection and
 * submit handling. No-ops gracefully if core nodes are missing.
 * @returns {Promise<void>}
 */
export default async function init() {
  const seatMap = qs('#seatMap');
  const form = qs('#bookingForm');
  if (!seatMap || !form) return;

  populateTimeOptions();
  populateTariffOptions();
  primeDateField();

  /** @type {{seat: Seat|null}} Shared selection state. */
  const state = { seat: null };

  let seats = [];
  try {
    seats = await apiGet('/api/seats/availability');
  } catch (err) {
    console.error('[buchung] seat availability failed:', err);
    seats = [];
  }
  renderFloor(seatMap, seats, state);

  wireForm(form, state);
  renderMyBookings();

  restoreLastChoices();
}

/* ------------------------------------------------------------------ */
/* Form controls (config-driven options)                             */
/* ------------------------------------------------------------------ */

/**
 * Fill the Uhrzeit `<select>` with the {@link ALLOWED_TIMES} slots, keeping the
 * leading disabled placeholder.
 * @returns {void}
 */
function populateTimeOptions() {
  const select = qs('#bookingTime');
  if (!select) return;
  ALLOWED_TIMES.forEach((time) => {
    select.appendChild(el('option', { value: time }, `${time} Uhr`));
  });
}

/**
 * Fill the Tarif `<select>` with {@link TARIFE}, marking the featured tariff as
 * the default selection.
 * @returns {void}
 */
function populateTariffOptions() {
  const select = qs('#bookingTariff');
  if (!select) return;
  TARIFE.forEach((tarif) => {
    select.appendChild(
      el('option', {
        value: tarif.key,
        selected: Boolean(tarif.featured),
      }, `${tarif.name} — ${formatEuro(tarif.price)} / ${tarif.unitLabel}`),
    );
  });
}

/**
 * Set the date input's `min` to today and default its value to today so a
 * past date can never be picked.
 * @returns {void}
 */
function primeDateField() {
  const input = qs('#bookingDate');
  if (!input) return;
  const today = isoToday();
  input.min = today;
  if (!input.value) input.value = today;
}

/* ------------------------------------------------------------------ */
/* Seat rendering + selection                                        */
/* ------------------------------------------------------------------ */

/**
 * Build the dense floor from {@link SEAT_ZONES}: a tight vertical stack of
 * labelled desk-rows, then the compact Privat-Boxen row. Availability data (by
 * seat code) drives each seat's state; missing data falls back to the config so
 * the plan always renders.
 * @param {HTMLElement} seatMap - The `#seatMap` floor container.
 * @param {Seat[]} seats - Seat list from the API/mock.
 * @param {{seat: Seat|null}} state - Shared selection state.
 * @returns {void}
 */
function renderFloor(seatMap, seats, state) {
  const byCode = new Map(seats.map((s) => [s.code, s]));
  const nodes = [];

  for (const zone of SEAT_ZONES) {
    const zoneSeats = zoneSeatList(zone, byCode);
    nodes.push(
      zone.kind === 'box'
        ? buildBoxRow(zone, zoneSeats, state, seatMap)
        : buildDeskRow(zone, zoneSeats, state, seatMap),
    );
  }

  seatMap.replaceChildren(...nodes);
}

/**
 * Build the ordered seat list for a zone from config, merging in any status
 * from the availability map (defaults to `available`).
 * @param {import('../config/seatLayout.js').SeatZone} zone - The zone.
 * @param {Map<string, Seat>} byCode - Availability keyed by seat code.
 * @returns {Seat[]} Seats in code order.
 */
function zoneSeatList(zone, byCode) {
  const list = [];
  for (let i = 1; i <= zone.count; i++) {
    const code = `${zone.codePrefix}${i}`;
    list.push(
      byCode.get(code)
        || { code, label: code, zone: zone.name, tier: zone.tier, status: 'available' },
    );
  }
  return list;
}

/**
 * Build one labelled desk-row: the zone name on the left, then the seats laid
 * out as desks of {@link SEATS_PER_DESK} with an aisle gap between them.
 * @param {import('../config/seatLayout.js').SeatZone} zone - The zone.
 * @param {Seat[]} zoneSeats - Seats for this row.
 * @param {{seat: Seat|null}} state - Shared selection state.
 * @param {HTMLElement} seatMap - The container (for clearing prior selection).
 * @returns {HTMLElement} The `.desk-row` element.
 */
function buildDeskRow(zone, zoneSeats, state, seatMap) {
  const desks = chunk(zoneSeats, SEATS_PER_DESK).map((group) =>
    el('div', { class: 'desk' }, ...group.map((seat) => buildSeat(seat, state, seatMap))),
  );
  return el('div', {
    class: `desk-row${zone.tier === 'Premium' ? ' is-premium' : ''}`,
    dataset: { zone: zone.id, tier: zone.tier },
  },
    el('p', { class: 'row-label' }, zone.name),
    el('div', { class: 'desks' }, ...desks),
  );
}

/**
 * Build the compact Privat-Boxen row: the zone name on the left, then one small
 * `.box` per group of `zone.perBox` seats.
 * @param {import('../config/seatLayout.js').SeatZone} zone - The box zone.
 * @param {Seat[]} zoneSeats - Seats for this zone.
 * @param {{seat: Seat|null}} state - Shared selection state.
 * @param {HTMLElement} seatMap - The container.
 * @returns {HTMLElement} The `.desk-row.box-row` element.
 */
function buildBoxRow(zone, zoneSeats, state, seatMap) {
  const per = zone.perBox || 2;
  const boxes = chunk(zoneSeats, per).map((group, idx) =>
    el('div', { class: 'box' },
      el('span', { class: 'box-tag' }, `Box ${idx + 1}`),
      el('div', { class: 'box-seats' }, ...group.map((seat) => buildSeat(seat, state, seatMap))),
    ),
  );
  return el('div', {
    class: 'desk-row box-row',
    dataset: { zone: zone.id, tier: zone.tier },
  },
    el('p', { class: 'row-label' }, zone.name),
    el('div', { class: 'boxes' }, ...boxes),
  );
}

/**
 * Split a list into contiguous chunks of at most `size`.
 * @param {Seat[]} list - The seats.
 * @param {number} size - Max chunk length.
 * @returns {Seat[][]} The chunks.
 */
function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * Build one accessible seat `<button>`.
 * @param {Seat} seat - Seat data.
 * @param {{seat: Seat|null}} state - Shared selection state.
 * @param {HTMLElement} seatMap - The container (for clearing prior selection).
 * @returns {HTMLButtonElement} The seat button.
 */
function buildSeat(seat, state, seatMap) {
  const status = seat.status || 'available';
  const blocked = status === 'occupied' || status === 'reserved';
  const stateClass = STATUS_CLASS[status] || '';

  const btn = el('button', {
    type: 'button',
    class: `seat${stateClass ? ` ${stateClass}` : ''}`,
    dataset: { code: seat.code, zone: seat.zone, tier: seat.tier || '' },
    disabled: blocked,
    'aria-pressed': 'false',
    'aria-label': `Platz ${seat.code}, ${seat.zone}, ${STATUS_LABEL[status] || status}`,
  }, seat.code);

  if (!blocked) {
    btn.addEventListener('click', () => selectSeat(seat, btn, state, seatMap));
  }
  return btn;
}

/**
 * Select a single available seat: clear any previous selection, mark this one
 * pressed, and refresh `#selectedSeat` + the summary.
 * @param {Seat} seat - The chosen seat.
 * @param {HTMLButtonElement} btn - Its button.
 * @param {{seat: Seat|null}} state - Shared selection state.
 * @param {HTMLElement} seatMap - The container.
 * @returns {void}
 */
function selectSeat(seat, btn, state, seatMap) {
  const prev = qs('.seat.selected', seatMap);
  if (prev) {
    prev.classList.remove('selected');
    prev.setAttribute('aria-pressed', 'false');
  }
  btn.classList.add('selected');
  btn.setAttribute('aria-pressed', 'true');
  state.seat = seat;

  const input = qs('#selectedSeat');
  if (input) input.value = `${seat.zone} – PC ${seat.code}`;
  clearError('seat');
  updateSummary(state);
}

/* ------------------------------------------------------------------ */
/* Summary                                                            */
/* ------------------------------------------------------------------ */

/**
 * Resolve the currently selected tariff object from the Tarif select.
 * @returns {import('../config/seatLayout.js').Tarif|null} The tariff, or null.
 */
function currentTarif() {
  const select = qs('#bookingTariff');
  if (!select) return null;
  return TARIFE.find((t) => t.key === select.value) || null;
}

/**
 * Update the live price recap in `#bookingSummary` from the selected seat and
 * tariff. Falls back to a dash when nothing is selected yet.
 * @param {{seat: Seat|null}} state - Shared selection state.
 * @returns {void}
 */
function updateSummary(state) {
  const summary = qs('#bookingSummary');
  if (!summary) return;
  const tarif = currentTarif();

  let lab = 'Summe';
  let valNodes = ['–'];
  if (state.seat && tarif) {
    lab = `${state.seat.code} · ${tarif.name}`;
    valNodes = [el('em', {}, formatEuro(tarif.price)), ` / ${tarif.unitLabel}`];
  } else if (tarif) {
    valNodes = [el('em', {}, formatEuro(tarif.price)), ` / ${tarif.unitLabel}`];
  }

  summary.replaceChildren(
    el('span', { class: 'lab' }, lab),
    el('span', { class: 'val' }, ...valNodes),
  );
}

/* ------------------------------------------------------------------ */
/* Form wiring + validation                                          */
/* ------------------------------------------------------------------ */

/**
 * Wire the booking form: keep the summary in sync with the tariff, validate on
 * submit, and submit the booking on success.
 * @param {HTMLFormElement} form - The `#bookingForm`.
 * @param {{seat: Seat|null}} state - Shared selection state.
 * @returns {void}
 */
function wireForm(form, state) {
  const tariffSelect = qs('#bookingTariff');
  if (tariffSelect) tariffSelect.addEventListener('change', () => updateSummary(state));
  updateSummary(state);

  // Clear a field's error as soon as the user edits it.
  ['bookingDate', 'bookingTime', 'bookingName'].forEach((id) => {
    const node = qs(`#${id}`);
    if (node) node.addEventListener('input', () => clearError(idToKey(id)));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit(form, state);
  });
}

/** Map a control id to its error-key. @param {string} id @returns {string} */
function idToKey(id) {
  return { bookingDate: 'date', bookingTime: 'time', bookingName: 'name' }[id] || id;
}

/**
 * Validate inputs and, when valid, POST the booking.
 * @param {HTMLFormElement} form - The form.
 * @param {{seat: Seat|null}} state - Shared selection state.
 * @returns {Promise<void>}
 */
async function handleSubmit(form, state) {
  const date = qs('#bookingDate');
  const time = qs('#bookingTime');
  const name = qs('#bookingName');

  let firstBad = null;
  const fail = (key, node, msg) => {
    setError(key, node, msg);
    if (!firstBad) firstBad = node;
  };

  if (!state.seat) {
    fail('seat', qs('#selectedSeat'), 'Bitte wähle zuerst einen Platz im Raumplan.');
  }
  if (date && !date.value) {
    fail('date', date, 'Bitte wähle ein Datum.');
  } else if (date && date.value < isoToday()) {
    fail('date', date, 'Das Datum darf nicht in der Vergangenheit liegen.');
  }
  if (time && !time.value) {
    fail('time', time, 'Bitte wähle eine Uhrzeit.');
  }
  if (name && !name.value.trim()) {
    fail('name', name, 'Bitte gib deinen Namen an.');
  }

  if (firstBad) {
    if (typeof firstBad.focus === 'function') firstBad.focus();
    return;
  }

  const tarif = currentTarif();
  const payload = {
    seat: state.seat.code,
    zone: state.seat.zone,
    date: date.value,
    time: time.value,
    tariff: tarif ? tarif.key : null,
    name: name.value.trim(),
  };

  try {
    await apiPost('/api/bookings', payload);
  } catch (err) {
    const msg = err instanceof ApiError && err.message
      ? err.message
      : 'Die Reservierung konnte nicht gespeichert werden. Bitte versuche es erneut.';
    toast('Fehler', msg, 'danger');
    return;
  }

  onBookingConfirmed(payload, state);
}

/**
 * Apply the success side-effects: toast, mark the seat reserved, persist the
 * choice + reservation list, refresh the summary and "Meine Reservierungen".
 * @param {Object} payload - The submitted booking.
 * @param {{seat: Seat|null}} state - Shared selection state.
 * @returns {void}
 */
function onBookingConfirmed(payload, state) {
  toast(
    'Reservierung bestätigt',
    `Platz ${payload.seat} am ${formatDateDE(payload.date)} um ${payload.time} Uhr.`,
    'ok',
  );

  markSeatReserved(payload.seat, state);
  persistChoices(payload);
  addBooking(payload);
  renderMyBookings();
}

/**
 * Turn the selected seat into a reserved (locked) seat after a successful
 * booking, clearing the active selection.
 * @param {string} code - Seat code.
 * @param {{seat: Seat|null}} state - Shared selection state.
 * @returns {void}
 */
function markSeatReserved(code, state) {
  const btn = qs(`.seat[data-code="${code}"]`);
  if (btn) {
    btn.classList.remove('selected');
    btn.classList.add('reserved');
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', `Platz ${code}, ${btn.dataset.zone || ''}, reserviert`);
    btn.disabled = true;
  }
  state.seat = null;
  const input = qs('#selectedSeat');
  if (input) input.value = '';
  updateSummary(state);
}

/* ------------------------------------------------------------------ */
/* Inline error helpers                                              */
/* ------------------------------------------------------------------ */

/**
 * Show an inline error: set `aria-invalid` on the control and write the message
 * into its `.field-error[role=alert]` sibling (`#<key>Error`).
 * @param {string} key - Error key (seat|date|time|tariff|name).
 * @param {HTMLElement|null} control - The control to flag.
 * @param {string} message - German error text.
 * @returns {void}
 */
function setError(key, control, message) {
  if (control && control.setAttribute) control.setAttribute('aria-invalid', 'true');
  const node = qs(`#${key}Error`);
  if (node) node.textContent = message;
}

/**
 * Clear a field's inline error and `aria-invalid` flag.
 * @param {string} key - Error key.
 * @returns {void}
 */
function clearError(key) {
  const node = qs(`#${key}Error`);
  if (node) node.textContent = '';
  const control = qs(`#${keyToId(key)}`);
  if (control && control.removeAttribute) control.removeAttribute('aria-invalid');
}

/** Map an error-key back to its control id. @param {string} key @returns {string} */
function keyToId(key) {
  return { seat: 'selectedSeat', date: 'bookingDate', time: 'bookingTime', name: 'bookingName' }[key]
    || key;
}

/* ------------------------------------------------------------------ */
/* Toast                                                             */
/* ------------------------------------------------------------------ */

/**
 * Append a toast into `#toastRegion`, auto-dismissed after a short delay.
 * @param {string} title - Bold headline.
 * @param {string} message - Body text.
 * @param {'ok'|'warn'|'danger'} [kind='ok'] - Visual variant.
 * @returns {void}
 */
function toast(title, message, kind = 'ok') {
  const region = qs('#toastRegion');
  if (!region) return;
  const node = el('div', { class: `toast toast-${kind}` },
    el('div', {},
      el('strong', {}, title),
      el('span', { style: { display: 'block' } }, message),
    ),
  );
  region.appendChild(node);
  setTimeout(() => node.remove(), 6000);
}

/* ------------------------------------------------------------------ */
/* Persistence: last choices + reservation list                     */
/* ------------------------------------------------------------------ */

/**
 * Persist the last-used date / time / tariff / name so they prefill next time.
 * @param {Object} payload - The submitted booking.
 * @returns {void}
 */
function persistChoices(payload) {
  setJSON(LS_LAST, {
    date: payload.date,
    time: payload.time,
    tariff: payload.tariff,
    name: payload.name,
  });
}

/**
 * Restore the last-used date / time / tariff / name into the form, if present.
 * @returns {void}
 */
function restoreLastChoices() {
  const last = getJSON(LS_LAST, null);
  if (!last) return;
  const set = (id, value) => {
    const node = qs(`#${id}`);
    if (node && value != null && value !== '') node.value = value;
  };
  // Never restore a date that is now in the past.
  if (last.date && last.date >= isoToday()) set('bookingDate', last.date);
  set('bookingTime', last.time);
  set('bookingTariff', last.tariff);
  set('bookingName', last.name);
}

/**
 * Append a confirmed booking to the persisted "Meine Reservierungen" list.
 * @param {Object} payload - The submitted booking.
 * @returns {void}
 */
function addBooking(payload) {
  const list = getJSON(LS_BOOKINGS, []);
  list.unshift({
    seat: payload.seat,
    zone: payload.zone,
    date: payload.date,
    time: payload.time,
    tariff: payload.tariff,
    name: payload.name,
    createdAt: new Date().toISOString(),
  });
  setJSON(LS_BOOKINGS, list.slice(0, 20));
}

/**
 * Render the persisted reservation list into `#myBookingsList`, revealing the
 * section when there is at least one entry.
 * @returns {void}
 */
function renderMyBookings() {
  const section = qs('#myBookingsSection');
  const list = qs('#myBookingsList');
  if (!section || !list) return;

  const bookings = getJSON(LS_BOOKINGS, []);
  if (!bookings.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  const tarifName = (key) => {
    const t = TARIFE.find((x) => x.key === key);
    return t ? t.name : '';
  };

  list.replaceChildren(
    ...bookings.map((b) =>
      el('li', { class: 'summary' },
        el('span', { class: 'lab' }, `${b.zone} · PC ${b.seat}`),
        el('span', { class: 'val' },
          `${formatDateDE(b.date)} · ${b.time} Uhr`,
          b.tariff ? el('em', { style: { display: 'block', fontSize: '.82rem' } }, tarifName(b.tariff)) : null,
        ),
      ),
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Utilities                                                         */
/* ------------------------------------------------------------------ */

/**
 * Today's date as an ISO `YYYY-MM-DD` string in the local timezone.
 * @returns {string} ISO date.
 */
function isoToday() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
