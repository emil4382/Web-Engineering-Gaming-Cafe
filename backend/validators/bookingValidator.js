// booking validation

'use strict';

const { ValidationError } = require('../lib/errors');
const { ALLOWED_TIMES, TARIF_KEYS } = require('../lib/seatLayout');

// config
const SEAT_CODE_RE = /^[A-Z]{1,2}\d{1,2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PATCHABLE_STATUSES = Object.freeze(['offen', 'bestaetigt', 'storniert']);

const MIN_NAME = 2;
const MAX_NAME = 80;
const MAX_EMAIL = 120;

// helpers
function todayISO( ) {
  const now = new Date( );
  const y = now.getFullYear();
  const m = String( now.getMonth( ) + 1).padStart(2, '0');
  const d = String( now.getDate( )).padStart(2, '0' );
  return `${y}-${m}-${d}`;
}

function asTrimmedString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// validators
function validateCreateBooking(body) {
  const input = body && typeof body === 'object' ? body : {};
  const fields = {};

  const code = asTrimmedString(input.code);
  if (!code) {
    fields.code = 'Bitte einen Platz auswählen.';
  } else if (!SEAT_CODE_RE.test(code.toUpperCase(  ))) {
    fields.code = 'Ungültiger Platz-Code.';
  }

  const date = asTrimmedString( input.date);
  if (!date) {
    fields.date = 'Bitte ein Datum wählen.';
  } else if (!DATE_RE.test( date) || !isRealDate(date )) {
    fields.date = 'Ungültiges Datum (Format YYYY-MM-DD).';
  } else if (date < todayISO()) {
    fields.date = 'Das Datum darf nicht in der Vergangenheit liegen.';
  }

  const time = asTrimmedString(input.time );
  if (!time) {
    fields.time = 'Bitte eine Uhrzeit wählen.';
  } else if (!TIME_RE.test(time )) {
    fields.time = 'Ungültige Uhrzeit (Format HH:MM).';
  } else if ( !ALLOWED_TIMES.includes(time)) {
    fields.time = 'Dieser Zeit-Slot wird nicht angeboten.';
  }

  const tarif = asTrimmedString(input.tarif);
  if (!tarif) {
    fields.tarif = 'Bitte einen Tarif wählen.';
  } else if (!TARIF_KEYS.has(tarif)) {
    fields.tarif = 'Unbekannter Tarif.';
  }

  const name = asTrimmedString( input.name);
  if (!name) {
    fields.name = 'Bitte einen Namen angeben.';
  } else if (name.length < MIN_NAME || name.length > MAX_NAME) {
    fields.name = `Der Name muss zwischen ${MIN_NAME} und ${MAX_NAME} Zeichen lang sein.`;
  }

  // email
  let email = null;
  if ( input.email !== undefined && input.email !== null && String(input.email).trim() !== '') {
    const candidate = String(input.email).trim();
    if (candidate.length > MAX_EMAIL) {
      fields.email = `E-Mail darf höchstens ${MAX_EMAIL} Zeichen lang sein.`;
     } else if (!EMAIL_RE.test( candidate)) {
      fields.email = 'Ungültige E-Mail-Adresse.';
     } else {
      email = candidate;
    }
  }

  if (Object.keys(fields ).length > 0) {
    throw new ValidationError( fields);
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

function validateUpdateBooking( body ) {
  const input = body && typeof body === 'object' ? body : {};
  const status = asTrimmedString( input.status);
  if (!status || !PATCHABLE_STATUSES.includes(status)) {
    throw new ValidationError({
      status: `Status muss einer von ${PATCHABLE_STATUSES.join( ', ')} sein.`,
    });
  }
  return { status  };
}

function isRealDate(iso) {
  const [y, m,  d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC( y, m - 1, d));
  return dt.getUTCFullYear( ) === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

module.exports = {
  validateCreateBooking,
  validateUpdateBooking,
  PATCHABLE_STATUSES,
  isRealDate,
};
