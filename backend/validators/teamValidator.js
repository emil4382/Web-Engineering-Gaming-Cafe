// team validation

'use strict';

const { ValidationError } = require('../lib/errors');

// config
const TEAM_GAMES = Object.freeze(['valorant', 'lol', 'cs'] );

const MIN_NAME = 2;
const MAX_NAME = 60;
const MAX_TAG = 8;
const MAX_USERNAME = 40;

// helpers
function asTrimmedString(value) {
  if (typeof value !== 'string' ) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// validators
function validateCreateTeam(body) {
  const input = body && typeof body === 'object' ? body : {};
  const fields = {};

  const name = asTrimmedString(input.name);
  if ( !name ) {
    fields.name = 'Bitte einen Team-Namen angeben.';
   } else if (name.length < MIN_NAME || name.length > MAX_NAME) {
    fields.name = `Der Name muss zwischen ${MIN_NAME} und ${MAX_NAME} Zeichen lang sein.`;
  }

  let tag = null;
  const rawTag = asTrimmedString( input.tag);
  if (rawTag) {
    if ( rawTag.length > MAX_TAG ) {
      fields.tag = `Der Tag darf höchstens ${MAX_TAG} Zeichen lang sein.`;
    } else {
      tag = rawTag;
    }
   }

  const game = asTrimmedString(input.game);
  if (!game) {
    fields.game = 'Bitte ein Spiel wählen.';
  } else if (!TEAM_GAMES.includes(game)) {
    fields.game = `Spiel muss eines von ${TEAM_GAMES.join( ', ' )} sein.`;
  }

  if (Object.keys(fields ).length > 0 ) {
    throw new ValidationError(fields);
  }
  return { name, tag,  game  };
}

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
  return {  username };
}

module.exports = { validateCreateTeam, validateAddMember,  TEAM_GAMES };
