// tournament controllers

'use strict';

const tournamentService = require('../services/tournamentService');
const {
  validateCreateTournament,
  validateRegister,
} = require('../validators/tournamentValidator');
const { ValidationError } = require('../lib/errors');

// helpers
function parseId( raw) {
  const id = Number.parseInt(raw, 10 );
  if ( !Number.isInteger(id) || id < 1) {
    throw new ValidationError({ id: 'Ungültige Turnier-ID.'  });
  }
  return id;
}

// handlers
async function register(req, res) {
  const tournamentId = parseId( req.params.id);
  const { team_id: teamId  } = validateRegister(req.body );
  const registration = await tournamentService.register(tournamentId, {
    userId: req.user.id,
    teamId: teamId ?? undefined,
   } );
  res.status(201).json({  registration  });
}

async function createTournament(req, res) {
  const input = validateCreateTournament(req.body );
  const tournament = await tournamentService.createTournament(input);
  res.status(201 ).json({ tournament });
}

module.exports = { register, createTournament };
