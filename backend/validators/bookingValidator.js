/**
 * @file Pure input validation for booking endpoints.
 *
 * Validates the request bodies for `POST /api/bookings` and the staff
 * `PATCH /api/bookings/:id` against the contract, WITHOUT touching the database
 * (seat existence and slot conflicts are enforced later by the service +
 * `uq_active_slot`). On failure it throws a {@link ValidationError} carrying a
 * `fields` map so the central handler returns `400 { error:{ …, fields } }`.
 *
 * Importing this module must have NO side effects (no DB, no env) so it stays
 * unit-testable in isolation.
 *
 * @module validators/bookingValidator
 */

'use strict';

const { ValidationError } = require('../lib/errors');
const { ALLOWED_TIMES, TARIF_KEYS } = require('../lib/seatLayout');

/** Seat codes: 1–2 uppercase letters + 1–2 digits (N1, W10, B5, P6). */
const SEAT_CODE_RE = /^[A-Z]{1,2}\d{1,2}$/;
/** Calendar date `YYYY-MM-DD`. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Time `HH:MM` (24h). */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Pragmatic e-mail check (presence of a single `@` with text either side). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Booking statuses a staff member may set via PATCH. */
const PATCHABLE_STATUSES = Object.freeze(['offen', 'bestaetigt', 'storniert']);

/** Name length bounds (contract: 2–80). */
const MIN_NAME = 2;
const MAX_NAME = 80;
/** Maximum e-mail length mirroring the `bookings.email` column. */
const MAX_EMAIL = 120;

/**
 * Today's date as `YYYY-MM-DD` in local time, for the "date ≥ today" check.
 * @returns {string} Today's calendar date.
 */
function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Assert a value is a non-empty trimmed string.
 * @param {*} value - Candidate.
 * @returns {string|null} The trimmed string, or `null` if not a usable string.
 */
function asTrimmedString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validate and normalise a `POST /api/bookings` body.
 *
 * Checks: `code` (seat code format), `date` (`YYYY-MM-DD` + real calendar
 * date), `time` (one of the allowed slots), `tarif` (a known tariff key),
 * `name` (present, ≤80), `email` (optional; if present, plausible + ≤120).
 *
 * @param {Object} body - The raw `req.body`.
 * @returns {{code:string,date:string,time:string,tarif:string,name:string,email:string|null}}
 *   The cleaned booking input (email is `null` when omitted).
 * @throws {ValidationError} With a `fields` map when any check fails.
 */
function validateCreateBooking(body) {
  const input = body && typeof body === 'object' ? body : {};
  const fields = {};

  const code = asTrimmedString(input.code);
  if (!code) {
    fields.code = 'Bitte einen Platz auswählen.';
  } else if (!SEAT_CODE_RE.test(code.toUpperCase())) {
    fields.code = 'Ungültiger Platz-Code.';
  }

  const date = asTrimmedString(input.date);
  if (!date) {
    fields.date = 'Bitte ein Datum wählen.';
  } else if (!DATE_RE.test(date) || !isRealDate(date)) {
    fields.date = 'Ungültiges Datum (Format YYYY-MM-DD).';
  } else if (date < todayISO()) {
    fields.date = 'Das Datum darf nicht in der Vergangenheit liegen.';
  }

  const time = asTrimmedString(input.time);
  if (!time) {
    fields.time = 'Bitte eine Uhrzeit wählen.';
  } else if (!TIME_RE.test(time)) {
    fields.time = 'Ungültige Uhrzeit (Format HH:MM).';
  } else if (!ALLOWED_TIMES.includes(time)) {
    fields.time = 'Dieser Zeit-Slot wird nicht angeboten.';
  }

  const tarif = asTrimmedString(input.tarif);
  if (!tarif) {
    fields.tarif = 'Bitte einen Tarif wählen.';
  } else if (!TARIF_KEYS.has(tarif)) {
    fields.tarif = 'Unbekannter Tarif.';
  }

  const name = asTrimmedString(input.name);
  if (!name) {
    fields.name = 'Bitte einen Namen angeben.';
  } else if (name.length < MIN_NAME || name.length > MAX_NAME) {
    fields.name = `Der Name muss zwischen ${MIN_NAME} und ${MAX_NAME} Zeichen lang sein.`;
  }

  // Email is optional; only validate when a non-empty value was supplied.
  let email = null;
  if (input.email !== undefined && input.email !== null && String(input.email).trim() !== '') {
    const candidate = String(input.email).trim();
    if (candidate.length > MAX_EMAIL) {
      fields.email = `E-Mail darf höchstens ${MAX_EMAIL} Zeichen lang sein.`;
    } else if (!EMAIL_RE.test(candidate)) {
      fields.email = 'Ungültige E-Mail-Adresse.';
    } else {
      email = candidate;
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new ValidationError(fields);
  }

  return {
    code: code.toUpperCase(),
    date,
    time,
    tarif,
    name,
    email,
  };
}

/**
 * Validate a staff `PATCH /api/bookings/:id` body (status change, e.g. cancel).
 *
 * @param {Object} body - The raw `req.body`.
 * @returns {{status:string}} The validated status.
 * @throws {ValidationError} If `status` is missing or not an allowed value.
 */
function validateUpdateBooking(body) {
  const input = body && typeof body === 'object' ? body : {};
  const status = asTrimmedString(input.status);
  if (!status || !PATCHABLE_STATUSES.includes(status)) {
    throw new ValidationError({
      status: `Status muss einer von ${PATCHABLE_STATUSES.join(', ')} sein.`,
    });
  }
  return { status };
}

/**
 * Whether a `YYYY-MM-DD` string is a real calendar date (rejects 2026-02-30).
 * Pure: builds a UTC date and checks the parts round-trip.
 * @param {string} iso - A date already matching `DATE_RE`.
 * @returns {boolean} `true` if the date exists.
 */
function isRealDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

module.exports = {
  validateCreateBooking,
  validateUpdateBooking,
  PATCHABLE_STATUSES,
  // Exported for unit tests / reuse.
  isRealDate,
};
