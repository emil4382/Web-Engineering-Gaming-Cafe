/**
 * @file Pure input validation for tournament WRITE endpoints.
 *
 * Covers `POST /api/tournaments` (staff create), `POST /api/tournaments/:id/
 * register` and `POST /api/tournaments/:id/results` (staff). Pure: no DB. Mode
 * correctness against the *actual* tournament (solo vs. team) is enforced in the
 * service; here we only validate shape/format. Throws {@link ValidationError}.
 *
 * @module validators/tournamentValidator
 */

'use strict';

const { ValidationError } = require('../lib/errors');

/** Tournament games + modes + lifecycle statuses (mirror the schema enums). */
const GAMES = Object.freeze(['valorant', 'fifa', 'lol', 'cs']);
const MODES = Object.freeze(['solo', 'team']);
const STATUSES = Object.freeze([
  'angekuendigt',
  'anmeldung_offen',
  'laufend',
  'abgeschlossen',
]);

/** Calendar date `YYYY-MM-DD`. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TITLE = 120;
const MAX_FORMAT = 40;
const MAX_PRIZE = 40;

/**
 * Trim a value to a non-empty string, or `null`.
 * @param {*} value - Candidate.
 * @returns {string|null} Trimmed string or `null`.
 */
function asTrimmedString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Parse a positive integer from a value, or return `null`.
 * @param {*} value - Candidate.
 * @returns {number|null} A positive integer, or `null` if not parseable.
 */
function asPositiveInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : NaN;
}

/**
 * Validate & normalise a `POST /api/tournaments` body (staff create).
 *
 * @param {Object} body - The raw `req.body`.
 * @returns {{game:string,mode:string,title:string,date:?string,format:?string,prize:?string,max_participants:?number,status:?string}}
 * @throws {ValidationError} With a `fields` map on any failure.
 */
function validateCreateTournament(body) {
  const input = body && typeof body === 'object' ? body : {};
  const fields = {};

  const game = asTrimmedString(input.game);
  if (!game) {
    fields.game = 'Bitte ein Spiel wählen.';
  } else if (!GAMES.includes(game)) {
    fields.game = `Spiel muss eines von ${GAMES.join(', ')} sein.`;
  }

  const mode = asTrimmedString(input.mode);
  if (!mode) {
    fields.mode = 'Bitte einen Modus wählen.';
  } else if (!MODES.includes(mode)) {
    fields.mode = `Modus muss 'solo' oder 'team' sein.`;
  } else if (game === 'fifa' && mode === 'team') {
    fields.mode = 'FIFA ist ein Solo-Turnier.';
  } else if (game && game !== 'fifa' && GAMES.includes(game) && mode === 'solo') {
    // Allowed: team games can still host a solo board — but tournaments of a
    // team game are usually team mode. We accept solo to stay flexible; no error.
  }

  const title = asTrimmedString(input.title);
  if (!title) {
    fields.title = 'Bitte einen Titel angeben.';
  } else if (title.length > MAX_TITLE) {
    fields.title = `Titel darf höchstens ${MAX_TITLE} Zeichen lang sein.`;
  }

  let date = null;
  const rawDate = asTrimmedString(input.date);
  if (rawDate) {
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
    if (rawPrize.length > MAX_PRIZE) {
      fields.prize = `Preis darf höchstens ${MAX_PRIZE} Zeichen lang sein.`;
    } else {
      prize = rawPrize;
    }
  }

  let maxParticipants = null;
  if (input.max_participants !== undefined && input.max_participants !== null && input.max_participants !== '') {
    const n = asPositiveInt(input.max_participants);
    if (Number.isNaN(n)) {
      fields.max_participants = 'Teilnehmerzahl muss eine positive Ganzzahl sein.';
    } else {
      maxParticipants = n;
    }
  }

  let status;
  const rawStatus = asTrimmedString(input.status);
  if (rawStatus) {
    if (!STATUSES.includes(rawStatus)) {
      fields.status = `Status muss einer von ${STATUSES.join(', ')} sein.`;
    } else {
      status = rawStatus;
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new ValidationError(fields);
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

/**
 * Validate a `POST /api/tournaments/:id/register` body. `team_id` is optional
 * (present only for team-mode sign-ups); solo mode sends `{}`. The
 * mode-vs-payload cross-check happens in the service against the real
 * tournament.
 *
 * @param {Object} body - The raw `req.body`.
 * @returns {{team_id: number|null}} The parsed team id (or `null`).
 * @throws {ValidationError} If `team_id` is present but not a positive integer.
 */
function validateRegister(body) {
  const input = body && typeof body === 'object' ? body : {};
  if (input.team_id === undefined || input.team_id === null || input.team_id === '') {
    return { team_id: null };
  }
  const n = asPositiveInt(input.team_id);
  if (Number.isNaN(n)) {
    throw new ValidationError({ team_id: 'Ungültige Team-ID.' });
  }
  return { team_id: n };
}

/**
 * Validate a `POST /api/tournaments/:id/results` body. Each entry needs a
 * positive `placement` and exactly one of `user_id` / `team_id` (XOR). `points`
 * are NOT accepted from the client — the server computes them.
 *
 * @param {Object} body - The raw `req.body` (`{ results: [...] }`).
 * @returns {{results: Array<{placement:number, user_id?:number, team_id?:number}>}}
 * @throws {ValidationError} With a `fields` map on any failure.
 */
function validateResults(body) {
  const input = body && typeof body === 'object' ? body : {};
  const list = input.results;
  if (!Array.isArray(list) || list.length === 0) {
    throw new ValidationError({ results: 'Bitte mindestens ein Ergebnis angeben.' });
  }

  const fields = {};
  const cleaned = [];
  list.forEach((raw, i) => {
    const entry = raw && typeof raw === 'object' ? raw : {};
    const placement = asPositiveInt(entry.placement);
    if (placement === null || Number.isNaN(placement)) {
      fields[`results[${i}].placement`] = 'Platzierung muss eine positive Ganzzahl sein.';
    }
    const userId = entry.user_id === undefined || entry.user_id === null ? null : asPositiveInt(entry.user_id);
    const teamId = entry.team_id === undefined || entry.team_id === null ? null : asPositiveInt(entry.team_id);
    if (Number.isNaN(userId)) fields[`results[${i}].user_id`] = 'Ungültige Benutzer-ID.';
    if (Number.isNaN(teamId)) fields[`results[${i}].team_id`] = 'Ungültige Team-ID.';

    const hasUser = userId !== null && !Number.isNaN(userId);
    const hasTeam = teamId !== null && !Number.isNaN(teamId);
    if (hasUser === hasTeam) {
      fields[`results[${i}]`] = 'Genau eines von user_id oder team_id ist erforderlich.';
    }

    cleaned.push({
      placement,
      ...(hasUser ? { user_id: userId } : {}),
      ...(hasTeam ? { team_id: teamId } : {}),
    });
  });

  if (Object.keys(fields).length > 0) {
    throw new ValidationError(fields);
  }
  return { results: cleaned };
}

module.exports = {
  validateCreateTournament,
  validateRegister,
  validateResults,
  GAMES,
  MODES,
  STATUSES,
};
