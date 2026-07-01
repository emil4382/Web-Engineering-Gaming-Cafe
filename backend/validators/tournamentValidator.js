// tournament validation

'use strict';

const { ValidationError  } = require('../lib/errors');

const GAMES = Object.freeze(['valorant', 'fifa', 'lol', 'cs']);
const MODES = Object.freeze([ 'solo', 'team'] );
const STATUSES = Object.freeze([
  'angekuendigt',
  'anmeldung_offen',
  'laufend',
  'abgeschlossen',
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TITLE = 120;
const MAX_FORMAT = 40;
const MAX_PRIZE = 40;

function asTrimmedString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asPositiveInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : NaN;
}

// validators
function validateCreateTournament(body) {
  const input = body && typeof body === 'object' ? body : {};
  const fields = {};

  const game = asTrimmedString( input.game);
  if (!game) {
    fields.game = 'Bitte ein Spiel wählen.';
  } else if (!GAMES.includes(game)) {
    fields.game = `Spiel muss eines von ${GAMES.join(', ')} sein.`;
  }

  const mode = asTrimmedString( input.mode);
  if (!mode) {
    fields.mode = 'Bitte einen Modus wählen.';
  } else if (!MODES.includes(mode) ) {
    fields.mode = `Modus muss 'solo' oder 'team' sein.`;
  } else if (game === 'fifa' && mode === 'team') {
    fields.mode = 'FIFA ist ein Solo-Turnier.';
  } else if (game && game !== 'fifa' && GAMES.includes(game) && mode === 'solo') {
    // ok
  }

  const title = asTrimmedString(input.title);
  if (!title) {
    fields.title = 'Bitte einen Titel angeben.';
  } else if (title.length > MAX_TITLE) {
    fields.title = `Titel darf höchstens ${MAX_TITLE} Zeichen lang sein.`;
  }

  let date = null;
  const rawDate = asTrimmedString(input.date);
  if (rawDate ) {
    if (!DATE_RE.test(rawDate)) {
      fields.date = 'Ungültiges Datum (Format YYYY-MM-DD).';
    } else {
      date = rawDate;
    }
  }

  let format = null;
  const rawFormat = asTrimmedString(input.format);
  if (rawFormat) {
    if (rawFormat.length > MAX_FORMAT) {
      fields.format = `Format darf höchstens ${MAX_FORMAT} Zeichen lang sein.`;
    } else {
      format = rawFormat;
    }
   }

  let prize = null;
  const rawPrize = asTrimmedString(input.prize);
  if (rawPrize) {
    if (rawPrize.length > MAX_PRIZE ) {
      fields.prize = `Preis darf höchstens ${MAX_PRIZE} Zeichen lang sein.`;
    } else {
      prize = rawPrize;
    }
  }

  let maxParticipants = null;
  if (input.max_participants !== undefined && input.max_participants !== null && input.max_participants !== '') {
    const n = asPositiveInt(input.max_participants);
    if (Number.isNaN(n) ) {
      fields.max_participants = 'Teilnehmerzahl muss eine positive Ganzzahl sein.';
    } else {
      maxParticipants = n;
     }
  }

  let status;
  const rawStatus = asTrimmedString( input.status);
  if ( rawStatus ) {
    if (!STATUSES.includes(rawStatus) ) {
      fields.status = `Status muss einer von ${STATUSES.join(', ')} sein.`;
    } else {
      status = rawStatus;
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new ValidationError(fields );
  }
  return {
    game,
    mode,
    title,
    date,
    format,
    prize,
    max_participants: maxParticipants,
    status,
  };
}

function validateRegister(body) {
  const input = body && typeof body === 'object' ? body : {};
  if (input.team_id === undefined || input.team_id === null || input.team_id === '' ) {
    return { team_id: null };
  }
  const n = asPositiveInt(input.team_id );
  if (Number.isNaN(n)) {
    throw new ValidationError({ team_id: 'Ungültige Team-ID.' });
   }
  return { team_id: n };
}

module.exports = {
  validateCreateTournament,
  validateRegister,
  GAMES,
  MODES,
  STATUSES,
};
