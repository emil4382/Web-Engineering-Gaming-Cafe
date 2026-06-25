/**
 * @file Pure input validation for team endpoints.
 *
 * Validates `POST /api/teams` (create) and `POST /api/teams/:id/members` (add a
 * member by username) against the contract. No DB access — existence/uniqueness
 * is enforced by the service + UNIQUE indexes. On failure it throws a
 * {@link ValidationError} carrying a German `fields` map.
 *
 * @module validators/teamValidator
 */

'use strict';

const { ValidationError } = require('../lib/errors');

/** Team games (no FIFA — FIFA is solo-only). */
const TEAM_GAMES = Object.freeze(['valorant', 'lol', 'cs']);

/** Name/tag/username length bounds (mirror the schema columns). */
const MIN_NAME = 2;
const MAX_NAME = 60;
const MAX_TAG = 8;
const MAX_USERNAME = 40;

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
 * Validate & normalise a `POST /api/teams` body.
 *
 * @param {Object} body - The raw `req.body`.
 * @returns {{name:string, tag:string|null, game:string}} Cleaned team input.
 * @throws {ValidationError} With a `fields` map on any failure.
 */
function validateCreateTeam(body) {
  const input = body && typeof body === 'object' ? body : {};
  const fields = {};

  const name = asTrimmedString(input.name);
  if (!name) {
    fields.name = 'Bitte einen Team-Namen angeben.';
  } else if (name.length < MIN_NAME || name.length > MAX_NAME) {
    fields.name = `Der Name muss zwischen ${MIN_NAME} und ${MAX_NAME} Zeichen lang sein.`;
  }

  // tag is optional.
  let tag = null;
  const rawTag = asTrimmedString(input.tag);
  if (rawTag) {
    if (rawTag.length > MAX_TAG) {
      fields.tag = `Der Tag darf höchstens ${MAX_TAG} Zeichen lang sein.`;
    } else {
      tag = rawTag;
    }
  }

  const game = asTrimmedString(input.game);
  if (!game) {
    fields.game = 'Bitte ein Spiel wählen.';
  } else if (!TEAM_GAMES.includes(game)) {
    fields.game = `Spiel muss eines von ${TEAM_GAMES.join(', ')} sein.`;
  }

  if (Object.keys(fields).length > 0) {
    throw new ValidationError(fields);
  }
  return { name, tag, game };
}

/**
 * Validate a `POST /api/teams/:id/members` body (add member by username).
 *
 * @param {Object} body - The raw `req.body`.
 * @returns {{username:string}} The validated username.
 * @throws {ValidationError} If `username` is missing or too long.
 */
function validateAddMember(body) {
  const input = body && typeof body === 'object' ? body : {};
  const username = asTrimmedString(input.username);
  if (!username) {
    throw new ValidationError({ username: 'Bitte einen Benutzernamen angeben.' });
  }
  if (username.length > MAX_USERNAME) {
    throw new ValidationError({
      username: `Benutzername darf höchstens ${MAX_USERNAME} Zeichen lang sein.`,
    });
  }
  return { username };
}

module.exports = { validateCreateTeam, validateAddMember, TEAM_GAMES };
